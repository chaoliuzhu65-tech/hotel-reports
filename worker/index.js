/**
 * 德胧预订管理系统 — Cloudflare Worker API 代理 v2
 * 
 * 升级内容:
 * - KV 缓存 token（跨请求持久化，避免重复获取）
 * - API Key 保护（防止未授权访问）
 * - 请求频率监控
 * - 完善的错误处理和日志
 * 
 * 环境变量/Secrets:
 * - FEISHU_APP_ID: 飞书 App ID (Secret)
 * - FEISHU_APP_SECRET: 飞书 App Secret (Secret)
 * - BITABLE_APP_TOKEN: 多维表格 app_token (Var)
 * - ALLOWED_ORIGINS: 逗号分隔的允许域名 (Var)
 * - PROXY_API_KEY: 前端访问密钥 (Secret, 可选)
 * 
 * KV Namespace:
 * - TOKEN_CACHE: 用于缓存 tenant_access_token
 */

const FEISHU_BASE = "https://open.feishu.cn/open-apis";
const TOKEN_KV_KEY = "feishu_tenant_token";
const TOKEN_EXPIRY_KEY = "feishu_token_expiry";

// 内存缓存（同一 Worker isolate 内复用）
let memToken = null;
let memTokenExpiry = 0;

async function getAccessToken(env) {
  const now = Date.now();

  // 1. 先查内存缓存
  if (memToken && now < memTokenExpiry - 60000) {
    return memToken;
  }

  // 2. 再查 KV 缓存
  if (env.TOKEN_CACHE) {
    try {
      const kvToken = await env.TOKEN_CACHE.get(TOKEN_KV_KEY);
      const kvExpiry = await env.TOKEN_CACHE.get(TOKEN_EXPIRY_KEY);
      if (kvToken && kvExpiry && now < Number(kvExpiry) - 60000) {
        memToken = kvToken;
        memTokenExpiry = Number(kvExpiry);
        return kvToken;
      }
    } catch (e) {
      // KV 读取失败，继续获取新 token
    }
  }

  // 3. 都没命中，请求新 token
  const resp = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET,
    }),
  });

  const data = await resp.json();
  if (data.code !== 0) {
    throw new Error(`飞书 Token 获取失败: ${data.msg}`);
  }

  const token = data.tenant_access_token;
  const expiry = now + (data.expire - 300) * 1000; // 提前5分钟过期

  // 更新内存缓存
  memToken = token;
  memTokenExpiry = expiry;

  // 写入 KV 缓存（TTL = token有效期 - 5分钟）
  if (env.TOKEN_CACHE) {
    try {
      const ttl = Math.max(Math.floor((data.expire - 300)), 60);
      await env.TOKEN_CACHE.put(TOKEN_KV_KEY, token, { expirationTtl: ttl });
      await env.TOKEN_CACHE.put(TOKEN_EXPIRY_KEY, String(expiry), { expirationTtl: ttl });
    } catch (e) {
      // KV 写入失败不影响流程
    }
  }

  return token;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
  const isAllowed = allowed.some(a => origin === a || a === "*");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0] || "",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Table-Id, X-Api-Key",
    "Access-Control-Max-Age": "86400",
  };
}

function verifyApiKey(request, env) {
  // 如果未设置 PROXY_API_KEY，跳过验证（开发阶段）
  if (!env.PROXY_API_KEY) return true;
  const key = request.headers.get("X-Api-Key") || "";
  return key === env.PROXY_API_KEY;
}

