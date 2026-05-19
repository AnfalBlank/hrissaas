/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr", "supervisor"];

export async function GET() {
  try {
    const session = await requireRole(ADMIN_ROLES);

    // Last 12 months trend
    const trend: { m: string; v: number; pred: number }[] = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const startDate = startMonth.toISOString().slice(0, 10);

    const allAttendances = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.companyId, session.companyId),
          gte(schema.attendances.date, startDate)
        )
      );

    const employees = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.companyId, session.companyId));
    const totalEmp = employees.length || 1;

    // Hari kerja per bulan dihitung dari kalender minus weekend & holidays
    const holidayRows = await db
      .select()
      .from(schema.holidays)
      .where(eq(schema.holidays.companyId, session.companyId));
    const holidaySet = new Set(holidayRows.map((h) => h.date));
    const recurringHolidayMmDd = new Set(
      holidayRows.filter((h) => h.recurringYearly).map((h) => h.date.slice(5))
    );

    function workingDaysInMonth(year: number, month: number): number {
      const days = new Date(year, month, 0).getDate();
      let count = 0;
      for (let d = 1; d <= days; d++) {
        const date = new Date(year, month - 1, d);
        if (date.getDay() === 0) continue; // Minggu
        const ymd = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (holidaySet.has(ymd)) continue;
        if (recurringHolidayMmDd.has(ymd.slice(5))) continue;
        count++;
      }
      return count;
    }

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthRows = allAttendances.filter((r) =>
        r.date.startsWith(monthKey)
      );
      const present = monthRows.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;
      const workingDays = workingDaysInMonth(d.getFullYear(), d.getMonth() + 1) || 1;
      const v = Math.round((present / (totalEmp * workingDays)) * 100);
      trend.push({
        m: monthNames[d.getMonth()],
        v: Math.min(100, v),
        pred: Math.min(100, Math.max(80, v + 1)),
      });
    }

    // Productivity per division (% present + on time vs working days)
    const divMap = new Map<string, { total: number; present: number }>();
    employees.forEach((e) => {
      const k = e.division || "Lainnya";
      const cur = divMap.get(k) || { total: 0, present: 0 };
      cur.total++;
      divMap.set(k, cur);
    });
    allAttendances.forEach((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      if (!emp) return;
      const k = emp.division || "Lainnya";
      const cur = divMap.get(k);
      if (cur && (a.status === "present" || a.status === "late")) {
        cur.present++;
      }
    });
    // Total working days dalam 12 bulan terakhir
    const totalWorkDays = (() => {
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        sum += workingDaysInMonth(d.getFullYear(), d.getMonth() + 1);
      }
      return sum || 1;
    })();
    const productivity = Array.from(divMap, ([d, v]) => ({
      d,
      v: v.total
        ? Math.min(100, Math.round((v.present / (v.total * totalWorkDays / 12)) * 100))
        : 0,
    }));

    // Heatmap: day-of-week × hour
    const heatmap: { day: string; h: number[] }[] = [];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    for (let i = 1; i <= 7; i++) {
      const dayIdx = i % 7; // start from Sen
      const hours = Array(12).fill(0);
      let max = 0;
      allAttendances.forEach((a) => {
        if (!a.checkInAt) return;
        const dt = new Date(a.checkInAt);
        if (dt.getDay() !== dayIdx) return;
        const hr = dt.getHours();
        const slot = Math.max(0, Math.min(11, hr - 6));
        hours[slot]++;
        if (hours[slot] > max) max = hours[slot];
      });
      const normalized = hours.map((c) =>
        max ? Math.round((c / max) * 100) : 0
      );
      heatmap.push({ day: dayNames[dayIdx], h: normalized });
    }

    // Top performer (employee with most on-time check-ins)
    const empScore = new Map<string, number>();
    allAttendances.forEach((a) => {
      if (a.status === "present") {
        empScore.set(a.employeeId, (empScore.get(a.employeeId) || 0) + 2);
      } else if (a.status === "late") {
        empScore.set(a.employeeId, (empScore.get(a.employeeId) || 0) + 1);
      }
    });
    let topId: string | null = null;
    let topScore = 0;
    for (const [k, v] of empScore) {
      if (v > topScore) {
        topScore = v;
        topId = k;
      }
    }
    const topEmployee = topId
      ? employees.find((e) => e.id === topId)
      : null;

    // Predicted late tomorrow: count employees with > 2 late in last 30 days
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const last30Str = last30.toISOString().slice(0, 10);
    const lateMap = new Map<string, number>();
    allAttendances
      .filter((a) => a.date >= last30Str && a.status === "late")
      .forEach((a) =>
        lateMap.set(a.employeeId, (lateMap.get(a.employeeId) || 0) + 1)
      );
    const predLate = Array.from(lateMap.values()).filter((c) => c >= 2).length;

    // Attendance score: % present (incl late) of all check-ins
    const presentRows = allAttendances.filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;
    const score = allAttendances.length
      ? (presentRows / allAttendances.length) * 100
      : 0;

    // AI insights — rule-based heuristics
    const insights: string[] = [];
    const dowLate = new Map<number, number>();
    allAttendances
      .filter((a) => a.status === "late" && a.checkInAt)
      .forEach((a) => {
        const d = new Date(a.checkInAt!).getDay();
        dowLate.set(d, (dowLate.get(d) || 0) + 1);
      });
    let worstDow = -1;
    let worstCount = 0;
    for (const [d, c] of dowLate)
      if (c > worstCount) {
        worstCount = c;
        worstDow = d;
      }
    if (worstDow >= 0) {
      const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][worstDow];
      insights.push(
        `Hari ${dayName} adalah hari dengan keterlambatan terbanyak (${worstCount} kasus). Pertimbangkan briefing pagi.`
      );
    }
    if (predLate > 0) {
      insights.push(
        `${predLate} pegawai memiliki pola telat berulang (>2x dalam 30 hari). Perlu pendekatan personal.`
      );
    }
    if (topEmployee) {
      insights.push(
        `Top performer minggu ini: ${topEmployee.fullName} dengan skor ${topScore}.`
      );
    }
    if (productivity.length > 0) {
      const worst = productivity.reduce((a, b) => (a.v < b.v ? a : b));
      const best = productivity.reduce((a, b) => (a.v > b.v ? a : b));
      if (worst.v < best.v - 10) {
        insights.push(
          `Divisi ${worst.d} memiliki produktivitas terendah (${worst.v}%). Bandingkan dengan ${best.d} (${best.v}%).`
        );
      }
    }
    if (insights.length === 0) {
      insights.push(
        "Belum cukup data untuk insight. Tambahkan absensi minimal 30 hari."
      );
    }

    return ok({
      stats: {
        attendanceScore: score,
        predictedLate: predLate,
        topPerformer: topEmployee
          ? { name: topEmployee.fullName, score: topScore }
          : null,
        insightCount: insights.length,
      },
      trend,
      productivity,
      heatmap,
      insights,
    });
  } catch (e) {
    return handleError(e);
  }
}
