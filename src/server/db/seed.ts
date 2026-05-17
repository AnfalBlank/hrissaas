import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db, schema } from "./client";
import { hashPassword } from "../auth/password";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding...");

  // Company
  let [company] = await db
    .select()
    .from(schema.companies)
    .where(eq(schema.companies.slug, "manggala"));

  if (!company) {
    [company] = await db
      .insert(schema.companies)
      .values({
        name: "PT Manggala Sejahtera",
        slug: "manggala",
        domain: "manggala.app",
        plan: "professional",
      })
      .returning();
    console.log("✓ Created company:", company.name);
  } else {
    console.log("• Company exists:", company.name);
  }

  // Branches
  const branchSeed = [
    { name: "Kantor Pusat", city: "Jakarta", lat: -6.2088, lng: 106.8456 },
    { name: "Cabang Bandung", city: "Bandung", lat: -6.9175, lng: 107.6191 },
    { name: "Cabang Surabaya", city: "Surabaya", lat: -7.2575, lng: 112.7521 },
    { name: "Cabang Medan", city: "Medan", lat: 3.5952, lng: 98.6722 },
  ];

  const existingBranches = await db
    .select()
    .from(schema.branches)
    .where(eq(schema.branches.companyId, company.id));

  if (existingBranches.length === 0) {
    for (const b of branchSeed) {
      await db.insert(schema.branches).values({
        companyId: company.id,
        name: b.name,
        city: b.city,
        latitude: b.lat,
        longitude: b.lng,
        radiusMeters: 100,
      });
    }
    console.log("✓ Created", branchSeed.length, "branches");
  }

  const branches = await db
    .select()
    .from(schema.branches)
    .where(eq(schema.branches.companyId, company.id));

  // Shifts
  const existingShifts = await db
    .select()
    .from(schema.shifts)
    .where(eq(schema.shifts.companyId, company.id));

  if (existingShifts.length === 0) {
    await db.insert(schema.shifts).values([
      {
        companyId: company.id,
        name: "Pagi",
        startTime: "08:00",
        endTime: "17:00",
        graceMinutes: 5,
      },
      {
        companyId: company.id,
        name: "Siang",
        startTime: "12:00",
        endTime: "21:00",
        graceMinutes: 5,
      },
      {
        companyId: company.id,
        name: "Malam",
        startTime: "21:00",
        endTime: "06:00",
        graceMinutes: 5,
        type: "night",
      },
      {
        companyId: company.id,
        name: "Flexible",
        startTime: "09:00",
        endTime: "18:00",
        graceMinutes: 30,
        type: "flexible",
      },
    ]);
    console.log("✓ Created shifts");
  }

  const shifts = await db
    .select()
    .from(schema.shifts)
    .where(eq(schema.shifts.companyId, company.id));
  const morningShift = shifts.find((s) => s.name === "Pagi")!;

  // Users + Employees
  const usersToCreate = [
    {
      email: "admin@manggala.id",
      role: "hr",
      fullName: "Rina Hartati",
      position: "HR Manager",
      division: "HR",
      branch: "Kantor Pusat",
      code: "EMP-00001",
      base: 15_000_000,
    },
    {
      email: "andini@manggala.id",
      role: "employee",
      fullName: "Andini Putri",
      position: "Senior UX Designer",
      division: "Produk",
      branch: "Kantor Pusat",
      code: "EMP-00214",
      base: 8_500_000,
      ptkp: "K/1",
      jkk: 1,
    },
    {
      email: "bayu@manggala.id",
      role: "employee",
      fullName: "Bayu Saputra",
      position: "Sales Lead",
      division: "Sales",
      branch: "Cabang Bandung",
      code: "EMP-00215",
      base: 7_500_000,
      ptkp: "K/2",
      jkk: 2,
    },
    {
      email: "rama@manggala.id",
      role: "supervisor",
      fullName: "Rama Wijaya",
      position: "Backend Engineer",
      division: "Engineering",
      branch: "Kantor Pusat",
      code: "EMP-00216",
      base: 12_500_000,
      ptkp: "TK/0",
      jkk: 1,
    },
    {
      email: "sari@manggala.id",
      role: "employee",
      fullName: "Sari Indah",
      position: "HR Specialist",
      division: "HR",
      branch: "Kantor Pusat",
      code: "EMP-00217",
      base: 6_500_000,
      ptkp: "TK/0",
      jkk: 1,
    },
    {
      email: "dimas@manggala.id",
      role: "employee",
      fullName: "Dimas Aditya",
      position: "Field Sales",
      division: "Sales",
      branch: "Cabang Surabaya",
      code: "EMP-00218",
      base: 6_000_000,
      ptkp: "K/0",
      jkk: 2,
    },
    {
      email: "owner@manggala.id",
      role: "owner",
      fullName: "Pak Anwar",
      position: "Founder",
      division: "Executive",
      branch: "Kantor Pusat",
      code: "EMP-00000",
      base: 30_000_000,
    },
  ];

  const passwordHash = await hashPassword("demo1234");
  let createdUsers = 0;

  for (const u of usersToCreate) {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, u.email));
    if (existing.length > 0) continue;

    const [user] = await db
      .insert(schema.users)
      .values({
        companyId: company.id,
        email: u.email,
        passwordHash,
        role: u.role,
      })
      .returning();

    const branch = branches.find((b) => b.name === u.branch);
    await db.insert(schema.employees).values({
      userId: user.id,
      companyId: company.id,
      branchId: branch?.id,
      shiftId: morningShift.id,
      employeeCode: u.code,
      fullName: u.fullName,
      division: u.division,
      position: u.position,
      phone: "+628120000" + u.code.slice(-4),
      baseSalary: u.base,
      faceRegistered: true,
      joinDate: new Date(2023, 0, 1),
      bankName: "BCA",
      bankAccount: "**** 1234",
      ptkpStatus: u.ptkp ?? "TK/0",
      jkkClass: u.jkk ?? 1,
    });

    // Default leave quotas
    const employees = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.userId, user.id));
    const emp = employees[0];
    const year = new Date().getFullYear();
    await db.insert(schema.leaveQuotas).values([
      { employeeId: emp.id, type: "annual", total: 12, used: 3, year },
      { employeeId: emp.id, type: "sick", total: 14, used: 0, year },
      { employeeId: emp.id, type: "permission", total: 6, used: 0, year },
      { employeeId: emp.id, type: "emergency", total: 3, used: 0, year },
    ]);

    createdUsers++;
  }
  console.log("✓ Created", createdUsers, "users");

  // Sample announcements
  const existingAnn = await db
    .select()
    .from(schema.announcements)
    .where(eq(schema.announcements.companyId, company.id));
  if (existingAnn.length === 0) {
    await db.insert(schema.announcements).values([
      {
        companyId: company.id,
        type: "announcement",
        title: "Cuti Bersama Idul Adha",
        excerpt: "5 - 7 Juni 2026 adalah cuti bersama nasional.",
        content: "Mohon disesuaikan dengan jadwal kerja masing-masing.",
        category: "Pengumuman",
      },
      {
        companyId: company.id,
        type: "promo",
        title: "Promo Wellness Mei 2026",
        excerpt: "Diskon 30% mitra wellness untuk seluruh karyawan.",
        category: "Promo",
      },
      {
        companyId: company.id,
        type: "article",
        title: "Workshop AI untuk HR",
        excerpt: "Daftar workshop internal tentang penerapan AI di SDM.",
        category: "Event",
      },
      {
        companyId: company.id,
        type: "banner",
        title: "Bonus Tahunan 2026 cair 20 Mei",
        excerpt: "Cek slip gaji Anda di menu Payroll.",
        category: "Banner",
      },
    ]);
    console.log("✓ Created announcements");
  }

  console.log("✅ Seed complete");
  console.log("\nDemo credentials (password: demo1234):");
  for (const u of usersToCreate) {
    console.log(`  ${u.email}  (${u.role})`);
  }

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
