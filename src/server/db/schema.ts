import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
/* ---------------- helpers ---------------- */
const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const ts = (name: string) =>
  integer(name, { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`);

/* ---------------- companies (multi-tenant) ---------------- */
export const companies = sqliteTable("companies", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  plan: text("plan").default("professional"),
  timezone: text("timezone").default("Asia/Jakarta"),
  logoUrl: text("logo_url"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

/* ---------------- branches ---------------- */
export const branches = sqliteTable("branches", {
  id: id(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  city: text("city"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  radiusMeters: integer("radius_meters").default(100),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: ts("created_at"),
});

/* ---------------- shifts ---------------- */
export const shifts = sqliteTable("shifts", {
  id: id(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // "08:00"
  endTime: text("end_time").notNull(), // "17:00"
  graceMinutes: integer("grace_minutes").default(5),
  type: text("type").default("regular"), // regular|night|flexible
  createdAt: ts("created_at"),
});

/* ---------------- users (auth) ---------------- */
export const users = sqliteTable(
  "users",
  {
    id: id(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("employee"), // super_admin|owner|hr|supervisor|employee
    active: integer("active", { mode: "boolean" }).default(true),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    createdAt: ts("created_at"),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

/* ---------------- employees (profile) ---------------- */
export const employees = sqliteTable(
  "employees",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => branches.id, {
      onDelete: "set null",
    }),
    shiftId: text("shift_id").references(() => shifts.id, {
      onDelete: "set null",
    }),
    employeeCode: text("employee_code").notNull(),
    fullName: text("full_name").notNull(),
    division: text("division"),
    position: text("position"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    faceRegistered: integer("face_registered", { mode: "boolean" }).default(
      false
    ),
    baseSalary: integer("base_salary").default(0),
    // PPh 21: PTKP status — TK/0, TK/1, K/0, K/1, K/2, K/3
    ptkpStatus: text("ptkp_status").default("TK/0"),
    // NPWP — 16 digit. Karyawan tanpa NPWP kena PPh21 + 20%
    npwp: text("npwp"),
    maritalStatus: text("marital_status").default("single"), // single|married|widowed|divorced
    // BPJS JKK risk class (1=lowest 0.24% up to 5=1.74%) — paid by employer
    jkkClass: integer("jkk_class").default(1),
    bankName: text("bank_name"),
    bankAccount: text("bank_account"),
    joinDate: integer("join_date", { mode: "timestamp_ms" }),
    status: text("status").default("active"), // active|leave|inactive
    createdAt: ts("created_at"),
  },
  (t) => ({
    codeIdx: uniqueIndex("employees_code_idx").on(t.employeeCode),
    companyIdx: index("employees_company_idx").on(t.companyId),
  })
);

/* ---------------- attendances ---------------- */
export const attendances = sqliteTable(
  "attendances",
  {
    id: id(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => branches.id),
    date: text("date").notNull(), // YYYY-MM-DD
    checkInAt: integer("check_in_at", { mode: "timestamp_ms" }),
    checkInLat: real("check_in_lat"),
    checkInLng: real("check_in_lng"),
    checkInMethod: text("check_in_method"), // face|qr|manual
    checkInPhotoUrl: text("check_in_photo_url"),
    checkInConfidence: real("check_in_confidence"),
    checkOutAt: integer("check_out_at", { mode: "timestamp_ms" }),
    checkOutLat: real("check_out_lat"),
    checkOutLng: real("check_out_lng"),
    checkOutMethod: text("check_out_method"),
    status: text("status").notNull().default("present"), // present|late|leave|sick|permission|alpha|overtime
    lateMinutes: integer("late_minutes").default(0),
    overtimeMinutes: integer("overtime_minutes").default(0),
    notes: text("notes"),
    createdAt: ts("created_at"),
  },
  (t) => ({
    empDateIdx: uniqueIndex("att_emp_date_idx").on(t.employeeId, t.date),
    companyDateIdx: index("att_company_date_idx").on(t.companyId, t.date),
  })
);

/* ---------------- leaves ---------------- */
export const leaves = sqliteTable("leaves", {
  id: id(),
  employeeId: text("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // annual|sick|permission|emergency
  fromDate: text("from_date").notNull(),
  toDate: text("to_date").notNull(),
  days: integer("days").notNull().default(1),
  reason: text("reason"),
  attachmentUrl: text("attachment_url"),
  status: text("status").notNull().default("pending"), // pending|approved|rejected
  approverId: text("approver_id"),
  approverNote: text("approver_note"),
  approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
  createdAt: ts("created_at"),
});

/* ---------------- leave quotas ---------------- */
export const leaveQuotas = sqliteTable("leave_quotas", {
  id: id(),
  employeeId: text("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // annual|sick|permission|emergency
  total: integer("total").notNull(),
  used: integer("used").notNull().default(0),
  year: integer("year").notNull(),
});

/* ---------------- payrolls ---------------- */
export const payrolls = sqliteTable("payrolls", {
  id: id(),
  employeeId: text("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  period: text("period").notNull(), // YYYY-MM
  baseSalary: integer("base_salary").notNull().default(0),
  allowance: integer("allowance").notNull().default(0),
  overtimePay: integer("overtime_pay").notNull().default(0),
  overtimeHours: integer("overtime_hours").notNull().default(0),
  bonus: integer("bonus").notNull().default(0),
  attendanceDeduction: integer("attendance_deduction").notNull().default(0),
  lateMinutes: integer("late_minutes").notNull().default(0),
  // BPJS — split for transparency on slip
  bpjsKesehatan: integer("bpjs_kesehatan").notNull().default(0),
  bpjsJht: integer("bpjs_jht").notNull().default(0),
  bpjsJp: integer("bpjs_jp").notNull().default(0),
  // Employer share — for company reporting (not subtracted from take-home)
  employerBpjs: integer("employer_bpjs").notNull().default(0),
  // Tax
  taxDeduction: integer("tax_deduction").notNull().default(0),
  ptkpStatus: text("ptkp_status").default("TK/0"),
  // Aggregate
  bpjsDeduction: integer("bpjs_deduction").notNull().default(0), // legacy total
  thr: integer("thr").notNull().default(0),
  netSalary: integer("net_salary").notNull().default(0),
  status: text("status").default("draft"), // draft|approved|paid
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  createdAt: ts("created_at"),
});

/* ---------------- notifications ---------------- */
export const notifications = sqliteTable("notifications", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => companies.id),
  title: text("title").notNull(),
  body: text("body"),
  icon: text("icon").default("bell"),
  category: text("category").default("system"), // system|attendance|leave|payroll|cms
  readAt: integer("read_at", { mode: "timestamp_ms" }),
  createdAt: ts("created_at"),
});

/* ---------------- announcements / CMS ---------------- */
export const announcements = sqliteTable("announcements", {
  id: id(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("article"), // banner|article|announcement|promo
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  imageUrl: text("image_url"),
  category: text("category"),
  status: text("status").default("live"), // live|draft
  createdAt: ts("created_at"),
});

/* ---------------- chats (legacy: employee → HR) ---------------- */
export const chats = sqliteTable("chats", {
  id: id(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  fromUserId: text("from_user_id")
    .notNull()
    .references(() => users.id),
  toRole: text("to_role").default("hr"),
  text: text("text").notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: ts("created_at"),
});

/* ---------------- chat_conversations (1-1 atau group antar user) ---------------- */
export const chatConversations = sqliteTable(
  "chat_conversations",
  {
    id: id(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    type: text("type").default("direct"), // direct | group
    title: text("title"), // optional, untuk group
    lastMessageAt: integer("last_message_at", { mode: "timestamp_ms" }),
    lastMessageText: text("last_message_text"),
    createdAt: ts("created_at"),
  },
  (t) => ({
    companyIdx: index("conv_company_idx").on(t.companyId),
  })
);

/* ---------------- chat_participants ---------------- */
export const chatParticipants = sqliteTable(
  "chat_participants",
  {
    id: id(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: integer("last_read_at", { mode: "timestamp_ms" }),
    createdAt: ts("created_at"),
  },
  (t) => ({
    convUserIdx: uniqueIndex("part_conv_user_idx").on(
      t.conversationId,
      t.userId
    ),
    userIdx: index("part_user_idx").on(t.userId),
  })
);

/* ---------------- chat_messages ---------------- */
export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: id(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => users.id),
    text: text("text"),
    attachmentUrl: text("attachment_url"),
    attachmentName: text("attachment_name"),
    attachmentMime: text("attachment_mime"),
    attachmentSize: integer("attachment_size"),
    createdAt: ts("created_at"),
  },
  (t) => ({
    convIdx: index("msg_conv_idx").on(t.conversationId),
  })
);

/* ---------------- payroll_settings (per company) ---------------- */
export const payrollSettings = sqliteTable("payroll_settings", {
  id: id(),
  companyId: text("company_id")
    .notNull()
    .unique()
    .references(() => companies.id, { onDelete: "cascade" }),
  // Defaults
  allowanceDefaultPct: real("allowance_default_pct").default(0.27),
  workingHoursPerMonth: integer("working_hours_per_month").default(173),
  lateDeductionCapPct: real("late_deduction_cap_pct").default(0.1),
  // Overtime rates (Permenaker 102/2004)
  otWeekdayFirstRate: real("ot_weekday_first_rate").default(1.5),
  otWeekdayRate: real("ot_weekday_rate").default(2.0),
  otHolidayFirst8hRate: real("ot_holiday_first_8h_rate").default(2.0),
  otHoliday9thRate: real("ot_holiday_9th_rate").default(3.0),
  otHoliday10thRate: real("ot_holiday_10th_rate").default(4.0),
  // THR (Permenaker 6/2016)
  thrFullMonths: integer("thr_full_months").default(12),
  thrMinMonths: integer("thr_min_months").default(1),
  // BPJS toggles
  bpjsKesehatanEnabled: integer("bpjs_kesehatan_enabled", {
    mode: "boolean",
  }).default(true),
  bpjsJhtEnabled: integer("bpjs_jht_enabled", { mode: "boolean" }).default(
    true
  ),
  bpjsJpEnabled: integer("bpjs_jp_enabled", { mode: "boolean" }).default(true),
  // Tax preference
  taxScheme: text("tax_scheme").default("gross"), // gross|gross-up|net
  // Default JKK
  defaultJkkClass: integer("default_jkk_class").default(1),
  // Company tax info
  companyNpwp: text("company_npwp"),
  companyTaxAddress: text("company_tax_address"),
  updatedAt: ts("updated_at"),
});

/* ---------------- holidays (per company) ---------------- */
export const holidays = sqliteTable("holidays", {
  id: id(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  name: text("name").notNull(),
  type: text("type").default("national"), // national|company|religious
  recurringYearly: integer("recurring_yearly", { mode: "boolean" }).default(
    false
  ),
  createdAt: ts("created_at"),
});

/* ---------------- payroll_components (per employee) ---------------- */
export const payrollComponents = sqliteTable("payroll_components", {
  id: id(),
  employeeId: text("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // earning | deduction
  category: text("category").notNull(), // loan|savings|insurance|bonus|allowance|thr|fine|advance|other
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  recurring: integer("recurring", { mode: "boolean" }).default(false),
  startPeriod: text("start_period"), // YYYY-MM, null=immediate
  endPeriod: text("end_period"), // YYYY-MM, null=ongoing
  notes: text("notes"),
  createdAt: ts("created_at"),
});

/* ---------------- audit logs ---------------- */
export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  companyId: text("company_id"),
  userId: text("user_id"),
  action: text("action").notNull(),
  details: text("details"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: ts("created_at"),
});

/* ---------------- overtime_requests ---------------- */
export const overtimeRequests = sqliteTable(
  "overtime_requests",
  {
    id: id(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    startTime: text("start_time").notNull(), // HH:mm
    endTime: text("end_time").notNull(),
    hours: integer("hours").notNull().default(0),
    description: text("description"),
    isHoliday: integer("is_holiday", { mode: "boolean" }).default(false),
    status: text("status").notNull().default("pending"), // pending|approved|rejected
    approverId: text("approver_id"),
    approverNote: text("approver_note"),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
    createdAt: ts("created_at"),
  },
  (t) => ({
    empIdx: index("ot_emp_idx").on(t.employeeId),
    coDateIdx: index("ot_co_date_idx").on(t.companyId, t.date),
  })
);

/* ---------------- types ---------------- */
export type User = typeof users.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;
export type Leave = typeof leaves.$inferSelect;
export type Payroll = typeof payrolls.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type OvertimeRequest = typeof overtimeRequests.$inferSelect;
export type PayrollSettings = typeof payrollSettings.$inferSelect;
export type Holiday = typeof holidays.$inferSelect;
export type PayrollComponent = typeof payrollComponents.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
