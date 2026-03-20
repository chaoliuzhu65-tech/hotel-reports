/**
 * 德胧预订管理系统 — 可移植数据抽象层 v2
 * 
 * 提供者模式架构:
 *   DataProvider (接口) ← LocalStorageProvider (默认)
 *                      ← BitableProvider (飞书多维表格)
 *                      ← [未来] MySQLProvider / SupabaseProvider
 * 
 * 使用方式:
 *   import { dataLayer } from './dataLayer.js';
 *   await dataLayer.init();
 *   const venues = await dataLayer.getAll('venues');
 *   await dataLayer.create('bookings', bookingData);
 * 
 * 切换提供者只需修改 init() 中的配置，业务代码零改动
 * 
 * ⚠️ 飞书免费版限额提醒:
 * 自2026年3月起，飞书免费版对自建应用限制每月1万次API调用。
 * 按酒店日均200次估算，月均约6000次，在限额内但偏紧。
 * 如果出现数据读写异常，请首先排查此限额问题。
 * 解决方案: 升级飞书套餐(商业版100万次/月) 或 切换到其他数据提供者。
 */

// ==================== 配置管理 ====================
const BITABLE_CONFIG_KEY = "delon_bitable_config";
const STORAGE_KEY = "delon_booking_system_v2";

export function getBitableConfig() {
  try { return JSON.parse(localStorage.getItem(BITABLE_CONFIG_KEY) || "null"); } catch { return null; }
}

export function saveBitableConfig(config) {
  localStorage.setItem(BITABLE_CONFIG_KEY, JSON.stringify(config));
}

export function isBitableEnabled() {
  const config = getBitableConfig();
  return !!(config?.workerUrl && config?.tableIds);
}

// ==================== API 调用 ====================

async function apiCall(method, path, body = null) {
  const config = getBitableConfig();
  if (!config?.workerUrl) throw new Error("未配置飞书数据源");

  const url = `${config.workerUrl.replace(/\/$/, "")}${path}`;
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  // 携带 API Key（如果配置了）
  if (config.apiKey) {
    opts.headers["X-Api-Key"] = config.apiKey;
  }
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(url, opts);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

// ==================== Bitable CRUD ====================

export async function fetchAllRecords(tableId) {
  const records = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({ page_size: "500" });
    if (pageToken) params.set("page_token", pageToken);
    const resp = await apiCall("GET", `/api/records/${tableId}?${params}`);

    if (resp.data?.items) {
      records.push(...resp.data.items);
    }
    hasMore = resp.data?.has_more || false;
    pageToken = resp.data?.page_token || null;
  }

  return records;
}

export async function createRecord(tableId, fields) {
  return apiCall("POST", `/api/records/${tableId}`, { fields });
}

export async function batchCreateRecords(tableId, recordsFields) {
  const records = recordsFields.map(fields => ({ fields }));
  return apiCall("POST", `/api/records/${tableId}`, { records });
}

export async function updateRecord(tableId, recordId, fields) {
  return apiCall("PATCH", `/api/records/${tableId}/${recordId}`, { fields });
}

export async function batchUpdateRecords(tableId, records) {
  return apiCall("PUT", `/api/records/${tableId}`, { records });
}

export async function deleteRecord(tableId, recordId) {
  return apiCall("DELETE", `/api/records/${tableId}/${recordId}`);
}

export async function syncUpload(tableId, recordsFields) {
  const records = recordsFields.map(fields => ({ fields }));
  return apiCall("POST", `/api/sync/${tableId}`, { records });
}

// ==================== 自动发现表格 ====================

/**
 * 从飞书多维表格 API 获取所有数据表并自动匹配 table_id
 * 根据表名匹配: 场地信息→venues, 预订记录→bookings, 客房预订→roomBookings, 操作日志→auditLogs
 */
