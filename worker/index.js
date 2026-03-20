/**
 * 德胧预订管理系统 — Cloudflare Worker API 代理
 * 
 * 功能：作为前端与飞书多维表格API之间的安全代理
 * - 管理飞书 tenant_access_token（自动刷新）
 * - 转发 CRUD 请求到飞书 Bitable API
 * - 处理 CORS，允许前端跨域访问
 * 
 * 环境变量（在 Cloudflare Dashboard 中设置）：
 * - FEISHU_APP_ID: 飞书自建应用 App ID
 * - FEISHU_APP_SECRET: 飞书自建应用 App Secret
 * - BITABLE_APP_TOKEN: 多维表格的 app_token
 * - ALLOWED_ORIGINS: 允许的前端域名（逗号分隔）
 */

const FEISHU_BASE = "https://open.feishu.cn/open-apis";

// Token 缓存（Worker 实例内存缓存，约30分钟自动刷新）
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken(env) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60000) {
    return cachedToken;
  }

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
    throw new Error(`Token error: ${data.msg}`);
  }

  cachedToken = data.tenant_access_token;
  tokenExpiry = now + (data.expire - 300) * 1000; // 提前5分钟刷新
  return cachedToken;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
  const isAllowed = allowed.some(a => origin === a || a === "*");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0] || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Table-Id",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    // CORS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 健康检查
      if (path === "/" || path === "/health") {
        return jsonResponse({ status: "ok", timestamp: new Date().toISOString() }, corsHeaders(request, env));
      }

      // ======== 表元数据 ========
      // GET /api/tables — 列出所有数据表
      if (path === "/api/tables" && request.method === "GET") {
        const token = await getAccessToken(env);
        const resp = await feishuGet(token, `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables`);
        return jsonResponse(resp, corsHeaders(request, env));
      }

      // ======== 通用 CRUD ========
      // 路由格式: /api/records/:tableId
      const recordMatch = path.match(/^\/api\/records\/([a-zA-Z0-9_]+)$/);
      if (recordMatch) {
        const tableId = recordMatch[1];
        const token = await getAccessToken(env);

        // GET — 查询记录（支持分页、筛选、排序）
        if (request.method === "GET") {
          const params = new URLSearchParams();
          if (url.searchParams.get("page_size")) params.set("page_size", url.searchParams.get("page_size"));
          if (url.searchParams.get("page_token")) params.set("page_token", url.searchParams.get("page_token"));
          if (url.searchParams.get("filter")) params.set("filter", url.searchParams.get("filter"));
          if (url.searchParams.get("sort")) params.set("sort", url.searchParams.get("sort"));
          params.set("automatic_fields", "true");
          const qs = params.toString() ? `?${params.toString()}` : "";
          const resp = await feishuGet(token, `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records${qs}`);
          return jsonResponse(resp, corsHeaders(request, env));
        }

        // POST — 创建记录（单条或批量）
        if (request.method === "POST") {
          const body = await request.json();
          // 批量创建: { records: [{fields:...}, ...] }
          if (body.records && Array.isArray(body.records)) {
            const resp = await feishuPost(token,
              `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/batch_create`,
              { records: body.records }
            );
            return jsonResponse(resp, corsHeaders(request, env));
          }
          // 单条创建: { fields: {...} }
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records`,
            { fields: body.fields || body }
          );
          return jsonResponse(resp, corsHeaders(request, env));
        }

        // PUT — 批量更新: { records: [{record_id, fields}, ...] }
        if (request.method === "PUT") {
          const body = await request.json();
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/batch_update`,
            { records: body.records },
            "PUT"
          );
          return jsonResponse(resp, corsHeaders(request, env));
        }

        // DELETE — 批量删除: { records: ["recXXX", ...] }
        if (request.method === "DELETE") {
          const body = await request.json();
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/batch_delete`,
            { records: body.records },
            "DELETE"
          );
          return jsonResponse(resp, corsHeaders(request, env));
        }
      }

      // 单条记录操作: /api/records/:tableId/:recordId
      const singleMatch = path.match(/^\/api\/records\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9_]+)$/);
      if (singleMatch) {
        const [, tableId, recordId] = singleMatch;
        const token = await getAccessToken(env);

        // GET — 获取单条
        if (request.method === "GET") {
          const resp = await feishuGet(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}?automatic_fields=true`
          );
          return jsonResponse(resp, corsHeaders(request, env));
        }

        // PATCH — 更新单条
        if (request.method === "PATCH") {
          const body = await request.json();
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}`,
            { fields: body.fields || body },
            "PUT"
          );
          return jsonResponse(resp, corsHeaders(request, env));
        }

        // DELETE — 删除单条
        if (request.method === "DELETE") {
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}`,
            {},
            "DELETE"
          );
          return jsonResponse(resp, corsHeaders(request, env));
        }
      }

      // ======== 全量同步接口 ========
      // POST /api/sync/:tableId — 批量同步（用于首次上传本地数据）
      const syncMatch = path.match(/^\/api\/sync\/([a-zA-Z0-9_]+)$/);
      if (syncMatch && request.method === "POST") {
        const tableId = syncMatch[1];
        const token = await getAccessToken(env);
        const body = await request.json();
        const records = body.records || [];

        // 分批上传（每批500条）
        const results = [];
        for (let i = 0; i < records.length; i += 500) {
          const batch = records.slice(i, i + 500);
          const resp = await feishuPost(token,
            `/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${tableId}/records/batch_create`,
            { records: batch }
          );
          results.push(resp);
          // 避免超过 QPS 限制
          if (i + 500 < records.length) {
            await new Promise(r => setTimeout(r, 200));
          }
        }
        return jsonResponse({ ok: true, batches: results.length, total: records.length }, corsHeaders(request, env));
      }

      return jsonResponse({ error: "Not Found", path }, corsHeaders(request, env), 404);

    } catch (err) {
      return jsonResponse(
        { error: err.message, stack: err.stack },
        corsHeaders(request, env),
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
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
