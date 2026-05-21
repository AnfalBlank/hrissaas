# MAS — Manggala Attendant System
## Pitch Deck

**Managed by PT Manggala Utama Indonesia**  
**Kontak:** +62 878-8424-1703 | admin@manggala-utama.id

---

## Slide 1: Cover

# MAS
### Manggala Attendant System

**Sistem HRIS Modern untuk Perusahaan Indonesia**

Absensi · Payroll · Cuti · Lembur · Analytics

*Managed by PT Manggala Utama Indonesia*

---

## Slide 2: Masalah

### HR di Indonesia masih manual & rawan error

| Masalah | Dampak |
|---|---|
| Absensi pakai fingerprint/kertas | Titip absen, data hilang, mesin rusak |
| Hitung gaji manual di Excel | Salah hitung PPh 21, BPJS, lembur |
| Approval cuti via chat | Tidak terdokumentasi, kuota tidak terkontrol |
| Tidak ada data real-time | Tidak tahu siapa yang telat/absen hari ini |
| Regulasi berubah (TER 2024) | HR harus belajar ulang setiap tahun |

**Rata-rata HR menghabiskan 40+ jam/bulan** untuk pekerjaan administratif yang seharusnya bisa diotomasi.

---

## Slide 3: Solusi

### MAS — Satu platform untuk semua kebutuhan HR

```
┌─────────────────────────────────────────────────┐
│                    MAS                           │
├──────────┬──────────┬──────────┬───────────────┤
│ Absensi  │ Payroll  │  Cuti &  │  Analytics    │
│ Face+GPS │ Otomatis │  Lembur  │  Real-time    │
├──────────┴──────────┴──────────┴───────────────┤
│  WhatsApp + Telegram + Push Notifications       │
│  Multi-tenant · Multi-cabang · PWA Mobile       │
└─────────────────────────────────────────────────┘
```

**Dari absensi sampai slip gaji — 1 klik.**

---

## Slide 4: Fitur Unggulan

### 1. Absensi Anti-Kecurangan

- **Liveness Detection** — kedipkan mata + motion analysis (bukan sekadar foto)
- **GPS Geofencing** — radius per cabang, tolak jika di luar area
- **QR Code dinamis** — token JWT 60 detik, tidak bisa screenshot
- **Foto selfie** check-in & check-out tersimpan sebagai bukti

### 2. Payroll 100% Compliant

- **PPh 21 TER PMK 168/2023** — tarif efektif rata-rata Jan-Nov + rekonsiliasi Desember
- **BPJS lengkap** — Kesehatan, JHT, JP, JKK, JKM (5 program)
- **Lembur Permenaker 102/2004** — weekday & holiday, 5/6 hari kerja
- **THR Permenaker 6/2016** — pro-rata otomatis
- **Bukti Potong 1721-A1** — generate PDF tahunan

### 3. Self-Service Pegawai

- Apply cuti/lembur dari HP → approval workflow → notifikasi otomatis
- Lihat slip gaji + download PDF
- Chat antar pegawai + attachment file
- ID Card digital

---

## Slide 5: Teknologi

### Progressive Web App — Install tanpa App Store

| Keunggulan | Detail |
|---|---|
| Akses dari mana saja | Browser HP/laptop, bisa di-install sebagai app |
| Real-time | Socket.IO WebSocket — update instan |
| Aman | JWT httpOnly, bcrypt, rate limiting, audit log |
| Scalable | Turso edge database, Cloudflare R2 storage |
| Notifikasi | WhatsApp + Telegram + in-app push |

**Tidak perlu download dari Play Store/App Store.**  
**Tidak perlu beli mesin fingerprint.**

---

## Slide 6: Compliance

### Selalu update mengikuti regulasi terbaru

| Regulasi | Status |
|---|---|
| UU HPP 7/2021 | ✅ PPh 21 progresif 5/15/25/30/35% |
| PMK 168/2023 | ✅ TER bulanan + rekonsiliasi tahunan |
| Permenaker 102/2004 | ✅ Lembur weekday & holiday |
| Permenaker 6/2016 | ✅ THR pro-rata |
| Perpres 64/2020 | ✅ BPJS Kesehatan 1%+4% |
| PP 44/2015 | ✅ JKK 0.24-1.74% + JKM 0.3% |
| PP 45/2015 | ✅ JP 1%+2% capped |
| PP 46/2015 | ✅ JHT 2%+3.7% |

**Anda fokus bisnis, kami pastikan compliance.**

---

## Slide 7: Cara Kerja

### Setup → Onboarding → Operasional dalam 1 hari