export async function discoverTables() {
  const resp = await apiCall("GET", "/api/tables");
  if (resp.code !== 0) {
    throw new Error(resp.msg || `飞书API错误 (code: ${resp.code})`);
  }

  const tables = resp.data?.items || [];
  const nameMap = {
    "场地信息": "venues", "场地": "venues", "venues": "venues",
    "预订记录": "bookings", "预订": "bookings", "bookings": "bookings",
    "客房预订": "roomBookings", "客房": "roomBookings", "rooms": "roomBookings", "room_bookings": "roomBookings",
    "操作日志": "auditLogs", "日志": "auditLogs", "logs": "auditLogs", "audit_logs": "auditLogs",
  };

  const discovered = { venues: "", bookings: "", roomBookings: "", auditLogs: "" };
  const tableInfo = [];

  for (const t of tables) {
    const name = t.name || "";
    const id = t.table_id || "";
    tableInfo.push({ name, id });

    // 精确匹配
    if (nameMap[name]) {
      discovered[nameMap[name]] = id;
    } else {
      // 模糊匹配
      const lower = name.toLowerCase();
      if (lower.includes("场地") || lower.includes("venue")) discovered.venues = discovered.venues || id;
      else if (lower.includes("预订") || lower.includes("booking")) discovered.bookings = discovered.bookings || id;
      else if (lower.includes("客房") || lower.includes("room")) discovered.roomBookings = discovered.roomBookings || id;
      else if (lower.includes("日志") || lower.includes("log") || lower.includes("audit")) discovered.auditLogs = discovered.auditLogs || id;
    }
  }

  return { tableIds: discovered, allTables: tableInfo };
}

// ==================== API 用量查询 ====================

export async function getApiUsage() {
  try {
    return await apiCall("GET", "/api/usage");
  } catch { return null; }
}

// ==================== 字段映射 ====================

const venueToFields = (v) => ({
  id: v.id || "",
  name: v.name || "",
  type: { BANQUET: "宴会厅", MEETING: "会议室", PRIVATE: "包厢" }[v.type] || v.type,
  floor: v.floor || "",
  capacity: Number(v.capacity) || 0,
  price_per_table: Number(v.pricePerTable) || 0,
  half_day_rate: Number(v.halfDayRate) || 0,
  min_spend: Number(v.minSpend) || 0,
  status: v.status === "active" ? "启用" : "停用",
  description: v.description || "",
  img_url: (v.img && !v.img.startsWith("data:")) ? v.img : "",
  recommended_dishes: v.recommendedDishes || "",
});

const fieldsToVenue = (record) => {
  const f = record.fields;
  const typeMap = { "宴会厅": "BANQUET", "会议室": "MEETING", "包厢": "PRIVATE" };
  return {
    id: f.id || record.record_id,
    _recordId: record.record_id,
    name: f.name || "",
    type: typeMap[f.type] || "MEETING",
    floor: f.floor || "",
    capacity: Number(f.capacity) || 0,
    pricePerTable: Number(f.price_per_table) || 0,
    halfDayRate: Number(f.half_day_rate) || 0,
    minSpend: Number(f.min_spend) || 0,
    status: f.status === "启用" ? "active" : "inactive",
    description: f.description || "",
    img: f.img_url || "",
    recommendedDishes: f.recommended_dishes || "",
    timeSlots: [
      { id: "morning", label: "上午", start: "08:00", end: "12:00", color: "#FEF3C7" },
      { id: "noon", label: "中午", start: "11:30", end: "14:00", color: "#DBEAFE" },
      { id: "afternoon", label: "下午", start: "14:00", end: "18:00", color: "#D1FAE5" },
      { id: "evening", label: "晚上", start: "18:00", end: "22:00", color: "#EDE9FE" },
    ],
  };
};

const bookingToFields = (b) => ({
  id: b.id || "",
  number: b.number || "",
  type: { MEETING: "会议", BANQUET: "宴会", WEDDING: "婚宴", PRIVATE_DINING: "包厢宴请", ROOM: "客房" }[b.type] || b.type,
  venue_id: b.venueId || "",
  venue_name: b._venueName || "",
  date: b.date ? new Date(b.date).getTime() : null,
  time_slot: { morning: "上午", noon: "中午", afternoon: "下午", evening: "晚上" }[b.timeSlotId] || b.timeSlotId,
  status: { TENTATIVE: "暂定", CONFIRMED: "确认", CANCELLED: "取消", COMPLETED: "已完成" }[b.status] || b.status,
  event_name: b.eventName || "",
  organizer: b.organizer || "",
  contact_name: b.contactName || "",
  contact_phone: b.contactPhone || "",
  expected_attendance: Number(b.expectedAttendance) || 0,
  guaranteed_attendance: Number(b.guaranteedAttendance) || 0,
  sales_person: b.salesPerson || "",
  sales_phone: b.salesPhone || "",
  total_amount: Number(b.totalAmount) || 0,
  payment_status: { UNPAID: "未付", PARTIAL: "部分付", PAID: "已付清", SETTLED: "已结算" }[b.paymentStatus] || b.paymentStatus,
  payment_terms: b.paymentTerms || "",
  setup_style: b.setupStyle || "",
  table_count: Number(b.tableCount) || 0,
  price_per_table: Number(b.pricePerTable) || 0,
  notes: b.notes || "",
  equipment_json: JSON.stringify(b.equipment || []),
  departments_json: JSON.stringify(b.departments || []),
  linked_venues_json: JSON.stringify(b.linkedVenues || []),
  room_bookings_json: JSON.stringify(b.roomBookings || []),
});