export default {
  async fetch(request, env) {
    // CORS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const cors = corsHeaders(request, env);

    try {
      // 健康检查（不需要 API Key）
      if (path === "/" || path === "/health") {
        return jsonResponse({
          status: "ok",
          version: "2.0",
          timestamp: new Date().toISOString(),
          hasKV: !!env.TOKEN_CACHE,
          note: "德胧预订管理系统 API 代理"
        }, cors);
      }

      // 验证 API Key
      if (!verifyApiKey(request, env)) {
        return jsonResponse({ error: "Unauthorized", message: "无效的 API Key" }, cors, 401);
      }

      // ======== API 使用量监控 ========
      // GET /api/usage — 返回当日 API 调用统计（用于监控飞书免费版额度）
      if (path === "/api/usage" && request.method === "GET") {
        if (env.TOKEN_CACHE) {
          const today = new Date().toISOString().slice(0, 10);
          const count = await env.TOKEN_CACHE.get(`usage_${today}`) || "0";
          return jsonResponse({ date: today, apiCalls: Number(count), limit: 10000, note: "飞书免费版每月1万次API调用限额" }, cors);
        }
        return jsonResponse({ message: "未配置 KV，无法追踪用量" }, cors);
      }

      // ======== 递增 API 调用计数 ========
      const incrementUsage = async () => {
        if (!env.TOKEN_CACHE) return;
        try {
          const today = new Date().toISOString().slice(0, 10);
          const key = `usage_${today}`;
          const current = Number(await env.TOKEN_CACHE.get(key) || "0");
          await env.TOKEN_CACHE.put(key, String(current + 1), { expirationTtl: 172800 }); // 保留2天
        } catch (e) {}
      };

      // ======== 表元数据 ========
      if (path === "/api/tables" && request.method === "GET") {
        const token = await getAccessToken(env);
        const resp = await feishuGet(token, `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables`);
        await incrementUsage();
        return jsonResponse(resp, cors);
      }

      // ======== 字段元数据 ========
      const fieldsMatch = path.match(/^\/api\/fields\/([a-zA-Z0-9_]+)$/);
      if (fieldsMatch && request.method === "GET") {
        const tableId = fieldsMatch[1];
        const token = await getAccessToken(env);
        const resp = await feishuGet(token, `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/fields`);
        await incrementUsage();
        return jsonResponse(resp, cors);
      }

      // ======== 通用 CRUD: /api/records/:tableId ========
      const recordMatch = path.match(/^\/api\/records\/([a-zA-Z0-9_]+)$/);
      if (recordMatch) {
        const tableId = recordMatch[1];
        const token = await getAccessToken(env);

        // GET — 查询记录
        if (request.method === "GET") {
          const params = new URLSearchParams();
          for (const [k, v] of url.searchParams) {
            if (["page_size", "page_token", "filter", "sort", "field_names", "view_id"].includes(k)) {
              params.set(k, v);
            }
          }
          params.set("automatic_fields", "true");
          const qs = params.toString() ? `?${params.toString()}` : "";
          const resp = await feishuGet(token, `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records${qs}`);
          await incrementUsage();
          return jsonResponse(resp, cors);
        }

        // POST — 创建记录
        if (request.method === "POST") {
          const body = await request.json();
          if (body.records && Array.isArray(body.records)) {
            const resp = await feishuPost(token,
              `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/batch_create`,
              { records: body.records }
            );
            await incrementUsage();
            return jsonResponse(resp, cors);
          }
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records`,
            { fields: body.fields || body }
          );
          await incrementUsage();
          return jsonResponse(resp, cors);
        }

        // PUT — 批量更新
        if (request.method === "PUT") {
          const body = await request.json();
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/batch_update`,
            { records: body.records },
            "PUT"
          );
          await incrementUsage();
          return jsonResponse(resp, cors);
        }

        // DELETE — 批量删除
        if (request.method === "DELETE") {
          const body = await request.json();
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/batch_delete`,
            { records: body.records },
            "DELETE"
          );
          await incrementUsage();
          return jsonResponse(resp, cors);
        }
      }

      // ======== 单条记录: /api/records/:tableId/:recordId ========
      const singleMatch = path.match(/^\/api\/records\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9_]+)$/);
      if (singleMatch) {
        const [, tableId, recordId] = singleMatch;
        const token = await getAccessToken(env);

        if (request.method === "GET") {
          const resp = await feishuGet(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}?automatic_fields=true`
          );
          await incrementUsage();
          return jsonResponse(resp, cors);
        }

        if (request.method === "PATCH") {
          const body = await request.json();
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}`,
            { fields: body.fields || body },
            "PUT"
          );
          await incrementUsage();
          return jsonResponse(resp, cors);
        }

        if (request.method === "DELETE") {
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}`,
            {},
            "DELETE"
          );
          await incrementUsage();
          return jsonResponse(resp, cors);
        }
      }

      // ======== 全量同步: POST /api/sync/:tableId ========
      const syncMatch = path.match(/^\/api\/sync\/([a-zA-Z0-9_]+)$/);
      if (syncMatch && request.method === "POST") {
        const tableId = syncMatch[1];
        const token = await getAccessToken(env);
        const body = await request.json();
        const records = body.records || [];

        const results = [];
        for (let i = 0; i < records.length; i += 500) {
          const batch = records.slice(i, i + 500);
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/batch_create`,
            { records: batch }
          );
          results.push(resp);
          await incrementUsage();
          if (i + 500 < records.length) {
            await new Promise(r => setTimeout(r, 200));
          }
        }
        return jsonResponse({ ok: true, batches: results.length, total: records.length }, cors);
      }

      return jsonResponse({ error: "Not Found", path }, cors, 404);

    } catch (err) {
      return jsonResponse(
        { error: err.message },
        cors,
        500
      );
    }
  },
};

// ---- 飞书 API 辅助函数 ----

async function feishuGet(token, path) {
  const resp = await fetch(`${FEISHU_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json();
}

async function feishuPost(token, path, body, method = "POST") {
  const resp = await fetch(`${FEISHU_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
