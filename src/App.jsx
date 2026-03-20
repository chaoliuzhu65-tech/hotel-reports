import React, { useState, useEffect, useMemo, useRef } from "react";
import _ from "lodash";

// ==================== 数据模型与常量 ====================
const HOTEL_INFO = { name: "天津开元酒店", group: "德胧集团", code: "TJKY" };
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

const SAMPLE_VENUES = [
  { id: "v1", name: "开元厅", type: "BANQUET", floor: "5F", capacity: 200, pricePerTable: 3088, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v2", name: "滨海厅", type: "BANQUET", floor: "5F", capacity: 80, pricePerTable: 2888, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v3", name: "海河厅", type: "BANQUET", floor: "3F", capacity: 120, pricePerTable: 2688, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v4", name: "一号会议室", type: "MEETING", floor: "5F", capacity: 50, halfDayRate: 2500, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v5", name: "二号会议室", type: "MEETING", floor: "5F", capacity: 30, halfDayRate: 1800, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v6", name: "三号会议室", type: "MEETING", floor: "5F", capacity: 20, halfDayRate: 1200, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v7", name: "四号会议室", type: "MEETING", floor: "5F", capacity: 50, halfDayRate: 2500, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v8", name: "贵宾厅", type: "MEETING", floor: "6F", capacity: 15, halfDayRate: 3000, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v9", name: "牡丹包厢", type: "PRIVATE", floor: "2F", capacity: 12, minSpend: 2000, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v10", name: "芙蓉包厢", type: "PRIVATE", floor: "2F", capacity: 10, minSpend: 1800, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v11", name: "兰花包厢", type: "PRIVATE", floor: "2F", capacity: 8, minSpend: 1500, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v12", name: "竹韵包厢", type: "PRIVATE", floor: "2F", capacity: 14, minSpend: 2500, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v13", name: "梅苑包厢", type: "PRIVATE", floor: "2F", capacity: 10, minSpend: 1800, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v14", name: "荷风包厢", type: "PRIVATE", floor: "2F", capacity: 8, minSpend: 1500, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v15", name: "松涛包厢", type: "PRIVATE", floor: "3F", capacity: 16, minSpend: 3000, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v16", name: "菊香包厢", type: "PRIVATE", floor: "3F", capacity: 10, minSpend: 1800, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v17", name: "VIP1", type: "PRIVATE", floor: "6F", capacity: 20, minSpend: 5000, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v18", name: "VIP2", type: "PRIVATE", floor: "6F", capacity: 16, minSpend: 4000, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v19", name: "五号会议室", type: "MEETING", floor: "3F", capacity: 100, halfDayRate: 3500, timeSlots: DEFAULT_TIME_SLOTS },
  { id: "v20", name: "六号会议室", type: "MEETING", floor: "3F", capacity: 40, halfDayRate: 2000, timeSlots: DEFAULT_TIME_SLOTS },
];

const today = new Date();
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const todayStr = fmt(today);