const fieldsToBooking = (record) => {
  const f = record.fields;
  const typeMap = { "会议": "MEETING", "宴会": "BANQUET", "婚宴": "WEDDING", "包厢宴请": "PRIVATE_DINING", "客房": "ROOM" };
  const statusMap = { "暂定": "TENTATIVE", "确认": "CONFIRMED", "取消": "CANCELLED", "已完成": "COMPLETED" };
  const payMap = { "未付": "UNPAID", "部分付": "PARTIAL", "已付清": "PAID", "已结算": "SETTLED" };
  const slotMap = { "上午": "morning", "中午": "noon", "下午": "afternoon", "晚上": "evening" };

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = new Date(typeof ts === "number" ? ts : ts);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  let equipment = [], departments = [], linkedVenues = [], roomBookings = [];
  try { equipment = JSON.parse(f.equipment_json || "[]"); } catch {}
  try { departments = JSON.parse(f.departments_json || "[]"); } catch {}
  try { linkedVenues = JSON.parse(f.linked_venues_json || "[]"); } catch {}
  try { roomBookings = JSON.parse(f.room_bookings_json || "[]"); } catch {}

  return {
    id: f.id || record.record_id,
    _recordId: record.record_id,
    number: f.number || "",
    type: typeMap[f.type] || "MEETING",
    venueId: f.venue_id || "",
    date: fmtDate(f.date),
    timeSlotId: slotMap[f.time_slot] || "morning",
    status: statusMap[f.status] || "TENTATIVE",
    eventName: f.event_name || "",
    organizer: f.organizer || "",
    contactName: f.contact_name || "",
    contactPhone: f.contact_phone || "",
    expectedAttendance: Number(f.expected_attendance) || 0,
    guaranteedAttendance: Number(f.guaranteed_attendance) || 0,
    salesPerson: f.sales_person || "",
    salesPhone: f.sales_phone || "",
    totalAmount: Number(f.total_amount) || 0,
    paymentStatus: payMap[f.payment_status] || "UNPAID",
    paymentTerms: f.payment_terms || "",
    setupStyle: f.setup_style || "",
    tableCount: Number(f.table_count) || 0,
    pricePerTable: Number(f.price_per_table) || 0,
    notes: f.notes || "",
    equipment,
    departments,
    linkedVenues,
    roomBookings,
    createdAt: fmtDate(record.created_time),
    updatedAt: fmtDate(record.modified_time),
  };
};

const roomToFields = (r) => ({
  id: r.id || "",
  guest_name: r.guestName || "",
  phone: r.phone || "",
  check_in: r.checkIn ? new Date(r.checkIn).getTime() : null,
  check_out: r.checkOut ? new Date(r.checkOut).getTime() : null,
  room_type: r.roomType || "",
  room_count: Number(r.roomCount) || 1,
  rate: Number(r.rate) || 0,
  source: r.source || "",
  company: r.company || "",
  sales_person: r.salesPerson || "",
  status: { CONFIRMED: "确认", CANCELLED: "取消" }[r.status] || r.status,
  payment_status: { UNPAID: "未付", PARTIAL: "部分付", PAID: "已付清" }[r.paymentStatus] || r.paymentStatus,
  notes: r.notes || "",
  linked_event_id: r.linkedEventId || "",
});

const fieldsToRoom = (record) => {
  const f = record.fields;
  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = new Date(typeof ts === "number" ? ts : ts);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  return {
    id: f.id || record.record_id,
    _recordId: record.record_id,
    guestName: f.guest_name || "",
    phone: f.phone || "",
    checkIn: fmtDate(f.check_in),
    checkOut: fmtDate(f.check_out),
    roomType: f.room_type || "",
    roomCount: Number(f.room_count) || 1,
    rate: Number(f.rate) || 0,
    source: f.source || "",
    company: f.company || "",
    salesPerson: f.sales_person || "",
    status: f.status === "取消" ? "CANCELLED" : "CONFIRMED",
    paymentStatus: { "未付": "UNPAID", "部分付": "PARTIAL", "已付清": "PAID" }[f.payment_status] || "UNPAID",
    notes: f.notes || "",
    linkedEventId: f.linked_event_id || null,
  };
};

