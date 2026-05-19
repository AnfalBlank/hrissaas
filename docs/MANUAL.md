# Manual Pengguna — Manggala Attendance System (MAS)

**Versi:** 1.0.0  
**Terakhir diperbarui:** Januari 2025  
**Platform:** Progressive Web App (PWA)

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Panduan Admin](#2-panduan-admin)
3. [Panduan Pegawai](#3-panduan-pegawai)
4. [Pengaturan Sistem](#4-pengaturan-sistem)
5. [Perhitungan Payroll](#5-perhitungan-payroll)
6. [Keamanan & Audit](#6-keamanan--audit)
7. [Integrasi](#7-integrasi)
8. [FAQ & Troubleshooting](#8-faq--troubleshooting)

---

## 1. Pendahuluan

### 1.1 Tentang MAS

Manggala Attendance System (MAS) adalah platform Human Resource Information System (HRIS) berbasis web yang dirancang khusus untuk kebutuhan perusahaan di Indonesia. Sistem ini mencakup manajemen absensi dengan face recognition dan GPS, pengelolaan cuti & lembur, payroll otomatis sesuai regulasi Indonesia 2024, serta fitur komunikasi internal.

MAS dibangun sebagai Progressive Web App (PWA) sehingga dapat diakses melalui browser di perangkat apapun (desktop, tablet, smartphone) dan dapat di-install layaknya aplikasi native tanpa perlu download dari app store.

### 1.2 Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TailwindCSS |
| Backend | Next.js API Routes, Custom Node.js Server |
| Database | Turso (libSQL/SQLite edge) via Drizzle ORM |
| Realtime | Socket.IO (WebSocket + polling fallback) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Notifikasi | WhatsApp Cloud API |
| Autentikasi | JWT (HS256) + httpOnly cookies |
| Charts | Recharts |
| Maps | Leaflet + OpenStreetMap |
| Icons | Lucide React |
| PDF | pdfkit, jspdf |
| Excel | exceljs |
| State | Zustand + TanStack React Query |

### 1.3 Persyaratan Sistem

**Untuk Pengguna (Pegawai/Admin):**
- Browser modern: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Koneksi internet stabil
- Untuk absensi: kamera depan (selfie) dan GPS aktif
- Resolusi layar minimum: 360×640 (mobile), 1024×768 (desktop)

**Untuk Deployment:**
- Node.js 18+
- Turso database account
- Cloudflare R2 bucket (opsional, fallback ke base64)
- WhatsApp Business API token (opsional, fallback ke mock)

### 1.4 Akses Demo

| Role | Email | Password |
|------|-------|----------|
| HR/Admin | admin@manggala.id | demo1234 |
| Employee | andini@manggala.id | demo1234 |
| Owner | owner@manggala.id | demo1234 |
| Supervisor | rama@manggala.id | demo1234 |

### 1.5 Role & Hak Akses

| Fitur | Super Admin | Owner | HR/Admin | Supervisor | Employee |
|-------|:-----------:|:-----:|:--------:|:----------:|:--------:|
| Dashboard Admin | ✅ | ✅ | ✅ | ❌ | ❌ |
| Live Tracking | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI Analytics | ✅ | ✅ | ✅ | ❌ | ❌ |
| Kelola Pegawai | ✅ | ❌ | ✅ | ❌ | ❌ |
| Monitoring Absensi | ✅ | ✅ | ✅ | ✅* | ❌ |
| Approve Cuti | ✅ | ❌ | ✅ | ✅ | ❌ |
| Approve Lembur | ✅ | ❌ | ✅ | ✅ | ❌ |
| Generate Payroll | ✅ | ❌ | ✅ | ❌ | ❌ |
| Pengaturan Sistem | ✅ | ❌ | ✅ | ❌ | ❌ |
| Absensi (self) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ajukan Cuti | ❌ | ❌ | ❌ | ✅ | ✅ |
| Lihat Slip Gaji | ❌ | ❌ | ❌ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ | ✅ | ✅ |

*Supervisor hanya melihat tim yang dipimpinnya.


---

## 2. Panduan Admin

### 2.1 Login & Navigasi

1. Buka aplikasi MAS di browser
2. Masukkan email dan password pada halaman login
3. Klik **Masuk**
4. Sistem akan mengarahkan ke Dashboard Admin

[Screenshot: Halaman login MAS]

**Navigasi Sidebar:**

Sidebar admin terbagi dalam beberapa grup menu:

- **Utama:** Dashboard, Live Tracking, AI Analytics
- **Manajemen:** Pegawai, Absensi, Timesheet, Lembur, Cuti, Kuota Cuti, Shift, Hari Libur
- **Payroll:** Generate Payroll, Komponen Tambahan, Pengaturan Payroll
- **Konfigurasi:** Cabang & GPS, CMS, Notifikasi, Keamanan, Pengaturan

**TopBar:**
- **Search Global** — ketik nama pegawai, cabang, atau shift untuk pencarian cepat (fuzzy match)
- **Ikon Chat** — akses chat dengan badge jumlah pesan belum dibaca
- **Ikon Notifikasi** — dropdown notifikasi terbaru dengan deep-link ke halaman terkait

### 2.2 Dashboard Admin

Dashboard menampilkan ringkasan operasional harian perusahaan secara realtime.

[Screenshot: Dashboard admin dengan stats cards dan charts]

**Komponen Dashboard:**

1. **Stats Cards** — Total pegawai, hadir hari ini, terlambat, tidak hadir, cuti
2. **Grafik Absensi 7 Hari** — Bar chart kehadiran mingguan (hadir/terlambat/absen)
3. **Pie Chart Divisi** — Distribusi pegawai per divisi
4. **Area Chart Tren Bulanan** — Tren kehadiran 30 hari terakhir
5. **Ringkasan Cabang** — Statistik per cabang
6. **Live Activity Feed** — Feed realtime (via Socket.IO) menampilkan aktivitas terbaru: check-in, check-out, pengajuan cuti/lembur

> **Tips:** Live Activity Feed akan otomatis ter-update tanpa perlu refresh halaman berkat koneksi WebSocket.

### 2.3 Live Tracking

Halaman ini menampilkan peta interaktif dengan posisi pegawai secara realtime.

[Screenshot: Peta Leaflet dengan marker pegawai dan geofence]

**Cara Menggunakan:**

1. Buka menu **Live Tracking** dari sidebar
2. Peta akan menampilkan:
   - **Marker pegawai** — warna berbeda berdasarkan status (hijau: hadir, kuning: terlambat, merah: di luar geofence)
   - **Lingkaran geofence** — radius area valid per cabang
3. Klik marker untuk melihat detail pegawai (nama, waktu check-in, jarak dari kantor)
4. Panel samping menampilkan **Realtime Feed** aktivitas absensi terbaru

### 2.4 AI Analytics

Halaman analitik berbasis heuristik cerdas untuk membantu pengambilan keputusan HR.

[Screenshot: Halaman AI Analytics dengan grafik tren dan heatmap]

**Fitur:**

1. **Tren Absensi 12 Bulan** — Grafik aktual vs prediksi kehadiran
2. **Produktivitas per Divisi** — Perbandingan skor kehadiran antar divisi
3. **Heatmap Hari × Jam** — Visualisasi pola keterlambatan (hari apa, jam berapa)
4. **AI Insights** — Rekomendasi otomatis berdasarkan pola data:
   - "Divisi Marketing memiliki tingkat keterlambatan 23% lebih tinggi pada hari Senin"
   - "Cabang Surabaya menunjukkan tren penurunan kehadiran 3 bulan terakhir"

### 2.5 Manajemen Pegawai

CRUD lengkap untuk data pegawai dengan filter dan export.

[Screenshot: Tabel pegawai dengan filter dan tombol aksi]

**Menambah Pegawai Baru:**

1. Klik tombol **+ Tambah Pegawai**
2. Isi formulir:
   - **Data Pribadi:** Nama lengkap, email, no. HP, alamat, tanggal lahir
   - **Data Kepegawaian:** NIP, divisi, jabatan, cabang, shift, tanggal bergabung, status (aktif/nonaktif)
   - **Data Pajak & BPJS:** NPWP, status PTKP (TK/0, K/1, dll), kelas JKK
   - **Data Bank:** Nama bank, no. rekening, atas nama
   - **Gaji:** Gaji pokok, tunjangan
3. Klik **Simpan**

**Filter & Pencarian:**
- Filter berdasarkan: Divisi, Cabang, Status (aktif/nonaktif)
- Pencarian: ketik nama atau NIP

**Export:**
- Klik **Export PDF** untuk laporan format PDF (header perusahaan, tabel zebra)
- Klik **Export Excel** untuk spreadsheet (format currency, tanggal Indonesia)

**Edit & Hapus:**
- Klik ikon pensil pada baris pegawai untuk edit
- Klik ikon hapus untuk menonaktifkan pegawai (soft delete)

### 2.6 Monitoring Absensi

Pantau kehadiran harian seluruh pegawai dengan detail lengkap.

[Screenshot: Tabel absensi harian dengan filter status dan date picker]

**Fitur Utama:**

1. **Tabel Harian** — Menampilkan: nama, shift, jam masuk, jam keluar, status, lokasi
2. **Filter:**
   - Status: Hadir, Terlambat, Tidak Hadir, Cuti, Izin
   - Tanggal: Date picker untuk memilih hari
   - Pencarian: nama pegawai
3. **Detail Modal** — Klik baris untuk melihat:
   - Foto selfie saat check-in
   - Peta GPS dengan titik lokasi dan lingkaran geofence
   - Jarak dari kantor (meter)
   - Confidence score face recognition
4. **Koreksi Manual:**
   - Klik tombol **Koreksi** pada baris absensi
   - Edit: status, waktu masuk/keluar, catatan
   - Koreksi akan tercatat di audit log
5. **Export:** PDF dan Excel dengan filter yang aktif

### 2.7 Timesheet Admin

Rekap jam kerja harian per pegawai.

[Screenshot: Tabel timesheet dengan kolom jam kerja dan total]

**Cara Menggunakan:**
1. Pilih periode (bulan/minggu)
2. Tabel menampilkan: nama pegawai, jam masuk, jam keluar, durasi kerja, lembur, keterlambatan
3. Export ke PDF/Excel untuk keperluan payroll

### 2.8 Manajemen Lembur

Kelola pengajuan lembur dari pegawai.

[Screenshot: Daftar pengajuan lembur dengan tombol approve/reject]

**Alur Kerja:**

1. Pegawai mengajukan lembur melalui aplikasi
2. Pengajuan muncul di halaman ini dengan status **Pending**
3. Admin/Supervisor dapat:
   - **Approve** — klik ✅, tambahkan catatan (opsional)
   - **Reject** — klik ❌, wajib isi alasan penolakan
4. Notifikasi otomatis dikirim ke pegawai
5. **Realtime Feed** di samping menampilkan pengajuan baru secara live

**Informasi yang Ditampilkan:**
- Nama pegawai, tanggal lembur, jam mulai-selesai
- Total jam, flag hari libur (isHoliday)
- Estimasi biaya lembur (otomatis dihitung)

### 2.9 Manajemen Cuti

Kelola pengajuan cuti dari pegawai.

[Screenshot: Daftar pengajuan cuti dengan status dan aksi]

**Alur Kerja:**

1. Pegawai mengajukan cuti (jenis: tahunan/sakit/izin/darurat)
2. Pengajuan muncul dengan status **Pending**
3. Admin/Supervisor:
   - **Approve** — setujui cuti
   - **Reject** — tolak dengan alasan
4. Sisa kuota cuti otomatis berkurang setelah approve
5. Export daftar cuti ke PDF/Excel

**Jenis Cuti:**
| Jenis | Kuota Default | Keterangan |
|-------|:------------:|------------|
| Tahunan | 12 hari/tahun | Sesuai UU Ketenagakerjaan |
| Sakit | Sesuai surat dokter | Wajib lampiran |
| Izin | 3 hari/tahun | Keperluan pribadi |
| Darurat | 3 hari/tahun | Keluarga meninggal, bencana |

### 2.10 Kuota Cuti

Kelola sisa kuota cuti per pegawai per jenis.

[Screenshot: Matriks kuota cuti per pegawai]

**Fitur:**
1. **Tabel Matriks** — Baris: pegawai, Kolom: jenis cuti (tahunan/sakit/izin/darurat)
2. **Edit Individual** — Klik sel untuk mengubah kuota pegawai tertentu
3. **Bulk Reset** — Tombol "Reset Tahun Baru" untuk mengatur ulang semua kuota ke default (biasanya dilakukan setiap 1 Januari)


### 2.11 Manajemen Shift

Atur jadwal shift kerja perusahaan.

[Screenshot: Daftar shift dengan jam mulai/selesai dan grace period]

**Menambah Shift:**

1. Klik **+ Tambah Shift**
2. Isi formulir:
   - **Nama Shift:** contoh "Pagi", "Siang", "Malam"
   - **Jam Mulai:** contoh 08:00
   - **Jam Selesai:** contoh 17:00
   - **Grace Minutes:** toleransi keterlambatan (menit), contoh: 15
   - **Tipe:** Regular / Flexible
3. Klik **Simpan**

**Catatan:**
- Grace minutes menentukan batas toleransi sebelum pegawai dianggap terlambat
- Contoh: Shift Pagi 08:00 dengan grace 15 menit → terlambat jika check-in setelah 08:15

### 2.12 Hari Libur

Kelola kalender hari libur nasional, perusahaan, dan keagamaan.

[Screenshot: Kalender hari libur dengan kategori warna]

**Menambah Hari Libur:**

1. Klik **+ Tambah Hari Libur**
2. Isi:
   - **Nama:** contoh "Hari Raya Idul Fitri"
   - **Tanggal:** pilih tanggal
   - **Kategori:** Nasional / Perusahaan / Keagamaan
   - **Recurring:** centang jika berulang setiap tahun (contoh: 17 Agustus)
3. Klik **Simpan**

**Fungsi Hari Libur:**
- Otomatis mendeteksi lembur di hari libur → tarif lembur holiday (2×/3×/4×)
- Tidak menghitung absen jika pegawai tidak masuk di hari libur
- Tampil di kalender pegawai

### 2.13 Generate Payroll

Proses penggajian bulanan otomatis.

[Screenshot: Halaman generate payroll dengan pilihan periode dan preview]

**Langkah Generate Payroll:**

1. Pilih **Periode** (bulan dan tahun)
2. Sistem otomatis menghitung untuk semua pegawai aktif:
   - Gaji pokok + tunjangan
   - Lembur (weekday & holiday)
   - Potongan keterlambatan
   - BPJS (Kesehatan, JHT, JP)
   - PPh 21 (progresif UU HPP)
   - Komponen tambahan (earning/deduction)
   - THR (jika diaktifkan)
3. Preview hasil perhitungan dalam tabel
4. Klik **Generate** untuk menyimpan
5. **Export:**
   - **PDF** — Laporan payroll lengkap dengan header perusahaan
   - **Excel** — Spreadsheet detail per pegawai
   - **Slip Gaji PDF** — Per pegawai, layout 2 kolom (pendapatan/potongan)

**THR Generator:**
- Tombol khusus untuk generate THR
- Otomatis hitung pro-rata berdasarkan masa kerja
- Sesuai Permenaker 6/2016

### 2.14 Pengaturan Payroll

Konfigurasi parameter perhitungan gaji.

[Screenshot: Form pengaturan payroll dengan toggle BPJS dan input rate]

**Parameter yang Dapat Dikonfigurasi:**

| Parameter | Default | Keterangan |
|-----------|---------|------------|
| Jam Kerja/Bulan | 173 | Basis perhitungan lembur |
| Tunjangan Default (%) | 27% | Jika tidak diset per pegawai |
| Cap Potongan Telat (%) | 10% | Maksimal potongan keterlambatan |
| Rate Lembur Weekday Jam-1 | 1.5× | Permenaker 102/2004 |
| Rate Lembur Weekday Jam-2+ | 2.0× | Permenaker 102/2004 |
| Rate Lembur Holiday Jam 1-8 | 2.0× | Permenaker 102/2004 |
| Rate Lembur Holiday Jam-9 | 3.0× | Permenaker 102/2004 |
| Rate Lembur Holiday Jam-10+ | 4.0× | Permenaker 102/2004 |
| THR Full (bulan) | 12 | Masa kerja untuk THR penuh |
| THR Min (bulan) | 1 | Minimal masa kerja untuk THR |
| BPJS Kesehatan | Aktif | Toggle on/off |
| BPJS JHT | Aktif | Toggle on/off |
| BPJS JP | Aktif | Toggle on/off |
| Kelas JKK Default | 1 | Kelas risiko 1-5 |
| Skema Pajak | Gross | Gross / Gross-up / Nett |
| NPWP Perusahaan | — | Untuk slip gaji |

### 2.15 Komponen Payroll Tambahan

Kelola komponen pendapatan/potongan tambahan per pegawai.

[Screenshot: Tabel komponen tambahan per pegawai]

**Jenis Komponen:**

- **Earning (Pendapatan):** Bonus, insentif, tunjangan khusus, uang makan
- **Deduction (Potongan):** Pinjaman/kasbon, asuransi tambahan, potongan koperasi

**Menambah Komponen:**

1. Klik **+ Tambah Komponen**
2. Pilih pegawai
3. Isi:
   - **Tipe:** Earning / Deduction
   - **Kategori:** Bonus / Loan / Insurance / dll
   - **Nama:** deskripsi komponen
   - **Jumlah:** nominal (Rp)
   - **Recurring:** centang jika berulang setiap bulan
   - **Periode:** tanggal mulai dan selesai (untuk recurring)
4. Klik **Simpan**

**Contoh Penggunaan:**
- Cicilan pinjaman Rp500.000/bulan selama 12 bulan
- Bonus proyek one-off Rp2.000.000
- Tunjangan transport Rp300.000/bulan (recurring)

### 2.16 Cabang & GPS

Kelola lokasi cabang perusahaan dengan geofence.

[Screenshot: Peta cabang dengan radius geofence dan form edit]

**Menambah Cabang:**

1. Klik **+ Tambah Cabang**
2. Isi formulir:
   - **Nama Cabang:** contoh "Kantor Pusat Jakarta"
   - **Kota:** Jakarta
   - **Alamat:** Jl. Sudirman No. 1
   - **Koordinat:** Klik pada peta Leaflet atau input manual (latitude, longitude)
   - **Radius Geofence:** dalam meter (default: 100m)
3. Klik **Simpan**

**QR Code Generator:**
- Setiap cabang memiliki tombol **Generate QR**
- QR berisi JWT token dengan TTL 60 detik
- QR otomatis expired dan harus di-generate ulang
- Digunakan untuk mode absensi QR Code

**Validasi GPS:**
- Sistem menggunakan formula Haversine untuk menghitung jarak
- Pegawai harus berada dalam radius geofence saat absensi
- Jika di luar radius → absensi ditolak dengan pesan error

### 2.17 CMS (Content Management System)

Kelola konten yang ditampilkan di aplikasi pegawai.

[Screenshot: Daftar konten CMS dengan kategori]

**Jenis Konten:**
- **Banner** — Gambar slider di dashboard pegawai
- **Artikel** — Berita/informasi perusahaan
- **Pengumuman** — Notifikasi penting (tampil di dashboard)
- **Promo** — Informasi benefit/promo karyawan

**Membuat Konten:**

1. Klik **+ Buat Konten**
2. Pilih jenis (Banner/Artikel/Pengumuman/Promo)
3. Isi: judul, isi/deskripsi, gambar (upload), kategori
4. Atur status: Draft / Published
5. Klik **Publish**

### 2.18 Notifikasi (Admin)

Overview template notifikasi dan status channel.

[Screenshot: Halaman notifikasi admin dengan status channel]

**Channel Notifikasi:**
| Channel | Status | Keterangan |
|---------|--------|------------|
| WhatsApp | ✅ / ⚠️ Fallback | Via WhatsApp Cloud API |
| Push Notification | ✅ | Via Service Worker (PWA) |
| Email | ✅ / ❌ | Opsional |

**Template yang Tersedia:**
- Pengingat check-in
- Notifikasi cuti disetujui/ditolak
- Notifikasi lembur disetujui/ditolak
- Slip gaji tersedia
- Pengumuman baru

### 2.19 Keamanan

Monitoring fitur keamanan dan audit log.

[Screenshot: Halaman keamanan dengan daftar fitur aktif dan audit log]

**Fitur Keamanan Aktif:**
- ✅ JWT Authentication (HS256 + httpOnly cookie)
- ✅ Edge Middleware Route Protection
- ✅ Role-Based Access Control (RBAC)
- ✅ Password Hashing (bcrypt)
- ✅ Input Validation (Zod)
- ✅ Multi-Tenant Isolation (companyId)
- ✅ Audit Logging
- ✅ Timezone-Aware Calculations

**Audit Log:**
Tabel log aktivitas dari database, mencakup:
- Login/logout
- Check-in/check-out
- GPS rejection (di luar geofence)
- Koreksi manual absensi
- Perubahan data pegawai
- Generate payroll

Filter: berdasarkan tanggal, tipe aksi, user.

### 2.20 Pengaturan Umum

Overview konfigurasi sistem dengan link ke semua halaman pengaturan.

[Screenshot: Halaman settings dengan status sistem]

**System Status:**
| Service | Status | Keterangan |
|---------|--------|------------|
| Cloudflare R2 | ✅ Connected / ⚠️ Fallback (base64) | File storage |
| WhatsApp API | ✅ Connected / ⚠️ Mock mode | Notifikasi |
| Socket.IO | ✅ Connected / ⚠️ Polling mode | Realtime |

**Quick Links:**
- Pengaturan Payroll
- Manajemen Shift
- Hari Libur
- Cabang & GPS
- Kuota Cuti


---

## 3. Panduan Pegawai

### 3.1 Instalasi PWA

MAS dapat di-install sebagai aplikasi di smartphone:

**Android (Chrome):**
1. Buka URL aplikasi MAS di Chrome
2. Tap ikon menu (⋮) di kanan atas
3. Pilih **"Add to Home Screen"** atau **"Install App"**
4. Konfirmasi instalasi
5. Aplikasi akan muncul di home screen

**iOS (Safari):**
1. Buka URL aplikasi MAS di Safari
2. Tap ikon Share (↑) di bawah
3. Scroll dan pilih **"Add to Home Screen"**
4. Beri nama dan tap **Add**

### 3.2 Login Pegawai

1. Buka aplikasi MAS
2. Masukkan email dan password yang diberikan HR
3. Tap **Masuk**
4. Anda akan diarahkan ke Dashboard Pegawai

[Screenshot: Halaman login mobile]

### 3.3 Dashboard Pegawai

Halaman utama setelah login menampilkan informasi penting hari ini.

[Screenshot: Dashboard pegawai mobile dengan greeting dan menu grid]

**Komponen:**

1. **Greeting** — "Selamat Pagi, [Nama]!" (berubah sesuai waktu)
2. **Jam Realtime** — Jam digital yang berjalan (timezone Asia/Jakarta)
3. **Info Shift** — Shift hari ini (nama, jam mulai-selesai)
4. **Kartu Absensi** — Status hari ini:
   - Belum check-in → tombol "Check In" aktif
   - Sudah check-in → tampil jam masuk, tombol "Check Out" aktif
   - Sudah check-out → tampil jam masuk & keluar
5. **Menu Grid** — Akses cepat ke semua fitur:
   - Absensi, Riwayat, Cuti, Lembur, Timesheet, Slip Gaji, Chat, Profil
6. **Pengumuman** — Slider pengumuman terbaru dari CMS

### 3.4 Absensi Face Recognition

Mode absensi utama menggunakan kamera selfie dan validasi GPS.

[Screenshot: Kamera selfie dengan overlay frame wajah]

**Langkah Check-In:**

1. Dari dashboard, tap **Check In** atau buka menu **Absensi**
2. Izinkan akses kamera dan lokasi (jika belum)
3. Posisikan wajah dalam frame kamera
4. Sistem akan:
   - Mengambil foto selfie
   - Mendeteksi wajah dan menghitung confidence score
   - Mengambil koordinat GPS
   - Menghitung jarak ke kantor (formula Haversine)
   - Memeriksa apakah dalam radius geofence
   - Mendeteksi keterlambatan (berdasarkan shift + grace period)
5. Jika valid → **Check-in berhasil** ✅
6. Jika di luar geofence → **Ditolak** ❌ dengan pesan "Anda berada di luar area kantor"

**Deteksi Keterlambatan:**
- Sistem menggunakan timezone Asia/Jakarta (WIB)
- Contoh: Shift 08:00, grace 15 menit
  - Check-in 08:10 → **Hadir** (dalam grace period)
  - Check-in 08:20 → **Terlambat** (5 menit terlambat)

### 3.5 Absensi QR Code

Mode absensi alternatif dengan scan QR Code yang di-generate admin.

[Screenshot: Scanner QR code dengan viewfinder]

**Langkah:**

1. Dari dashboard, tap **Scan QR**
2. Izinkan akses kamera
3. Arahkan kamera ke QR Code yang ditampilkan di kantor
4. Sistem memvalidasi:
   - Token JWT dalam QR (TTL 60 detik)
   - Lokasi GPS (tetap dicek)
5. Jika QR valid dan belum expired → **Check-in berhasil** ✅
6. Jika QR expired → minta admin generate ulang

> **Catatan:** QR Code di-generate oleh admin per cabang dan hanya berlaku 60 detik untuk mencegah penyalahgunaan.

### 3.6 Check-Out

Proses pulang kerja dengan validasi GPS.

[Screenshot: Konfirmasi check-out dengan info lembur otomatis]

**Langkah:**

1. Tap **Check Out** di dashboard atau halaman absensi
2. Izinkan akses lokasi
3. Sistem memvalidasi GPS (harus dalam geofence)
4. **Deteksi Lembur Otomatis:**
   - Jika check-out > 30 menit setelah jam shift berakhir
   - Sistem otomatis menghitung selisih sebagai potensi lembur
   - Contoh: Shift selesai 17:00, check-out 19:30 → 2.5 jam lembur terdeteksi
5. Check-out berhasil → tampil ringkasan hari ini

### 3.7 Riwayat Absensi

Lihat rekap kehadiran dalam dua tampilan.

[Screenshot: Riwayat absensi tampilan list dan kalender]

**Tampilan List:**
- Daftar kronologis per hari
- Info: tanggal, jam masuk, jam keluar, status (hadir/terlambat/cuti/absen)
- Filter berdasarkan bulan

**Tampilan Kalender:**
- Kalender bulanan dengan warna per status:
  - 🟢 Hijau: Hadir
  - 🟡 Kuning: Terlambat
  - 🔴 Merah: Tidak Hadir
  - 🔵 Biru: Cuti
  - ⚪ Abu-abu: Hari Libur

**Export:**
- Download riwayat sebagai PDF atau Excel

### 3.8 Pengajuan Cuti

Ajukan cuti melalui aplikasi.

[Screenshot: Form pengajuan cuti dengan pilihan jenis dan tanggal]

**Langkah Mengajukan Cuti:**

1. Buka menu **Cuti**
2. Tap **+ Ajukan Cuti**
3. Isi formulir:
   - **Jenis Cuti:** Tahunan / Sakit / Izin / Darurat
   - **Tanggal Mulai:** pilih tanggal
   - **Tanggal Selesai:** pilih tanggal
   - **Alasan:** deskripsi singkat
   - **Lampiran:** upload surat dokter (untuk cuti sakit)
4. Tap **Kirim**
5. Status: **Pending** → menunggu approval

**Informasi Kuota:**
- Ditampilkan di bagian atas: sisa kuota per jenis cuti
- Contoh: "Cuti Tahunan: 8/12 hari tersisa"

**Membatalkan Pengajuan:**
- Hanya bisa dibatalkan jika status masih **Pending**
- Tap pengajuan → **Batalkan**

### 3.9 Pengajuan Lembur

Ajukan lembur untuk mendapat approval.

[Screenshot: Form pengajuan lembur]

**Langkah:**

1. Buka menu **Lembur**
2. Tap **+ Ajukan Lembur**
3. Isi:
   - **Tanggal:** pilih tanggal lembur
   - **Jam Mulai — Jam Selesai**
   - **Hari Libur:** centang jika lembur di hari libur/weekend (mempengaruhi tarif)
   - **Alasan:** deskripsi pekerjaan
4. Tap **Kirim**

**Riwayat Lembur:**
- Daftar pengajuan dengan status (Pending/Approved/Rejected)
- Detail: tanggal, jam, total jam, estimasi bayaran

**Membatalkan:**
- Hanya bisa dibatalkan jika status **Pending**

### 3.10 Timesheet Pegawai

Rekap jam kerja bulanan.

[Screenshot: Timesheet bulanan dengan total jam dan keterlambatan]

**Informasi yang Ditampilkan:**
- Total jam kerja bulan ini
- Total menit keterlambatan
- Total jam lembur (approved)
- Breakdown per hari: jam masuk, jam keluar, durasi

### 3.11 Slip Gaji (Payroll)

Lihat dan download slip gaji.

[Screenshot: Slip gaji dengan breakdown pendapatan dan potongan]

**Cara Melihat Slip Gaji:**

1. Buka menu **Slip Gaji**
2. Pilih periode (bulan/tahun)
3. Slip menampilkan breakdown lengkap:

**Pendapatan:**
- Gaji Pokok
- Tunjangan
- Lembur (weekday + holiday)
- Bonus (jika ada)
- THR (jika ada)
- Komponen tambahan

**Potongan:**
- BPJS Kesehatan (1%)
- BPJS JHT (2%)
- BPJS JP (1%)
- PPh 21
- Potongan Keterlambatan
- Potongan lain (pinjaman, dll)

**Total:**
- **Take Home Pay** = Total Pendapatan - Total Potongan

**Download:**
- **PDF** — Slip gaji format cetak (layout 2 kolom)
- **Print** — Langsung cetak dari browser

**Riwayat:**
- Lihat slip gaji bulan-bulan sebelumnya

### 3.12 Chat

Komunikasi internal peer-to-peer.

[Screenshot: Tampilan chat dengan daftar kontak dan percakapan]

**Fitur Chat:**

1. **Daftar Percakapan** — Semua chat aktif dengan preview pesan terakhir
2. **Unread Indicator** — Badge jumlah pesan belum dibaca
3. **Contact Picker** — Cari dan mulai chat baru dengan rekan kerja
4. **Percakapan:**
   - Kirim pesan teks
   - Kirim file attachment (max 5MB)
   - Timestamp per pesan
   - Status: terkirim / dibaca

**Memulai Chat Baru:**
1. Tap ikon **+** atau **Kontak Baru**
2. Cari nama rekan kerja
3. Tap nama → buka percakapan
4. Ketik pesan dan kirim

### 3.13 Notifikasi

Pusat notifikasi dengan deep-link.

[Screenshot: Inbox notifikasi dengan kategori]

**Jenis Notifikasi:**
- Cuti disetujui/ditolak
- Lembur disetujui/ditolak
- Slip gaji tersedia
- Pengumuman baru
- Pesan chat baru

**Fitur:**
- **Deep-link** — Tap notifikasi → langsung ke halaman terkait
- **Mark as Read** — Tandai sudah dibaca
- **Filter** — Filter berdasarkan kategori

### 3.14 Berita & Pengumuman

Feed informasi perusahaan.

[Screenshot: Daftar berita dengan kategori dan thumbnail]

- Artikel/berita dari CMS admin
- Kategori: Umum, HR, Event, Promo
- Tap untuk baca detail lengkap

### 3.15 Profil

Kelola data pribadi.

[Screenshot: Halaman profil dengan avatar dan form edit]

**Yang Dapat Diedit Pegawai:**
- Nama tampilan
- Nomor HP
- Data bank (nama bank, no. rekening, atas nama)
- Avatar/foto profil (upload)
- Password (ganti password)

**Yang Hanya Bisa Dilihat:**
- NIP, email, divisi, jabatan, cabang (dikelola HR)

### 3.16 Kartu Identitas Digital (ID Card)

Kartu pegawai digital dengan branding perusahaan.

[Screenshot: ID Card digital dengan logo perusahaan dan foto pegawai]

**Fitur:**
- Tampilan kartu identitas dengan:
  - Logo perusahaan
  - Foto pegawai
  - Nama, NIP, jabatan, divisi
  - QR Code identitas
- **Download PNG** — Resolusi 3× untuk kualitas cetak
- **Download PDF** — Format A4 dengan kartu di tengah (siap cetak)


---

## 4. Pengaturan Sistem

### 4.1 Konfigurasi Payroll

Pengaturan payroll dapat diakses melalui **Sidebar → Payroll → Pengaturan Payroll**.

**Parameter Jam Kerja:**
```
Jam Kerja per Bulan: 173 jam (default)
```
Angka ini digunakan sebagai pembagi untuk menghitung tarif per jam (hourly rate) yang menjadi basis perhitungan lembur dan potongan keterlambatan.

**Parameter Tunjangan:**
```
Tunjangan Default: 27%
```
Jika pegawai tidak memiliki tunjangan spesifik, sistem menggunakan 27% dari gaji pokok sebagai tunjangan tetap.

**Parameter Keterlambatan:**
```
Cap Potongan Telat: 10%
```
Potongan keterlambatan tidak akan melebihi 10% dari gaji bulanan (gaji pokok + tunjangan), berapapun total menit keterlambatan.

**Parameter Lembur:**
```
Weekday Jam-1:  1.5×
Weekday Jam-2+: 2.0×
Holiday Jam 1-8: 2.0×
Holiday Jam-9:   3.0×
Holiday Jam-10+: 4.0×
```

**Parameter THR:**
```
THR Full: 12 bulan (masa kerja untuk THR penuh)
THR Min:  1 bulan (minimal masa kerja untuk eligible THR)
```

**Toggle BPJS:**
- BPJS Kesehatan: On/Off
- BPJS JHT: On/Off
- BPJS JP: On/Off

**Kelas JKK:**
Pilih kelas risiko perusahaan (1-5):
| Kelas | Rate | Contoh Industri |
|:-----:|:----:|-----------------|
| 1 | 0.24% | Perkantoran, jasa keuangan |
| 2 | 0.54% | Retail, perdagangan |
| 3 | 0.89% | Manufaktur ringan, restoran |
| 4 | 1.27% | Konstruksi, transportasi |
| 5 | 1.74% | Pertambangan, migas |

### 4.2 Konfigurasi Shift

Akses: **Sidebar → Manajemen → Shift**

Setiap shift memiliki properti:
- **Nama:** Identifikasi shift (Pagi, Siang, Malam, Flexible)
- **Jam Mulai (start_time):** Waktu mulai kerja
- **Jam Selesai (end_time):** Waktu selesai kerja
- **Grace Minutes:** Toleransi keterlambatan dalam menit
- **Tipe:** Regular atau Flexible

**Contoh Konfigurasi:**

| Shift | Mulai | Selesai | Grace | Tipe |
|-------|:-----:|:-------:|:-----:|------|
| Pagi | 08:00 | 17:00 | 15 min | Regular |
| Siang | 13:00 | 22:00 | 10 min | Regular |
| Malam | 22:00 | 07:00 | 15 min | Regular |
| Flexible | 07:00 | 10:00 | 60 min | Flexible |

### 4.3 Konfigurasi Hari Libur

Akses: **Sidebar → Manajemen → Hari Libur**

**Kategori:**
- **Nasional** — Hari libur resmi pemerintah (17 Agustus, 1 Januari, dll)
- **Keagamaan** — Idul Fitri, Natal, Nyepi, Waisak, dll
- **Perusahaan** — Hari jadi perusahaan, cuti bersama internal

**Flag Recurring:**
- Jika dicentang, hari libur otomatis berlaku setiap tahun pada tanggal yang sama
- Cocok untuk: 17 Agustus, 1 Januari, 1 Mei
- Tidak cocok untuk: Idul Fitri (tanggal berubah setiap tahun)

**Dampak pada Sistem:**
1. Pegawai tidak dihitung absen di hari libur
2. Lembur di hari libur menggunakan tarif holiday (2×/3×/4×)
3. Tampil di kalender pegawai dengan warna khusus

### 4.4 Konfigurasi Cabang & Geofence

Akses: **Sidebar → Konfigurasi → Cabang & GPS**

**Parameter per Cabang:**
- **Latitude & Longitude** — Titik pusat kantor (klik pada peta atau input manual)
- **Radius (meter)** — Jarak maksimal dari titik pusat yang masih dianggap valid
  - Rekomendasi: 50-100m untuk gedung perkantoran, 200-500m untuk area pabrik/gudang

**Cara Menentukan Koordinat:**
1. Buka halaman Cabang & GPS
2. Klik lokasi kantor pada peta Leaflet
3. Koordinat otomatis terisi
4. Atur radius sesuai luas area kantor
5. Preview lingkaran geofence pada peta

**QR Code per Cabang:**
- Setiap cabang dapat generate QR Code unik
- QR berisi JWT token terenkripsi dengan payload: `{ branchId, companyId, exp }`
- TTL: 60 detik (harus di-generate ulang secara berkala)
- Tampilkan QR di monitor/TV di lobby kantor

### 4.5 Konfigurasi Kuota Cuti

Akses: **Sidebar → Manajemen → Kuota Cuti**

**Default Kuota per Tahun:**
| Jenis | Kuota | Dasar Hukum |
|-------|:-----:|-------------|
| Tahunan | 12 hari | UU 13/2003 Pasal 79 |
| Sakit | Sesuai surat | UU 13/2003 Pasal 93 |
| Izin | 3 hari | Kebijakan perusahaan |
| Darurat | 3 hari | Kebijakan perusahaan |

**Operasi:**
- **Edit Individual:** Klik sel pada matriks → ubah kuota pegawai tertentu
- **Bulk Reset:** Awal tahun, klik "Reset Semua" → semua kuota kembali ke default
- **Carry Over:** Jika perusahaan mengizinkan sisa cuti dibawa ke tahun berikutnya, edit manual

---

## 5. Perhitungan Payroll

### 5.1 Struktur Gaji

```
┌─────────────────────────────────────────────────┐
│              PENDAPATAN (EARNINGS)                │
├─────────────────────────────────────────────────┤
│ Gaji Pokok (Base Salary)                         │
│ + Tunjangan Tetap (Fixed Allowance)              │
│ + Lembur (Overtime Pay)                          │
│ + Bonus (jika ada)                               │
│ + THR (jika ada)                                 │
│ + Komponen Tambahan (Extra Earnings)             │
│ = TOTAL PENDAPATAN                               │
├─────────────────────────────────────────────────┤
│              POTONGAN (DEDUCTIONS)                │
├─────────────────────────────────────────────────┤
│ BPJS Kesehatan (1% karyawan)                     │
│ + BPJS JHT (2% karyawan)                        │
│ + BPJS JP (1% karyawan)                         │
│ + PPh 21                                         │
│ + Potongan Keterlambatan                         │
│ + Komponen Tambahan (Extra Deductions)           │
│ = TOTAL POTONGAN                                 │
├─────────────────────────────────────────────────┤
│ TAKE HOME PAY = TOTAL PENDAPATAN - TOTAL POTONGAN│
└─────────────────────────────────────────────────┘
```

### 5.2 PPh 21 (Pajak Penghasilan)

**Dasar Hukum:** UU HPP 7/2021, PMK 168/2023

**Tarif Progresif:**
| Penghasilan Kena Pajak (PKP) | Tarif |
|------------------------------|:-----:|
| Rp 0 — Rp 60.000.000 | 5% |
| Rp 60.000.001 — Rp 250.000.000 | 15% |
| Rp 250.000.001 — Rp 500.000.000 | 25% |
| Rp 500.000.001 — Rp 5.000.000.000 | 30% |
| > Rp 5.000.000.000 | 35% |

**PTKP (Penghasilan Tidak Kena Pajak):**
| Status | PTKP/Tahun |
|--------|:----------:|
| TK/0 (Tidak Kawin, tanpa tanggungan) | Rp 54.000.000 |
| TK/1 | Rp 58.500.000 |
| TK/2 | Rp 63.000.000 |
| TK/3 | Rp 67.500.000 |
| K/0 (Kawin, tanpa tanggungan) | Rp 58.500.000 |
| K/1 | Rp 63.000.000 |
| K/2 | Rp 67.500.000 |
| K/3 | Rp 72.000.000 |

**Formula Perhitungan PPh 21 Bulanan:**

```
1. Penghasilan Bruto Tahunan = (Gaji Pokok + Tunjangan) × 12
2. Biaya Jabatan = 5% × Bruto Tahunan (max Rp 6.000.000/tahun = Rp 500.000/bulan)
3. Iuran BPJS Karyawan Tahunan = (BPJS Kes + JHT + JP) × 12
4. Penghasilan Neto Tahunan = Bruto Tahunan - Biaya Jabatan - BPJS Karyawan
5. PKP = Neto Tahunan - PTKP (dibulatkan ke bawah ribuan)
6. PPh 21 Tahunan = Tarif Progresif × PKP
7. PPh 21 Bulanan = PPh 21 Tahunan ÷ 12
```

**Tanpa NPWP:** PPh 21 × 120% (tambahan 20%)

### 5.3 BPJS

#### BPJS Kesehatan (Perpres 64/2020)
```
Basis: min(Gaji Pokok + Tunjangan, Rp 12.000.000)
Karyawan: 1% × Basis
Pemberi Kerja: 4% × Basis
```

#### BPJS Ketenagakerjaan — JHT (PP 46/2015)
```
Basis: Gaji Pokok + Tunjangan (tanpa cap)
Karyawan: 2% × Basis
Pemberi Kerja: 3.7% × Basis
```

#### BPJS Ketenagakerjaan — JP (PP 45/2015)
```
Basis: min(Gaji Pokok + Tunjangan, Rp 10.547.400)
Karyawan: 1% × Basis
Pemberi Kerja: 2% × Basis
```

#### BPJS Ketenagakerjaan — JKK (PP 44/2015)
```
Basis: Gaji Pokok + Tunjangan
Pemberi Kerja: Rate sesuai kelas (0.24% - 1.74%)
Karyawan: 0% (ditanggung pemberi kerja)
```

#### BPJS Ketenagakerjaan — JKM (PP 44/2015)
```
Basis: Gaji Pokok + Tunjangan
Pemberi Kerja: 0.3%
Karyawan: 0% (ditanggung pemberi kerja)
```

### 5.4 Perhitungan Lembur

**Dasar Hukum:** Permenaker 102/MEN/VI/2004

**Tarif Per Jam:**
```
Hourly Rate = (Gaji Pokok + Tunjangan) ÷ 173
```

#### Lembur Hari Kerja (Weekday)
```
Jam ke-1: 1.5 × Hourly Rate
Jam ke-2 dst: 2.0 × Hourly Rate
```

**Contoh:** Lembur 3 jam di hari kerja
```
= (1 × 1.5 × HR) + (2 × 2.0 × HR)
= 1.5 HR + 4.0 HR
= 5.5 × Hourly Rate
```

#### Lembur Hari Libur/Weekend (5 hari kerja/minggu)
```
Jam ke-1 s/d 8: 2.0 × Hourly Rate
Jam ke-9:       3.0 × Hourly Rate
Jam ke-10 dst:  4.0 × Hourly Rate
```

**Contoh:** Lembur 10 jam di hari libur
```
= (8 × 2.0 × HR) + (1 × 3.0 × HR) + (1 × 4.0 × HR)
= 16 HR + 3 HR + 4 HR
= 23 × Hourly Rate
```

### 5.5 Potongan Keterlambatan

```
Minute Rate = Hourly Rate ÷ 60
Potongan = Minute Rate × Total Menit Terlambat
Cap = 10% × (Gaji Pokok + Tunjangan)
Potongan Final = min(Potongan, Cap)
```

**Contoh:**
- Gaji + Tunjangan = Rp 7.000.000
- Hourly Rate = 7.000.000 ÷ 173 = Rp 40.462
- Minute Rate = 40.462 ÷ 60 = Rp 674
- Terlambat total bulan ini: 90 menit
- Potongan = 674 × 90 = Rp 60.694
- Cap = 10% × 7.000.000 = Rp 700.000
- Potongan Final = Rp 60.694 (di bawah cap)

### 5.6 THR (Tunjangan Hari Raya)

**Dasar Hukum:** Permenaker 6/2016

**Ketentuan:**
- Masa kerja ≥ 12 bulan → THR = 1 bulan upah (Gaji Pokok + Tunjangan Tetap)
- Masa kerja 1-11 bulan → THR = (Masa Kerja ÷ 12) × Upah (pro-rata)
- Masa kerja < 1 bulan → Tidak eligible

**Contoh Pro-rata:**
- Gaji Pokok: Rp 5.000.000
- Tunjangan: Rp 1.350.000
- Upah: Rp 6.350.000
- Masa kerja: 8 bulan
- THR = (8 ÷ 12) × 6.350.000 = Rp 4.233.333

### 5.7 Contoh Perhitungan Lengkap

**Data Pegawai:**
- Nama: Andini Putri
- Gaji Pokok: Rp 7.000.000
- Tunjangan: Rp 1.890.000 (27%)
- Status PTKP: TK/0
- Memiliki NPWP: Ya
- Kelas JKK: 1
- Lembur bulan ini: 5 jam weekday + 8 jam holiday
- Keterlambatan: 45 menit total
- Komponen tambahan: Bonus Rp 500.000

**Perhitungan:**

```
PENDAPATAN:
├── Gaji Pokok:           Rp  7.000.000
├── Tunjangan:            Rp  1.890.000
├── Lembur Weekday:
│   = (1×1.5 + 4×2.0) × (8.890.000÷173)
│   = 9.5 × Rp 51.387
│   =                    Rp    488.179
├── Lembur Holiday:
│   = 8 × 2.0 × Rp 51.387
│   =                    Rp    822.197
├── Bonus:                Rp    500.000
└── TOTAL PENDAPATAN:     Rp 10.700.376

POTONGAN:
├── BPJS Kesehatan:
│   = 1% × Rp 8.890.000
│   =                    Rp     88.900
├── BPJS JHT:
│   = 2% × Rp 8.890.000
│   =                    Rp    177.800
├── BPJS JP:
│   = 1% × Rp 8.890.000
│   =                    Rp     88.900
├── PPh 21:
│   Bruto Tahunan = 8.890.000 × 12 = 106.680.000
│   Biaya Jabatan = 5% × 106.680.000 = 5.334.000
│   BPJS Karyawan Tahunan = 355.600 × 12 = 4.267.200
│   Neto = 106.680.000 - 5.334.000 - 4.267.200 = 97.078.800
│   PKP = 97.078.800 - 54.000.000 = 43.078.000
│   PPh Tahunan = 5% × 43.078.000 = 2.153.900
│   PPh Bulanan =        Rp    179.492
├── Potongan Telat:
│   = (51.387÷60) × 45 = Rp     38.540
└── TOTAL POTONGAN:       Rp    573.632

═══════════════════════════════════════
TAKE HOME PAY:            Rp 10.126.744
═══════════════════════════════════════

DITANGGUNG PERUSAHAAN (tidak dipotong dari gaji):
├── BPJS Kesehatan (4%):  Rp    355.600
├── BPJS JHT (3.7%):     Rp    328.930
├── BPJS JP (2%):        Rp    177.800
├── BPJS JKK (0.24%):    Rp     21.336
└── BPJS JKM (0.3%):     Rp     26.670
```


---

## 6. Keamanan & Audit

### 6.1 Autentikasi

**Mekanisme:**
- Login menghasilkan JWT token (algoritma HS256)
- Token disimpan dalam httpOnly cookie (tidak bisa diakses JavaScript client)
- Token memiliki expiry time (default: 24 jam)
- Setiap request API memvalidasi token melalui Edge Middleware

**Proteksi Route:**
- Edge Middleware Next.js memeriksa keberadaan dan validitas token
- Route `/admin/*` hanya bisa diakses role: super_admin, owner, hr_admin
- Route `/employee/*` hanya bisa diakses role: employee, supervisor
- Route `/api/*` memvalidasi token dan companyId

**Password:**
- Di-hash menggunakan bcrypt (cost factor default)
- Password lama tidak pernah disimpan dalam plaintext
- Minimum 8 karakter saat registrasi/ganti password

### 6.2 Multi-Tenant Isolation

Sistem mendukung multiple perusahaan (multi-tenant) dengan isolasi ketat:

- Setiap record di database memiliki kolom `company_id`
- Semua query otomatis di-filter berdasarkan `companyId` dari token JWT
- Pegawai perusahaan A tidak bisa melihat data perusahaan B
- Admin perusahaan A tidak bisa mengakses endpoint perusahaan B

### 6.3 Validasi Input

Semua input dari client divalidasi menggunakan **Zod** schema:
- Tipe data (string, number, date)
- Format (email, UUID, phone number)
- Range (min/max length, min/max value)
- Enum (status, role, jenis cuti)
- Custom validation (koordinat GPS, file size)

Jika validasi gagal, API mengembalikan error 400 dengan detail field yang bermasalah.

### 6.4 Role-Based Access Control (RBAC)

Setiap API endpoint memiliki dekorator role yang diizinkan:

```
GET  /api/admin/employees     → [super_admin, hr_admin]
POST /api/admin/payroll       → [super_admin, hr_admin]
GET  /api/admin/analytics     → [super_admin, owner, hr_admin]
POST /api/employee/attendance → [employee, supervisor]
GET  /api/employee/payslip    → [employee, supervisor]
```

Akses di luar role yang diizinkan menghasilkan HTTP 403 Forbidden.

### 6.5 Audit Log

Sistem mencatat aktivitas penting ke tabel audit log:

| Event | Data yang Dicatat |
|-------|-------------------|
| Login | userId, IP, timestamp, success/fail |
| Check-in | userId, koordinat, jarak, status, foto |
| Check-out | userId, koordinat, overtime detected |
| GPS Rejection | userId, koordinat, jarak, radius cabang |
| Koreksi Manual | adminId, targetUserId, field yang diubah, nilai lama → baru |
| Generate Payroll | adminId, periode, jumlah pegawai |
| Perubahan Data | adminId, tabel, recordId, perubahan |

**Akses Audit Log:**
1. Buka **Sidebar → Konfigurasi → Keamanan**
2. Scroll ke bagian **Audit Log**
3. Filter berdasarkan: tanggal, tipe event, user
4. Data tidak bisa dihapus (append-only)

### 6.6 Timezone Handling

Semua perhitungan waktu menggunakan timezone **Asia/Jakarta (WIB, UTC+7)**:
- Deteksi keterlambatan
- Perhitungan lembur
- Timestamp absensi
- Periode payroll

Implementasi menggunakan `Intl.DateTimeFormat` dengan timezone eksplisit untuk menghindari masalah server yang berada di timezone berbeda.

---

## 7. Integrasi

### 7.1 WhatsApp Cloud API

**Fungsi:** Mengirim notifikasi ke pegawai via WhatsApp.

**Konfigurasi:**
- Token API WhatsApp Business diset di environment variable
- Jika token tidak tersedia atau API gagal → sistem fallback ke mock (notifikasi tetap tercatat di database, tidak terkirim ke WhatsApp)

**Notifikasi yang Dikirim:**
- Pengingat check-in (pagi hari)
- Cuti disetujui/ditolak
- Lembur disetujui/ditolak
- Slip gaji tersedia
- Pengumuman penting

**Status di Admin:**
- ✅ **Connected** — WhatsApp API aktif dan terverifikasi
- ⚠️ **Fallback/Mock** — API tidak tersedia, notifikasi hanya in-app

### 7.2 Cloudflare R2 (File Storage)

**Fungsi:** Menyimpan file upload (foto selfie, attachment chat, avatar, dokumen).

**Konfigurasi:**
- Bucket R2 dikonfigurasi via environment variable (endpoint, access key, secret key, bucket name)
- Kompatibel dengan S3 API (menggunakan AWS SDK)

**Graceful Fallback:**
- Jika R2 tidak dikonfigurasi atau gagal → file disimpan sebagai base64 di database
- Fungsionalitas tetap berjalan normal, hanya storage yang berbeda
- Rekomendasi: gunakan R2 untuk production (performa lebih baik, hemat database)

**File yang Disimpan:**
| Jenis | Max Size | Format |
|-------|:--------:|--------|
| Selfie absensi | ~500KB | JPEG (compressed) |
| Avatar profil | 2MB | JPEG/PNG |
| Attachment chat | 5MB | Any |
| Dokumen cuti | 5MB | PDF/JPEG/PNG |

### 7.3 Socket.IO (Realtime)

**Fungsi:** Komunikasi realtime antara server dan client.

**Arsitektur:**
- Custom Node.js server (`server.js`) menjalankan Socket.IO bersamaan dengan Next.js
- Client terhubung via WebSocket (upgrade dari HTTP)
- Fallback: long-polling 30 detik (untuk environment tanpa WebSocket, contoh: Vercel)

**Events:**

| Event | Arah | Deskripsi |
|-------|------|-----------|
| `attendance:check-in` | Server → Client | Pegawai baru check-in |
| `attendance:check-out` | Server → Client | Pegawai check-out |
| `leave:applied` | Server → Client | Pengajuan cuti baru |
| `leave:decided` | Server → Client | Cuti disetujui/ditolak |
| `overtime:applied` | Server → Client | Pengajuan lembur baru |
| `overtime:decided` | Server → Client | Lembur disetujui/ditolak |
| `notification` | Server → Client | Notifikasi baru |
| `conv:message` | Server → Client | Pesan chat baru |

**Rooms:**
- `company:{companyId}` — Semua user dalam satu perusahaan (untuk broadcast)
- `admin:{companyId}` — Hanya admin (untuk live feed dashboard)
- `user:{userId}` — Per user (untuk chat dan notifikasi personal)

**Penggunaan di UI:**
- Dashboard Admin: Live Activity Feed
- Live Tracking: Update posisi realtime
- Overtime/Leave: Pengajuan baru muncul tanpa refresh
- Chat: Pesan masuk instant
- Notification bell: Badge count update

### 7.4 Export PDF & Excel

**PDF (pdfkit):**
- Header: logo perusahaan, nama perusahaan, alamat
- Tabel: zebra rows (alternating background), border
- Footer: tanggal cetak, halaman
- Encoding: UTF-8 (mendukung karakter Indonesia)

**Excel (exceljs):**
- Header row: bold, background color, frozen
- Format currency: `#,##0` (Rp 1.000.000)
- Format tanggal: `DD/MM/YYYY`
- Auto-width kolom
- Sheet name sesuai konteks

**Slip Gaji PDF (jspdf):**
- Layout custom 2 kolom (Pendapatan | Potongan)
- Box "Take Home Pay" di bawah
- Info pegawai: nama, NIP, periode, jabatan
- Info perusahaan: nama, NPWP, alamat

**ID Card (html-to-image + jspdf):**
- PNG: resolusi 3× (untuk kualitas cetak)
- PDF: A4 portrait, kartu di-center

### 7.5 GPS & Geofencing

**Formula Haversine:**
Menghitung jarak antara dua titik koordinat di permukaan bumi:

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c

R = 6.371.000 meter (radius bumi)
```

**Validasi Geofence:**
```
IF distance(pegawai, cabang) ≤ radius_cabang THEN
  → Absensi VALID
ELSE
  → Absensi DITOLAK
  → Catat di audit log sebagai "GPS Rejection"
END IF
```

**Akurasi GPS:**
- Smartphone modern: ±3-10 meter (outdoor)
- Indoor: ±10-50 meter (tergantung sinyal)
- Rekomendasi radius minimum: 50 meter (untuk mengakomodasi error GPS indoor)

---

## 8. FAQ & Troubleshooting

### 8.1 FAQ Umum

**Q: Apakah MAS bisa diakses tanpa internet?**
A: MAS membutuhkan koneksi internet untuk semua fitur utama (absensi, chat, payroll). Sebagai PWA, halaman yang sudah pernah dibuka akan ter-cache oleh Service Worker, namun fitur yang membutuhkan server (absensi, submit data) tetap memerlukan koneksi.

**Q: Apakah bisa absensi dari rumah?**
A: Tidak, kecuali admin mengatur radius geofence yang mencakup lokasi rumah pegawai (misalnya untuk WFH). Sistem memvalidasi GPS dan hanya menerima absensi dalam radius yang ditentukan per cabang.

**Q: Bagaimana jika GPS tidak akurat?**
A: Pastikan:
1. GPS/Location Services aktif di pengaturan HP
2. Izin lokasi diberikan ke browser (Allow)
3. Berada di area terbuka (bukan basement)
4. Jika tetap bermasalah, hubungi admin untuk koreksi manual

**Q: Berapa lama QR Code berlaku?**
A: QR Code berlaku 60 detik sejak di-generate. Setelah expired, admin harus generate ulang. Ini untuk mencegah screenshot QR digunakan dari lokasi lain.

**Q: Apakah foto selfie absensi disimpan?**
A: Ya, foto disimpan di Cloudflare R2 (atau database sebagai fallback) dan dapat dilihat oleh admin di halaman Monitoring Absensi. Foto digunakan sebagai bukti kehadiran.

**Q: Bagaimana jika lupa password?**
A: Hubungi HR/Admin untuk reset password. Saat ini belum ada fitur self-service reset password via email.

**Q: Apakah slip gaji bisa diakses bulan-bulan sebelumnya?**
A: Ya, pegawai dapat melihat riwayat slip gaji semua periode yang sudah di-generate oleh admin.

### 8.2 Troubleshooting Pegawai

#### Kamera tidak muncul saat absensi
**Penyebab:** Izin kamera tidak diberikan ke browser.
**Solusi:**
1. Buka Settings browser → Site Settings → Camera
2. Cari URL aplikasi MAS
3. Ubah permission ke "Allow"
4. Refresh halaman dan coba lagi

#### GPS menunjukkan "di luar area" padahal di kantor
**Penyebab:** GPS belum lock atau akurasi rendah (indoor).
**Solusi:**
1. Pastikan Location/GPS aktif di HP
2. Buka Google Maps sebentar untuk "warm up" GPS
3. Tunggu 10-30 detik agar GPS mendapat fix yang akurat
4. Coba lagi
5. Jika tetap gagal, gunakan mode QR Code atau hubungi admin

#### Notifikasi tidak muncul
**Penyebab:** Push notification tidak diizinkan.
**Solusi:**
1. Buka Settings browser → Notifications
2. Izinkan notifikasi untuk URL MAS
3. Pastikan Do Not Disturb tidak aktif di HP

#### Aplikasi lambat atau tidak responsive
**Solusi:**
1. Clear cache browser (Settings → Clear Browsing Data)
2. Tutup tab lain yang tidak digunakan
3. Pastikan koneksi internet stabil
4. Jika di-install sebagai PWA: uninstall dan install ulang

#### Chat tidak realtime (pesan delay)
**Penyebab:** WebSocket terputus, fallback ke polling.
**Solusi:**
1. Refresh halaman
2. Periksa koneksi internet
3. Jika menggunakan VPN, coba matikan VPN

### 8.3 Troubleshooting Admin

#### Payroll menunjukkan angka 0 untuk pegawai tertentu
**Penyebab:** Data gaji pokok belum diisi.
**Solusi:**
1. Buka Manajemen Pegawai
2. Edit pegawai yang bermasalah
3. Pastikan field "Gaji Pokok" terisi
4. Generate ulang payroll

#### Export PDF/Excel gagal
**Penyebab:** Data terlalu besar atau timeout.
**Solusi:**
1. Coba filter data terlebih dahulu (per cabang/divisi)
2. Export dalam batch yang lebih kecil
3. Periksa koneksi internet (file di-generate di server)

#### Live Tracking tidak menampilkan marker
**Penyebab:** Belum ada pegawai yang check-in hari ini.
**Solusi:**
1. Pastikan sudah ada pegawai yang check-in
2. Refresh halaman
3. Periksa filter (mungkin ter-filter status tertentu)

#### Socket.IO menunjukkan "Polling mode"
**Penyebab:** Environment tidak mendukung WebSocket (contoh: Vercel).
**Solusi:**
- Ini normal untuk deployment di Vercel. Sistem otomatis fallback ke polling 30 detik.
- Untuk realtime penuh, deploy menggunakan custom server (`node server.js`) di VPS/container.

#### QR Code tidak bisa di-scan
**Penyebab:** QR sudah expired (>60 detik) atau kualitas tampilan rendah.
**Solusi:**
1. Generate QR baru (klik tombol Generate)
2. Tampilkan QR di layar yang cukup besar dan terang
3. Pastikan tidak ada glare/pantulan pada layar

### 8.4 Troubleshooting Deployment

#### Database connection error
```
Error: TURSO_DATABASE_URL is not defined
```
**Solusi:** Pastikan environment variable berikut terisi di `.env.local`:
```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

#### R2 upload gagal (fallback ke base64)
```
Warning: R2 upload failed, falling back to base64
```
**Solusi:** Periksa environment variable R2:
```env
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=your-bucket
```
Jika tidak dikonfigurasi, sistem tetap berjalan dengan base64 storage (tidak error, hanya warning).

#### WhatsApp notification gagal
```
Warning: WhatsApp API failed, using mock
```
**Solusi:** Periksa:
```env
WHATSAPP_TOKEN=your-token
WHATSAPP_PHONE_ID=your-phone-id
```
Jika tidak dikonfigurasi, notifikasi hanya tersimpan di database (in-app notification tetap berfungsi).

#### Build error setelah update
**Solusi:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

### 8.5 Kontak Support

Untuk bantuan teknis lebih lanjut:
- **Email:** support@manggala.id
- **Dokumentasi API:** `/api/docs` (jika tersedia)
- **Repository:** Internal Git

---

## Lampiran

### A. Keyboard Shortcuts (Desktop)

| Shortcut | Fungsi |
|----------|--------|
| `/` atau `Ctrl+K` | Focus ke search bar (admin) |
| `Esc` | Tutup modal/dropdown |

### B. Supported File Formats

| Konteks | Format yang Didukung | Max Size |
|---------|---------------------|:--------:|
| Selfie absensi | JPEG (auto-compressed) | ~500KB |
| Avatar profil | JPEG, PNG | 2MB |
| Attachment chat | Semua format | 5MB |
| Lampiran cuti | PDF, JPEG, PNG | 5MB |
| Export | PDF, XLSX | — |

### C. API Rate Limits

| Endpoint | Limit |
|----------|-------|
| Login | 5 attempts / 15 menit |
| Absensi | 1 check-in + 1 check-out / hari |
| Chat | 100 pesan / menit |
| Export | 10 requests / menit |

### D. Browser Compatibility

| Browser | Minimum Version | Status |
|---------|:--------------:|:------:|
| Google Chrome | 90+ | ✅ Full Support |
| Mozilla Firefox | 88+ | ✅ Full Support |
| Safari (iOS) | 14+ | ✅ Full Support |
| Microsoft Edge | 90+ | ✅ Full Support |
| Samsung Internet | 14+ | ✅ Full Support |
| Opera | 76+ | ✅ Full Support |

---

*Dokumen ini terakhir diperbarui pada Januari 2025. Untuk informasi terbaru, hubungi tim pengembang.*


---

## 9. Modul Payroll v2 — Improvements (Mei 2026)

### 9.1 PPh 21 — Migrasi ke TER PMK 168/2023

Sesuai Peraturan Menteri Keuangan Nomor 168/2023, perhitungan PPh 21 bulanan
sekarang menggunakan **Tarif Efektif Rata-rata (TER)** untuk Januari–November,
dan **rekonsiliasi progresif tahunan** di Desember.

- Kategori TER otomatis ditentukan dari status PTKP pegawai:
  - **A**: TK/0, TK/1, K/0
  - **B**: TK/2, TK/3, K/1, K/2
  - **C**: K/3
- Setting baru di `Pengaturan Payroll` → `Metode PPh 21`:
  - `TER` (default, rekomendasi 2024+)
  - `ANNUAL` (legacy progresif ÷ 12, untuk audit historis)
- Rekonsiliasi Desember otomatis hitung selisih antara progresif tahunan
  vs total TER yang telah dipotong Jan–Nov.
- Tarif non-NPWP +20% tetap berlaku.

### 9.2 Workflow Payroll (Draft → Approved → Paid)

Setiap baris payroll sekarang punya tombol aksi:

- **Approve** (icon centang hijau): hanya untuk status `draft`. Mengisi
  `approvedById` dan `approvedAt`.
- **Mark Paid** (icon dompet biru): hanya untuk status `approved`.
  Membuka modal yang meminta:
  - Metode pembayaran (Transfer / Tunai / Lainnya)
  - No. referensi (opsional)
  - Tanggal bayar
  Setelah disimpan, pegawai otomatis menerima notifikasi WhatsApp + bell.
- **Bukti Potong** (icon scroll ungu): generate PDF Form 1721-A1 tahunan
  untuk pegawai tsb (data diambil dari semua payroll tahun yang sama).
- **Hapus** (icon trash merah): hanya untuk status non-paid.

Payroll dengan status `paid` tidak bisa lagi diubah atau dihapus.

### 9.3 Bulk Add Komponen Payroll

Halaman `Komponen Payroll` punya tombol **Bulk Add** untuk menambahkan satu
komponen sekaligus ke banyak pegawai. Target bisa:

- Semua pegawai aktif
- Per divisi

Cocok untuk: tunjangan transport seragam, kasbon kolektif, dll.

### 9.4 Pro-rata Otomatis untuk Join/Resign Tengah Bulan

Calculator sekarang otomatis hitung faktor pro-rata berdasar hari kalender:

- Karyawan join 15 Mei dari 31 hari → faktor = 17/31 ≈ 0.55
- Karyawan resign 10 Mei dari 31 hari → faktor = 10/31 ≈ 0.32
- Karyawan resign sebelum bulan tsb → di-skip (tidak digenerate)

Field baru `employees.resignDate` digunakan sebagai signal.

### 9.5 Pengaturan Tambahan

Di halaman **Pengaturan Payroll**:

- **Hari Kerja per Minggu** (5 atau 6) — mempengaruhi rate lembur hari libur
  (5-day: 8 jam pertama 2x; 6-day: 7 jam pertama 2x sesuai Permenaker 102/2004).
- **Basis Potongan Telat** (Gaji Pokok / Gaji+Tunjangan) — default Gaji Pokok.
- **NPWP Perusahaan** + **Alamat Pajak** — muncul di slip gaji PDF dan
  rekap payroll PDF/Excel.

### 9.6 Slip Gaji Real (No More Fake Synthesize)

Endpoint `/api/payroll/me/export` sekarang return **404** jika payroll periode
yang diminta belum digenerate (sebelumnya dia synthesize estimasi dari
baseSalary, yang menyesatkan untuk dokumen pajak).

Slip PDF sekarang menampilkan:

- Nama + NPWP + alamat perusahaan di header
- Status PTKP + indikator NPWP/non-NPWP
- Bank + nomor rekening (4 digit terakhir) dari profil pegawai
- Tanggal pembayaran (jika sudah `paid`)
- Kontribusi BPJS dari perusahaan (separate dari take home)

### 9.7 Bukti Potong Tahunan (Form 1721-A1)

Endpoint baru: `GET /api/admin/payroll/bukti-potong?employeeId=xxx&year=YYYY`

Hasil PDF berisi:

- Identitas pemberi kerja (nama, NPWP, alamat) — diambil dari payroll-settings
- Identitas pegawai (nama, NPWP, status PTKP, jabatan)
- Tabel rincian per bulan: bruto, BPJS, PPh 21, take home
- Total tahunan
- Footer attestasi sesuai PMK 168/2023 + UU HPP 7/2021

Bisa diakses dari tombol scroll ungu di tabel payroll admin.

### 9.8 Audit Logging Lengkap

Semua mutasi payroll sekarang ter-log ke `audit_logs`:

- `payroll.generate` — saat generate massal
- `payroll.approved` / `payroll.paid` / `payroll.cancelled` — saat status
  berubah
- `payroll.delete`
- `payroll.thr.generate`
- `payroll.settings.update` (key yang berubah dicatat)
- `payroll.component.create` / `delete` / `bulkCreate`
- `payroll.buktiPotong.download`

### 9.9 Race Condition & Data Integrity

- UNIQUE constraint `(employee_id, period)` di tabel `payrolls` — mencegah
  generate ganda saat double-click.
- `monthEnd` sekarang dihitung pakai `new Date(year, month, 0)` — akurat
  untuk Februari 28/29 hari.
- Filter `status === 'active'` saat generate payroll dan THR — pegawai
  resign/leave tidak ikut digenerate.
- Skip update payroll yang sudah `approved`/`paid` saat re-generate (tidak
  menimpa data yang sudah final).

### 9.10 THR Pintar

- `payDate` default sekarang H-7 dari hari raya religious yang ada di tabel
  `holidays` bulan tsb. Fallback ke tanggal 7 bulan tsb jika tidak ada.
- Allowance sumber prioritas: component recurring `category=allowance`
  → fallback `baseSalary × allowanceDefaultPct`.
- Filter pegawai aktif saja.
- Audit log otomatis.

---

*Bagian ini diperbarui pada Mei 2026 mengikuti audit modul payroll.*


---

## 10. Modul Payroll v2.1 — Polishing (Mei 2026 - lanjutan)

### 10.1 Transaction Wrap di Generate

Setiap upsert payroll di endpoint `POST /api/admin/payroll` sekarang
dijalankan dalam `db.transaction()`. Jika ada gangguan jaringan ke Turso saat
update sebagian, transaksi akan rollback dan tidak meninggalkan data parsial.

### 10.2 Tabel `payroll_revisions` — Audit Histori Lengkap

Schema baru `payroll_revisions`:

| Field | Tipe | Catatan |
|---|---|---|
| `payrollId` | text | FK ke `payrolls`, cascade delete |
| `companyId` | text | tenant scoping |
| `revisedById` | text | userId yang melakukan |
| `action` | text | create / update / approve / paid / cancel / delete |
| `snapshot` | text (JSON) | full row payroll **sebelum** perubahan |
| `diff` | text (JSON) | `{field: {old, new}}` — hanya field yang berubah |
| `notes` | text | konteks tambahan |
| `createdAt` | integer | timestamp |

Setiap mutasi (generate baru, re-generate, approve, paid, cancel, delete)
otomatis di-log via helper `logRevision()`.

### 10.3 UI History Revisi

Di tabel admin payroll, tombol **History** (icon clock amber) per baris
membuka modal yang menampilkan timeline revisi:

- Action badge (CREATE / APPROVE / PAID / DELETE / dll)
- Tanggal & email pelaku revisi
- Notes (kalau ada)
- Tabel diff field-level: nama field, value sebelum (merah, coret), value
  sesudah (hijau)

Berguna untuk audit pajak, dispute pegawai, atau debugging.

### 10.4 Slip Employee — Visualisasi & Edukasi

Halaman `/app/payroll` di sisi karyawan sekarang menampilkan:

#### Donut Chart Komposisi Gaji
SVG donut menunjukkan proporsi gaji pokok, tunjangan, lembur, bonus+THR,
dan potongan. Total bruto kompak ditampilkan di tengah (mis. "Rp 12.5 jt").
Legenda ke kanan dengan warna + nilai per komponen.

#### Tooltip Edukasi PPh 21
Tombol "Edukasi PPh 21" di header section Potongan membuka bottom sheet:
- Penjelasan TER PMK 168/2023 (kategori A/B/C berdasarkan PTKP).
- Cara hitung: tarif TER × bruto bulanan untuk Jan–Nov.
- Rekonsiliasi tahunan di Desember.
- Tarif +20% tanpa NPWP.
- Tip: lengkapi NPWP di profil.

#### Card Kontribusi Perusahaan (Employer BPJS)
Card gradient violet menampilkan total `employerBpjs` dari payroll, dengan
penjelasan bahwa **tidak dipotong dari take home**, tapi dialokasikan untuk
perlindungan jangka panjang (Kesehatan, JHT, JP, JKK, JKM dari sisi
perusahaan).

Tombol info di pojok membuka bottom sheet edukasi BPJS dengan tabel rate
karyawan vs perusahaan untuk masing-masing program, plus dasar hukum
(Perpres 64/2020, PP 44/2015, PP 45/2015, PP 46/2015).

### 10.5 SDK Tambahan

```ts
api.adminPayrollRevisions(payrollId)
// → GET /api/admin/payroll/[id]/revisions
// returns { items: PayrollRevision[] }
```
