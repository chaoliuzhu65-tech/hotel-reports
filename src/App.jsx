import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import _ from "lodash";

// ==================== 数据模型与常量 ====================
const HOTEL_INFO = { name: "天津开元酒店", group: "德胧集团", code: "TJKY", address: "天津市滨海新区开元大道88号", lat: 39.0842, lng: 117.2005, phone: "022-88888888", coverImg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80" };
const BOOKING_TYPES = { MEETING: "会议", BANQUET: "宴会", WEDDING: "婚宴", PRIVATE_DINING: "包厢宴请", ROOM: "客房" };
const BOOKING_STATUS = { TENTATIVE: "暂定", CONFIRMED: "确认", CANCELLED: "取消", COMPLETED: "已完成" };
const TASK_STATUS = { PENDING: "待处理", IN_PROGRESS: "进行中", COMPLETED: "已完成", FEEDBACK: "待反馈" };
const PAYMENT_STATUS = { UNPAID: "未付", PARTIAL: "部分付", PAID: "已付清", SETTLED: "已结算" };

const DEFAULT_TIME_SLOTS = [
  { id: "morning", label: "上午", start: "08:00", end: "12:00", color: "#FEF3C7" },
  { id: "noon", label: "中午", start: "11:30", end: "14:00", color: "#DBEAFE" },
  { id: "afternoon", label: "下午", start: "14:00", end: "18:00", color: "#D1FAE5" },
  { id: "evening", label: "晚上", start: "18:00", end: "22:00", color: "#EDE9FE" },
];

const DEPARTMENTS = [
  { id: "frontdesk", name: "前厅部", icon: "🏨" }, { id: "fb", name: "餐饮部", icon: "🍽️" },
  { id: "marketing", name: "市场传讯部", icon: "📢" }, { id: "engineering", name: "工程部", icon: "🔧" },
  { id: "security", name: "安保部", icon: "🛡️" }, { id: "finance", name: "财务部", icon: "💰" },
  { id: "housekeeping", name: "管家部", icon: "🛏️" }, { id: "kitchen", name: "厨房", icon: "👨‍🍳" },
];

const VENUE_TYPES = { BANQUET: "宴会厅", MEETING: "会议室", PRIVATE: "包厢" };

const SAMPLE_VENUES_INIT = [
  { id: "v1", name: "开元厅", type: "BANQUET", floor: "5F", capacity: 200, pricePerTable: 3088, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80", description: "五楼主宴会厅，可容纳200人" },
  { id: "v2", name: "滨海厅", type: "BANQUET", floor: "5F", capacity: 80, pricePerTable: 2888, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "https://images.unsplash.com/photo-1540575467063-178a50e2fd60?w=400&q=80", description: "五楼副厅，适合中型宴会" },
  { id: "v3", name: "海河厅", type: "BANQUET", floor: "3F", capacity: 120, pricePerTable: 2688, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80", description: "三楼宴会厅" },
  { id: "v4", name: "一号会议室", type: "MEETING", floor: "5F", capacity: 50, halfDayRate: 2500, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "多功能会议室" },
  { id: "v5", name: "二号会议室", type: "MEETING", floor: "5F", capacity: 30, halfDayRate: 1800, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v6", name: "三号会议室", type: "MEETING", floor: "5F", capacity: 20, halfDayRate: 1200, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v7", name: "四号会议室", type: "MEETING", floor: "5F", capacity: 50, halfDayRate: 2500, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v8", name: "贵宾厅", type: "MEETING", floor: "6F", capacity: 15, halfDayRate: 3000, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v9", name: "牡丹包厢", type: "PRIVATE", floor: "2F", capacity: 12, minSpend: 2000, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80", description: "精品包厢，适合商务宴请", recommendedDishes: "松茸炖花胶、龙虾刺身、黑松露和牛" },
  { id: "v10", name: "芙蓉包厢", type: "PRIVATE", floor: "2F", capacity: 10, minSpend: 1800, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "", recommendedDishes: "清蒸东星斑、佛跳墙" },
  { id: "v11", name: "兰花包厢", type: "PRIVATE", floor: "2F", capacity: 8, minSpend: 1500, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v12", name: "竹韵包厢", type: "PRIVATE", floor: "2F", capacity: 14, minSpend: 2500, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v13", name: "梅苑包厢", type: "PRIVATE", floor: "2F", capacity: 10, minSpend: 1800, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v14", name: "荷风包厢", type: "PRIVATE", floor: "2F", capacity: 8, minSpend: 1500, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v15", name: "松涛包厢", type: "PRIVATE", floor: "3F", capacity: 16, minSpend: 3000, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v16", name: "菊香包厢", type: "PRIVATE", floor: "3F", capacity: 10, minSpend: 1800, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v17", name: "VIP1", type: "PRIVATE", floor: "6F", capacity: 20, minSpend: 5000, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v18", name: "VIP2", type: "PRIVATE", floor: "6F", capacity: 16, minSpend: 4000, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v19", name: "五号会议室", type: "MEETING", floor: "3F", capacity: 100, halfDayRate: 3500, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
  { id: "v20", name: "六号会议室", type: "MEETING", floor: "3F", capacity: 40, halfDayRate: 2000, timeSlots: DEFAULT_TIME_SLOTS, status: "active", img: "", description: "" },
];

// ==================== 权限与角色 ====================
const PERMISSIONS = [
  { id: "venue_manage", label: "场地管理", desc: "新增/编辑/删除场地" },
  { id: "booking_create", label: "创建预订", desc: "新建预订单" },
  { id: "booking_edit", label: "修改预订", desc: "编辑已有预订（需审批）" },
  { id: "booking_delete", label: "取消预订", desc: "取消/删除预订" },
  { id: "room_manage", label: "客房管理", desc: "管理客房预订" },
  { id: "user_manage", label: "用户管理", desc: "管理系统用户和角色" },
  { id: "log_view", label: "日志查看", desc: "查看操作日志" },
  { id: "feishu_config", label: "飞书配置", desc: "管理飞书集成设置" },
  { id: "approval_manage", label: "审批管理", desc: "审批预订变更" },
  { id: "report_view", label: "数据分析", desc: "查看数据报表" },
];

const DEFAULT_ROLES = [
  { id: "admin", name: "系统管理员", color: "bg-red-100 text-red-700 border-red-300", permissions: PERMISSIONS.map(p => p.id) },
  { id: "manager", name: "部门经理", color: "bg-blue-100 text-blue-700 border-blue-300", permissions: ["venue_manage", "booking_create", "booking_edit", "booking_delete", "room_manage", "log_view", "approval_manage", "report_view"] },
  { id: "sales", name: "销售顾问", color: "bg-green-100 text-green-700 border-green-300", permissions: ["booking_create", "booking_edit", "room_manage", "report_view"] },
  { id: "staff", name: "普通员工", color: "bg-gray-100 text-gray-700 border-gray-300", permissions: ["booking_create", "room_manage"] },
];

const SAMPLE_USERS = [
  { id: "u001", name: "夏美娟", phone: "13802134933", dept: "marketing", role: "admin", avatar: "夏", status: "active", createdAt: "2024-01-01" },
  { id: "u002", name: "李勋", phone: "13800000000", dept: "marketing", role: "sales", avatar: "李", status: "active", createdAt: "2024-03-15" },
  { id: "u003", name: "王丽", phone: "13800000001", dept: "marketing", role: "sales", avatar: "王", status: "active", createdAt: "2024-06-01" },
  { id: "u004", name: "刘强", phone: "13800000002", dept: "fb", role: "manager", avatar: "刘", status: "active", createdAt: "2024-02-10" },
  { id: "u005", name: "张华", phone: "13800000003", dept: "frontdesk", role: "staff", avatar: "张", status: "active", createdAt: "2025-01-01" },
];

// ==================== 审计日志 ====================
const LOG_ACTIONS = {
  VENUE_ADD: "新增场地", VENUE_EDIT: "修改场地", VENUE_DELETE: "删除场地", VENUE_TOGGLE: "启停场地",
  BOOKING_CREATE: "创建预订", BOOKING_EDIT: "修改预订", BOOKING_CANCEL: "取消预订",
  BOOKING_EDIT_REQUEST: "提交变更审批", BOOKING_EDIT_APPROVED: "审批通过", BOOKING_EDIT_REJECTED: "审批驳回",
  USER_ADD: "新增用户", USER_EDIT: "修改用户", USER_DELETE: "删除用户", USER_ROLE_CHANGE: "变更角色",
  FEISHU_CONFIG: "更新飞书配置", ROOM_CREATE: "创建客房预订", ROOM_CANCEL: "取消客房预订",
  LOGIN: "用户登录", SETTINGS_CHANGE: "系统设置变更",
};

const today = new Date();
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtTime = (d) => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
const todayStr = fmt(today);

const SAMPLE_LOGS = [
  { id: "log001", userId: "u001", userName: "夏美娟", action: "BOOKING_CREATE", target: "EO-2026-0320-001", details: "创建会议预订「2026天津郊区县内分泌代谢会议」", timestamp: todayStr + " 08:30:15" },
  { id: "log002", userId: "u002", userName: "李勋", action: "BOOKING_CREATE", target: "EO-2026-0321-001", details: "创建婚宴预订「刘磊先生韩旭雯女士喜结良缘」", timestamp: todayStr + " 09:15:42" },
  { id: "log003", userId: "u001", userName: "夏美娟", action: "VENUE_EDIT", target: "开元厅", details: "修改开元厅容量从180人调整为200人", timestamp: todayStr + " 10:05:33" },
  { id: "log004", userId: "u003", userName: "王丽", action: "BOOKING_CREATE", target: "EO-2026-0320-002", details: "创建包厢宴请「张总商务宴请」", timestamp: todayStr + " 11:20:08" },
  { id: "log005", userId: "u004", userName: "刘强", action: "BOOKING_EDIT_REQUEST", target: "EO-2026-0321-001", details: "申请变更婚宴桌数从13桌改为15桌，已发送飞书审批", timestamp: todayStr + " 14:30:22" },
];

// ==================== 飞书配置 ====================
const DEFAULT_FEISHU_CONFIG = { appId: "", appSecret: "", webhookUrl: "", approvalCode: "", botName: "德胧预订助手", enabled: false, lastTest: null, testResult: null };

// ==================== 审批队列 ====================
const SAMPLE_APPROVALS = [
  { id: "ap001", bookingId: "b002", bookingNumber: "EO-2026-0321-001", requesterId: "u004", requesterName: "刘强", changes: { tableCount: { old: 13, new: 15 }, totalAmount: { old: 40144, new: 46320 } }, reason: "客户追加2桌", status: "pending", feishuApprovalId: "FA-20260320-001", createdAt: todayStr + " 14:30:22" },
];

// ==================== 预订数据 ====================
const SAMPLE_BOOKINGS = [
  { id: "b001", number: "EO-2026-0320-001", type: "MEETING", venueId: "v7", date: todayStr, timeSlotId: "afternoon", status: "CONFIRMED", eventName: "2026天津郊区县内分泌代谢会议", organizer: "诺和诺德", contactName: "朱女士", contactPhone: "13800138000", expectedAttendance: 50, guaranteedAttendance: 40, salesPerson: "夏美娟", salesPhone: "13802134933", totalAmount: 2500, paymentStatus: "UNPAID", paymentTerms: "现付", setupStyle: "课桌式", equipment: ["音响","麦克风","LED大屏"], notes: "13:30签到，提供纸笔矿泉水薄荷糖", linkedVenues: [{ venueId: "v2", timeSlotId: "afternoon", purpose: "沙发休息区", attendance: 8 }], departments: [{ deptId: "marketing", tasks: "大堂LCD显示、指引牌、门牌" },{ deptId: "engineering", tasks: "安装麦克风及音响设备" },{ deptId: "security", tasks: "车辆疏导" },{ deptId: "finance", tasks: "现结" }], createdAt: todayStr, updatedAt: todayStr },
  { id: "b002", number: "EO-2026-0321-001", type: "WEDDING", venueId: "v1", date: fmt(new Date(today.getTime()+86400000)), timeSlotId: "noon", status: "CONFIRMED", eventName: "刘磊先生 韩旭雯女士 喜结良缘", organizer: "婚宴", contactName: "刘磊", contactPhone: "13900139000", expectedAttendance: 150, guaranteedAttendance: 130, salesPerson: "李勋", salesPhone: "13800000000", totalAmount: 40144, paymentStatus: "PAID", paymentTerms: "全款付清", setupStyle: "桌餐", tableCount: 13, pricePerTable: 3088, equipment: ["舞台","音响","投影"], notes: "早上8点开门，13备2桌，果粒橙可乐青岛畅饮", linkedVenues: [{ venueId: "v2", timeSlotId: "noon", purpose: "桌餐溢出", attendance: 30 }], roomBookings: [{ roomType: "海河套房（婚房）", count: 1, nights: 1, rate: 0, checkIn: todayStr, checkOut: fmt(new Date(today.getTime()+86400000)), notes: "免费婚房" }], departments: [{ deptId: "frontdesk", tasks: "婚房7:00前布置完毕" },{ deptId: "marketing", tasks: "LCD显示屏、指示牌" },{ deptId: "fb", tasks: "13备2桌" },{ deptId: "finance", tasks: "已全款付清" },{ deptId: "security", tasks: "车辆指引" }], createdAt: todayStr, updatedAt: todayStr },
  { id: "b003", number: "EO-2026-0320-002", type: "PRIVATE_DINING", venueId: "v9", date: todayStr, timeSlotId: "evening", status: "CONFIRMED", eventName: "张总商务宴请", organizer: "张伟", contactName: "张伟", contactPhone: "13700137000", expectedAttendance: 10, guaranteedAttendance: 10, salesPerson: "王丽", salesPhone: "13800000001", totalAmount: 3880, paymentStatus: "UNPAID", paymentTerms: "签单", notes: "VIP客人", departments: [{ deptId: "fb", tasks: "定制菜单" }], createdAt: todayStr, updatedAt: todayStr },
  { id: "b004", number: "EO-2026-0322-001", type: "MEETING", venueId: "v4", date: fmt(new Date(today.getTime()+2*86400000)), timeSlotId: "morning", status: "TENTATIVE", eventName: "德胧集团季度经营分析会", organizer: "德胧集团", contactName: "李明", contactPhone: "13600136000", expectedAttendance: 30, guaranteedAttendance: 25, salesPerson: "夏美娟", salesPhone: "13802134933", totalAmount: 4000, paymentStatus: "UNPAID", paymentTerms: "月结", setupStyle: "U型", equipment: ["投影","视频会议系统"], notes: "需提前测试视频会议设备", departments: [{ deptId: "engineering", tasks: "视频会议设备调试" },{ deptId: "fb", tasks: "茶歇服务" }], createdAt: todayStr, updatedAt: todayStr },
  { id: "b005", number: "EO-2026-0320-003", type: "BANQUET", venueId: "v3", date: todayStr, timeSlotId: "evening", status: "CONFIRMED", eventName: "天津市企业家协会年会晚宴", organizer: "天津市企业家协会", contactName: "赵秘书长", contactPhone: "13500135000", expectedAttendance: 100, guaranteedAttendance: 80, salesPerson: "李勋", salesPhone: "13800000000", totalAmount: 58000, paymentStatus: "PARTIAL", paymentTerms: "预付50%", setupStyle: "桌餐", tableCount: 10, pricePerTable: 2688, equipment: ["舞台","音响","LED屏"], notes: "需红地毯迎宾", roomBookings: [{ roomType: "豪华大床房", count: 5, nights: 1, rate: 680, checkIn: todayStr, checkOut: fmt(new Date(today.getTime()+86400000)) },{ roomType: "行政套房", count: 2, nights: 1, rate: 1280, checkIn: todayStr, checkOut: fmt(new Date(today.getTime()+86400000)) }], departments: [{ deptId: "frontdesk", tasks: "VIP接待" },{ deptId: "marketing", tasks: "LED+横幅" },{ deptId: "fb", tasks: "10桌桌餐" },{ deptId: "security", tasks: "VIP通道安保" },{ deptId: "finance", tasks: "预付50%" }], createdAt: todayStr, updatedAt: todayStr },
];

const SAMPLE_ROOM_BOOKINGS = [
  { id: "r001", guestName: "王建国", phone: "13900001111", checkIn: todayStr, checkOut: fmt(new Date(today.getTime()+2*86400000)), roomType: "豪华双床房", roomCount: 2, rate: 580, source: "协议客户", company: "华为技术有限公司", salesPerson: "夏美娟", status: "CONFIRMED", paymentStatus: "UNPAID", notes: "长住客户", linkedEventId: null },
  { id: "r002", guestName: "陈静", phone: "13900002222", checkIn: fmt(new Date(today.getTime()+86400000)), checkOut: fmt(new Date(today.getTime()+3*86400000)), roomType: "行政大床房", roomCount: 1, rate: 880, source: "OTA-携程", company: "", salesPerson: "王丽", status: "CONFIRMED", paymentStatus: "PAID", notes: "" },
  { id: "r003", guestName: "张伟(企业家协会)", phone: "13500135000", checkIn: todayStr, checkOut: fmt(new Date(today.getTime()+86400000)), roomType: "豪华大床房", roomCount: 5, rate: 680, source: "团队", company: "天津市企业家协会", salesPerson: "李勋", status: "CONFIRMED", paymentStatus: "PARTIAL", notes: "关联年会晚宴", linkedEventId: "b005" },
];

const SAMPLE_TASKS = [
  { id: "t001", bookingId: "b002", deptId: "frontdesk", assignee: "前台主管-张华", task: "婚房7:00前布置完毕", deadline: fmt(new Date(today.getTime()+86400000))+" 07:00", status: "PENDING", feedback: "", photos: [] },
  { id: "t002", bookingId: "b002", deptId: "marketing", assignee: "传讯-小李", task: "LCD显示屏+指示牌制作", deadline: fmt(new Date(today.getTime()+86400000))+" 07:00", status: "IN_PROGRESS", feedback: "模板已设计，待打印", photos: [] },
  { id: "t003", bookingId: "b001", deptId: "engineering", assignee: "工程-王师傅", task: "安装麦克风及音响设备", deadline: todayStr+" 12:00", status: "COMPLETED", feedback: "已安装完毕并测试", photos: ["photo1.jpg"] },
  { id: "t004", bookingId: "b005", deptId: "fb", assignee: "宴会经理-刘强", task: "10桌桌餐准备+红地毯迎宾", deadline: todayStr+" 16:00", status: "IN_PROGRESS", feedback: "菜品已确认", photos: [] },
  { id: "t005", bookingId: "b005", deptId: "security", assignee: "安保主管-陈刚", task: "VIP通道安保部署", deadline: todayStr+" 17:00", status: "PENDING", feedback: "", photos: [] },
];

// ==================== 工具函数 ====================
const uid = () => Math.random().toString(36).slice(2, 10);
const cn = (...classes) => classes.filter(Boolean).join(" ");
const statusColor = (s) => ({ TENTATIVE: "bg-yellow-100 text-yellow-800 border-yellow-300", CONFIRMED: "bg-green-100 text-green-800 border-green-300", CANCELLED: "bg-red-100 text-red-800 border-red-300", COMPLETED: "bg-gray-100 text-gray-600 border-gray-300" }[s] || "bg-gray-100 text-gray-600");
const payColor = (s) => ({ UNPAID: "text-red-600", PARTIAL: "text-orange-500", PAID: "text-green-600", SETTLED: "text-blue-600" }[s] || "text-gray-500");
const taskStatusColor = (s) => ({ PENDING: "bg-gray-100 border-gray-300", IN_PROGRESS: "bg-blue-100 border-blue-300", COMPLETED: "bg-green-100 border-green-300", FEEDBACK: "bg-yellow-100 border-yellow-300" }[s] || "bg-gray-100");
const formatMoney = (n) => `¥${Number(n||0).toLocaleString()}`;
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
const addDays = (dateStr, n) => { const d = new Date(dateStr); d.setDate(d.getDate()+n); return fmt(d); };
const nowTimestamp = () => { const n = new Date(); return fmt(n) + " " + fmtTime(n); };

const AI_SUGGESTIONS = {
  pricing: (b) => b.type === "WEDDING" ? `💡 AI建议: 婚宴${b.tableCount}桌，建议赠送婚房+迎宾红地毯` : b.type === "MEETING" ? `💡 AI建议: 会议${b.expectedAttendance}人，建议搭配茶歇(¥45/人)` : `💡 AI建议: 该时段平均消费¥${Math.round(Math.random()*10000+5000)}`,
  upsell: () => ["🔥 热门搭配: 会后鸡尾酒会(18:00-20:00)","📊 数据洞察: 同类活动追加用房率65%","🎯 智能提醒: 该客户上次消费¥38,000","⭐ 增值服务: LED欢迎屏+定制水牌仅加¥800"][Math.floor(Math.random()*4)],
  conflict: (date, vid, sid, bks) => { const c = bks.filter(b => b.date===date && b.venueId===vid && b.timeSlotId===sid && b.status!=="CANCELLED"); return c.length > 0 ? `⚠️ 冲突: ${date} 该场地已有「${c[0].eventName}」` : null; },
};

// ==================== 通用组件 ====================
const Badge = ({ children, className }) => <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", className)}>{children}</span>;

const Button = ({ children, onClick, variant = "primary", size = "md", className, disabled }) => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none active:scale-95";
  const v = { primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm", secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50", success: "bg-emerald-600 text-white hover:bg-emerald-700", danger: "bg-red-600 text-white hover:bg-red-700", ghost: "text-gray-600 hover:bg-gray-100", ai: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm", warning: "bg-amber-500 text-white hover:bg-amber-600" };
  const s = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return <button onClick={onClick} disabled={disabled} className={cn(base, v[variant], s[size], disabled && "opacity-50 cursor-not-allowed", className)}>{children}</button>;
};

const Card = ({ children, className, onClick }) => <div onClick={onClick} className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", onClick && "cursor-pointer hover:shadow-md transition-shadow", className)}>{children}</div>;

const Input = ({ label, value, onChange, type = "text", placeholder, className, required, disabled }) => (
  <div className={cn("flex flex-col gap-1", className)}>
    {label && <label className="text-xs font-medium text-gray-600">{label}{required && <span className="text-red-500">*</span>}</label>}
    <input type={type} value={value||""} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={cn("px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none", disabled && "bg-gray-50 text-gray-400")} />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, className, rows = 3 }) => (
  <div className={cn("flex flex-col gap-1", className)}>
    {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
    <textarea value={value||""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
  </div>
);

const Select = ({ label, value, onChange, options, className }) => (
  <div className={cn("flex flex-col gap-1", className)}>
    {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
    <select value={value||""} onChange={e => onChange(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div className={cn("relative w-10 h-5 rounded-full transition-colors", checked ? "bg-indigo-600" : "bg-gray-300")} onClick={() => onChange(!checked)}>
      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </div>
    {label && <span className="text-sm text-gray-700">{label}</span>}
  </label>
);

const Modal = ({ open, onClose, title, children, width = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start sm:justify-center sm:pt-10 bg-black/40 overflow-y-auto" onClick={onClose}>
      <div className={cn("bg-white w-full sm:rounded-2xl sm:mx-4 sm:mb-10 rounded-t-2xl shadow-2xl", width)} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">&times;</button>
        </div>
        <div className="px-5 py-4 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap", active === t.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>{t.label}{t.count != null && <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">{t.count}</span>}</button>
    ))}
  </div>
);

const StatCard = ({ label, value, sub, icon, color = "indigo" }) => {
  const cm = { indigo: { t: "text-indigo-700", b: "bg-indigo-50" }, green: { t: "text-green-700", b: "bg-green-50" }, violet: { t: "text-violet-700", b: "bg-violet-50" }, red: { t: "text-red-700", b: "bg-red-50" }, yellow: { t: "text-yellow-700", b: "bg-yellow-50" } };
  const c = cm[color] || cm.indigo;
  return <Card className="p-3 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] sm:text-xs text-gray-500 font-medium">{label}</p><p className={`text-lg sm:text-2xl font-bold mt-0.5 ${c.t}`}>{value}</p>{sub && <p className="text-[10px] text-gray-400">{sub}</p>}</div><div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl ${c.b}`}>{icon}</div></div></Card>;
};

const ConfirmDialog = ({ open, onClose, onConfirm, title, message, variant = "danger" }) => {
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}><div className="bg-white rounded-2xl shadow-2xl max-w-sm mx-4 p-5" onClick={e => e.stopPropagation()}>
    <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{message}</p>
    <div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={onClose}>取消</Button><Button variant={variant} size="sm" onClick={() => { onConfirm(); onClose(); }}>确认</Button></div>
  </div></div>;
};

// ==================== AI 聊天助手 ====================
const AIChatPanel = ({ bookings, venues, onClose }) => {
  const [messages, setMessages] = useState([{ role: "ai", content: "您好！我是德胧AI预订助手 🤖\n\n我可以帮您：\n• 快速查询场地可用情况\n• 智能推荐合适的场地和套餐\n• 自动生成EO通知单\n• 分析销售数据和趋势\n\n请问有什么可以帮您的？" }]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);
  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim(); setMessages(p => [...p, { role: "user", content: userMsg }]); setInput("");
    setTimeout(() => {
      let r = ""; const l = userMsg.toLowerCase();
      if (l.includes("可用") || l.includes("空") || l.includes("查询")) { const av = venues.filter(v => v.status === "active" && !bookings.some(b => b.date===todayStr && b.venueId===v.id && b.status!=="CANCELLED")); r = `📋 今日可用场地：\n\n` + av.slice(0,8).map(v => `• ${v.name} (${v.floor}, ${v.capacity}人)`).join("\n") + `\n\n共${av.length}个可预订`; }
      else if (l.includes("婚宴") || l.includes("婚礼")) r = `💒 婚宴场地推荐：\n\n🥇 开元厅 (5F) - 200人，¥3,088/桌\n🥈 海河厅 (3F) - 120人，¥2,688/桌\n🥉 滨海厅 (5F) - 80人，¥2,888/桌`;
      else if (l.includes("今天") || l.includes("今日")) { const tb = bookings.filter(b => b.date===todayStr && b.status!=="CANCELLED"); r = `📊 今日${tb.length}场活动，总额${formatMoney(tb.reduce((s,b)=>s+b.totalAmount,0))}\n\n` + tb.map(b => `• ${b.eventName} | ${venues.find(v=>v.id===b.venueId)?.name} | ${formatMoney(b.totalAmount)}`).join("\n"); }
      else if (l.includes("菜品") || l.includes("推荐菜")) r = `🍽️ AI菜品推荐：\n\n🥇 松茸炖花胶（¥688/位）\n🥈 龙虾刺身拼盘（¥888/份）\n🥉 黑松露和牛（¥558/位）\n🏅 佛跳墙（¥388/位）\n\n以上为本月VIP客户热门选择`;
      else r = `关于"${userMsg}"：\n\n本月场地使用率约78%\n热门时段：晚间(64%)\n建议关注午间时段开发`;
      setMessages(p => [...p, { role: "ai", content: r }]);
    }, 500);
  };
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages]);
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-50/50 to-white rounded-xl border border-indigo-100">
      <div className="px-4 py-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">🤖</div><div><h4 className="text-sm font-semibold text-white">德胧AI预订助手</h4><p className="text-xs text-indigo-200">AI Native</p></div></div>
        {onClose && <button onClick={onClose} className="text-white/70 hover:text-white text-lg">&times;</button>}
      </div>
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{maxHeight: "50vh"}}>
        {messages.map((m, i) => <div key={i} className={cn("flex", m.role==="user"?"justify-end":"justify-start")}><div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap", m.role==="user"?"bg-indigo-600 text-white rounded-br-sm":"bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm")}>{m.content}</div></div>)}
      </div>
      <div className="p-3 border-t border-indigo-100">
        <div className="flex gap-1.5 mb-2 flex-wrap">{["今日预订","查询可用","婚宴推荐","菜品推荐"].map(q => <button key={q} onClick={()=>setInput(q)} className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100">{q}</button>)}</div>
        <div className="flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} placeholder="输入问题..." className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /><Button onClick={handleSend} variant="ai" size="sm">发送</Button></div>
      </div>
    </div>
  );
};

// ==================== 场地日历 ====================
const VenueCalendarGrid = ({ date, venues, bookings, onCellClick, onBookingClick, venueFilter }) => {
  const filtered = venueFilter==="ALL" ? venues.filter(v=>v.status==="active") : venues.filter(v => v.type===venueFilter && v.status==="active");
  const grouped = _.groupBy(filtered, "type");
  const tl = { BANQUET: "宴会厅", MEETING: "会议室", PRIVATE: "包厢" };
  const tc = { BANQUET: "bg-rose-50 text-rose-700", MEETING: "bg-blue-50 text-blue-700", PRIVATE: "bg-amber-50 text-amber-700" };
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full border-collapse text-sm" style={{minWidth: 700}}>
        <thead><tr className="bg-gray-50"><th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600 w-24 sticky left-0 bg-gray-50 z-10">场地</th>
        {DEFAULT_TIME_SLOTS.map(s => <th key={s.id} className="border border-gray-200 px-2 py-2 text-center text-xs font-semibold text-gray-600 min-w-[140px]" style={{backgroundColor:s.color+"80"}}><div>{s.label}</div><div className="text-gray-400 font-normal text-[10px]">{s.start}-{s.end}</div></th>)}</tr></thead>
        <tbody>{Object.entries(grouped).map(([type, vList]) => (
          <React.Fragment key={type}>
            <tr><td colSpan={5} className={cn("border border-gray-200 px-2 py-1 text-xs font-bold", tc[type])}>{tl[type]} ({vList.length})</td></tr>
            {vList.map(venue => (
              <tr key={venue.id} className="hover:bg-gray-50/50">
                <td className="border border-gray-200 px-2 py-1.5 font-medium text-gray-800 sticky left-0 bg-white z-10"><div className="text-xs">{venue.name}</div><div className="text-[10px] text-gray-400">{venue.floor}·{venue.capacity}人</div></td>
                {DEFAULT_TIME_SLOTS.map(slot => {
                  const cell = bookings.filter(b => b.date===date && b.venueId===venue.id && b.timeSlotId===slot.id && b.status!=="CANCELLED");
                  const linked = bookings.filter(b => b.date===date && b.linkedVenues?.some(lv => lv.venueId===venue.id && lv.timeSlotId===slot.id) && b.status!=="CANCELLED");
                  const all = [...cell, ...linked];
                  return <td key={slot.id} className={cn("border border-gray-200 px-1.5 py-1 cursor-pointer transition-colors", all.length===0&&"hover:bg-indigo-50/50")} onClick={()=>all.length===0?onCellClick(venue,slot,date):onBookingClick(all[0])}>
                    {all.length>0 ? all.map((b,i)=><div key={i} className={cn("rounded-lg px-2 py-1.5 mb-1 text-xs cursor-pointer border hover:shadow-md", b.status==="CONFIRMED"?"bg-green-50 border-green-200":"bg-yellow-50 border-yellow-200")} onClick={e=>{e.stopPropagation();onBookingClick(b)}}>
                      <div className="font-semibold text-gray-800 truncate">{b.eventName}</div>
                      <div className="flex items-center justify-between mt-0.5"><span className="text-gray-500">{b.expectedAttendance}人</span><Badge className={statusColor(b.status)}>{BOOKING_STATUS[b.status]}</Badge></div>
                      <div className={cn("font-semibold mt-0.5", payColor(b.paymentStatus))}>{formatMoney(b.totalAmount)}</div>
                    </div>) : <div className="text-gray-300 text-center py-2 text-xs">可预订</div>}
                  </td>;
                })}
              </tr>
            ))}
          </React.Fragment>
        ))}</tbody>
      </table>
    </div>
  );
};

// ==================== 全景日历（多日×多场地矩阵视图） ====================
const VenuePanoramicGrid = ({ venues, bookings, startDate, endDate, onBookingClick, venueFilter }) => {
  const filtered = venueFilter==="ALL" ? venues.filter(v=>v.status==="active") : venues.filter(v => v.type===venueFilter && v.status==="active");
  const grouped = _.groupBy(filtered, "type");
  const tl = { BANQUET: "宴会厅", MEETING: "会议室", PRIVATE: "包厢" };
  const tc = { BANQUET: "bg-rose-50 text-rose-700", MEETING: "bg-blue-50 text-blue-700", PRIVATE: "bg-amber-50 text-amber-700" };
  const slotColors = { morning: "#F59E0B", noon: "#3B82F6", afternoon: "#10B981", evening: "#8B5CF6" };
  const slotLabels = { morning: "上午", noon: "中午", afternoon: "下午", evening: "晚上" };

  // 生成日期列
  const dates = [];
  let cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) { dates.push(fmt(cur)); cur = new Date(cur.getTime() + 86400000); }

  // 星期名
  const weekDay = (ds) => ["日","一","二","三","四","五","六"][new Date(ds).getDay()];
  const isWeekend = (ds) => { const d = new Date(ds).getDay(); return d === 0 || d === 6; };

  return (
    <div className="overflow-auto border border-gray-200 rounded-xl bg-white" style={{maxHeight: "calc(100vh - 220px)"}}>
      <table className="border-collapse text-xs" style={{minWidth: Math.max(700, dates.length * 90 + 120)}}>
        <thead className="sticky top-0 z-20 bg-white">
          {/* 月份行 */}
          <tr>{/* 空白场地列 */}<th className="border border-gray-200 bg-gray-50 px-2 py-1 sticky left-0 z-30 min-w-[110px]" />
          {dates.map((d, i) => {
            const isFirst = i === 0 || d.slice(0, 7) !== dates[i - 1]?.slice(0, 7);
            if (!isFirst) return null;
            const span = dates.filter(x => x.slice(0, 7) === d.slice(0, 7)).length;
            return <th key={d + "m"} colSpan={span} className="border border-gray-200 bg-indigo-50 px-2 py-1 text-indigo-700 font-bold text-center">{d.slice(0, 7)}</th>;
          })}</tr>
          {/* 日期行 */}
          <tr><th className="border border-gray-200 bg-gray-50 px-2 py-1.5 text-left font-semibold text-gray-600 sticky left-0 z-30 min-w-[110px]">
            <div>场地</div>
            <div className="flex gap-1 mt-1">{DEFAULT_TIME_SLOTS.map(s=><span key={s.id} className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm" style={{backgroundColor:slotColors[s.id]}}/><span className="text-[9px] text-gray-400">{s.label}</span></span>)}</div>
          </th>
          {dates.map(d => <th key={d} className={cn("border border-gray-200 px-1 py-1.5 text-center min-w-[80px]", d===todayStr?"bg-indigo-100 text-indigo-700":"bg-gray-50", isWeekend(d)&&d!==todayStr?"bg-orange-50":"")}>
            <div className="font-bold">{d.slice(8)}</div>
            <div className={cn("text-[10px]", isWeekend(d)?"text-orange-500 font-medium":"text-gray-400")}>周{weekDay(d)}</div>
          </th>)}</tr>
        </thead>
        <tbody>{Object.entries(grouped).map(([type, vList]) => (
          <React.Fragment key={type}>
            <tr><td colSpan={dates.length + 1} className={cn("border border-gray-200 px-2 py-1 text-xs font-bold sticky left-0 z-10", tc[type])}>{tl[type]} ({vList.length})</td></tr>
            {vList.map(venue => (
              <tr key={venue.id} className="hover:bg-gray-50/30">
                <td className="border border-gray-200 px-2 py-1 font-medium text-gray-800 sticky left-0 bg-white z-10 min-w-[110px]">
                  <div className="text-xs leading-tight">{venue.name}</div>
                  <div className="text-[10px] text-gray-400">{venue.floor}·{venue.capacity}人</div>
                </td>
                {dates.map(d => {
                  const dayBookings = bookings.filter(b => b.date === d && b.venueId === venue.id && b.status !== "CANCELLED");
                  const dayLinked = bookings.filter(b => b.date === d && b.linkedVenues?.some(lv => lv.venueId === venue.id) && b.status !== "CANCELLED");
                  const all = [...dayBookings, ...dayLinked];
                  // 按时段分组
                  const slotMap = {};
                  all.forEach(b => { const sid = b.timeSlotId || "unknown"; if(!slotMap[sid]) slotMap[sid] = []; slotMap[sid].push(b); });
                  const hasBooking = all.length > 0;
                  return <td key={d} className={cn("border border-gray-200 px-0.5 py-0.5 align-top cursor-pointer transition-colors", d===todayStr?"bg-indigo-50/30":"", !hasBooking&&"hover:bg-indigo-50/50")} onClick={()=>{ if(all.length>0) onBookingClick(all[0]); }}>
                    {hasBooking ? (
                      <div className="space-y-px">
                        {DEFAULT_TIME_SLOTS.map(slot => {
                          const sb = slotMap[slot.id];
                          if (!sb || sb.length === 0) return null;
                          return sb.map((b, bi) => (
                            <div key={b.id + bi} className="rounded px-1 py-0.5 cursor-pointer hover:opacity-80" style={{backgroundColor: slotColors[slot.id] + "18", borderLeft: `3px solid ${slotColors[slot.id]}`}} onClick={e=>{e.stopPropagation();onBookingClick(b)}}>
                              <div className="font-medium text-gray-800 truncate leading-tight" style={{fontSize: "10px"}}>{b.eventName}</div>
                              <div className="flex items-center gap-1 mt-px">
                                <span className="text-[9px] font-medium" style={{color: slotColors[slot.id]}}>{slot.label}</span>
                                <span className="text-[9px] text-gray-400">{b.expectedAttendance}人</span>
                                {b.totalAmount > 0 && <span className="text-[9px] font-semibold text-indigo-600 ml-auto">{formatMoney(b.totalAmount)}</span>}
                              </div>
                            </div>
                          ));
                        })}
                      </div>
                    ) : null}
                  </td>;
                })}
              </tr>
            ))}
          </React.Fragment>
        ))}</tbody>
      </table>
    </div>
  );
};

// ==================== 月历 ====================
const MonthCalendar = ({ bookings, onDateSelect, selectedDate }) => {
  const [cm, setCm] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const days = getDaysInMonth(cm.year, cm.month);
  const first = getFirstDayOfMonth(cm.year, cm.month);
  const mn = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  const cells = []; for (let i=0;i<first;i++) cells.push(null); for (let d=1;d<=days;d++) cells.push(d);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={()=>setCm(p=>p.month===0?{year:p.year-1,month:11}:{...p,month:p.month-1})} className="p-1 rounded hover:bg-gray-100 text-gray-500">◀</button>
        <h4 className="font-semibold text-gray-800 text-sm">{cm.year}年{mn[cm.month]}</h4>
        <button onClick={()=>setCm(p=>p.month===11?{year:p.year+1,month:0}:{...p,month:p.month+1})} className="p-1 rounded hover:bg-gray-100 text-gray-500">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["日","一","二","三","四","五","六"].map(w=><div key={w} className="text-[10px] text-gray-400 font-medium py-1">{w}</div>)}
        {cells.map((d,i)=>{
          if(!d) return <div key={`e${i}`}/>;
          const ds=`${cm.year}-${String(cm.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const db=bookings.filter(b=>b.date===ds&&b.status!=="CANCELLED");
          return <button key={ds} onClick={()=>onDateSelect(ds)} className={cn("relative py-1 rounded-lg text-xs transition-all", ds===selectedDate?"bg-indigo-600 text-white":ds===todayStr?"bg-indigo-50 text-indigo-700 font-bold":"hover:bg-gray-50 text-gray-700")}>{d}{db.length>0&&<div className="flex justify-center gap-0.5 mt-0.5">{db.length<=3?db.map((b,j)=><div key={j} className={cn("w-1 h-1 rounded-full",b.status==="CONFIRMED"?"bg-green-500":"bg-yellow-500")}/>):<div className="text-[8px] text-indigo-500 font-bold">{db.length}</div>}</div>}</button>;
        })}
      </div>
    </div>
  );
};

// ==================== 场地管理设置 ====================
const VenueFormModal = ({ open, onClose, onSave, venue }) => {
  const isEdit = !!venue;
  const [f, setF] = useState({ name:"", type:"MEETING", floor:"", capacity:"", halfDayRate:"", pricePerTable:"", minSpend:"", description:"", img:"", recommendedDishes:"", status:"active" });
  useEffect(()=>{ if(venue) setF({...venue, capacity:String(venue.capacity||""), halfDayRate:String(venue.halfDayRate||""), pricePerTable:String(venue.pricePerTable||""), minSpend:String(venue.minSpend||"")}); else setF({ name:"", type:"MEETING", floor:"", capacity:"", halfDayRate:"", pricePerTable:"", minSpend:"", description:"", img:"", recommendedDishes:"", status:"active" }); },[venue, open]);
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  const priceLabel = f.type==="BANQUET"||f.type==="WEDDING"?"单桌价格(¥)":f.type==="PRIVATE"?"最低消费(¥)":"半天租金(¥)";
  const priceKey = f.type==="BANQUET"||f.type==="WEDDING"?"pricePerTable":f.type==="PRIVATE"?"minSpend":"halfDayRate";
  return <Modal open={open} onClose={onClose} title={isEdit?"编辑场地":"新增场地"}>
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Input label="场地名称" value={f.name} onChange={v=>u("name",v)} required />
        <Select label="场地类型" value={f.type} onChange={v=>u("type",v)} options={Object.entries(VENUE_TYPES).map(([k,l])=>({value:k,label:l}))} />
        <Input label="楼层" value={f.floor} onChange={v=>u("floor",v)} placeholder="如: 5F" required />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Input label="容纳人数" type="number" value={f.capacity} onChange={v=>u("capacity",v)} required />
        <Input label={priceLabel} type="number" value={f[priceKey]} onChange={v=>u(priceKey,v)} />
        <Select label="状态" value={f.status} onChange={v=>u("status",v)} options={[{value:"active",label:"启用"},{value:"inactive",label:"停用"}]} />
      </div>
      <Input label="场地图片URL" value={f.img} onChange={v=>u("img",v)} placeholder="https://..." />
      <Textarea label="场地描述" value={f.description} onChange={v=>u("description",v)} placeholder="场地特色、设施等" />
      {f.type==="PRIVATE" && <Textarea label="推荐菜品" value={f.recommendedDishes} onChange={v=>u("recommendedDishes",v)} placeholder="松茸炖花胶、龙虾刺身..." />}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>取消</Button>
        <Button variant="primary" onClick={()=>{ const data={...f, capacity:Number(f.capacity)||0, halfDayRate:Number(f.halfDayRate)||0, pricePerTable:Number(f.pricePerTable)||0, minSpend:Number(f.minSpend)||0, timeSlots:DEFAULT_TIME_SLOTS}; if(!isEdit) data.id="v"+uid(); onSave(data); onClose(); }}>{isEdit?"保存修改":"新增场地"}</Button>
      </div>
    </div>
  </Modal>;
};

// ==================== 用户管理 ====================
const UserFormModal = ({ open, onClose, onSave, user, roles }) => {
  const isEdit = !!user;
  const [f, setF] = useState({ name:"", phone:"", dept:"marketing", role:"staff", status:"active" });
  useEffect(()=>{ if(user) setF({...user}); else setF({ name:"", phone:"", dept:"marketing", role:"staff", status:"active" }); },[user, open]);
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return <Modal open={open} onClose={onClose} title={isEdit?"编辑用户":"新增用户"}>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="姓名" value={f.name} onChange={v=>u("name",v)} required />
        <Input label="手机号" value={f.phone} onChange={v=>u("phone",v)} required />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Select label="部门" value={f.dept} onChange={v=>u("dept",v)} options={DEPARTMENTS.map(d=>({value:d.id,label:d.name}))} />
        <Select label="角色" value={f.role} onChange={v=>u("role",v)} options={roles.map(r=>({value:r.id,label:r.name}))} />
        <Select label="状态" value={f.status} onChange={v=>u("status",v)} options={[{value:"active",label:"启用"},{value:"disabled",label:"停用"}]} />
      </div>
      {f.role && <div className="bg-gray-50 rounded-lg p-3"><h4 className="text-xs font-semibold text-gray-600 mb-2">角色权限预览</h4><div className="flex flex-wrap gap-1.5">{roles.find(r=>r.id===f.role)?.permissions.map(pid=>{const p=PERMISSIONS.find(x=>x.id===pid); return p?<Badge key={pid} className="bg-indigo-50 text-indigo-700 border-indigo-200">{p.label}</Badge>:null})}</div></div>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>取消</Button>
        <Button variant="primary" onClick={()=>{ const data={...f}; if(!isEdit){data.id="u"+uid();data.avatar=f.name?.[0]||"?";data.createdAt=todayStr;} onSave(data); onClose(); }}>{isEdit?"保存修改":"新增用户"}</Button>
      </div>
    </div>
  </Modal>;
};

// ==================== 预订变更审批弹窗 ====================
const BookingEditApprovalModal = ({ open, onClose, booking, originalBooking, onSubmit, feishuConfig }) => {
  if(!open||!booking||!originalBooking) return null;
  const [reason, setReason] = useState("");
  const changes = [];
  const fields = { eventName:"活动名称", expectedAttendance:"预计人数", guaranteedAttendance:"保证人数", totalAmount:"总金额", tableCount:"桌数", venueId:"场地", timeSlotId:"时段", date:"日期", setupStyle:"摆台方式", notes:"备注" };
  Object.keys(fields).forEach(k=>{ if(booking[k]!==originalBooking[k]&&(booking[k]||originalBooking[k])) changes.push({ field:fields[k], old:k==="totalAmount"?formatMoney(originalBooking[k]):String(originalBooking[k]||"无"), new:k==="totalAmount"?formatMoney(booking[k]):String(booking[k]||"无") }); });
  return <Modal open={open} onClose={onClose} title="⚠️ 预订变更审批" width="max-w-lg">
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-sm text-amber-800 font-medium">已检测到对已有预订的修改，需要通过飞书审批后才能生效。</p><p className="text-xs text-amber-600 mt-1">预订编号: {originalBooking.number}</p></div>
      {changes.length>0 && <div><h4 className="text-xs font-semibold text-gray-600 mb-2">变更内容</h4><div className="space-y-1.5">{changes.map((c,i)=><div key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2"><span className="text-gray-500 min-w-[5rem]">{c.field}</span><span className="text-red-500 line-through">{c.old}</span><span className="text-gray-400">→</span><span className="text-green-600 font-medium">{c.new}</span></div>)}</div></div>}
      <Textarea label="变更原因" value={reason} onChange={setReason} placeholder="请说明修改原因..." rows={2} />
      {!feishuConfig?.enabled && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">⚠️ 飞书集成尚未启用，审批将以站内消息形式发送</div>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>取消修改</Button>
        <Button variant="warning" onClick={()=>{ onSubmit({ changes, reason, feishuEnabled: feishuConfig?.enabled }); onClose(); }}>📮 提交飞书审批</Button>
      </div>
    </div>
  </Modal>;
};

// ==================== 编辑预订弹窗 ====================
const EditBookingModal = ({ open, onClose, booking, venues, bookings, onSave, onRequestApproval }) => {
  const [f, setF] = useState({});
  useEffect(()=>{ if(booking) setF({...booking, expectedAttendance:String(booking.expectedAttendance||""), guaranteedAttendance:String(booking.guaranteedAttendance||""), totalAmount:String(booking.totalAmount||""), tableCount:String(booking.tableCount||""), pricePerTable:String(booking.pricePerTable||"")}); },[booking, open]);
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  if(!open||!booking) return null;
  return <Modal open={open} onClose={onClose} title={`编辑预订 - ${booking.number}`} width="max-w-2xl"><div className="space-y-3">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700">⚠️ 修改已有预订将触发飞书审批流程，审批通过后变更才会生效</div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Select label="预订类型" value={f.type} onChange={v=>u("type",v)} options={Object.entries(BOOKING_TYPES).filter(([k])=>k!=="ROOM").map(([v,l])=>({value:v,label:l}))} />
      <Select label="场地" value={f.venueId} onChange={v=>u("venueId",v)} options={[{value:"",label:"请选择"},...venues.filter(v=>v.status==="active").map(v=>({value:v.id,label:`${v.name}(${v.floor})`}))]} />
      <Select label="时段" value={f.timeSlotId} onChange={v=>u("timeSlotId",v)} options={DEFAULT_TIME_SLOTS.map(s=>({value:s.id,label:`${s.label}(${s.start}-${s.end})`}))} />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="日期" type="date" value={f.date} onChange={v=>u("date",v)} /><Input label="活动名称" value={f.eventName} onChange={v=>u("eventName",v)} /></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Input label="预计人数" type="number" value={f.expectedAttendance} onChange={v=>u("expectedAttendance",v)} /><Input label="保证人数" type="number" value={f.guaranteedAttendance} onChange={v=>u("guaranteedAttendance",v)} /><Input label="桌数" type="number" value={f.tableCount} onChange={v=>u("tableCount",v)} /><Input label="总金额(¥)" type="number" value={f.totalAmount} onChange={v=>u("totalAmount",v)} /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="摆台方式" value={f.setupStyle} onChange={v=>u("setupStyle",v)} /><Input label="备注" value={f.notes} onChange={v=>u("notes",v)} /></div>
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="secondary" onClick={onClose}>取消</Button>
      <Button variant="warning" onClick={()=>{ const updated={...f,expectedAttendance:Number(f.expectedAttendance)||0,guaranteedAttendance:Number(f.guaranteedAttendance)||0,totalAmount:Number(f.totalAmount)||0,tableCount:Number(f.tableCount)||0,pricePerTable:Number(f.pricePerTable)||0,updatedAt:todayStr}; onRequestApproval(updated); }}>📮 提交变更审批</Button>
    </div>
  </div></Modal>;
};

// ==================== 预订详情 ====================
const BookingDetailModal = ({ booking: b, venues, tasks, open, onClose, onForwardFeishu, onForwardWeChat, onGenerateEO, onEdit, hasPermission }) => {
  if (!b||!open) return null;
  const v = venues.find(x=>x.id===b.venueId), sl = DEFAULT_TIME_SLOTS.find(x=>x.id===b.timeSlotId), bt = tasks.filter(t=>t.bookingId===b.id);
  return <Modal open={open} onClose={onClose} title={`预订详情 - ${b.number}`} width="max-w-3xl">
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-xl p-3"><p className="text-xs text-indigo-700">{AI_SUGGESTIONS.pricing(b)}</p><p className="text-xs text-indigo-600 mt-1">{AI_SUGGESTIONS.upsell()}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><h4 className="text-sm font-semibold text-gray-800 mb-2">活动信息</h4><div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">名称</span><span className="font-medium text-right max-w-[60%] truncate">{b.eventName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">类型</span><Badge className={statusColor(b.status)}>{BOOKING_TYPES[b.type]}</Badge></div>
          <div className="flex justify-between"><span className="text-gray-500">状态</span><Badge className={statusColor(b.status)}>{BOOKING_STATUS[b.status]}</Badge></div>
          <div className="flex justify-between"><span className="text-gray-500">日期</span><span>{b.date}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">时段</span><span>{sl?.label} ({sl?.start}-{sl?.end})</span></div>
          <div className="flex justify-between"><span className="text-gray-500">场地</span><span>{v?.name} ({v?.floor})</span></div>
          <div className="flex justify-between"><span className="text-gray-500">人数</span><span>{b.expectedAttendance}/{b.guaranteedAttendance}人</span></div>
          {b.setupStyle&&<div className="flex justify-between"><span className="text-gray-500">摆台</span><span>{b.setupStyle}</span></div>}
          {b.tableCount&&<div className="flex justify-between"><span className="text-gray-500">桌数</span><span>{b.tableCount}桌×{formatMoney(b.pricePerTable)}</span></div>}
        </div></div>
        <div><h4 className="text-sm font-semibold text-gray-800 mb-2">联系与财务</h4><div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">主办方</span><span>{b.organizer}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">联系人</span><span>{b.contactName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">电话</span><span className="text-indigo-600">{b.contactPhone}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">销售</span><span>{b.salesPerson}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">金额</span><span className="text-lg font-bold text-indigo-700">{formatMoney(b.totalAmount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">付款</span><span>{b.paymentTerms}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">状态</span><span className={cn("font-semibold",payColor(b.paymentStatus))}>{PAYMENT_STATUS[b.paymentStatus]}</span></div>
        </div></div>
      </div>
      {b.notes&&<div className="bg-gray-50 rounded-lg p-3"><h4 className="text-xs font-semibold text-gray-600 mb-1">备注</h4><p className="text-sm text-gray-700">{b.notes}</p></div>}
      {b.roomBookings?.length>0&&<div><h4 className="text-sm font-semibold text-gray-800 mb-2">关联客房</h4>{b.roomBookings.map((r,i)=><div key={i} className="flex flex-wrap items-center justify-between bg-blue-50 rounded-lg px-3 py-2 text-sm mb-1"><span>{r.roomType}×{r.count}间</span><span>{r.checkIn}~{r.checkOut}</span><span className="font-semibold">{formatMoney(r.rate)}/晚</span></div>)}</div>}
      {b.departments?.length>0&&<div><h4 className="text-sm font-semibold text-gray-800 mb-2">部门任务</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{b.departments.map((d,i)=>{const dp=DEPARTMENTS.find(x=>x.id===d.deptId);return<div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm"><span className="font-medium">{dp?.icon} {dp?.name}</span><p className="text-gray-600 text-xs mt-0.5">{d.tasks}</p></div>})}</div></div>}
      {bt.length>0&&<div><h4 className="text-sm font-semibold text-gray-800 mb-2">跟单进度</h4>{bt.map(t=><div key={t.id} className={cn("flex flex-wrap items-center justify-between rounded-lg px-3 py-2 text-sm border mb-1",taskStatusColor(t.status))}><div><span className="font-medium">{DEPARTMENTS.find(d=>d.id===t.deptId)?.icon} {t.assignee}</span><span className="text-gray-500 ml-2">{t.task}</span></div><Badge className={taskStatusColor(t.status)}>{TASK_STATUS[t.status]}</Badge></div>)}</div>}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {hasPermission("booking_edit") && <Button variant="secondary" size="sm" onClick={()=>onEdit(b)}>✏️ 编辑预订</Button>}
        <Button variant="ai" size="sm" onClick={()=>onGenerateEO(b)}>📋 EO通知单</Button>
        <Button variant="primary" size="sm" onClick={()=>onForwardFeishu(b)}>💬 飞书转发</Button>
        <Button variant="success" size="sm" onClick={()=>onForwardWeChat(b)}>📱 微信转发</Button>
      </div>
    </div>
  </Modal>;
};

// ==================== 创建预订 ====================
const CreateBookingModal = ({ open, onClose, onSave, venues, bookings, prefill }) => {
  const [f, setF] = useState({ type:"MEETING",venueId:"",date:todayStr,timeSlotId:"morning",eventName:"",organizer:"",contactName:"",contactPhone:"",expectedAttendance:"",guaranteedAttendance:"",salesPerson:"",salesPhone:"",totalAmount:"",paymentTerms:"现付",setupStyle:"",notes:"",tableCount:"",pricePerTable:"" });
  const [tip, setTip] = useState("");
  useEffect(()=>{if(prefill)setF(p=>({...p,...prefill}))},[prefill]);
  useEffect(()=>{setTip(AI_SUGGESTIONS.conflict(f.date,f.venueId,f.timeSlotId,bookings)||"")},[f.date,f.venueId,f.timeSlotId,bookings]);
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return <Modal open={open} onClose={onClose} title="新建预订" width="max-w-2xl"><div className="space-y-3">
    {tip&&<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{tip}</div>}
    <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-xs text-indigo-700">🤖 AI提示: 填写后系统自动推荐布置方案和报价</div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Select label="预订类型" value={f.type} onChange={v=>u("type",v)} options={Object.entries(BOOKING_TYPES).filter(([k])=>k!=="ROOM").map(([v,l])=>({value:v,label:l}))} />
      <Select label="场地" value={f.venueId} onChange={v=>u("venueId",v)} options={[{value:"",label:"请选择"},...venues.filter(v=>v.status==="active").map(v=>({value:v.id,label:`${v.name}(${v.floor})`}))]} />
      <Select label="时段" value={f.timeSlotId} onChange={v=>u("timeSlotId",v)} options={DEFAULT_TIME_SLOTS.map(s=>({value:s.id,label:`${s.label}(${s.start}-${s.end})`}))} />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="日期" type="date" value={f.date} onChange={v=>u("date",v)} required /><Input label="活动名称" value={f.eventName} onChange={v=>u("eventName",v)} placeholder="如：XX公司年会" required /></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Input label="主办方" value={f.organizer} onChange={v=>u("organizer",v)} /><Input label="联系人" value={f.contactName} onChange={v=>u("contactName",v)} required /><Input label="联系电话" value={f.contactPhone} onChange={v=>u("contactPhone",v)} required /></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Input label="预计人数" type="number" value={f.expectedAttendance} onChange={v=>u("expectedAttendance",v)} /><Input label="保证人数" type="number" value={f.guaranteedAttendance} onChange={v=>u("guaranteedAttendance",v)} /><Input label="销售负责人" value={f.salesPerson} onChange={v=>u("salesPerson",v)} /><Input label="销售电话" value={f.salesPhone} onChange={v=>u("salesPhone",v)} /></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Input label="摆台方式" value={f.setupStyle} onChange={v=>u("setupStyle",v)} placeholder="课桌/U型" /><Input label="桌数" type="number" value={f.tableCount} onChange={v=>u("tableCount",v)} /><Input label="单桌价格" type="number" value={f.pricePerTable} onChange={v=>u("pricePerTable",v)} /><Input label="总金额(¥)" type="number" value={f.totalAmount} onChange={v=>u("totalAmount",v)} required /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Select label="付款方式" value={f.paymentTerms} onChange={v=>u("paymentTerms",v)} options={["现付","预付50%","月结","签单","全款付清"].map(s=>({value:s,label:s}))} /><Input label="备注" value={f.notes} onChange={v=>u("notes",v)} /></div>
    <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button variant="primary" onClick={()=>{onSave({...f,id:uid(),number:`EO-${f.date.replace(/-/g,"")}-${String(Math.floor(Math.random()*999)).padStart(3,"0")}`,status:"TENTATIVE",paymentStatus:"UNPAID",totalAmount:Number(f.totalAmount)||0,expectedAttendance:Number(f.expectedAttendance)||0,guaranteedAttendance:Number(f.guaranteedAttendance)||0,departments:[],createdAt:todayStr,updatedAt:todayStr});onClose()}}>创建预订</Button></div>
  </div></Modal>;
};

// ==================== 客房预订弹窗 ====================
const RoomBookingModal = ({ open, onClose, onSave }) => {
  const [f, setF] = useState({ guestName:"",phone:"",checkIn:todayStr,checkOut:addDays(todayStr,1),roomType:"豪华大床房",roomCount:1,rate:"",source:"直销",company:"",salesPerson:"",notes:"" });
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return <Modal open={open} onClose={onClose} title="新建客房预订"><div className="space-y-3">
    <div className="grid grid-cols-2 gap-3"><Input label="客人姓名" value={f.guestName} onChange={v=>u("guestName",v)} required /><Input label="联系电话" value={f.phone} onChange={v=>u("phone",v)} required /></div>
    <div className="grid grid-cols-2 gap-3"><Input label="入住日期" type="date" value={f.checkIn} onChange={v=>u("checkIn",v)} required /><Input label="离店日期" type="date" value={f.checkOut} onChange={v=>u("checkOut",v)} required /></div>
    <div className="grid grid-cols-3 gap-3"><Select label="房型" value={f.roomType} onChange={v=>u("roomType",v)} options={["豪华大床房","豪华双床房","行政大床房","行政套房","海河套房","总统套房"].map(r=>({value:r,label:r}))} /><Input label="间数" type="number" value={f.roomCount} onChange={v=>u("roomCount",v)} /><Input label="房价(¥)" type="number" value={f.rate} onChange={v=>u("rate",v)} /></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Select label="来源" value={f.source} onChange={v=>u("source",v)} options={["直销","协议客户","OTA-携程","OTA-美团","OTA-飞猪","团队","会议","婚宴"].map(s=>({value:s,label:s}))} /><Input label="公司" value={f.company} onChange={v=>u("company",v)} /><Input label="销售" value={f.salesPerson} onChange={v=>u("salesPerson",v)} /></div>
    <Input label="备注" value={f.notes} onChange={v=>u("notes",v)} />
    <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button variant="primary" onClick={()=>{onSave({...f,id:uid(),status:"CONFIRMED",paymentStatus:"UNPAID"});onClose()}}>创建预订</Button></div>
  </div></Modal>;
};

// ==================== EO通知单 ====================
const EOPreviewModal = ({ booking: b, venues, open, onClose }) => {
  if(!b||!open) return null;
  const v=venues.find(x=>x.id===b.venueId), sl=DEFAULT_TIME_SLOTS.find(x=>x.id===b.timeSlotId);
  return <Modal open={open} onClose={onClose} title="EO活动通知单" width="max-w-3xl">
    <div className="bg-white border-2 border-gray-300 p-4 sm:p-6 font-serif">
      <div className="text-center mb-4"><h2 className="text-lg sm:text-xl font-bold">宴会、会议安排通知单</h2><p className="text-sm text-gray-500">Event Order</p><p className="text-xs mt-1">编号: {b.number}</p></div>
      <div className="border border-gray-400 mb-4"><div className="grid grid-cols-2 text-xs sm:text-sm">
        <div className="border-b border-r border-gray-400 p-2"><b>名称：</b>{b.eventName}</div><div className="border-b border-gray-400 p-2"><b>电话：</b>{b.contactPhone}</div>
        <div className="border-b border-r border-gray-400 p-2"><b>日期：</b>{b.date}</div><div className="border-b border-gray-400 p-2"><b>种类：</b>{BOOKING_TYPES[b.type]}</div>
        <div className="border-b border-r border-gray-400 p-2"><b>时间：</b>{sl?.label}</div><div className="border-b border-gray-400 p-2"><b>地点：</b>{v?.name}</div>
        <div className="border-r border-gray-400 p-2"><b>预计：</b>{b.expectedAttendance}人</div><div className="p-2"><b>保证：</b>{b.guaranteedAttendance}人</div>
      </div></div>
      {b.departments?.map((d,i)=>{const dp=DEPARTMENTS.find(x=>x.id===d.deptId);return<div key={i} className="mb-2"><h4 className="font-bold text-sm">{dp?.icon} {dp?.name}</h4><p className="text-sm ml-4">{d.tasks}</p></div>})}
      <div className="mt-4 pt-3 border-t border-gray-300 text-sm"><p><b>经办人：</b>{b.salesPerson} ({b.salesPhone})</p><p className="mt-1"><b>总金额：</b><span className="text-lg font-bold text-red-700">{formatMoney(b.totalAmount)}</span></p></div>
    </div>
    <div className="flex flex-wrap justify-end gap-2 mt-3"><Button variant="primary" size="sm">💬 发布飞书</Button><Button variant="success" size="sm">🖨️ 打印</Button></div>
  </Modal>;
};

// ==================== 微信富文本卡片 ====================
const WeChatRichCardModal = ({ booking: b, venues, open, onClose }) => {
  if(!b||!open) return null;
  const v=venues.find(x=>x.id===b.venueId), sl=DEFAULT_TIME_SLOTS.find(x=>x.id===b.timeSlotId);
  const venueImg = v?.img || HOTEL_INFO.coverImg;
  return <Modal open={open} onClose={onClose} title="微信转发卡片" width="max-w-md">
    <div className="mx-auto max-w-[375px]">
      {/* 富文本卡片预览 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        {/* 头图 */}
        <div className="relative h-44 bg-gradient-to-br from-indigo-800 to-violet-900 overflow-hidden">
          <img src={venueImg} alt="" className="w-full h-full object-cover opacity-70" onError={e=>{e.target.style.display="none"}} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <p className="text-[10px] opacity-80">{HOTEL_INFO.group}</p>
            <h3 className="text-base font-bold leading-tight mt-0.5">{b.eventName}</h3>
          </div>
          <div className="absolute top-3 right-3"><Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">{BOOKING_TYPES[b.type]}</Badge></div>
        </div>

        {/* 信息区 */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-indigo-50 rounded-lg p-2.5"><p className="text-[10px] text-indigo-500">日期</p><p className="font-semibold text-indigo-900 text-xs">{b.date}</p></div>
            <div className="bg-indigo-50 rounded-lg p-2.5"><p className="text-[10px] text-indigo-500">时间</p><p className="font-semibold text-indigo-900 text-xs">{sl?.label} {sl?.start}-{sl?.end}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-500">场地</p><p className="font-semibold text-gray-800 text-xs">{v?.name} ({v?.floor})</p></div>
            <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-500">规模</p><p className="font-semibold text-gray-800 text-xs">{b.guaranteedAttendance}人{b.tableCount ? ` / ${b.tableCount}桌` : ""}</p></div>
          </div>

          {/* 推荐菜品（包厢类型） */}
          {v?.recommendedDishes && <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100"><p className="text-[10px] text-amber-600 font-medium mb-1">🍽️ 主厨推荐菜品</p><p className="text-xs text-amber-800">{v.recommendedDishes}</p></div>}

          {/* 酒店位置 */}
          <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
            <p className="text-[10px] text-green-600 font-medium mb-1">📍 酒店位置</p>
            <p className="text-xs text-green-800">{HOTEL_INFO.address}</p>
            <a href={`https://uri.amap.com/marker?position=${HOTEL_INFO.lng},${HOTEL_INFO.lat}&name=${encodeURIComponent(HOTEL_INFO.name)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-600 underline mt-1 inline-block">查看地图导航 →</a>
          </div>

          {/* 金额 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div><p className="text-[10px] text-gray-500">预订金额</p><p className="text-xl font-bold text-indigo-700">{formatMoney(b.totalAmount)}</p></div>
            <Badge className={cn("text-xs", statusColor(b.status))}>{BOOKING_STATUS[b.status]}</Badge>
          </div>

          {/* 销售顾问 */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">{b.salesPerson?.[0]}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800">专属顾问: {b.salesPerson}</p><p className="text-xs text-gray-500">{b.salesPhone}</p></div>
            <a href={`tel:${b.salesPhone}`} className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">📞</a>
          </div>
        </div>

        {/* 底部品牌 */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-center">
          <p className="text-white text-xs font-medium">{HOTEL_INFO.name}</p>
          <p className="text-indigo-200 text-[10px]">{HOTEL_INFO.phone}</p>
        </div>
      </div>
    </div>

    <div className="flex justify-center gap-2 mt-4">
      <Button variant="success" size="sm" onClick={()=>{navigator.clipboard?.writeText(`${HOTEL_INFO.name} - ${b.eventName}\n日期: ${b.date} ${sl?.label}\n场地: ${v?.name}\n金额: ${formatMoney(b.totalAmount)}\n顾问: ${b.salesPerson} ${b.salesPhone}\n地址: ${HOTEL_INFO.address}\n导航: https://uri.amap.com/marker?position=${HOTEL_INFO.lng},${HOTEL_INFO.lat}&name=${encodeURIComponent(HOTEL_INFO.name)}`)}}>📋 复制富文本</Button>
      <Button variant="primary" size="sm" onClick={()=>{navigator.clipboard?.writeText(`https://chaoliuzhu65-tech.github.io/hotel-reports/#booking/${b.id}`)}}>🔗 复制H5链接</Button>
    </div>
  </Modal>;
};

// ==================== 飞书转发 ====================
const FeishuForwardModal = ({ booking: b, venues, open, onClose, type="event" }) => {
  if(!open) return null;
  const v=venues?.find(x=>x.id===b?.venueId);
  return <Modal open={open} onClose={onClose} title={type==="room"?"转发客房到飞书":"转发预订到飞书"}>
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold">飞书</div><span className="font-medium text-sm">消息预览</span></div>
      <div className="bg-white rounded-lg p-3 text-sm border border-blue-100">{type==="room"?<div><p className="font-bold text-blue-700">📋 客房预订通知</p><p><b>客人:</b> {b?.guestName}</p><p><b>入住:</b> {b?.checkIn}~{b?.checkOut}</p><p><b>房型:</b> {b?.roomType}×{b?.roomCount}间</p><p><b>房价:</b> {formatMoney(b?.rate)}/晚</p></div>:<div><p className="font-bold text-blue-700">📋 {BOOKING_TYPES[b?.type]}预订通知</p><p><b>活动:</b> {b?.eventName}</p><p><b>日期:</b> {b?.date}</p><p><b>场地:</b> {v?.name}</p><p><b>金额:</b> {formatMoney(b?.totalAmount)}</p></div>}</div></div>
      <div><label className="text-xs font-medium text-gray-600">选择群组</label><div className="mt-2 space-y-1">{["酒店销售部工作群","酒店运营管理群","餐饮部工作群","前厅部工作群","宴会预订专项群"].map(g=><label key={g} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"><input type="checkbox" className="rounded border-gray-300"/><span>{g}</span></label>)}</div></div>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button variant="primary" onClick={onClose}>💬 发送</Button></div>
    </div>
  </Modal>;
};

// ==================== 看板 ====================
const KanbanBoard = ({ tasks, bookings }) => {
  const cols = [{ id:"PENDING",label:"待处理",color:"bg-gray-500" },{ id:"IN_PROGRESS",label:"进行中",color:"bg-blue-500" },{ id:"FEEDBACK",label:"待反馈",color:"bg-yellow-500" },{ id:"COMPLETED",label:"已完成",color:"bg-green-500" }];
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cols.map(col=>{
    const ct=tasks.filter(t=>t.status===col.id);
    return <div key={col.id} className="bg-gray-50 rounded-xl p-2.5">
      <div className="flex items-center gap-2 mb-2"><div className={cn("w-2 h-2 rounded-full",col.color)}/><h4 className="text-xs sm:text-sm font-semibold text-gray-700">{col.label}</h4><span className="text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">{ct.length}</span></div>
      <div className="space-y-2">{ct.map(task=>{const bk=bookings.find(b=>b.id===task.bookingId),dp=DEPARTMENTS.find(d=>d.id===task.deptId);return<Card key={task.id} className="p-2.5"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-semibold text-indigo-600">{bk?.number}</span><span className="text-[10px] text-gray-400">{task.deadline?.split(" ")[1]||""}</span></div><p className="text-xs sm:text-sm font-medium text-gray-800 mb-1">{task.task}</p><span className="text-[10px] text-gray-500">{dp?.icon} {task.assignee}</span>{task.feedback&&<div className="mt-1.5 bg-blue-50 rounded px-2 py-1 text-[10px] text-blue-700">{task.feedback}</div>}<p className="text-[10px] text-gray-400 mt-1 truncate">{bk?.eventName}</p></Card>})}{ct.length===0&&<div className="text-center py-6 text-gray-300 text-xs">暂无</div>}</div>
    </div>
  })}</div>;
};

// ==================== 主应用 ====================
export default function App() {
  // ---- 核心状态 ----
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState(SAMPLE_BOOKINGS);
  const [roomBookings, setRoomBookings] = useState(SAMPLE_ROOM_BOOKINGS);
  const [tasks] = useState(SAMPLE_TASKS);
  const [venues, setVenues] = useState(SAMPLE_VENUES_INIT);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [venueFilter, setVenueFilter] = useState("ALL");
  const [calendarView, setCalendarView] = useState("day"); // "day" | "panoramic"
  const [panoramicStart, setPanoramicStart] = useState(todayStr);
  const [panoramicEnd, setPanoramicEnd] = useState(addDays(todayStr, 30));
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [kanbanFilter, setKanbanFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showEO, setShowEO] = useState(false);
  const [showWeChat, setShowWeChat] = useState(false);
  const [showFeishu, setShowFeishu] = useState(false);
  const [feishuType, setFeishuType] = useState("event");
  const [feishuData, setFeishuData] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ---- 新增: 权限/用户/日志/配置 状态 ----
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [currentUser, setCurrentUser] = useState(SAMPLE_USERS[0]); // 默认管理员
  const [roles] = useState(DEFAULT_ROLES);
  const [auditLogs, setAuditLogs] = useState(SAMPLE_LOGS);
  const [feishuConfig, setFeishuConfig] = useState(DEFAULT_FEISHU_CONFIG);
  const [approvals, setApprovals] = useState(SAMPLE_APPROVALS);

  // ---- 设置页面状态 ----
  const [settingsTab, setSettingsTab] = useState("venues");
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditBooking, setShowEditBooking] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [pendingBookingEdit, setPendingBookingEdit] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [logFilter, setLogFilter] = useState("all");
  const [venueSettingsFilter, setVenueSettingsFilter] = useState("ALL");

  // ---- 权限检查 ----
  const hasPermission = useCallback((perm) => {
    const role = roles.find(r => r.id === currentUser?.role);
    return role?.permissions?.includes(perm) ?? false;
  }, [currentUser, roles]);

  // ---- 审计日志记录 ----
  const addLog = useCallback((action, target, details) => {
    setAuditLogs(prev => [{ id: "log" + uid(), userId: currentUser.id, userName: currentUser.name, action, target, details, timestamp: nowTimestamp() }, ...prev]);
  }, [currentUser]);

  // ---- 场地 CRUD ----
  const handleSaveVenue = (data) => {
    const existing = venues.find(v => v.id === data.id);
    if (existing) {
      setVenues(prev => prev.map(v => v.id === data.id ? { ...v, ...data } : v));
      addLog("VENUE_EDIT", data.name, `修改场地「${data.name}」信息`);
    } else {
      setVenues(prev => [...prev, data]);
      addLog("VENUE_ADD", data.name, `新增场地「${data.name}」(${VENUE_TYPES[data.type]}, ${data.floor}, ${data.capacity}人)`);
    }
  };

  const handleToggleVenue = (venue) => {
    const newStatus = venue.status === "active" ? "inactive" : "active";
    setVenues(prev => prev.map(v => v.id === venue.id ? { ...v, status: newStatus } : v));
    addLog("VENUE_TOGGLE", venue.name, `${newStatus === "active" ? "启用" : "停用"}场地「${venue.name}」`);
  };

  const handleDeleteVenue = (venue) => {
    const hasBookings = bookings.some(b => b.venueId === venue.id && b.status !== "CANCELLED");
    if (hasBookings) { alert("该场地有关联预订，无法删除"); return; }
    setVenues(prev => prev.filter(v => v.id !== venue.id));
    addLog("VENUE_DELETE", venue.name, `删除场地「${venue.name}」`);
  };

  // ---- 用户 CRUD ----
  const handleSaveUser = (data) => {
    const existing = users.find(u => u.id === data.id);
    if (existing) {
      const roleChanged = existing.role !== data.role;
      setUsers(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u));
      addLog(roleChanged ? "USER_ROLE_CHANGE" : "USER_EDIT", data.name, roleChanged ? `将「${data.name}」角色从${roles.find(r=>r.id===existing.role)?.name}变更为${roles.find(r=>r.id===data.role)?.name}` : `修改用户「${data.name}」信息`);
    } else {
      setUsers(prev => [...prev, data]);
      addLog("USER_ADD", data.name, `新增用户「${data.name}」(${roles.find(r=>r.id===data.role)?.name})`);
    }
  };

  // ---- 预订变更审批 ----
  const handleRequestBookingApproval = (updatedBooking) => {
    const original = bookings.find(b => b.id === updatedBooking.id);
    setPendingBookingEdit(updatedBooking);
    setShowEditBooking(false);
    setShowApprovalDialog(true);
  };

  const handleSubmitApproval = ({ changes, reason, feishuEnabled }) => {
    const original = bookings.find(b => b.id === pendingBookingEdit.id);
    const approval = {
      id: "ap" + uid(), bookingId: pendingBookingEdit.id, bookingNumber: original.number,
      requesterId: currentUser.id, requesterName: currentUser.name,
      changes, reason, status: "pending",
      feishuApprovalId: feishuEnabled ? "FA-" + todayStr.replace(/-/g, "") + "-" + uid().slice(0, 3).toUpperCase() : null,
      createdAt: nowTimestamp(),
    };
    setApprovals(prev => [approval, ...prev]);
    addLog("BOOKING_EDIT_REQUEST", original.number, `提交预订变更审批: ${reason || "无说明"}`);
    setShowApprovalDialog(false);
    setPendingBookingEdit(null);
  };

  const handleApproveBooking = (approvalId, approved) => {
    setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status: approved ? "approved" : "rejected", decidedAt: nowTimestamp() } : a));
    const approval = approvals.find(a => a.id === approvalId);
    if (approved && approval) {
      // 这里实际应用中会从 pendingBookingEdit 拿到完整数据，简化处理
      addLog("BOOKING_EDIT_APPROVED", approval.bookingNumber, `审批通过预订变更`);
    } else if (approval) {
      addLog("BOOKING_EDIT_REJECTED", approval.bookingNumber, `驳回预订变更申请`);
    }
  };

  // ---- 飞书配置保存 ----
  const handleSaveFeishuConfig = (config) => {
    setFeishuConfig(config);
    addLog("FEISHU_CONFIG", "飞书集成", `更新飞书配置 (App ID: ${config.appId?.slice(0, 8)}...)`);
  };

  // ---- 预订创建包装 ----
  const handleCreateBooking = (b) => {
    setBookings(prev => [...prev, b]);
    addLog("BOOKING_CREATE", b.number, `创建${BOOKING_TYPES[b.type]}预订「${b.eventName}」`);
  };

  // ---- 计算数据 ----
  const todayBk = bookings.filter(b => b.date === todayStr && b.status !== "CANCELLED");
  const confirmed = bookings.filter(b => b.status === "CONFIRMED");
  const totalRev = bookings.filter(b => b.status !== "CANCELLED").reduce((s, b) => s + (b.totalAmount || 0), 0);
  const pendingT = tasks.filter(t => t.status === "PENDING" || t.status === "IN_PROGRESS");
  const pendingApprovals = approvals.filter(a => a.status === "pending");

  const filtered = useMemo(() => {
    let r = bookings;
    if (bookingStatusFilter !== "all") r = r.filter(b => b.status === bookingStatusFilter);
    if (!searchQuery) return r;
    const q = searchQuery.toLowerCase();
    return r.filter(b => b.eventName?.toLowerCase().includes(q) || b.organizer?.toLowerCase().includes(q) || b.contactName?.toLowerCase().includes(q) || b.salesPerson?.toLowerCase().includes(q) || b.number?.toLowerCase().includes(q));
  }, [bookings, bookingStatusFilter, searchQuery]);

  const nav = (id) => { setPage(id); setSidebarOpen(false); };
  const NAV = [
    { id: "dashboard", icon: "📊", label: "工作台" }, { id: "calendar", icon: "📅", label: "场地日历" },
    { id: "bookings", icon: "📋", label: "预订管理" }, { id: "rooms", icon: "🛏️", label: "客房预订" },
    { id: "kanban", icon: "📌", label: "跟单看板" }, { id: "reports", icon: "📈", label: "数据分析" },
    { id: "settings", icon: "⚙️", label: "系统设置" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans" style={{ height: "100dvh" }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={cn("fixed lg:static inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold">德</div><div><h1 className="text-sm font-bold text-gray-900">德胧预订管理</h1><p className="text-[10px] text-gray-400">AI Native · {HOTEL_INFO.name}</p></div></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">{NAV.map(item => <button key={item.id} onClick={() => nav(item.id)} className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all", page === item.id ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-50")}><span>{item.icon}</span><span>{item.label}</span>
          {item.id === "kanban" && pendingT.length > 0 && <span className="ml-auto text-[10px] bg-red-100 text-red-600 rounded-full px-1.5">{pendingT.length}</span>}
          {item.id === "settings" && pendingApprovals.length > 0 && <span className="ml-auto text-[10px] bg-amber-100 text-amber-600 rounded-full px-1.5">{pendingApprovals.length}</span>}
        </button>)}</nav>
        {/* 当前用户 */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2 mb-2"><div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">{currentUser.avatar}</div><div className="min-w-0"><p className="text-xs font-medium text-gray-800 truncate">{currentUser.name}</p><p className="text-[10px] text-gray-400">{roles.find(r => r.id === currentUser.role)?.name}</p></div></div>
          <Select value={currentUser.id} onChange={v => setCurrentUser(users.find(u => u.id === v) || users[0])} options={users.filter(u => u.status === "active").map(u => ({ value: u.id, label: `${u.name} (${roles.find(r => r.id === u.role)?.name})` }))} />
          <button onClick={() => { setShowAI(p => !p); setSidebarOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-700 hover:to-indigo-700 shadow-sm mt-2"><span>🤖</span><span>AI 助手</span></button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-12 sm:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg></button>
            <h2 className="text-sm sm:text-base font-semibold">{NAV.find(n => n.id === page)?.icon} {NAV.find(n => n.id === page)?.label}</h2>
            <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">{todayStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 搜索..." className="hidden sm:block px-3 py-1.5 text-sm border border-gray-200 rounded-lg w-48 lg:w-64 focus:ring-2 focus:ring-indigo-500 outline-none" />
            {pendingApprovals.length > 0 && <button onClick={() => { setPage("settings"); setSettingsTab("approvals"); }} className="relative p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><span>🔔</span><span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{pendingApprovals.length}</span></button>}
            {hasPermission("booking_create") && <Button variant="primary" size="sm" onClick={() => setShowCreateBooking(true)} className="hidden sm:inline-flex">+ 新建预订</Button>}
            <Button variant="secondary" size="sm" onClick={() => setShowCreateRoom(true)} className="hidden sm:inline-flex">+ 客房</Button>
            <button onClick={() => setShowCreateBooking(true)} className="sm:hidden w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg shadow-lg">+</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="flex gap-6">
            <div className={cn("transition-all min-w-0", showAI ? "flex-1" : "w-full")}>

              {/* Dashboard */}
              {page === "dashboard" && <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <StatCard label="今日预订" value={todayBk.length} sub="场活动" icon="📋" color="indigo" />
                  <StatCard label="已确认" value={confirmed.length} sub="笔订单" icon="✅" color="green" />
                  <StatCard label="预订总额" value={formatMoney(totalRev)} icon="💰" color="violet" />
                  <StatCard label="待处理" value={pendingT.length} sub="项工单" icon="📌" color="red" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2"><Card className="p-3 sm:p-4"><div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">今日场地预订</h3><Button variant="ghost" size="sm" onClick={() => setPage("calendar")}>完整日历→</Button></div><VenueCalendarGrid date={todayStr} venues={venues.slice(0, 10)} bookings={bookings} onCellClick={(v, s, d) => { setPrefill({ venueId: v.id, timeSlotId: s.id, date: d }); setShowCreateBooking(true); }} onBookingClick={b => { setSelectedBooking(b); setShowDetail(true); }} venueFilter="ALL" /></Card></div>
                  <div>
                    <MonthCalendar bookings={bookings} onDateSelect={d => { setSelectedDate(d); setPage("calendar"); }} selectedDate={selectedDate} />
                    <Card className="p-3 sm:p-4 mt-4"><h3 className="text-sm font-semibold mb-3">🔥 AI 智能提醒</h3><div className="space-y-2">{[{ i: "⚠️", t: "明日婚宴(刘磊先生)婚房需7:00前布置" }, { i: "💡", t: "本周三有3个会议室空置，建议推送促销" }, { i: "📊", t: "本月宴会收入同比增长12%" }, { i: "🎯", t: "协议客户王建国入住中，可推荐餐饮消费" }].map((x, j) => <div key={j} className="flex items-start gap-2 text-xs bg-gray-50 rounded-lg p-2"><span>{x.i}</span><span className="text-gray-700">{x.t}</span></div>)}</div></Card>
                    {pendingApprovals.length > 0 && <Card className="p-3 sm:p-4 mt-4 border-amber-200"><h3 className="text-sm font-semibold mb-2 text-amber-700">🔔 待审批 ({pendingApprovals.length})</h3>{pendingApprovals.slice(0,3).map(a=><div key={a.id} className="bg-amber-50 rounded-lg p-2 mb-1.5 text-xs"><p className="font-medium text-amber-800">{a.bookingNumber}</p><p className="text-amber-600">{a.requesterName}: {a.reason}</p><div className="flex gap-1.5 mt-1.5"><Button variant="success" size="sm" onClick={()=>handleApproveBooking(a.id,true)}>通过</Button><Button variant="danger" size="sm" onClick={()=>handleApproveBooking(a.id,false)}>驳回</Button></div></div>)}</Card>}
                  </div>
                </div>
              </div>}

              {/* Calendar */}
              {page==="calendar"&&<div className="space-y-3 sm:space-y-4">
                {/* 工具栏 */}
                <div className="flex flex-col gap-2">
                  {/* 第一行: 视图切换 + 场地筛选 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex bg-gray-100 p-0.5 rounded-lg">
                        <button onClick={()=>setCalendarView("day")} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all", calendarView==="day"?"bg-white text-indigo-700 shadow-sm":"text-gray-500 hover:text-gray-700")}>📅 日视图</button>
                        <button onClick={()=>setCalendarView("panoramic")} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all", calendarView==="panoramic"?"bg-white text-indigo-700 shadow-sm":"text-gray-500 hover:text-gray-700")}>🖥️ 全景视图</button>
                      </div>
                    </div>
                    <Tabs tabs={[{id:"ALL",label:"全部"},{id:"BANQUET",label:"宴会厅"},{id:"MEETING",label:"会议室"},{id:"PRIVATE",label:"包厢"}]} active={venueFilter} onChange={setVenueFilter} />
                  </div>

                  {/* 第二行: 日期控制 */}
                  {calendarView==="day" ? (
                    <div className="flex items-center gap-2">
                      <button onClick={()=>setSelectedDate(addDays(selectedDate,-1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">◀</button>
                      <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg" />
                      <button onClick={()=>setSelectedDate(addDays(selectedDate,1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">▶</button>
                      <Button variant="ghost" size="sm" onClick={()=>setSelectedDate(todayStr)}>今天</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium">日期范围:</span>
                        <input type="date" value={panoramicStart} onChange={e=>{
                          const s = e.target.value;
                          setPanoramicStart(s);
                          // 自动调整结束日期不超过35天
                          const diff = Math.round((new Date(panoramicEnd) - new Date(s)) / 86400000);
                          if (diff > 35 || diff < 0) setPanoramicEnd(addDays(s, 30));
                        }} className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg" />
                        <span className="text-gray-400">→</span>
                        <input type="date" value={panoramicEnd} onChange={e=>{
                          const newEnd = e.target.value;
                          const diff = Math.round((new Date(newEnd) - new Date(panoramicStart)) / 86400000);
                          if (diff > 35) { alert("最长展示35天，已自动调整"); setPanoramicEnd(addDays(panoramicStart, 35)); }
                          else if (diff < 1) { alert("结束日期必须晚于开始日期"); }
                          else setPanoramicEnd(newEnd);
                        }} className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg" />
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{Math.round((new Date(panoramicEnd) - new Date(panoramicStart)) / 86400000) + 1}天</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={()=>{setPanoramicStart(todayStr);setPanoramicEnd(addDays(todayStr,6))}}>本周</Button>
                        <Button variant="ghost" size="sm" onClick={()=>{setPanoramicStart(todayStr);setPanoramicEnd(addDays(todayStr,13))}}>两周</Button>
                        <Button variant="ghost" size="sm" onClick={()=>{setPanoramicStart(todayStr);setPanoramicEnd(addDays(todayStr,30))}}>本月</Button>
                        <Button variant="ghost" size="sm" onClick={()=>{setPanoramicStart(todayStr);setPanoramicEnd(addDays(todayStr,35))}}>35天</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 日视图 */}
                {calendarView==="day" && <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 min-w-0"><Card className="overflow-hidden"><VenueCalendarGrid date={selectedDate} venues={venues} bookings={bookings} onCellClick={(v,s,d)=>{setPrefill({venueId:v.id,timeSlotId:s.id,date:d});setShowCreateBooking(true)}} onBookingClick={b=>{setSelectedBooking(b);setShowDetail(true)}} venueFilter={venueFilter} /></Card></div>
                  <div className="w-full lg:w-64 shrink-0">
                    <MonthCalendar bookings={bookings} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
                    <Card className="mt-3 p-3"><h4 className="text-xs font-semibold text-gray-600 mb-2">当日统计</h4>{(()=>{const db=bookings.filter(b=>b.date===selectedDate&&b.status!=="CANCELLED");return<div className="space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-gray-500">预订数</span><span className="font-bold">{db.length}</span></div><div className="flex justify-between"><span className="text-gray-500">总金额</span><span className="font-bold text-indigo-700">{formatMoney(db.reduce((s,b)=>s+b.totalAmount,0))}</span></div><div className="flex justify-between"><span className="text-gray-500">总人次</span><span className="font-bold">{db.reduce((s,b)=>s+b.expectedAttendance,0)}</span></div></div>})()}</Card>
                  </div>
                </div>}

                {/* 全景视图 */}
                {calendarView==="panoramic" && <div>
                  {/* 统计概览条 */}
                  {(()=>{
                    const rangeBookings = bookings.filter(b => b.date >= panoramicStart && b.date <= panoramicEnd && b.status !== "CANCELLED");
                    const days = Math.round((new Date(panoramicEnd) - new Date(panoramicStart)) / 86400000) + 1;
                    const activeVenues = venues.filter(v => v.status === "active").length;
                    const totalSlots = days * activeVenues * 4;
                    const usedSlots = rangeBookings.length;
                    const utilRate = totalSlots > 0 ? Math.round(usedSlots / totalSlots * 100) : 0;
                    return <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      <div className="bg-indigo-50 rounded-lg px-3 py-2"><p className="text-[10px] text-indigo-500">预订总数</p><p className="text-lg font-bold text-indigo-700">{rangeBookings.length}</p></div>
                      <div className="bg-green-50 rounded-lg px-3 py-2"><p className="text-[10px] text-green-500">总营收</p><p className="text-lg font-bold text-green-700">{formatMoney(rangeBookings.reduce((s,b)=>s+b.totalAmount,0))}</p></div>
                      <div className="bg-violet-50 rounded-lg px-3 py-2"><p className="text-[10px] text-violet-500">场地使用率</p><p className="text-lg font-bold text-violet-700">{utilRate}%</p></div>
                      <div className="bg-amber-50 rounded-lg px-3 py-2"><p className="text-[10px] text-amber-500">展示范围</p><p className="text-lg font-bold text-amber-700">{days}天</p></div>
                    </div>;
                  })()}
                  <VenuePanoramicGrid venues={venues} bookings={bookings} startDate={panoramicStart} endDate={panoramicEnd} onBookingClick={b=>{setSelectedBooking(b);setShowDetail(true)}} venueFilter={venueFilter} />
                </div>}
              </div>}

              {/* Bookings */}
              {page==="bookings"&&<div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Tabs tabs={[{id:"all",label:"全部"},{id:"TENTATIVE",label:"暂定"},{id:"CONFIRMED",label:"已确认"},{id:"COMPLETED",label:"已完成"}]} active={bookingStatusFilter} onChange={setBookingStatusFilter} />
                  <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="🔍 搜索..." className="sm:hidden px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div className="space-y-2">{filtered.map(b=>{const v=venues.find(x=>x.id===b.venueId),sl=DEFAULT_TIME_SLOTS.find(x=>x.id===b.timeSlotId);return<Card key={b.id} className="p-3 sm:p-4" onClick={()=>{setSelectedBooking(b);setShowDetail(true)}}>
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><span className="text-[10px] text-gray-400">{b.number}</span><Badge className={statusColor(b.status)}>{BOOKING_STATUS[b.status]}</Badge><Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">{BOOKING_TYPES[b.type]}</Badge></div><h4 className="font-semibold text-gray-800 mt-1 text-sm truncate">{b.eventName}</h4><div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-gray-500 flex-wrap"><span>📅{b.date}</span><span>⏰{sl?.label}</span><span>📍{v?.name}</span><span>👥{b.expectedAttendance}人</span></div></div>
                    <div className="text-right shrink-0"><div className="text-base sm:text-lg font-bold text-indigo-700">{formatMoney(b.totalAmount)}</div><span className={cn("text-[10px] sm:text-xs font-medium",payColor(b.paymentStatus))}>{PAYMENT_STATUS[b.paymentStatus]}</span></div>
                  </div>
                </Card>})}</div>
              </div>}

              {/* Rooms */}
              {page==="rooms"&&<div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Tabs tabs={[{id:"all",label:"全部"},{id:"today",label:"今日入住"},{id:"tomorrow",label:"明日入住"}]} active={roomFilter} onChange={setRoomFilter} />
                  <Button variant="primary" size="sm" onClick={()=>setShowCreateRoom(true)}>+ 客房预订</Button>
                </div>
                <div className="space-y-2">{roomBookings.filter(r=>{if(roomFilter==="today")return r.checkIn===todayStr;if(roomFilter==="tomorrow")return r.checkIn===addDays(todayStr,1);return true}).map(r=><Card key={r.id} className="p-3 sm:p-4">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><h4 className="font-semibold text-sm">{r.guestName}</h4><Badge className={statusColor(r.status)}>{BOOKING_STATUS[r.status]}</Badge>{r.linkedEventId&&<Badge className="bg-purple-50 text-purple-700 border-purple-200">关联</Badge>}</div><div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-gray-500 flex-wrap"><span>📅{r.checkIn}~{r.checkOut}</span><span>🛏️{r.roomType}×{r.roomCount}</span>{r.company&&<span>🏢{r.company}</span>}</div></div>
                    <div className="flex items-center gap-2 shrink-0"><div className="text-right"><div className="font-bold text-indigo-700 text-sm">{formatMoney(r.rate)}/晚</div><span className={cn("text-[10px]",payColor(r.paymentStatus))}>{PAYMENT_STATUS[r.paymentStatus]}</span></div><Button variant="primary" size="sm" onClick={e=>{e.stopPropagation();setFeishuData(r);setFeishuType("room");setShowFeishu(true)}}>💬</Button></div>
                  </div>
                </Card>)}</div>
              </div>}

              {/* Kanban */}
              {page==="kanban"&&<div>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap"><Tabs tabs={[{id:"all",label:"全部"},{id:"today",label:"今日"},{id:"overdue",label:"逾期"}]} active={kanbanFilter} onChange={setKanbanFilter} /><Button variant="primary" size="sm">+ 新建工单</Button></div>
                <KanbanBoard tasks={kanbanFilter==="all"?tasks:kanbanFilter==="today"?tasks.filter(t=>t.deadline?.startsWith(todayStr)):tasks.filter(t=>t.deadline&&t.deadline<todayStr&&t.status!=="COMPLETED")} bookings={bookings} />
              </div>}

              {/* Reports */}
              {page==="reports"&&<div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <StatCard label="本月总额" value={formatMoney(totalRev)} icon="💰" color="indigo" />
                  <StatCard label="场地使用率" value="78%" sub="环比+5%" icon="📊" color="green" />
                  <StatCard label="平均客单价" value={formatMoney(Math.round(totalRev/bookings.length))} icon="💵" color="violet" />
                  <StatCard label="满意度" value="4.8" sub="/5.0" icon="⭐" color="yellow" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="p-3 sm:p-4"><h3 className="text-sm font-semibold mb-3">预订类型分布</h3><div className="space-y-2.5">{Object.entries(BOOKING_TYPES).filter(([k])=>k!=="ROOM").map(([key,label])=>{const ct=bookings.filter(b=>b.type===key).length,pct=Math.round(ct/bookings.length*100);return<div key={key}><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{label}</span><span className="font-semibold">{ct}笔({pct}%)</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{width:`${pct}%`}}/></div></div>})}</div></Card>
                  <Card className="p-3 sm:p-4"><h3 className="text-sm font-semibold mb-3">🤖 AI 经营洞察</h3><div className="space-y-2.5 text-sm">
                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100"><p className="font-medium text-indigo-800 mb-1 text-xs">💡 收入优化</p><p className="text-xs text-gray-600">午间时段使用率仅35%，建议推出午间商务套餐</p></div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100"><p className="font-medium text-green-800 mb-1 text-xs">📈 增长机会</p><p className="text-xs text-gray-600">包厢预订30天增长23%，建议开发企业包厢年卡</p></div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><p className="font-medium text-amber-800 mb-1 text-xs">⚠️ 风险预警</p><p className="text-xs text-gray-600">3笔大额预订为部分付款状态，建议催款</p></div>
                  </div></Card>
                </div>
                <Card className="p-3 sm:p-4"><h3 className="text-sm font-semibold mb-3">近7天趋势</h3><div className="flex items-end gap-1.5 h-28 sm:h-32">{Array.from({length:7},(_,i)=>{const d=addDays(todayStr,i-6),ct=bookings.filter(b=>b.date===d&&b.status!=="CANCELLED").length;return<div key={d} className="flex-1 flex flex-col items-center gap-1"><span className="text-[10px] text-gray-500">{ct}</span><div className="w-full bg-indigo-500 rounded-t-md" style={{height:Math.max(6,ct*25)}}/><span className="text-[10px] text-gray-400">{d.slice(8)}</span></div>})}</div></Card>
              </div>}

              {/* ==================== 系统设置 ==================== */}
              {page==="settings"&&<div className="space-y-4">
                <Tabs tabs={[
                  {id:"venues",label:"场地管理",count:venues.length},
                  {id:"users",label:"用户权限",count:users.length},
                  {id:"logs",label:"操作日志",count:auditLogs.length},
                  {id:"approvals",label:"审批管理",count:pendingApprovals.length},
                  {id:"feishu",label:"飞书配置"},
                ]} active={settingsTab} onChange={setSettingsTab} />

                {/* 场地管理 */}
                {settingsTab==="venues"&&<div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Tabs tabs={[{id:"ALL",label:"全部"},{id:"BANQUET",label:"宴会厅"},{id:"MEETING",label:"会议室"},{id:"PRIVATE",label:"包厢"}]} active={venueSettingsFilter} onChange={setVenueSettingsFilter} />
                    {hasPermission("venue_manage")&&<Button variant="primary" size="sm" onClick={()=>{setEditingVenue(null);setShowVenueForm(true)}}>+ 新增场地</Button>}
                  </div>
                  <div className="space-y-2">{venues.filter(v=>venueSettingsFilter==="ALL"||v.type===venueSettingsFilter).map(v=><Card key={v.id} className={cn("p-3 sm:p-4",v.status==="inactive"&&"opacity-60")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">{v.img?<img src={v.img} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">{v.type==="BANQUET"?"🏛️":v.type==="MEETING"?"💼":"🍽️"}</div>}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5"><h4 className="font-semibold text-sm">{v.name}</h4><Badge className={v.status==="active"?"bg-green-100 text-green-700 border-green-300":"bg-gray-100 text-gray-500 border-gray-300"}>{v.status==="active"?"启用":"停用"}</Badge><Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">{VENUE_TYPES[v.type]}</Badge></div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500"><span>{v.floor}</span><span>·</span><span>{v.capacity}人</span><span>·</span><span>{v.pricePerTable?`¥${v.pricePerTable}/桌`:v.halfDayRate?`¥${v.halfDayRate}/半天`:v.minSpend?`¥${v.minSpend}起`:""}</span></div>
                          {v.description&&<p className="text-xs text-gray-400 mt-0.5 truncate">{v.description}</p>}
                        </div>
                      </div>
                      {hasPermission("venue_manage")&&<div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" onClick={()=>{setEditingVenue(v);setShowVenueForm(true)}}>✏️</Button>
                        <Button variant="ghost" size="sm" onClick={()=>handleToggleVenue(v)}>{v.status==="active"?"⏸️":"▶️"}</Button>
                        <Button variant="ghost" size="sm" onClick={()=>setConfirmDialog({open:true,title:"确认删除",message:`确定要删除场地「${v.name}」吗？此操作不可撤销。`,onConfirm:()=>handleDeleteVenue(v)})} className="text-red-500">🗑️</Button>
                      </div>}
                    </div>
                  </Card>)}</div>
                </div>}

                {/* 用户权限管理 */}
                {settingsTab==="users"&&<div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">用户列表</h3>
                    {hasPermission("user_manage")&&<Button variant="primary" size="sm" onClick={()=>{setEditingUser(null);setShowUserForm(true)}}>+ 新增用户</Button>}
                  </div>
                  <div className="space-y-2">{users.map(u=>{const role=roles.find(r=>r.id===u.role);const dept=DEPARTMENTS.find(d=>d.id===u.dept);return<Card key={u.id} className={cn("p-3 sm:p-4",u.status==="disabled"&&"opacity-60")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{u.avatar}</div><div><div className="flex items-center gap-1.5"><h4 className="font-semibold text-sm">{u.name}</h4><Badge className={role?.color}>{role?.name}</Badge>{u.status==="disabled"&&<Badge className="bg-gray-100 text-gray-500 border-gray-300">已停用</Badge>}</div><div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500"><span>{dept?.icon} {dept?.name}</span><span>·</span><span>{u.phone}</span></div></div></div>
                      {hasPermission("user_manage")&&<div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" onClick={()=>{setEditingUser(u);setShowUserForm(true)}}>✏️</Button>
                      </div>}
                    </div>
                  </Card>})}</div>
                  <Card className="p-3 sm:p-4"><h3 className="text-sm font-semibold mb-3">角色权限矩阵</h3><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-gray-50"><th className="px-2 py-2 text-left border-b">权限</th>{roles.map(r=><th key={r.id} className="px-2 py-2 text-center border-b">{r.name}</th>)}</tr></thead><tbody>{PERMISSIONS.map(p=><tr key={p.id} className="border-b border-gray-100"><td className="px-2 py-1.5"><span className="font-medium">{p.label}</span><span className="text-gray-400 ml-1">{p.desc}</span></td>{roles.map(r=><td key={r.id} className="px-2 py-1.5 text-center">{r.permissions.includes(p.id)?<span className="text-green-500 text-base">✓</span>:<span className="text-gray-300">—</span>}</td>)}</tr>)}</tbody></table></div></Card>
                </div>}

                {/* 操作日志 */}
                {settingsTab==="logs"&&<div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Tabs tabs={[{id:"all",label:"全部"},{id:"VENUE",label:"场地"},{id:"BOOKING",label:"预订"},{id:"USER",label:"用户"}]} active={logFilter} onChange={setLogFilter} />
                    <span className="text-xs text-gray-400">共 {auditLogs.length} 条记录</span>
                  </div>
                  <div className="space-y-1">{auditLogs.filter(l=>{if(logFilter==="all")return true;return l.action.startsWith(logFilter);}).map(l=>{
                    const ac=LOG_ACTIONS[l.action]||l.action;
                    const isVenue=l.action.startsWith("VENUE");const isBooking=l.action.startsWith("BOOKING");const isUser=l.action.startsWith("USER");
                    const tagColor=isVenue?"bg-blue-50 text-blue-700 border-blue-200":isBooking?"bg-green-50 text-green-700 border-green-200":isUser?"bg-purple-50 text-purple-700 border-purple-200":"bg-gray-50 text-gray-700 border-gray-200";
                    return<div key={l.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">{l.userName?.[0]}</div>
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><span className="text-sm font-medium text-gray-800">{l.userName}</span><Badge className={tagColor}>{ac}</Badge><span className="text-xs text-gray-400">{l.target}</span></div><p className="text-xs text-gray-600 mt-0.5">{l.details}</p><p className="text-[10px] text-gray-400 mt-0.5">{l.timestamp}</p></div>
                    </div>
                  })}</div>
                </div>}

                {/* 审批管理 */}
                {settingsTab==="approvals"&&<div className="space-y-3">
                  <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">预订变更审批</h3><span className="text-xs text-gray-400">待审批: {pendingApprovals.length}</span></div>
                  {approvals.length===0?<div className="text-center py-12 text-gray-400 text-sm">暂无审批记录</div>:
                  <div className="space-y-2">{approvals.map(a=>{
                    const statusMap={pending:{label:"待审批",color:"bg-amber-100 text-amber-700 border-amber-300"},approved:{label:"已通过",color:"bg-green-100 text-green-700 border-green-300"},rejected:{label:"已驳回",color:"bg-red-100 text-red-700 border-red-300"}};
                    const st=statusMap[a.status]||statusMap.pending;
                    return<Card key={a.id} className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><span className="text-xs text-gray-400">{a.bookingNumber}</span><Badge className={st.color}>{st.label}</Badge>{a.feishuApprovalId&&<Badge className="bg-blue-50 text-blue-700 border-blue-200">飞书 {a.feishuApprovalId}</Badge>}</div><p className="text-sm font-medium text-gray-800 mt-1">{a.requesterName} 申请变更</p>{a.reason&&<p className="text-xs text-gray-600 mt-0.5">原因: {a.reason}</p>}
                        {a.changes&&Object.entries(a.changes).length>0&&<div className="mt-2 space-y-1">{Object.entries(a.changes).map(([field,{old:o,new:n}])=><div key={field} className="flex items-center gap-2 text-xs"><span className="text-gray-500 min-w-[4rem]">{field}</span><span className="text-red-500 line-through">{typeof o==="number"?formatMoney(o):o}</span><span className="text-gray-400">→</span><span className="text-green-600 font-medium">{typeof n==="number"?formatMoney(n):n}</span></div>)}</div>}
                        <p className="text-[10px] text-gray-400 mt-1">{a.createdAt}</p></div>
                        {a.status==="pending"&&hasPermission("approval_manage")&&<div className="flex flex-col gap-1.5 shrink-0"><Button variant="success" size="sm" onClick={()=>handleApproveBooking(a.id,true)}>✅ 通过</Button><Button variant="danger" size="sm" onClick={()=>handleApproveBooking(a.id,false)}>❌ 驳回</Button></div>}
                      </div>
                    </Card>
                  })}</div>}
                </div>}

                {/* 飞书配置 */}
                {settingsTab==="feishu"&&<div className="space-y-4">
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">飞书</div><div><h3 className="text-base font-semibold">飞书开放平台集成</h3><p className="text-xs text-gray-500">配置飞书应用凭证，启用消息推送和审批流程</p></div></div>
                    <div className="space-y-3">
                      <Toggle checked={feishuConfig.enabled} onChange={v=>setFeishuConfig(p=>({...p,enabled:v}))} label="启用飞书集成" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input label="App ID" value={feishuConfig.appId} onChange={v=>setFeishuConfig(p=>({...p,appId:v}))} placeholder="cli_xxxxxxxxxx" />
                        <Input label="App Secret" value={feishuConfig.appSecret} onChange={v=>setFeishuConfig(p=>({...p,appSecret:v}))} placeholder="xxxxxxxxxxxxxxxx" type="password" />
                      </div>
                      <Input label="Webhook URL (机器人)" value={feishuConfig.webhookUrl} onChange={v=>setFeishuConfig(p=>({...p,webhookUrl:v}))} placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxx" />
                      <Input label="审批应用编码" value={feishuConfig.approvalCode} onChange={v=>setFeishuConfig(p=>({...p,approvalCode:v}))} placeholder="审批流程的 approval_code" />
                      <Input label="机器人名称" value={feishuConfig.botName} onChange={v=>setFeishuConfig(p=>({...p,botName:v}))} />
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={()=>{setFeishuConfig(p=>({...p,lastTest:nowTimestamp(),testResult:"success"}))}}>🔗 测试连接</Button>
                          {feishuConfig.lastTest&&<span className={cn("text-xs",feishuConfig.testResult==="success"?"text-green-600":"text-red-600")}>最近测试: {feishuConfig.lastTest} {feishuConfig.testResult==="success"?"✓ 成功":"✗ 失败"}</span>}
                        </div>
                        <Button variant="primary" size="sm" onClick={()=>handleSaveFeishuConfig(feishuConfig)}>💾 保存配置</Button>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-sm font-semibold mb-3">飞书 MCP 能力说明</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{[
                      {icon:"📨",title:"消息推送",desc:"预订创建/变更时自动推送到指定群组"},
                      {icon:"✅",title:"审批流程",desc:"预订变更触发飞书审批，审批结果实时回传"},
                      {icon:"🤖",title:"机器人互动",desc:"销售可通过飞书与AI助手交互查询"},
                      {icon:"📊",title:"卡片消息",desc:"发送富文本卡片消息，支持按钮交互"},
                      {icon:"📎",title:"文件传输",desc:"EO通知单、确认函自动发送"},
                      {icon:"🔔",title:"事件订阅",desc:"订阅飞书事件，如审批完成回调"},
                    ].map((f,i)=><div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100"><div className="flex items-center gap-2 mb-1"><span>{f.icon}</span><span className="text-sm font-medium">{f.title}</span></div><p className="text-xs text-gray-500">{f.desc}</p></div>)}</div>
                  </Card>
                </div>}
              </div>}

            </div>

            {/* AI Panel - Desktop sidebar */}
            {showAI&&<div className="hidden lg:block w-96 shrink-0"><AIChatPanel bookings={bookings} venues={venues} onClose={()=>setShowAI(false)} /></div>}
          </div>
        </main>

        {/* AI Panel - Mobile bottom sheet */}
        {showAI&&<div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={()=>setShowAI(false)}><div className="absolute bottom-0 left-0 right-0 h-[75vh] bg-white rounded-t-2xl" onClick={e=>e.stopPropagation()}><AIChatPanel bookings={bookings} venues={venues} onClose={()=>setShowAI(false)} /></div></div>}

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-gray-200 h-14 shrink-0 px-1">
          {NAV.slice(0,5).map(item=><button key={item.id} onClick={()=>nav(item.id)} className={cn("flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0", page===item.id?"text-indigo-600":"text-gray-400")}><span className="text-base">{item.icon}</span><span className="text-[10px] truncate">{item.label}</span></button>)}
          <button onClick={()=>nav("settings")} className={cn("flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0 relative", page==="settings"?"text-indigo-600":"text-gray-400")}><span className="text-base">⚙️</span><span className="text-[10px]">设置</span>{pendingApprovals.length>0&&<span className="absolute -top-0.5 right-0 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">{pendingApprovals.length}</span>}</button>
        </nav>
      </div>

      {/* Modals */}
      <BookingDetailModal booking={selectedBooking} venues={venues} tasks={tasks} open={showDetail} onClose={()=>setShowDetail(false)} onForwardFeishu={b=>{setFeishuData(b);setFeishuType("event");setShowFeishu(true)}} onForwardWeChat={b=>{setSelectedBooking(b);setShowWeChat(true)}} onGenerateEO={b=>{setSelectedBooking(b);setShowEO(true)}} onEdit={b=>{setEditingBooking(b);setShowDetail(false);setShowEditBooking(true)}} hasPermission={hasPermission} />
      <CreateBookingModal open={showCreateBooking} onClose={()=>{setShowCreateBooking(false);setPrefill(null)}} onSave={handleCreateBooking} venues={venues} bookings={bookings} prefill={prefill} />
      <EditBookingModal open={showEditBooking} onClose={()=>setShowEditBooking(false)} booking={editingBooking} venues={venues} bookings={bookings} onSave={()=>{}} onRequestApproval={handleRequestBookingApproval} />
      <BookingEditApprovalModal open={showApprovalDialog} onClose={()=>{setShowApprovalDialog(false);setPendingBookingEdit(null)}} booking={pendingBookingEdit} originalBooking={pendingBookingEdit?bookings.find(b=>b.id===pendingBookingEdit.id):null} onSubmit={handleSubmitApproval} feishuConfig={feishuConfig} />
      <RoomBookingModal open={showCreateRoom} onClose={()=>setShowCreateRoom(false)} onSave={r=>setRoomBookings(p=>[...p,r])} />
      <EOPreviewModal booking={selectedBooking} venues={venues} open={showEO} onClose={()=>setShowEO(false)} />
      <WeChatRichCardModal booking={selectedBooking} venues={venues} open={showWeChat} onClose={()=>setShowWeChat(false)} />
      <FeishuForwardModal booking={feishuData} venues={venues} open={showFeishu} onClose={()=>setShowFeishu(false)} type={feishuType} />
      <VenueFormModal open={showVenueForm} onClose={()=>{setShowVenueForm(false);setEditingVenue(null)}} onSave={handleSaveVenue} venue={editingVenue} />
      <UserFormModal open={showUserForm} onClose={()=>{setShowUserForm(false);setEditingUser(null)}} onSave={handleSaveUser} user={editingUser} roles={roles} />
      <ConfirmDialog {...confirmDialog} onClose={()=>setConfirmDialog({open:false})} />
    </div>
  );
}