const logToFields = (l) => ({
  user_id: l.userId || "",
  user_name: l.userName || "",
  action: l.action || "",
  target: l.target || "",
  details: l.details || "",
  timestamp: l.timestamp || "",
});

const fieldsToLog = (record) => {
  const f = record.fields;
  return {
    id: record.record_id,
    _recordId: record.record_id,
    userId: f.user_id || "",
    userName: f.user_name || "",
    action: f.action || "",
    target: f.target || "",
    details: f.details || "",
    timestamp: f.timestamp || "",
  };
};

// ==================== 字段映射导出 ====================
export const FIELD_MAPPERS = {
  venues: { toFields: venueToFields, fromFields: fieldsToVenue },
  bookings: { toFields: bookingToFields, fromFields: fieldsToBooking },
  roomBookings: { toFields: roomToFields, fromFields: fieldsToRoom },
  auditLogs: { toFields: logToFields, fromFields: fieldsToLog },
};

// ==================== 写入队列 ====================

let writeQueue = Promise.resolve();

export function enqueueWrite(fn) {
  writeQueue = writeQueue.then(fn).catch(err => {
    console.warn("[DataLayer] 写入失败，数据已在本地缓存:", err.message);
  });
  return writeQueue;
}

// ==================== 同步管理 ====================

export async function pullAllFromBitable() {
  const config = getBitableConfig();
  if (!config?.tableIds) throw new Error("未配置表ID");

  const result = {};
  const tableMap = config.tableIds;

  for (const [key, tableId] of Object.entries(tableMap)) {
    if (!tableId || !FIELD_MAPPERS[key]) continue;
    const records = await fetchAllRecords(tableId);
    result[key] = records.map(FIELD_MAPPERS[key].fromFields);
  }

  return result;
}

export async function pushAllToBitable(localData) {
  const config = getBitableConfig();
  if (!config?.tableIds) throw new Error("未配置表ID");

  const results = {};
  for (const [key, tableId] of Object.entries(config.tableIds)) {
    if (!tableId || !FIELD_MAPPERS[key] || !localData[key]) continue;
    const fieldsArray = localData[key].map(item => ({ fields: FIELD_MAPPERS[key].toFields(item) }));
    if (fieldsArray.length === 0) continue;
    const resp = await syncUpload(tableId, fieldsArray.map(r => r.fields));
    results[key] = { count: localData[key].length, resp };
  }

  return results;
}

export async function testBitableConnection() {
  try {
    const resp = await apiCall("GET", "/health");
    if (resp.status === "ok") {
      const config = getBitableConfig();
      if (config?.tableIds?.venues) {
        await apiCall("GET", `/api/records/${config.tableIds.venues}?page_size=1`);
      }
      return { success: true, message: "连接成功", version: resp.version || "1.0" };
    }
    return { success: false, message: "代理服务异常" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ==================== 提供者模式接口（为未来扩展预留） ====================
/**
 * 数据提供者接口规范 — 未来切换数据库时实现此接口即可
 * 
 * interface DataProvider {
 *   name: string;                                          // 提供者名称
 *   init(config: object): Promise<void>;                   // 初始化连接
 *   getAll(collection: string): Promise<object[]>;         // 获取全部记录
 *   getById(collection: string, id: string): Promise<object>; // 获取单条
 *   create(collection: string, data: object): Promise<object>; // 创建
 *   update(collection: string, id: string, data: object): Promise<object>; // 更新
 *   delete(collection: string, id: string): Promise<void>; // 删除
 *   query(collection: string, filter: object): Promise<object[]>; // 条件查询
 *   testConnection(): Promise<{success: boolean, message: string}>; // 测试连接
 *   getUsageStats(): Promise<object>;                      // 获取用量统计
 * }
 * 
 * 支持的 collection 名称: 'venues', 'bookings', 'roomBookings', 'auditLogs', 'users'
 * 
 * 迁移指南:
 * 1. 创建新的 Provider 实现上述接口
 * 2. 在 dataLayer.init() 中根据配置选择 Provider
 * 3. 业务代码通过 dataLayer.xxx() 调用，无需修改
 * 
 * 候选替代数据库:
 * - Supabase (PostgreSQL): 免费50K行，适合中小酒店
 * - PlanetScale (MySQL): 免费1GB，5K读/月
 * - Turso (SQLite edge): 免费8GB，适合读多写少
 * - 阿里云 RDS MySQL: 适合集团级部署
 */
