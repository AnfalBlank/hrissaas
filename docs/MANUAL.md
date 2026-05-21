# Manual Pengguna — MAS (Manggala Attendant System)

**Versi:** 2.1.0  
**Terakhir diperbarui:** Mei 2026  
**Platform:** Progressive Web App (PWA)  
**Managed by:** PT Manggala Utama Indonesia

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Panduan Admin](#2-panduan-admin)
3. [Panduan Pegawai](#3-panduan-pegawai)
4. [Modul Payroll](#4-modul-payroll)
5. [Pengaturan Sistem](#5-pengaturan-sistem)
6. [Keamanan & Audit](#6-keamanan--audit)
7. [Integrasi & Notifikasi](#7-integrasi--notifikasi)
8. [FAQ & Troubleshooting](#8-faq--troubleshooting)

---

## 1. Pendahuluan

### 1.1 Tentang MAS

MAS (Manggala Attendant System) adalah platform Human Resource Information System berbasis web untuk perusahaan di Indonesia, dikembangkan dan dikelola oleh **PT Manggala Utama Indonesia**.

Fitur utama:

- **Absensi online** dengan liveness detection (blink + motion), GPS geofencing, QR code
- **Manajemen cuti** dengan validasi kuota otomatis + overlap detection
- **Manajemen lembur** dengan approval workflow
- **Payroll otomatis** sesuai regulasi 2024+ (PPh 21 TER PMK 168/2023, BPJS lengkap, THR pro-rata)
- **Chat antar pegawai** (P2P dengan file attachment)
- **Live monitoring** peta real-time lokasi absensi
- **AI Analytics** tren kehadiran + insight prediktif
- **Notifikasi dual channel** — WhatsApp + Telegram
- **Multi-tenant** dengan isolasi data per perusahaan

### 1.2 Kontak & Support

| Channel | Detail |
|---|---|
| WhatsApp | +62 878-8424-1703 |
| Email | admin@manggala-utama.id |
| Instagram | @manggalautamaindonesia |

### 1.3 Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TailwindCSS |
| Backend | Next.js API Routes + Custom Node.js Server (Socket.IO) |
| Database | Turso (libSQL) via Drizzle ORM |
| Realtime | Socket.IO (WebSocket + polling) |
| Storage | Cloudflare R2 (fallback base64) |
| Notifikasi | WhatsApp Cloud API + Telegram Bot + in-app push |
| Auth | JWT HS256 + httpOnly cookies + auto-refresh 6 jam |
| Maps | Leaflet + OpenStreetMap |
| PDF/Excel | pdfkit, exceljs, jspdf, html-to-image |
| Liveness | Frame diff analysis (motion + blink detection) |

### 1.4 Roles

| Role | Akses |
|---|---|
| `super_admin` | Full akses semua modul + settings |
| `owner` | Sama seperti super_admin |
| `hr` | Kelola pegawai, payroll, absensi, cuti, lembur |
| `supervisor` | View dashboard, approve cuti/lembur |
| `employee` | Absensi, cuti, lembur, slip gaji, chat, profil |

---

## 2. Panduan Admin

### 2.1 Dashboard (`/admin`)

Menampilkan:
- **4 kartu statistik**: total pegawai, hadir hari ini, telat, cuti/sakit
- **Chart 7 hari**: bar chart kehadiran (hadir/telat/cuti) per hari + label Y "Pegawai"
- **Distribusi divisi**: pie chart jumlah pegawai per divisi
- **Tren bulanan**: area chart % kehadiran 12 bulan (label Y "% Hadir")
- **Live feed**: 8 aktivitas absensi terakhir real-time
- **Statistik cabang**: kehadiran per lokasi kantor

### 2.2 Live Monitoring (`/admin/live`)

Peta OpenStreetMap real-time menampilkan:
- Pin lokasi semua cabang (lingkaran radius geofence)
- Pin pegawai yang sudah check-in hari ini (posisi GPS saat check-in)
- Feed aktivitas terbaru
- Statistik hadir/telat/total

Hanya tampilkan pegawai **aktif** (resigned tidak muncul).

### 2.3 Manajemen Pegawai (`/admin/employees`)

**Fitur:**
- List dengan filter: status (active/inactive/all), search nama/kode/posisi
- Default: hide pegawai `inactive` (resigned)
- Tombol per row: Edit, Resign, Hapus
- **Tambah Pegawai**: form lengkap (email, password, nama, kode, divisi, posisi, cabang, shift, gaji, PTKP, NPWP, JKK class, join date, phone)
- **Bulk Import**: upload CSV atau Excel (.xlsx), template tersedia. Max 500 row per batch. Validasi email+kode unik.
- **Resign**: set tanggal resign + alasan + opsi nonaktifkan login. History tetap dipertahankan.
- **Hapus**: hanya jika belum punya payroll history (kalau ada, sarankan resign)
- Export PDF/Excel

**Foto profil**: pegawai upload dari `/app/profile` → tampil di semua halaman admin (employees, attendance, leave, overtime, sidebar).

### 2.4 Absensi (`/admin/attendance`)

- List absensi per tanggal (default hari ini)
- Detail per row: nama + foto, waktu check-in/out, metode, GPS, foto selfie, telat/lembur
- **AttendanceDetail modal**: peta lokasi GPS + foto selfie check-in & check-out
- **Koreksi manual**: edit status, waktu check-in/out, menit telat, menit lembur, notes
- Export PDF/Excel

### 2.5 Cuti (`/admin/leave`)

- List pengajuan cuti semua pegawai (filter by status)
- Approve/reject dengan catatan
- **Auto kuota**: saat approve → `leaveQuotas.used += days`. Saat reject → restore.
- Validasi: kuota cukup sebelum approve

### 2.6 Kuota Cuti (`/admin/leave-quotas`)

- Matrix per pegawai × tipe (annual, sick, permission, emergency)
- Edit individual: ubah total/used per pegawai per type
- **Bulk reset**: set default semua pegawai untuk tahun baru (annual=12, sick=12, permission=6, emergency=3). Opsi reset used=0.

### 2.7 Lembur (`/admin/overtime`)

- List pengajuan lembur semua pegawai (filter by status)
- Summary: pending, approved, rejected, total jam approved
- Approve/reject dengan catatan
- Audit log otomatis

### 2.8 Shift (`/admin/shifts`)

- CRUD shift kerja: nama, jam masuk (HH:mm), jam keluar, toleransi (menit), tipe
- Tampil jumlah pegawai per shift
- **Delete guard**: tidak bisa hapus jika ada pegawai assigned

### 2.9 Hari Libur (`/admin/holidays`)

- CRUD hari libur: tanggal (YYYY-MM-DD), nama, tipe (national/company/religious), recurring yearly
- Digunakan untuk:
  - Auto-detect lembur hari libur saat generate payroll
  - Default payDate THR (H-7 dari hari raya religious)
  - Analytics working days calculation

### 2.10 Cabang & GPS (`/admin/branches`)

- CRUD cabang kantor
- **Map picker**: klik peta untuk set lokasi pin + search alamat via Nominatim geocoding
- Radius geofence visual (lingkaran biru di peta)
- Validasi: lat -90..90, lng -180..180, radius max 100km
- **Delete guard**: tidak bisa hapus jika ada pegawai aktif assigned
- Generate QR code dinamis untuk check-in

### 2.11 CMS / Announcements (`/admin/cms`)

- CRUD konten: banner, article, announcement, promo
- Status: live/draft
- Banner tampil sebagai carousel horizontal di halaman news pegawai
- Audit log setiap create/update/delete

### 2.12 Notifikasi (`/admin/notifications`)

- Template notifikasi (WhatsApp + Telegram + Push)
- Status integrasi: WhatsApp, Telegram, Socket.IO, Email SMTP

### 2.13 Integrasi (`/admin/integrations`)

Halaman setup token langsung dari UI:
- **Telegram Bot**: input token, test koneksi (verifikasi via getMe API), simpan
- **WhatsApp Cloud API**: input Access Token + Phone Number ID, simpan
- **Status overview**: 4 badge (Telegram, WhatsApp, R2, Socket.IO) active/off
- Token di-mask saat ditampilkan untuk keamanan
- Validasi token sebelum save

### 2.14 Keamanan (`/admin/security`)

- **Status fitur keamanan**: 10 item (GPS, Liveness, Rate Limit, Audit Log, JWT, Multi-tenant, bcrypt, Anti Mock GPS, Redis Rate Limit, WhatsApp). Masing-masing dengan badge Aktif/Off + label Built-in/Env config.
- **Audit Logs viewer**: pagination (25 per page), filter by action type (dropdown 40+ actions), filter by user email, total events hari ini.

### 2.15 Pengaturan (`/admin/settings`)

- **Edit Profil Perusahaan**: nama, slug, domain, plan, timezone, logo (modal edit)
- Card-card navigasi ke: Payroll Settings, Holidays, Branches, Komponen Payroll, Keamanan, CMS
- Status integrasi (WhatsApp, R2, Socket.IO)
- Upgrade plan CTA (link WhatsApp sales)

---

## 3. Panduan Pegawai

### 3.1 Home (`/app`)

Dashboard mobile-first dengan:
- Kartu absensi hari ini (status, jam masuk/keluar)
- Quick actions: Absen, Cuti, Lembur, Riwayat
- Pengumuman terbaru

### 3.2 Absensi (`/app/attendance`)

**Flow check-in/check-out:**

1. **Intro**: tampil status GPS (±Xm), metode liveness (Challenge — Kedipkan mata), lokasi kantor, tombol "Mulai Liveness Check"
2. **Camera**: buka front camera, posisikan wajah dalam lingkaran, tombol "Mulai Verifikasi"
3. **Liveness Challenge** (3.5 detik):
   - Instruksi: "Kedipkan Mata"
   - Deteksi real-time: gerakan wajah ✓, kedipan mata ✓, anti-spoof ✓
   - Progress bar 0-100%
   - Jika gagal → error spesifik ("kedipan tidak terdeteksi" atau "tidak ada gerakan")
4. **Upload & Submit**: foto di-capture, upload ke R2, kirim ke server dengan confidence score dinamis
5. **Success**: detail waktu, status (tepat waktu/telat Xm), detail verifikasi (Motion ✓/✗, Blink ✓/✗, Score X%)

**Anti-spoof:**
- Frame diff (motion): orang hidup > 2.0, foto statis ≈ 0-1
- Blink detection: brightness dip di area mata > 3 unit + recovery > 2
- Brightness variance: std > 0.8
- Pass threshold: confidence ≥ 60%

**GPS Geofencing:**
- Validasi jarak ke cabang assigned via haversine
- Error message jelas: "Anda berada Xm dari kantor 'Nama Cabang' (radius Ym)"
- Wajib punya cabang assigned + cabang harus punya koordinat

### 3.3 Riwayat Absensi (`/app/history`)

List absensi bulan berjalan: tanggal, status (hadir/telat/cuti/sakit), jam masuk-keluar, menit telat.

### 3.4 Cuti (`/app/leave`)

- **Kuota**: tampil sisa per tipe (annual/sick/permission/emergency)
- **Apply cuti**: pilih tipe, dari-sampai tanggal, alasan, lampiran
  - Validasi: fromDate ≤ toDate
  - Validasi: tidak overlap dengan cuti existing
  - Validasi: kuota cukup
- **Cancel**: bisa cancel pending atau approved (approved → kuota dikembalikan)
- **Status tracking**: pending → approved/rejected

### 3.5 Lembur (`/app/overtime`)

- **Apply lembur**: tanggal (±14 hari lalu s/d +30 hari depan), jam mulai-selesai (HH:mm), deskripsi, flag hari libur
  - Validasi: durasi 1-14 jam
  - Validasi: tidak boleh overlap (1 request per tanggal)
- **Cancel**: bisa cancel pending
- **Status tracking**: pending → approved/rejected

### 3.6 Timesheet (`/app/timesheet`)

View bulanan: calendar kehadiran, summary hadir/telat/cuti/alpha, total jam kerja.

### 3.7 Slip Gaji (`/app/payroll`)

- **Hero card**: Take Home Pay, bank info (4 digit terakhir, atau pesan lengkapi profil)
- **Donut chart**: komposisi gaji (pokok, tunjangan, lembur, bonus+THR, potongan)
- **Pendapatan**: gaji pokok, tunjangan, lembur (Xj), bonus, THR
- **Potongan**: BPJS Kesehatan 1%, JHT 2%, JP 1%, PPh 21 · PTKP status, potongan telat
- **Kontribusi Perusahaan**: card violet — total employer BPJS (tidak potong take-home)
- **Edukasi PPh 21**: bottom sheet penjelasan TER PMK 168/2023 (kategori A/B/C, cara hitung, +20% non-NPWP)
- **Edukasi BPJS**: tabel rate karyawan vs perusahaan + dasar hukum
- **Download PDF**: slip gaji dengan header perusahaan + NPWP + bank info
- **Riwayat**: list semua periode sebelumnya + download per periode

### 3.8 Chat (`/app/chat`)

- List conversations (P2P)
- Pilih contact dari list pegawai
- Kirim text + file attachment (max 5MB)
- Real-time via Socket.IO
- Badge unread di bottom nav

### 3.9 Notifikasi (`/app/notifications`)

- Filter: semua, belum dibaca, per kategori (absensi/cuti/payroll/sistem)
- **Deep-link**: klik notif → langsung ke halaman terkait
- **Hapus**: per item (icon trash) atau "Bersihkan" semua yang sudah dibaca
- Tandai semua dibaca
- Real-time via Socket.IO

### 3.10 Profil (`/app/profile`)

- Edit: nama, phone, foto avatar (upload ke R2), bank name + account
- Ganti password (dengan audit log)
- **ID Card**: view + download PNG/PDF. Design gradient header + curved wave + avatar 120px
- Logout

### 3.11 QR Check-in (`/app/qr`)

Scan QR code yang di-generate admin → check-in tanpa face recognition (validasi GPS tetap berlaku).

---

## 4. Modul Payroll

### 4.1 Generate Payroll (`/admin/payroll`)

Tombol "Generate Payroll" membuat slip untuk semua pegawai aktif pada periode yang dipilih.

**Data yang diambil:**
- Attendance (absensi): telat, lembur — range sesuai pola gajian
- Overtime requests (approved): jam lembur per hari + flag holiday
- Payroll components: recurring + one-off sesuai periode
- Employee: gaji pokok, PTKP, NPWP, JKK class, join date, resign date

**Pola Gajian (setting di `/admin/payroll-settings`):**

| Pola | Data Absensi | Contoh Period 2026-05 |
|---|---|---|
| Akhir Bulan (Siklus Berjalan) | 1 - akhir bulan | 01 Mei - 31 Mei |
| Awal Bulan Berikutnya (Siklus Bulan Sebelumnya) | 1 - akhir bulan | 01 Mei - 31 Mei (dibayar Juni) |
| Custom Cut-off (mis. tgl 20) | tgl 21 bulan lalu - tgl 20 bulan ini | 21 Apr - 20 Mei |

**Protection:**
- Payroll sudah `approved`/`paid` TIDAK akan ditimpa saat re-generate
- UNIQUE constraint `(employee_id, period)` mencegah duplikasi
- Transaction wrap per upsert

### 4.2 Workflow Payroll

```
draft → approved → paid
         ↓
       cancelled
```

| Status | Aksi yang bisa dilakukan |
|---|---|
| `draft` | Edit (bonus/thr/potongan), Approve, Hapus, Re-generate |
| `approved` | Mark Paid (isi metode + referensi + tanggal), Cancel |
| `paid` | Tidak bisa diubah/dihapus |
| `cancelled` | — |

### 4.3 Verifikasi Sebelum Approve

Tombol 👁 (mata) per row membuka modal **Detail Verifikasi**:

1. **Info Pegawai**: nama, kode, PTKP, NPWP, bank, metode pajak, pola gajian
2. **Data Absensi**: hadir/telat/total, total menit telat, total menit OT, range tanggal data
3. **Breakdown Perhitungan**: tabel lengkap (lihat section 4.5)
4. **Komponen Aktif**: list earning/deduction yang ikut dihitung
5. **Tip verifikasi**: cara edit manual jika tidak sesuai

### 4.4 Perhitungan PPh 21 (TER PMK 168/2023)

**Januari–November: Tarif Efektif Rata-rata (TER)**

Kategori TER ditentukan dari PTKP:
- **A**: TK/0, TK/1, K/0
- **B**: TK/2, TK/3, K/1, K/2
- **C**: K/3

Rumus: `PPh21 = penghasilan_bruto_bulanan × tarif_TER`

Tarif TER = lookup dari tabel 40+ bracket per kategori (sesuai lampiran PMK 168/2023).

**Desember: Rekonsiliasi Tahunan**

```
PKP = gross_annual - biaya_jabatan(5%, max 6jt) - BPJS_annual - PTKP
PPh_tahunan = progresif(5/15/25/30/35%)
PPh_Desember = PPh_tahunan - total_TER_Jan-Nov
```

**Non-NPWP**: semua tarif ×1.2 (tambah 20%).

**Setting**: bisa switch ke mode `ANNUAL` (progresif ÷ 12) di payroll-settings untuk komparasi.

### 4.5 Breakdown Perhitungan

```
PENDAPATAN:
  Gaji Pokok            = baseSalary × prorataFactor
  Tunjangan Tetap       = baseSalary × allowanceDefaultPct × prorataFactor
  Lembur                = Σ(entries × rate × hourlyRate)
  Bonus                 = dari komponen category=bonus
  THR                   = dari komponen category=thr
  Extra Earnings        = komponen earning lainnya
                        ─────────────────────────
  TOTAL PENDAPATAN

POTONGAN:
  BPJS Kesehatan        = 1% × min(monthlyGross, 12jt)
  BPJS JHT              = 2% × monthlyGross
  BPJS JP               = 1% × min(monthlyGross, 10.55jt)
  PPh 21                = TER × bruto (Jan-Nov) atau rekonsiliasi (Des)
  Potongan Telat        = min(minuteRate × totalMenitTelat, basis × capPct)
  Extra Deductions      = komponen deduction lainnya
                        ─────────────────────────
  TOTAL POTONGAN

TAKE HOME PAY = TOTAL PENDAPATAN - TOTAL POTONGAN

KONTRIBUSI PERUSAHAAN (tidak potong take-home):
  BPJS Kesehatan (4%) + JHT (3.7%) + JP (2%) + JKK (0.24-1.74%) + JKM (0.3%)
```

### 4.6 Potongan Telat

Diatur di `/admin/payroll-settings` → section "Default Umum":

| Setting | Default | Fungsi |
|---|---|---|
| Cap Potongan Telat (%) | 0.10 (10%) | Maksimum potongan sebagai % dari basis |
| Basis Potongan Telat | Gaji Pokok | Dihitung dari gaji pokok saja atau gaji+tunjangan |

Rumus:
```
hourlyRate = basis / 173
minuteRate = hourlyRate / 60
potongan   = min(minuteRate × totalMenitTelat, basis × cap%)
```

### 4.7 Lembur

| Kondisi | Rate (Permenaker 102/2004) |
|---|---|
| Weekday jam ke-1 | 1.5× hourlyRate |
| Weekday jam ke-2+ | 2× hourlyRate |
| Holiday jam 1-8 (5-day) / 1-7 (6-day) | 2× hourlyRate |
| Holiday jam ke-9 (5-day) / ke-8 (6-day) | 3× hourlyRate |
| Holiday jam ke-10+ (5-day) / ke-9+ (6-day) | 4× hourlyRate |

`hourlyRate = monthlyGross / workingHoursPerMonth (default 173)`

Setting `workDaysPerWeek` (5 atau 6) menggeser break point lembur holiday.

### 4.8 THR (Permenaker 6/2016)

- Masa kerja ≥ 12 bulan: 1× upah (gaji pokok + tunjangan tetap)
- Masa kerja 1-11 bulan: pro-rata (bulan/12 × upah)
- Masa kerja < 1 bulan: tidak eligible

Tunjangan diambil dari:
1. Component `category=allowance` recurring (prioritas)
2. Fallback: `baseSalary × allowanceDefaultPct`

Default payDate THR: H-7 dari hari raya religious di tabel holidays.

### 4.9 Pro-rata Join/Resign

Karyawan yang join atau resign tengah bulan mendapat gaji pro-rata:

```
factor = activeDays / totalDaysInMonth
baseSalary_actual = baseSalary × factor
allowance_actual  = allowance × factor
```

### 4.10 Komponen Payroll (`/admin/payroll-components`)

Earning/deduction tambahan per pegawai:
- **Individual**: tambah per pegawai (bonus, cicilan, asuransi, dll)
- **Bulk Add**: tambah ke semua pegawai aktif atau per divisi sekaligus
- **Recurring**: centang untuk komponen bulanan (berlaku dari startPeriod s/d endPeriod)
- **One-off**: tanpa recurring, hanya berlaku di startPeriod

### 4.11 Bukti Potong PPh 21 (Form 1721-A1)

Endpoint: tombol scroll ungu per row → download PDF tahunan.

Isi: identitas pemberi kerja + penerima, rincian bruto/BPJS/PPh per bulan, total tahunan, attestasi.

### 4.12 Export

- **Admin Payroll**: PDF/Excel rekap semua pegawai (include company NPWP + alamat)
- **Employee Slip**: PDF slip gaji per pegawai (include bank info, BPJS employer, PTKP)
- **Bukti Potong**: PDF Form 1721-A1 per pegawai per tahun

---

## 5. Pengaturan Sistem

### 5.1 Pengaturan Payroll (`/admin/payroll-settings`)

| Section | Settings |
|---|---|
| **Pola Gajian & Cut-off** | Pola gajian (akhir bulan/awal bulan berikutnya/custom), tanggal cut-off (1-28), tanggal gajian (1-31) |
| **Default Umum** | % tunjangan tetap, jam kerja/bulan, cap potongan telat, basis potongan telat, hari kerja/minggu |
| **Tarif Lembur** | 5 rate (weekday jam 1, weekday jam 2+, holiday jam 1-8, jam 9, jam 10+) |
| **THR** | Min masa kerja eligible, min masa kerja THR penuh |
| **BPJS Toggle** | Kesehatan on/off, JHT on/off, JP on/off, default JKK class |
| **Pajak** | Metode (TER/ANNUAL), skema (gross/gross-up/net), NPWP perusahaan, alamat pajak |

### 5.2 Profil Perusahaan (`/admin/settings` → Edit Profil)

- Nama perusahaan
- Slug (URL-friendly, unique)
- Domain
- Plan (starter/professional/enterprise)
- Timezone (WIB/WITA/WIT)
- Logo URL

### 5.3 Manajemen Cabang (`/admin/branches`)

- Nama, kota, alamat
- Lokasi GPS via **map picker** (klik peta / search alamat / drag pin)
- Radius geofence (meter) — visual circle di peta
- Status aktif/nonaktif

---

## 6. Keamanan & Audit

### 6.1 Autentikasi

- JWT HS256 token di httpOnly cookie (7 hari expiry)
- **Auto-refresh**: setiap 6 jam silent refresh (update payload JWT jika branchId/role berubah)
- **Auto-logout**: 30 menit idle tanpa aktivitas → logout otomatis → redirect login dengan pesan

### 6.2 Rate Limiting Login

- Max 5 percobaan gagal per (IP + email) dalam 15 menit
- Setelah threshold → lockout 30 menit, response 429
- Reset counter saat login sukses
- Opsional persistent via Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)

### 6.3 Liveness Detection (Anti-Spoof)

- **Motion detection**: frame diff analysis — tolak foto/screenshot statis
- **Blink detection**: brightness dip di area mata — tolak video tanpa kedip
- **Confidence scoring**: Motion 35% + Blink 40% + Variance 25%. Pass ≥ 60%
- User harus kedipkan mata selama 3.5 detik challenge

### 6.4 GPS Security

- Haversine distance validation vs cabang assigned
- Wajib cabang + wajib koordinat (error jelas jika belum set)
- Accuracy info ditampilkan (±Xm)

### 6.5 Audit Log

40+ action types tercatat otomatis:

| Kategori | Actions |
|---|---|
| Auth | login.success, login.failed, login.blocked |
| Attendance | check_in.success, check_in.qr, check_in.rejected, manual_correction |
| Leave | approved, rejected |
| Overtime | approved, rejected |
| Payroll | generate, approve, paid, delete, thr.generate, settings.update, component.create/delete/bulkCreate, buktiPotong.download |
| Employee | create, update, delete, resign, bulkImport |
| Branch | create, update, delete |
| Shift | create, update, delete |
| Holiday | create, delete |
| Announcement | create, update, delete |
| Company | update |
| Profile | password.changed, password.failed, bank.changed |

Viewer: `/admin/security` → pagination, filter by action/user.

### 6.6 Payroll Revisions

Setiap perubahan pada payroll dicatat di tabel `payroll_revisions`:
- Action: create/update/approve/paid/cancel/delete
- Snapshot: full row sebelum perubahan (JSON)
- Diff: `{field: {old, new}}` field-level
- Viewer: tombol History per row di tabel payroll

---

## 7. Integrasi & Notifikasi

### 7.1 Halaman Integrasi (`/admin/integrations`)

Admin bisa setup token langsung dari UI tanpa perlu edit env vars:

**Telegram Bot:**
1. Buka Telegram → cari @BotFather → kirim `/newbot`
2. Ikuti instruksi → dapat token (format: `123456789:ABCdef...`)
3. Paste token di halaman Integrasi → klik "Test Koneksi" → verifikasi nama bot
4. Simpan
5. Pegawai chat ke bot → kirim `/start` → catat chat_id
6. Admin set chat_id di form edit pegawai (field "Telegram Chat ID")

**WhatsApp Cloud API:**
1. Buka Meta Business Suite → WhatsApp → API Setup
2. Buat Permanent Access Token
3. Catat Phone Number ID
4. Paste keduanya di halaman Integrasi → Simpan

Token disimpan di database (encrypted at rest via Turso). Bisa juga via env vars (`TELEGRAM_BOT_TOKEN`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) — env vars override DB.

### 7.2 Socket.IO (Realtime)

Events yang di-broadcast:
- `attendance:check-in`, `attendance:check-out`
- `leave:applied`, `leave:decided`, `leave:cancelled`
- `overtime:applied`, `overtime:decided`
- `notification` (in-app push)
- `conv:message` (chat)

Koneksi via custom server (`server.js`) di port 3000 path `/api/socket`.

### 7.3 Dual Channel Notifikasi

Setiap notifikasi penting otomatis dikirim ke **kedua channel** jika data tersedia:
- **WhatsApp** — jika pegawai punya field `phone` + WhatsApp token configured
- **Telegram** — jika pegawai punya field `telegramChatId` + Telegram bot token configured
- **In-app push** — selalu (via Socket.IO + DB notifications)

Notifikasi yang dikirim:
- Telat masuk
- Cuti disetujui/ditolak
- Lembur disetujui/ditolak
- Slip gaji tersedia
- THR ditetapkan
- Payroll dibayar
- Check-out summary jam kerja

### 7.4 Cloudflare R2

Upload foto selfie absensi + avatar profil + attachment cuti/chat.
- Key format: `{companyId}/{category}/{employeeId}/{filename}`
- Fallback: base64 data URL jika R2 tidak dikonfigurasi
- Konfigurasi: env `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`

### 7.5 Deep-link Notifikasi

Setiap notifikasi punya field `link` yang mengarahkan ke halaman terkait:
- Telat → `/app/history`
- Cuti decided → `/app/leave`
- Lembur decided → `/app/overtime`
- Slip gaji → `/app/payroll?period=YYYY-MM`
- Chat → `/app/chat?conv=xxx`

---

## 8. FAQ & Troubleshooting

### Q: Pegawai tidak bisa check-in setelah pindah cabang?
**A**: Pastikan:
1. Cabang baru sudah di-set latitude + longitude (via map picker di `/admin/branches`)
2. Pegawai logout-login ulang (atau tunggu 6 jam auto-refresh JWT)
3. Jika sudah check-in hari ini di cabang lama, check-out dulu atau admin koreksi manual

### Q: Liveness detection selalu gagal?
**A**: Pastikan:
1. Wajah terlihat jelas (cahaya cukup, tidak backlight)
2. Kedipkan mata dengan jelas selama proses 3.5 detik
3. Jangan pakai masker/kacamata hitam yang tutup mata
4. Pastikan bukan foto/screenshot (harus wajah asli bergerak)

### Q: Payroll generate tapi gaji 0?
**A**: Cek:
1. Pegawai sudah di-set `baseSalary` > 0 di edit employee
2. Status pegawai `active` (bukan inactive/resigned)
3. Join date sebelum periode payroll

### Q: Potongan telat terlalu besar/kecil?
**A**: Atur di `/admin/payroll-settings`:
- Cap potongan telat (default 10%)
- Basis (gaji pokok vs gaji+tunjangan)
- Jam kerja per bulan (default 173)

### Q: PPh 21 tidak sesuai?
**A**: Cek:
1. PTKP status pegawai sudah benar (TK/0, K/1, dll)
2. NPWP pegawai sudah diisi (tanpa NPWP = +20%)
3. Metode pajak di settings: TER (2024+) vs ANNUAL (legacy)
4. Untuk Desember: pastikan payroll Jan-Nov sudah ada (untuk rekonsiliasi YTD)

### Q: Cara verifikasi hasil generate payroll?
**A**:
1. Klik tombol 👁 (mata) per row pegawai → modal detail breakdown
2. Bandingkan data absensi (hadir/telat/OT) dengan aktual
3. Cek komponen aktif yang ikut dihitung
4. Jika ada selisih: koreksi data absensi atau komponen → re-generate

### Q: Perbedaan pola gajian akhir bulan vs awal bulan?
**A**:
- **Akhir bulan**: generate payroll Mei → data absensi 1-31 Mei → bayar tanggal X Mei
- **Awal bulan berikutnya**: generate payroll Mei → data absensi 1-31 Mei → bayar tanggal X Juni
- **Custom cut-off 20**: generate payroll Mei → data absensi 21 Apr - 20 Mei → bayar tanggal X

### Q: Quota cuti tidak berkurang setelah approve?
**A**: Sistem otomatis update `used += days` saat approve. Jika terjadi inkonsistensi, admin bisa manual edit di `/admin/leave-quotas`.

### Q: Auto-logout terlalu cepat?
**A**: Timeout idle saat ini 30 menit. Setiap aktivitas (klik, ketik, scroll, tap) reset timer. Jika ingin ubah, kontak developer untuk adjust `IDLE_TIMEOUT` di kode.

---

*MAS (Manggala Attendant System) v2.1.0 — Managed by PT Manggala Utama Indonesia.*  
*Dokumen ini diperbarui Mei 2026. Untuk informasi terbaru, hubungi admin@manggala-utama.id atau WhatsApp +62 878-8424-1703.*