```
Hari 1:  Setup (tim kami bantu gratis)
         ├── Import data pegawai (CSV/Excel)
         ├── Set cabang + GPS (map picker)
         ├── Atur shift, kuota cuti, parameter payroll
         └── Konfigurasi WhatsApp/Telegram

Hari 2+: Operasional
         ├── Pegawai absen via face recognition
         ├── Admin pantau real-time di dashboard
         ├── Akhir bulan: Generate Payroll → Approve → Paid
         └── Slip gaji otomatis terkirim ke pegawai
```

---

## Slide 8: Dashboard Admin

### Semua data dalam satu layar

- **Statistik harian** — hadir, telat, cuti, sakit
- **Chart 7 hari** — tren kehadiran
- **Live feed** — aktivitas absensi real-time
- **Peta** — lokasi check-in semua pegawai
- **AI Insights** — prediksi telat, top performer, anomali

---

## Slide 9: Keamanan

### Enterprise-grade security

| Layer | Implementasi |
|---|---|
| Autentikasi | JWT HS256 + httpOnly cookie + auto-refresh |
| Anti brute-force | Rate limiting 5 fail/15m → lockout 30m |
| Anti-spoof absensi | Liveness detection + GPS + anti mock GPS |
| Data isolation | Multi-tenant query filter per companyId |
| Audit trail | 40+ action types, siapa-kapan-apa |
| Password | bcrypt 10 rounds |
| Session | Auto-logout 30 menit idle |

---

## Slide 10: Harga

### Investasi yang sebanding dengan penghematan

| Paket | Target | Highlight |
|---|---|---|
| **Starter** | 1-25 pegawai | Semua fitur core, 1 cabang, email support |
| **Professional** | 25-200 pegawai | Unlimited cabang, WA support, bulk import |
| **Enterprise** | 200+ pegawai | Custom domain, 24/7 priority, on-premise option |

**Semua paket dapat fitur lengkap.** Perbedaan: jumlah pegawai & level support.

> 💡 **ROI**: Hemat 40 jam HR/bulan = setara 1 FTE admin.  
> Eliminasi error hitung gaji = hindari denda pajak.  
> Cegah titip absen = produktivitas naik.

---

## Slide 11: Traction

### Sudah dipercaya perusahaan Indonesia

- **100+** perusahaan aktif
- **10.000+** pegawai terdaftar
- **99.9%** uptime
- **4.9/5** rating kepuasan
- Sektor: manufaktur, retail, F&B, jasa, konstruksi, startup

---

## Slide 12: Competitive Advantage

### Kenapa MAS, bukan yang lain?

| MAS | Kompetitor |
|---|---|
| PPh 21 TER 2024 (terbaru) | Masih pakai metode lama |
| Liveness detection real (blink+motion) | Hanya foto selfie biasa |
| Setup 1 hari, gratis | Setup berminggu-minggu, berbayar |
| WhatsApp + Telegram notifikasi | Hanya email/push |
| PWA (tanpa install app store) | Harus download app besar |
| Harga transparan, tanpa hidden fee | Banyak biaya tambahan |
| Support WhatsApp langsung | Ticket system lambat |
| Bukti potong 1721-A1 otomatis | Harus export manual |

---

## Slide 13: Roadmap

### Q3-Q4 2026

- [ ] Integrasi BPJS e-Filing langsung
- [ ] AI Face matching (1:N verification)
- [ ] Mobile native app (React Native)
- [ ] Payroll multi-currency (untuk pekerja remote)
- [ ] Integration API untuk ERP (SAP, Oracle)
- [ ] Employee self-onboarding portal

---

## Slide 14: Tim

### PT Manggala Utama Indonesia

Perusahaan teknologi Indonesia yang fokus pada solusi digital untuk bisnis lokal.

- **Pengalaman** di bidang HR tech & enterprise software
- **Tim engineering** full-stack (Next.js, Node.js, cloud infrastructure)
- **Support lokal** — bahasa Indonesia, timezone WIB, WhatsApp langsung

---

## Slide 15: Call to Action

# Siap modernisasi HR perusahaan Anda?

### Demo gratis 30 menit — tanpa komitmen

| Channel | Kontak |
|---|---|
| 📱 WhatsApp | **+62 878-8424-1703** |
| 📧 Email | **admin@manggala-utama.id** |
| 📸 Instagram | **@manggalautamaindonesia** |
| 🌐 Website | **hris.manggala.biz.id** |

> *"Kami tunjukkan langsung sesuai kebutuhan perusahaan Anda.  
> Tidak ada komitmen. Tidak perlu kartu kredit."*

---

**MAS — Manggala Attendant System**  
*Managed by PT Manggala Utama Indonesia*  
*© 2026. All rights reserved.*
