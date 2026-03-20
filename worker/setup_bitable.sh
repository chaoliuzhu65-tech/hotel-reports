#!/bin/bash
# 德胧预订管理系统 — 飞书多维表格自动建表脚本
# 运行方式: bash setup_bitable.sh
# 前提: 飞书应用已授权 bitable:app 权限并发布版本

APP_ID="cli_a93aa1cc63389cee"
APP_SECRET="KOIpik0vS2wOJIBKyIwtTdIoKBB4sXNp"
FEISHU_BASE="https://open.feishu.cn/open-apis"

echo "=============================="
echo " 德胧预订管理系统 - 自动建表"
echo "=============================="

# 1. 获取 Token
echo "[1/5] 获取飞书访问令牌..."
TOKEN_RESP=$(curl -s -X POST "$FEISHU_BASE/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\":\"$APP_ID\",\"app_secret\":\"$APP_SECRET\"}")

TOKEN=$(echo $TOKEN_RESP | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tenant_access_token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Token 获取失败:"
  echo $TOKEN_RESP
  exit 1
fi
echo "✅ Token 获取成功: ${TOKEN:0:15}..."

# 2. 创建多维表格应用
echo "[2/5] 创建多维表格..."
BITABLE_RESP=$(curl -s -X POST "$FEISHU_BASE/bitable/v1/apps" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"德胧预订管理系统_天津开元","folder_token":""}')

echo "响应: $BITABLE_RESP"

BITABLE_CODE=$(echo $BITABLE_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('code','-1'))" 2>/dev/null)

if [ "$BITABLE_CODE" != "0" ]; then
  echo "❌ 创建多维表格失败 (code=$BITABLE_CODE)"
  echo "如果错误码是 99991672，请确认:"
  echo "  1. 已在飞书开放平台添加 bitable:app 权限"
  echo "  2. 已发布新版本使权限生效"
  echo "  链接: https://open.feishu.cn/app/$APP_ID/apiandscope"
  exit 1
fi

APP_TOKEN=$(echo $BITABLE_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['app']['app_token'])" 2>/dev/null)
# 创建时会自动生成一个默认表，获取它的 ID
DEFAULT_TABLE=$(echo $BITABLE_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['app']['default_table_id'])" 2>/dev/null)

echo "✅ 多维表格创建成功!"
echo "   App Token: $APP_TOKEN"
echo "   默认表 ID: $DEFAULT_TABLE"

# 3. 重命名默认表为"场地信息"，并添加字段
echo "[3/5] 配置「场地信息」表..."

# 更新默认表名称
curl -s -X PATCH "$FEISHU_BASE/bitable/v1/apps/$APP_TOKEN/tables/$DEFAULT_TABLE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"场地信息"}' > /dev/null

# 添加字段（场地信息）
for FIELD_JSON in \
  '{"field_name":"id","type":1}' \
  '{"field_name":"name","type":1}' \
  '{"field_name":"type","type":3,"property":{"options":[{"name":"宴会厅"},{"name":"会议室"},{"name":"包厢"}]}}' \
  '{"field_name":"floor","type":1}' \
  '{"field_name":"capacity","type":2}' \
  '{"field_name":"price_per_table","type":2}' \
  '{"field_name":"half_day_rate","type":2}' \
  '{"field_name":"min_spend","type":2}' \
  '{"field_name":"status","type":3,"property":{"options":[{"name":"启用"},{"name":"停用"}]}}' \
  '{"field_name":"description","type":1}' \
  '{"field_name":"img_url","type":15}' \
  '{"field_name":"recommended_dishes","type":1}' \
; do
  curl -s -X POST "$FEISHU_BASE/bitable/v1/apps/$APP_TOKEN/tables/$DEFAULT_TABLE/fields" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$FIELD_JSON" > /dev/null
  sleep 0.15
done
echo "✅ 场地信息表配置完成"

VENUES_TABLE=$DEFAULT_TABLE

# 4. 创建预订记录表
echo "[4/5] 创建其他数据表..."

# 创建预订记录表
BOOKINGS_RESP=$(curl -s -X POST "$FEISHU_BASE/bitable/v1/apps/$APP_TOKEN/tables" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table":{"name":"预订记录","default_view_name":"全部预订"}}')
BOOKINGS_TABLE=$(echo $BOOKINGS_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['table_id'])" 2>/dev/null)

# 添加预订记录字段
for FIELD_JSON in \
  '{"field_name":"id","type":1}' \
  '{"field_name":"number","type":1}' \
  '{"field_name":"type","type":3,"property":{"options":[{"name":"会议"},{"name":"宴会"},{"name":"婚宴"},{"name":"包厢宴请"},{"name":"客房"}]}}' \
  '{"field_name":"venue_id","type":1}' \
  '{"field_name":"venue_name","type":1}' \
  '{"field_name":"date","type":5}' \
  '{"field_name":"time_slot","type":3,"property":{"options":[{"name":"上午"},{"name":"中午"},{"name":"下午"},{"name":"晚上"}]}}' \
  '{"field_name":"status","type":3,"property":{"options":[{"name":"暂定"},{"name":"确认"},{"name":"取消"},{"name":"已完成"}]}}' \
  '{"field_name":"event_name","type":1}' \
  '{"field_name":"organizer","type":1}' \
  '{"field_name":"contact_name","type":1}' \
  '{"field_name":"contact_phone","type":1}' \
  '{"field_name":"expected_attendance","type":2}' \
  '{"field_name":"guaranteed_attendance","type":2}' \
  '{"field_name":"sales_person","type":1}' \
  '{"field_name":"sales_phone","type":1}' \
  '{"field_name":"total_amount","type":2}' \
  '{"field_name":"payment_status","type":3,"property":{"options":[{"name":"未付"},{"name":"部分付"},{"name":"已付清"},{"name":"已结算"}]}}' \
  '{"field_name":"payment_terms","type":1}' \
  '{"field_name":"setup_style","type":1}' \
  '{"field_name":"table_count","type":2}' \
  '{"field_name":"price_per_table","type":2}' \
  '{"field_name":"notes","type":1}' \
  '{"field_name":"equipment_json","type":1}' \
  '{"field_name":"departments_json","type":1}' \
  '{"field_name":"linked_venues_json","type":1}' \
  '{"field_name":"room_bookings_json","type":1}' \
; do
  curl -s -X POST "$FEISHU_BASE/bitable/v1/apps/$APP_TOKEN/tables/$BOOKINGS_TABLE/fields" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$FIELD_JSON" > /dev/null
  sleep 0.15
done
echo "   ✅ 预订记录表创建完成: $BOOKINGS_TABLE"

# 创建客房预订表
ROOMS_RESP=$(curl -s -X POST "$FEISHU_BASE/bitable/v1/apps/$APP_TOKEN/tables" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table":{"name":"客房预订","default_view_name":"全部客房"}}')
ROOMS_TABLE=$(echo $ROOMS_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['table_id'])" 2>/dev/null)

for FIELD_JSON in \
  '{"field_name":"id","type":1}' \
  '{"field_name":"guest_name","type":1}' \
  '{"field_name":"phone","type":1}' \
  '{"field_name":"check_in","type":5}' \
  '{"field_name":"check_out","type":5}' \
  '{"field_name":"room_type","type":1}' \
  '{"field_name":"room_count","type":2}' \
  '{"field_name":"rate","type":2}' \
  '{"field_name":"source","type":1}' \
  '{"field_name":"company","type":1}' \
  '{"field_name":"sales_person","type":1}' \
  '{"field_name":"status","type":3,"property":{"options":[{"name":"确认"},{"name":"取消"}]}}' \
  '{"field_name":"payment_status","type":3,"property":{"options":[{"name":"未付"},{"name":"部分付"},{"name":"已付清"}]}}' \
  '{"field_name":"notes","type":1}' \
  '{"field_name":"linked_event_id","type":1}' \
; do
  curl -s -X POST "$FEISHU_BASE/bitable/v1/apps/$APP_TOKEN/tables/$ROOMS_TABLE/fields" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$FIELD_JSON" > /dev/null
  sleep 0.15
done
echo "   ✅ 客房预订表创建完成: $ROOMS_TABLE"

# 创建操作日志表
LOGS_RESP=$(curl -s -X POST "$FEISHU_BASE/bitable/v1/apps/$APP_TOKEN/tables" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table":{"name":"操作日志","default_view_name":"全部日志"}}')
LOGS_TABLE=$(echo $LOGS_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['table_id'])" 2>/dev/null)

for FIELD_JSON in \
  '{"field_name":"user_id","type":1}' \
  '{"field_name":"user_name","type":1}' \
  '{"field_name":"action","type":1}' \
  '{"field_name":"target","type":1}' \
  '{"field_name":"details","type":1}' \
  '{"field_name":"timestamp","type":1}' \
; do
  curl -s -X POST "$FEISHU_BASE/bitable/v1/apps/$APP_TOKEN/tables/$LOGS_TABLE/fields" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$FIELD_JSON" > /dev/null
  sleep 0.15
done
echo "   ✅ 操作日志表创建完成: $LOGS_TABLE"

# 5. 输出配置信息
echo ""
echo "=============================="
echo " 🎉 全部表创建完成!"
echo "=============================="
echo ""
echo "请将以下信息填入系统设置 → 数据管理："
echo ""
echo "  BITABLE_APP_TOKEN = $APP_TOKEN"
echo "  场地信息表 ID     = $VENUES_TABLE"
echo "  预订记录表 ID     = $BOOKINGS_TABLE"
echo "  客房预订表 ID     = $ROOMS_TABLE"
echo "  操作日志表 ID     = $LOGS_TABLE"
echo ""
echo "也请将 BITABLE_APP_TOKEN 填入 Cloudflare Worker 的 Secrets 中"
echo ""
echo "多维表格链接: https://your-domain.feishu.cn/base/$APP_TOKEN"
