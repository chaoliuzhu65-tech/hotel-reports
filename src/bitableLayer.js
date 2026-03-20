/**
 * 德胧预订管理系统 — 飞书多维表格数据层
 * 
 * 双层架构：localStorage（快速缓存）+ 飞书Bitable（持久存储）
 * - 读操作：优先从缓存读取，后台异步刷新
 * - 写操作：立即写缓存 + 异步写Bitable
 * - 首次加载：从Bitable拉取全量数据到缓存
 */

// ===== 配置 =====
const BITABLE_CONFIG_KEY = "delon_bitable_config";
const STORAGE_KEY = "delon_booking_system_v2";

// 获取配置
export function getBitableConfig() {
  try {
    return JSON.parse(localStorage.getItem(BITABLE_CONFIG_KEY) || "null");
  } catch { return null; }
}

// 保存配置
export function saveBitableConfig(config) {
  localStorage.setItem(BITABLE_CONFIG_KEY, JSON.stringify(config));
}

// 检查是否已配置
export function isBitableEnabled() {
  const config = getBitableConfig();
  return !!(config?.workerUrl && config?.tableIds);
}

// ===== API 调用 =====

async function apiCall(method, path, body = null) {
  const config = getBitableConfig();
  if (!config?.workerUrl) throw new Error("未配置飞书数据源");

  const url = `${config.workerUrl.replace(/\/$/, "")}${path}`;
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(url, opts);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

// ===== 表数据操作 =====

// 获取所有记录（自动分页）
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

// 创建单条记录
export async function createRecord(tableId, fields) {
  return apiCall("POST", `/api/records/${tableId}`, { fields });
}

// 批量创建记录
export async function batchCreateRecords(tableId, recordsFields) {
  const records = recordsFields.map(fields => ({ fields }));
  return apiCall("POST", `/api/records/${tableId}`, { records });
}

// 更新单条记录
export async function updateRecord(tableId, recordId, fields) {
  return apiCall("PATCH", `/api/records/${tableId}/${recordId}`, { fields });
}

// 批量更新记录
export async function batchUpdateRecords(tableId, records) {
  // records: [{record_id, fields}, ...]
  return apiCall("PUT", `/api/records/${tableId}`, { records });
}

// 删除记录
export async function deleteRecord(tableId, recordId) {
  return apiCall("DELETE", `/api/records/${tableId}/${recordId}`);
}

// 批量同步（首次上传本地数据）
export async function syncUpload(tableId, recordsFields) {
  const records = recordsFields.map(fields => ({ fields }));
  return apiCall("POST", `/api/sync/${tableId}`, { records });
}

// ===== 字段映射 =====

// 将前端数据对象转为 Bitable fields
const venueToFields = (v) => ({
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

// 将 Bitable record 转为前端数据对象
const fieldsToVenue = (record) => {
  const f = record.fields;
  const typeMap = { "宴会厅": "BANQUET", "会议室": "MEETING", "包厢": "PRIVATE" };
  return {
    id: record.record_id,
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
  number: b.number || "",
  type: { MEETING: "会议", BANQUET: "宴会", WEDDING: "婚宴", PRIVATE_DINING: "包厢宴请", ROOM: "客房" }[b.type] || b.type,
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
  total_amount: Number(b.totalAmount) || 0,
  payment_status: { UNPAID: "未付", PARTIAL: "部分付", PAID: "已付清", SETTLED: "已结算" }[b.paymentStatus] || b.paymentStatus,
  payment_terms: b.paymentTerms || "",
  setup_style: b.setupStyle || "",
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
    id: record.record_id,
    _recordId: record.record_id,
    number: f.number || "",
    type: typeMap[f.type] || "MEETING",
    venueId: f.venue_name || "", // 需要后续通过名称关联
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
    salesPhone: "",
    totalAmount: Number(f.total_amount) || 0,
    paymentStatus: payMap[f.payment_status] || "UNPAID",
    paymentTerms: f.payment_terms || "",
    setupStyle: f.setup_style || "",
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
    id: record.record_id,
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
    userId: "",
    userName: f.user_name || "",
    action: f.action || "",
    target: f.target || "",
    details: f.details || "",
    timestamp: f.timestamp || "",
  };
};

// ===== 导出映射表 =====
export const FIELD_MAPPERS = {
  venues: { toFields: venueToFields, fromFields: fieldsToVenue },
  bookings: { toFields: bookingToFields, fromFields: fieldsToBooking },
  roomBookings: { toFields: roomToFields, fromFields: fieldsToRoom },
  auditLogs: { toFields: logToFields, fromFields: fieldsToLog },
};

// ===== 高级同步管理 =====

// 写入队列（避免并发写冲突）
let writeQueue = Promise.resolve();

export function enqueueWrite(fn) {
  writeQueue = writeQueue.then(fn).catch(err => {
    console.warn("[Bitable] 写入失败，数据已在本地缓存:", err.message);
  });
  return writeQueue;
}

// 从飞书加载全量数据到本地
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

  // 预订表需要将 venue_name 映射回 venueId
  if (result.venues && result.bookings) {
    const venueNameToId = {};
    result.venues.forEach(v => { venueNameToId[v.name] = v.id; });
    result.bookings.forEach(b => {
      if (b.venueId && venueNameToId[b.venueId]) {
        b.venueId = venueNameToId[b.venueId];
      }
    });
  }

  return result;
}

// 将本地数据全量推送到飞书（首次迁移用）
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

// 测试连接
export async function testBitableConnection() {
  try {
    const resp = await apiCall("GET", "/health");
    if (resp.status === "ok") {
      // 进一步测试表访问
      const config = getBitableConfig();
      if (config?.tableIds?.venues) {
        await apiCall("GET", `/api/records/${config.tableIds.venues}?page_size=1`);
      }
      return { success: true, message: "连接成功" };
    }
    return { success: false, message: "代理服务异常" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
