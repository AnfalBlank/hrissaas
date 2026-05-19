"use client";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

async function request<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!json) throw new Error("Network error");
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any; employee: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () =>
    request<{ user: any; employee: any; branch: any; shift: any }>(
      "/api/auth/me"
    ),
  logout: () => request("/api/auth/logout", { method: "POST" }),

  // Employee
  attendanceMe: () =>
    request<{ today: any; history: any[] }>("/api/attendance/me"),
  checkIn: (data: {
    latitude: number;
    longitude: number;
    method?: "face" | "qr" | "manual";
    confidence?: number;
    photoUrl?: string;
    photoDataUrl?: string;
  }) =>
    request("/api/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  checkOut: (data: {
    latitude: number;
    longitude: number;
    method?: "face" | "qr" | "manual";
  }) =>
    request("/api/attendance/check-out", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  payrollMe: (period?: string) =>
    request<{ current: any; history: any[]; preview: boolean }>(
      `/api/payroll/me${period ? `?period=${period}` : ""}`
    ),
  leaveMe: () => request<{ quotas: any[]; leaves: any[] }>("/api/leave/me"),
  applyLeave: (data: {
    type: "annual" | "sick" | "permission" | "emergency";
    fromDate: string;
    toDate: string;
    reason?: string;
    attachmentUrl?: string;
  }) =>
    request("/api/leave/me", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancelLeave: (id: string) =>
    request(`/api/leave/${id}`, { method: "DELETE" }),

  // Overtime
  overtimeMe: () => request<{ items: any[] }>("/api/overtime/me"),
  applyOvertime: (data: {
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    isHoliday?: boolean;
  }) =>
    request("/api/overtime/me", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancelOvertime: (id: string) =>
    request(`/api/overtime/${id}`, { method: "DELETE" }),

  // Timesheet
  timesheetMe: (month?: string) =>
    request<{ month: string; items: any[]; summary: any }>(
      `/api/timesheet/me${month ? `?month=${month}` : ""}`
    ),

  // Admin overtime
  adminOvertime: (status?: string) =>
    request<{ items: any[]; summary: any }>(
      `/api/admin/overtime${status ? `?status=${status}` : ""}`
    ),
  adminOvertimeDecide: (
    id: string,
    status: "approved" | "rejected",
    note?: string
  ) =>
    request("/api/admin/overtime", {
      method: "PATCH",
      body: JSON.stringify({ id, status, note }),
    }),
  notifications: () => request<{ items: any[] }>("/api/notifications"),
  notificationRead: (id: string) =>
    request(`/api/notifications/${id}`, { method: "PATCH" }),
  notificationsReadAll: () =>
    request("/api/notifications/read-all", { method: "POST" }),
  announcements: () => request<{ items: any[] }>("/api/announcements"),
  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    bankName?: string;
    bankAccount?: string;
  }) =>
    request<{ employee: any }>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request("/api/profile/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Admin
  adminDashboard: () => request<any>("/api/admin/dashboard"),
  adminAnalytics: () => request<any>("/api/admin/analytics"),
  adminAuditLogs: () =>
    request<{ items: any[]; totalToday: number }>("/api/admin/audit-logs"),
  adminQrToken: (branchId: string) =>
    request<{ token: string; branch: any; expiresInSec: number }>(
      `/api/admin/qr-token?branchId=${branchId}`
    ),
  adminLive: () => request<any>("/api/admin/live"),
  qrCheckIn: (data: { token: string; latitude: number; longitude: number }) =>
    request("/api/attendance/qr-checkin", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminSystemStatus: () =>
    request<{ r2: boolean; whatsapp: boolean; socketIO: boolean; jwt: boolean }>(
      "/api/admin/system-status"
    ),
  adminEmployees: (q?: string) =>
    request<{ items: any[] }>(
      `/api/admin/employees${q ? `?q=${encodeURIComponent(q)}` : ""}`
    ),
  adminEmployeeGet: (id: string) =>
    request<{ employee: any; user: any }>(`/api/admin/employees/${id}`),
  adminEmployeeCreate: (data: any) =>
    request("/api/admin/employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminEmployeeUpdate: (id: string, data: any) =>
    request(`/api/admin/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminEmployeeDelete: (id: string) =>
    request(`/api/admin/employees/${id}`, { method: "DELETE" }),
  adminAttendance: (date?: string) =>
    request<{ items: any[]; summary: any; date: string }>(
      `/api/admin/attendance${date ? `?date=${date}` : ""}`
    ),
  adminAttendanceUpdate: (id: string, data: any) =>
    request(`/api/admin/attendance/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  // Leave & quotas
  adminLeave: (status?: string) =>
    request<{ items: any[]; summary: any }>(
      `/api/admin/leave${status ? `?status=${status}` : ""}`
    ),
  adminLeaveDecide: (
    id: string,
    status: "approved" | "rejected",
    note?: string
  ) =>
    request("/api/admin/leave", {
      method: "PATCH",
      body: JSON.stringify({ id, status, note }),
    }),
  adminLeaveQuotas: (year?: number) =>
    request<{ year: number; items: any[] }>(
      `/api/admin/leave-quotas${year ? `?year=${year}` : ""}`
    ),
  adminLeaveQuotaUpdate: (data: {
    employeeId: string;
    type: "annual" | "sick" | "permission" | "emergency";
    total: number;
    used?: number;
    year?: number;
  }) =>
    request("/api/admin/leave-quotas", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminLeaveQuotaBulk: (data: {
    year: number;
    defaults: {
      annual: number;
      sick: number;
      permission: number;
      emergency: number;
    };
    resetUsed?: boolean;
  }) =>
    request("/api/admin/leave-quotas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminPayroll: (period?: string) =>
    request<{ items: any[]; totals: any; period: string }>(
      `/api/admin/payroll${period ? `?period=${period}` : ""}`
    ),
  adminGeneratePayroll: (period: string) =>
    request("/api/admin/payroll", {
      method: "POST",
      body: JSON.stringify({ period }),
    }),
  adminPayrollUpdate: (
    id: string,
    data: {
      status?: "draft" | "approved" | "paid" | "cancelled";
      paymentMethod?: "transfer" | "cash" | "other";
      paymentReference?: string;
      paidAt?: string;
      notes?: string;
      bonus?: number;
      thr?: number;
      attendanceDeduction?: number;
    }
  ) =>
    request(`/api/admin/payroll/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminPayrollDelete: (id: string) =>
    request(`/api/admin/payroll/${id}`, { method: "DELETE" }),
  adminBuktiPotongUrl: (employeeId: string, year: number) =>
    `/api/admin/payroll/bukti-potong?employeeId=${employeeId}&year=${year}`,
  adminPayrollComponentBulk: (data: {
    scope: "all-active" | "selected" | "by-division";
    employeeIds?: string[];
    division?: string;
    type: "earning" | "deduction";
    category: string;
    name: string;
    amount: number;
    recurring?: boolean;
    startPeriod?: string;
    endPeriod?: string;
    notes?: string;
  }) =>
    request("/api/admin/payroll-components/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminShifts: () => request<{ items: any[] }>("/api/admin/shifts"),
  adminShiftCreate: (data: any) =>
    request("/api/admin/shifts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminShiftUpdate: (id: string, data: any) =>
    request(`/api/admin/shifts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminShiftDelete: (id: string) =>
    request(`/api/admin/shifts/${id}`, { method: "DELETE" }),
  adminBranches: () => request<{ items: any[] }>("/api/admin/branches"),
  adminBranchCreate: (data: any) =>
    request("/api/admin/branches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminBranchUpdate: (id: string, data: any) =>
    request(`/api/admin/branches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminBranchDelete: (id: string) =>
    request(`/api/admin/branches/${id}`, { method: "DELETE" }),
  adminAnnouncements: () =>
    request<{ items: any[] }>("/api/admin/announcements"),
  adminAnnouncementCreate: (data: any) =>
    request("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminAnnouncementUpdate: (id: string, data: any) =>
    request(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminAnnouncementDelete: (id: string) =>
    request(`/api/admin/announcements/${id}`, { method: "DELETE" }),

  // Payroll Settings
  adminPayrollSettings: () =>
    request<{ settings: any }>("/api/admin/payroll-settings"),
  adminPayrollSettingsUpdate: (data: any) =>
    request<{ settings: any }>("/api/admin/payroll-settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Holidays
  adminHolidays: () => request<{ items: any[] }>("/api/admin/holidays"),
  adminHolidayCreate: (data: any) =>
    request("/api/admin/holidays", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminHolidayDelete: (id: string) =>
    request(`/api/admin/holidays/${id}`, { method: "DELETE" }),

  // Payroll Components
  adminPayrollComponents: (employeeId?: string) =>
    request<{ items: any[] }>(
      `/api/admin/payroll-components${employeeId ? `?employeeId=${employeeId}` : ""}`
    ),
  adminPayrollComponentCreate: (data: any) =>
    request("/api/admin/payroll-components", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminPayrollComponentDelete: (id: string) =>
    request(`/api/admin/payroll-components/${id}`, { method: "DELETE" }),

  // THR
  adminGenerateThr: (period: string, payDate?: string) =>
    request("/api/admin/thr", {
      method: "POST",
      body: JSON.stringify({ period, payDate }),
    }),

  // Chat (1-1 antar pegawai)
  contacts: () => request<{ items: any[] }>("/api/contacts"),
  conversations: () => request<{ items: any[] }>("/api/conversations"),
  startConversation: (toUserId: string) =>
    request<{ conversationId: string; existed: boolean }>(
      "/api/conversations",
      { method: "POST", body: JSON.stringify({ toUserId }) }
    ),
  conversationMessages: (id: string) =>
    request<{ messages: any[] }>(`/api/conversations/${id}/messages`),
  sendMessage: (
    id: string,
    data: {
      text?: string;
      attachmentUrl?: string;
      attachmentName?: string;
      attachmentMime?: string;
      attachmentSize?: number;
    }
  ) =>
    request(`/api/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Legacy chat (HR support)
  chatList: () => request<{ items: any[] }>("/api/chat"),
  chatSend: (text: string, attachmentUrl?: string) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ text, attachmentUrl }),
    }),

  // Upload
  uploadDataUrl: (
    dataUrl: string,
    filename: string,
    category: "selfie" | "leave" | "avatar" = "selfie"
  ) =>
    request<{ url: string; key: string; configured: boolean }>("/api/upload", {
      method: "PUT",
      body: JSON.stringify({ dataUrl, filename, category }),
    }),
};