const SAMPLE_BOOKINGS = [
  { id: "b001", number: "EO-2026-0320-001", type: "MEETING", venueId: "v7", date: todayStr, timeSlotId: "afternoon", status: "CONFIRMED", eventName: "2026天津郊区县内分泌代谢会议", organizer: "诺和诺德", contactName: "朱女士", contactPhone: "13800138000", expectedAttendance: 50, guaranteedAttendance: 40, salesPerson: "夏美娟", salesPhone: "13802134933", totalAmount: 2500, paymentStatus: "UNPAID", paymentTerms: "现付", setupStyle: "课桌式", equipment: ["音响","麦克风","LED大屏"], notes: "13:30签到，提供纸笔矿泉水薄荷糖", linkedVenues: [{ venueId: "v2", timeSlotId: "afternoon", purpose: "沙发休息区", attendance: 8 }], departments: [{ deptId: "marketing", tasks: "大堂LCD显示、指引牌、门牌" },{ deptId: "engineering", tasks: "安装麦克风及音响设备" },{ deptId: "security", tasks: "车辆疏导" },{ deptId: "finance", tasks: "现结" }], createdAt: todayStr, updatedAt: todayStr },
  { id: "b002", number: "EO-2026-0321-001", type: "WEDDING", venueId: "v1", date: fmt(new Date(today.getTime()+86400000)), timeSlotId: "noon", status: "CONFIRMED", eventName: "刘磊先生 韩旭雯女士 喜结良缘", organizer: "婚宴", contactName: "刘磊", contactPhone: "13900139000", expectedAttendance: 150, guaranteedAttendance: 130, salesPerson: "李勋", salesPhone: "13800000000", totalAmount: 40144, paymentStatus: "PAID", paymentTerms: "全款付清", setupStyle: "桌餐", tableCount: 13, pricePerTable: 3088, equipment: ["舞台","音响","投影"], notes: "早上8点开门，13备2桌，果粒橙可乐青岛畅饮，每桌赠一盘喜糖", linkedVenues: [{ venueId: "v2", timeSlotId: "noon", purpose: "桌餐溢出", attendance: 30 }], roomBookings: [{ roomType: "海河套房（婚房）", count: 1, nights: 1, rate: 0, checkIn: todayStr, checkOut: fmt(new Date(today.getTime()+86400000)), notes: "免费婚房，布置鲜花水果巧克力" }], departments: [{ deptId: "frontdesk", tasks: "婚房7:00前布置完毕，LCD屏7:00播放" },{ deptId: "marketing", tasks: "LCD显示屏、指示牌、水牌" },{ deptId: "fb", tasks: "13备2桌，签到台1个，客人自带酒水" },{ deptId: "finance", tasks: "已全款付清" },{ deptId: "security", tasks: "车辆指引" }], createdAt: todayStr, updatedAt: todayStr },
  { id: "b003", number: "EO-2026-0320-002", type: "PRIVATE_DINING", venueId: "v9", date: todayStr, timeSlotId: "evening", status: "CONFIRMED", eventName: "张总商务宴请", organizer: "张伟", contactName: "张伟", contactPhone: "13700137000", expectedAttendance: 10, guaranteedAttendance: 10, salesPerson: "王丽", salesPhone: "13800000001", totalAmount: 3880, paymentStatus: "UNPAID", paymentTerms: "签单", notes: "VIP客人，需准备特殊菜品", departments: [{ deptId: "fb", tasks: "定制菜单，配高端酒水" }], createdAt: todayStr, updatedAt: todayStr },
  { id: "b004", number: "EO-2026-0322-001", type: "MEETING", venueId: "v4", date: fmt(new Date(today.getTime()+2*86400000)), timeSlotId: "morning", status: "TENTATIVE", eventName: "德胧集团季度经营分析会", organizer: "德胧集团", contactName: "李明", contactPhone: "13600136000", expectedAttendance: 30, guaranteedAttendance: 25, salesPerson: "夏美娟", salesPhone: "13802134933", totalAmount: 4000, paymentStatus: "UNPAID", paymentTerms: "月结", setupStyle: "U型", equipment: ["投影","视频会议系统"], notes: "需提前测试视频会议设备", departments: [{ deptId: "engineering", tasks: "视频会议设备调试" },{ deptId: "fb", tasks: "茶歇服务" }], createdAt: todayStr, updatedAt: todayStr },
  { id: "b005", number: "EO-2026-0320-003", type: "BANQUET", venueId: "v3", date: todayStr, timeSlotId: "evening", status: "CONFIRMED", eventName: "天津市企业家协会年会晚宴", organizer: "天津市企业家协会", contactName: "赵秘书长", contactPhone: "13500135000", expectedAttendance: 100, guaranteedAttendance: 80, salesPerson: "李勋", salesPhone: "13800000000", totalAmount: 58000, paymentStatus: "PARTIAL", paymentTerms: "预付50%", setupStyle: "桌餐", tableCount: 10, pricePerTable: 2688, equipment: ["舞台","音响","LED屏"], notes: "需红地毯迎宾，VIP席位标识", roomBookings: [{ roomType: "豪华大床房", count: 5, nights: 1, rate: 680, checkIn: todayStr, checkOut: fmt(new Date(today.getTime()+86400000)) },{ roomType: "行政套房", count: 2, nights: 1, rate: 1280, checkIn: todayStr, checkOut: fmt(new Date(today.getTime()+86400000)) }], departments: [{ deptId: "frontdesk", tasks: "VIP接待，行政楼层安排" },{ deptId: "marketing", tasks: "LED屏幕、欢迎横幅、指引" },{ deptId: "fb", tasks: "10桌桌餐+酒水" },{ deptId: "security", tasks: "VIP通道安保" },{ deptId: "finance", tasks: "预付50%，余款活动当天结" }], createdAt: todayStr, updatedAt: todayStr },
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
  { id: "t004", bookingId: "b005", deptId: "fb", assignee: "宴会经理-刘强", task: "10桌桌餐准备+红地毯迎宾", deadline: todayStr+" 16:00", status: "IN_PROGRESS", feedback: "菜品已确认，正在备料", photos: [] },
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

const AI_SUGGESTIONS = {
  pricing: (b) => b.type === "WEDDING" ? `💡 AI建议: 婚宴${b.tableCount}桌，建议赠送婚房+迎宾红地毯` : b.type === "MEETING" ? `💡 AI建议: 会议${b.expectedAttendance}人，建议搭配茶歇(¥45/人)，增收¥${b.expectedAttendance*45}` : `💡 AI建议: 该时段平均消费¥${Math.round(Math.random()*10000+5000)}`,
  upsell: () => ["🔥 热门搭配: 会后鸡尾酒会(18:00-20:00)，接受率72%","📊 数据洞察: 同类活动追加用房率65%，建议推荐协议房价","🎯 智能提醒: 该客户上次消费¥38,000，可推荐升级方案","⭐ 增值服务: LED欢迎屏+定制水牌套餐仅需加收¥800"][Math.floor(Math.random()*4)],
  conflict: (date, vid, sid, bks) => { const c = bks.filter(b => b.date===date && b.venueId===vid && b.timeSlotId===sid && b.status!=="CANCELLED"); return c.length > 0 ? `⚠️ 冲突: ${date} 该场地已有「${c[0].eventName}」` : null; },
};

// ==================== 通用组件 ====================
const Badge = ({ children, className }) => <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", className)}>{children}</span>;

const Button = ({ children, onClick, variant = "primary", size = "md", className, disabled }) => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none active:scale-95";
  const v = { primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm", secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50", success: "bg-emerald-600 text-white hover:bg-emerald-700", danger: "bg-red-600 text-white hover:bg-red-700", ghost: "text-gray-600 hover:bg-gray-100", ai: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm" };
  const s = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return <button onClick={onClick} disabled={disabled} className={cn(base, v[variant], s[size], disabled && "opacity-50 cursor-not-allowed", className)}>{children}</button>;
};

const Card = ({ children, className, onClick }) => <div onClick={onClick} className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", onClick && "cursor-pointer hover:shadow-md transition-shadow", className)}>{children}</div>;

const Input = ({ label, value, onChange, type = "text", placeholder, className, required }) => (
  <div className={cn("flex flex-col gap-1", className)}>
    {label && <label className="text-xs font-medium text-gray-600">{label}{required && <span className="text-red-500">*</span>}</label>}
    <input type={type} value={value||""} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
  </div>
);

const Select = ({ label, value, onChange, options, className }) => (
  <div className={cn("flex flex-col gap-1", className)}>
    {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
    <select value={value||""} onChange={e => onChange(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
  </div>
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
      <button key={t.id} onClick={() => onChange(t.id)} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap", active === t.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>{t.label}</button>
    ))}
  </div>
);

const StatCard = ({ label, value, sub, icon, color = "indigo" }) => {
  const cm = { indigo: { t: "text-indigo-700", b: "bg-indigo-50" }, green: { t: "text-green-700", b: "bg-green-50" }, violet: { t: "text-violet-700", b: "bg-violet-50" }, red: { t: "text-red-700", b: "bg-red-50" }, yellow: { t: "text-yellow-700", b: "bg-yellow-50" } };
  const c = cm[color] || cm.indigo;
  return <Card className="p-3 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] sm:text-xs text-gray-500 font-medium">{label}</p><p className={`text-lg sm:text-2xl font-bold mt-0.5 ${c.t}`}>{value}</p>{sub && <p className="text-[10px] text-gray-400">{sub}</p>}</div><div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl ${c.b}`}>{icon}</div></div></Card>;
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
      if (l.includes("可用") || l.includes("空") || l.includes("查询")) { const av = venues.filter(v => !bookings.some(b => b.date===todayStr && b.venueId===v.id && b.status!=="CANCELLED")); r = `📋 今日可用场地：\n\n` + av.slice(0,8).map(v => `• ${v.name} (${v.floor}, ${v.capacity}人)`).join("\n") + `\n\n共${av.length}个可预订`; }
      else if (l.includes("婚宴") || l.includes("婚礼")) r = `💒 婚宴场地推荐：\n\n🥇 开元厅 (5F) - 200人，¥3,088/桌\n🥈 海河厅 (3F) - 120人，¥2,688/桌\n🥉 滨海厅 (5F) - 80人，¥2,888/桌`;
      else if (l.includes("今天") || l.includes("今日")) { const tb = bookings.filter(b => b.date===todayStr && b.status!=="CANCELLED"); r = `📊 今日${tb.length}场活动，总额${formatMoney(tb.reduce((s,b)=>s+b.totalAmount,0))}\n\n` + tb.map(b => `• ${b.eventName} | ${venues.find(v=>v.id===b.venueId)?.name} | ${formatMoney(b.totalAmount)}`).join("\n"); }
      else if (l.includes("报告") || l.includes("分析")) { const t = bookings.filter(b=>b.status!=="CANCELLED").reduce((s,b)=>s+b.totalAmount,0); r = `📈 销售分析：\n\n💰 总额: ${formatMoney(t)}\n📋 ${bookings.length}笔\n✅ 已确认${bookings.filter(b=>b.status==="CONFIRMED").length}笔`; }
      else r = `关于"${userMsg}"：\n\n本月场地使用率约78%\n热门时段：晚间(64%)\n建议关注午间时段开发`;
      setMessages(p => [...p, { role: "ai", content: r }]);
    }, 500);
  };
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages]);
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-50/50 to-white rounded-xl border border-indigo-100">
      <div className="px-4 py-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">🤖</div><div><h4 className="text-sm font-semibold text-white">德胧AI预订助手</h4><p className="text-xs text-indigo-200">AI Native · 智能预订</p></div></div>
        {onClose && <button onClick={onClose} className="text-white/70 hover:text-white text-lg">&times;</button>}
      </div>
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{maxHeight: "50vh"}}>
        {messages.map((m, i) => <div key={i} className={cn("flex", m.role==="user"?"justify-end":"justify-start")}><div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap", m.role==="user"?"bg-indigo-600 text-white rounded-br-sm":"bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm")}>{m.content}</div></div>)}
      </div>
      <div className="p-3 border-t border-indigo-100">
        <div className="flex gap-1.5 mb-2 flex-wrap">{["今日预订","查询可用","婚宴推荐","销售分析"].map(q => <button key={q} onClick={()=>setInput(q)} className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100">{q}</button>)}</div>
        <div className="flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} placeholder="输入问题..." className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /><Button onClick={handleSend} variant="ai" size="sm">发送</Button></div>
      </div>
    </div>
  );
};

// ==================== 场地日历 ====================
const VenueCalendarGrid = ({ date, venues, bookings, onCellClick, onBookingClick, venueFilter }) => {
  const filtered = venueFilter==="ALL" ? venues : venues.filter(v => v.type===venueFilter);
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

// ==================== 预订详情 ====================
const BookingDetailModal = ({ booking: b, venues, tasks, open, onClose, onForwardFeishu, onForwardWeChat, onGenerateEO }) => {
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
        <Button variant="ai" size="sm" onClick={()=>onGenerateEO(b)}>📋 EO通知单</Button>
        <Button variant="primary" size="sm" onClick={()=>onForwardFeishu(b)}>💬 飞书转发</Button>
        <Button variant="success" size="sm" onClick={()=>onForwardWeChat(b)}>📱 微信确认函</Button>
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
      <Select label="场地" value={f.venueId} onChange={v=>u("venueId",v)} options={[{value:"",label:"请选择"},...venues.map(v=>({value:v.id,label:`${v.name}(${v.floor})`}))]} />
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
    <div className="flex flex-wrap justify-end gap-2 mt-3"><Button variant="ai" size="sm">🤖 AI优化</Button><Button variant="primary" size="sm">💬 发布飞书</Button><Button variant="success" size="sm">🖨️ 打印</Button></div>
  </Modal>;
};

// ==================== 微信H5确认函 ====================
const WeChatConfirmModal = ({ booking: b, venues, open, onClose }) => {
  if(!b||!open) return null;
  const v=venues.find(x=>x.id===b.venueId), sl=DEFAULT_TIME_SLOTS.find(x=>x.id===b.timeSlotId);
  return <Modal open={open} onClose={onClose} title="微信确认函 (H5)" width="max-w-md">
    <div className="bg-gradient-to-b from-indigo-900 to-indigo-800 rounded-2xl p-5 text-white mx-auto max-w-[375px]">
      <div className="text-center mb-5"><div className="w-14 h-14 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center text-2xl">🏨</div><h3 className="text-lg font-bold">{HOTEL_INFO.name}</h3><p className="text-indigo-200 text-xs">{HOTEL_INFO.group}</p></div>
      <div className="bg-white/10 rounded-xl p-4 mb-3"><h4 className="text-center font-bold mb-3 text-indigo-100">预订确认函</h4><div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-indigo-300">活动</span><span className="font-medium text-right max-w-[60%] truncate">{b.eventName}</span></div>
        <div className="flex justify-between"><span className="text-indigo-300">日期</span><span>{b.date}</span></div>
        <div className="flex justify-between"><span className="text-indigo-300">时间</span><span>{sl?.label} {sl?.start}-{sl?.end}</span></div>
        <div className="flex justify-between"><span className="text-indigo-300">场地</span><span>{v?.name}</span></div>
        <div className="flex justify-between"><span className="text-indigo-300">人数</span><span>{b.guaranteedAttendance}人</span></div>
        {b.tableCount&&<div className="flex justify-between"><span className="text-indigo-300">桌数</span><span>{b.tableCount}桌</span></div>}
        <div className="flex justify-between"><span className="text-indigo-300">金额</span><span className="text-xl font-bold text-yellow-300">{formatMoney(b.totalAmount)}</span></div>
      </div></div>
      <div className="bg-white/10 rounded-xl p-3 mb-3"><h5 className="text-xs text-indigo-300 mb-2">专属销售顾问</h5><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">{b.salesPerson?.[0]}</div><div><p className="font-medium text-sm">{b.salesPerson}</p><p className="text-xs text-indigo-300">{b.salesPhone}</p></div></div></div>
      <p className="text-center text-xs text-indigo-400 mt-3">—— {HOTEL_INFO.group} · {HOTEL_INFO.name} ——</p>
    </div>
    <div className="flex justify-center gap-2 mt-3"><Button variant="success" size="sm">📱 发送微信</Button><Button variant="secondary" size="sm">📋 复制链接</Button></div>
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
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState(SAMPLE_BOOKINGS);
  const [roomBookings, setRoomBookings] = useState(SAMPLE_ROOM_BOOKINGS);
  const [tasks] = useState(SAMPLE_TASKS);
  const [venues] = useState(SAMPLE_VENUES);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [venueFilter, setVenueFilter] = useState("ALL");
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

  const todayBk = bookings.filter(b => b.date===todayStr && b.status!=="CANCELLED");
  const confirmed = bookings.filter(b => b.status==="CONFIRMED");
  const totalRev = bookings.filter(b => b.status!=="CANCELLED").reduce((s,b)=>s+(b.totalAmount||0),0);
  const pendingT = tasks.filter(t => t.status==="PENDING"||t.status==="IN_PROGRESS");

  const filtered = useMemo(()=>{
    let r=bookings;
    if(bookingStatusFilter!=="all") r=r.filter(b=>b.status===bookingStatusFilter);
    if(!searchQuery) return r;
    const q=searchQuery.toLowerCase();
    return r.filter(b=>b.eventName?.toLowerCase().includes(q)||b.organizer?.toLowerCase().includes(q)||b.contactName?.toLowerCase().includes(q)||b.salesPerson?.toLowerCase().includes(q)||b.number?.toLowerCase().includes(q));
  },[bookings,bookingStatusFilter,searchQuery]);

  const nav = (id) => { setPage(id); setSidebarOpen(false); };
  const NAV = [{id:"dashboard",icon:"📊",label:"工作台"},{id:"calendar",icon:"📅",label:"场地日历"},{id:"bookings",icon:"📋",label:"预订管理"},{id:"rooms",icon:"🛏️",label:"客房预订"},{id:"kanban",icon:"📌",label:"跟单看板"},{id:"reports",icon:"📈",label:"数据分析"}];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans" style={{height:"100dvh"}}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={()=>setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={cn("fixed lg:static inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0", sidebarOpen?"translate-x-0":"-translate-x-full")}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold">德</div><div><h1 className="text-sm font-bold text-gray-900">德胧预订管理</h1><p className="text-[10px] text-gray-400">AI Native · {HOTEL_INFO.name}</p></div></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">{NAV.map(item=><button key={item.id} onClick={()=>nav(item.id)} className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all", page===item.id?"bg-indigo-50 text-indigo-700 font-semibold":"text-gray-600 hover:bg-gray-50")}><span>{item.icon}</span><span>{item.label}</span>{item.id==="kanban"&&pendingT.length>0&&<span className="ml-auto text-[10px] bg-red-100 text-red-600 rounded-full px-1.5">{pendingT.length}</span>}</button>)}</nav>
        <div className="p-3 border-t border-gray-100"><button onClick={()=>{setShowAI(p=>!p);setSidebarOpen(false)}} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-700 hover:to-indigo-700 shadow-sm"><span>🤖</span><span>AI 助手</span></button></div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-12 sm:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={()=>setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
            <h2 className="text-sm sm:text-base font-semibold">{NAV.find(n=>n.id===page)?.icon} {NAV.find(n=>n.id===page)?.label}</h2>
            <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">{todayStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="🔍 搜索..." className="hidden sm:block px-3 py-1.5 text-sm border border-gray-200 rounded-lg w-48 lg:w-64 focus:ring-2 focus:ring-indigo-500 outline-none" />
            <Button variant="primary" size="sm" onClick={()=>setShowCreateBooking(true)} className="hidden sm:inline-flex">+ 新建预订</Button>
            <Button variant="secondary" size="sm" onClick={()=>setShowCreateRoom(true)} className="hidden sm:inline-flex">+ 客房</Button>
            <button onClick={()=>setShowCreateBooking(true)} className="sm:hidden w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg shadow-lg">+</button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="flex gap-6">
            <div className={cn("transition-all min-w-0", showAI?"flex-1":"w-full")}>

              {/* Dashboard */}
              {page==="dashboard"&&<div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <StatCard label="今日预订" value={todayBk.length} sub="场活动" icon="📋" color="indigo" />
                  <StatCard label="已确认" value={confirmed.length} sub="笔订单" icon="✅" color="green" />
                  <StatCard label="预订总额" value={formatMoney(totalRev)} icon="💰" color="violet" />
                  <StatCard label="待处理" value={pendingT.length} sub="项工单" icon="📌" color="red" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2"><Card className="p-3 sm:p-4"><div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">今日场地预订</h3><Button variant="ghost" size="sm" onClick={()=>setPage("calendar")}>完整日历→</Button></div><VenueCalendarGrid date={todayStr} venues={venues.slice(0,10)} bookings={bookings} onCellClick={(v,s,d)=>{setPrefill({venueId:v.id,timeSlotId:s.id,date:d});setShowCreateBooking(true)}} onBookingClick={b=>{setSelectedBooking(b);setShowDetail(true)}} venueFilter="ALL" /></Card></div>
                  <div>
                    <MonthCalendar bookings={bookings} onDateSelect={d=>{setSelectedDate(d);setPage("calendar")}} selectedDate={selectedDate} />
                    <Card className="p-3 sm:p-4 mt-4"><h3 className="text-sm font-semibold mb-3">🔥 AI 智能提醒</h3><div className="space-y-2">{[{i:"⚠️",t:"明日婚宴(刘磊先生)婚房需7:00前布置"},{i:"💡",t:"本周三有3个会议室空置，建议推送促销"},{i:"📊",t:"本月宴会收入同比增长12%"},{i:"🎯",t:"协议客户王建国入住中，可推荐餐饮消费"}].map((x,j)=><div key={j} className="flex items-start gap-2 text-xs bg-gray-50 rounded-lg p-2"><span>{x.i}</span><span className="text-gray-700">{x.t}</span></div>)}</div></Card>
                  </div>
                </div>
              </div>}

              {/* Calendar */}
              {page==="calendar"&&<div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2"><button onClick={()=>setSelectedDate(addDays(selectedDate,-1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">◀</button><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg" /><button onClick={()=>setSelectedDate(addDays(selectedDate,1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">▶</button><Button variant="ghost" size="sm" onClick={()=>setSelectedDate(todayStr)}>今天</Button></div>
                  <Tabs tabs={[{id:"ALL",label:"全部"},{id:"BANQUET",label:"宴会厅"},{id:"MEETING",label:"会议室"},{id:"PRIVATE",label:"包厢"}]} active={venueFilter} onChange={setVenueFilter} />
                </div>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 min-w-0"><Card className="overflow-hidden"><VenueCalendarGrid date={selectedDate} venues={venues} bookings={bookings} onCellClick={(v,s,d)=>{setPrefill({venueId:v.id,timeSlotId:s.id,date:d});setShowCreateBooking(true)}} onBookingClick={b=>{setSelectedBooking(b);setShowDetail(true)}} venueFilter={venueFilter} /></Card></div>
                  <div className="w-full lg:w-64 shrink-0">
                    <MonthCalendar bookings={bookings} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
                    <Card className="mt-3 p-3"><h4 className="text-xs font-semibold text-gray-600 mb-2">当日统计</h4>{(()=>{const db=bookings.filter(b=>b.date===selectedDate&&b.status!=="CANCELLED");return<div className="space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-gray-500">预订数</span><span className="font-bold">{db.length}</span></div><div className="flex justify-between"><span className="text-gray-500">总金额</span><span className="font-bold text-indigo-700">{formatMoney(db.reduce((s,b)=>s+b.totalAmount,0))}</span></div><div className="flex justify-between"><span className="text-gray-500">总人次</span><span className="font-bold">{db.reduce((s,b)=>s+b.expectedAttendance,0)}</span></div></div>})()}</Card>
                  </div>
                </div>
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
                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100"><p className="font-medium text-indigo-800 mb-1 text-xs">💡 收入优化</p><p className="text-xs text-gray-600">午间时段使用率仅35%，建议推出"午间商务套餐"</p></div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100"><p className="font-medium text-green-800 mb-1 text-xs">📈 增长机会</p><p className="text-xs text-gray-600">包厢预订30天增长23%，建议开发企业包厢年卡</p></div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><p className="font-medium text-amber-800 mb-1 text-xs">⚠️ 风险预警</p><p className="text-xs text-gray-600">3笔大额预订({'>'}5万)为&quot;部分付&quot;，建议催款</p></div>
                  </div></Card>
                </div>
                <Card className="p-3 sm:p-4"><h3 className="text-sm font-semibold mb-3">近7天趋势</h3><div className="flex items-end gap-1.5 h-28 sm:h-32">{Array.from({length:7},(_,i)=>{const d=addDays(todayStr,i-6),ct=bookings.filter(b=>b.date===d&&b.status!=="CANCELLED").length;return<div key={d} className="flex-1 flex flex-col items-center gap-1"><span className="text-[10px] text-gray-500">{ct}</span><div className="w-full bg-indigo-500 rounded-t-md" style={{height:Math.max(6,ct*25)}}/><span className="text-[10px] text-gray-400">{d.slice(8)}</span></div>})}</div></Card>
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
          <button onClick={()=>setShowAI(p=>!p)} className="flex flex-col items-center gap-0.5 px-2 py-1 text-violet-600"><span className="text-base">🤖</span><span className="text-[10px]">AI</span></button>
        </nav>
      </div>

      {/* Modals */}
      <BookingDetailModal booking={selectedBooking} venues={venues} tasks={tasks} open={showDetail} onClose={()=>setShowDetail(false)} onForwardFeishu={b=>{setFeishuData(b);setFeishuType("event");setShowFeishu(true)}} onForwardWeChat={b=>{setSelectedBooking(b);setShowWeChat(true)}} onGenerateEO={b=>{setSelectedBooking(b);setShowEO(true)}} />
      <CreateBookingModal open={showCreateBooking} onClose={()=>{setShowCreateBooking(false);setPrefill(null)}} onSave={b=>setBookings(p=>[...p,b])} venues={venues} bookings={bookings} prefill={prefill} />
      <RoomBookingModal open={showCreateRoom} onClose={()=>setShowCreateRoom(false)} onSave={r=>setRoomBookings(p=>[...p,r])} />
      <EOPreviewModal booking={selectedBooking} venues={venues} open={showEO} onClose={()=>setShowEO(false)} />
      <WeChatConfirmModal booking={selectedBooking} venues={venues} open={showWeChat} onClose={()=>setShowWeChat(false)} />
      <FeishuForwardModal booking={feishuData} venues={venues} open={showFeishu} onClose={()=>setShowFeishu(false)} type={feishuType} />
    </div>
  );
}
