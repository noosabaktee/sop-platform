# Implementation Tracker

Status audit terakhir: 14 Oktober 2026. Dokumen ini memakai arti status yang ketat:

- **Verified**: diuji otomatis terhadap Laravel dan PostgreSQL nyata.
- **Integrated**: UI asli terhubung ke API/SQL, tetapi belum semua aksi pada halaman memiliki skenario browser nyata.
- **UI-only/partial**: route dapat dibuka, tetapi sebagian data atau aksi masih fixture/prototype.
- **Blocked external**: memerlukan kredensial/provider di luar repository.

## Cakupan 28 route

| Kelompok | Route | Status | Bukti utama |
|---|---|---|---|
| Auth | `/login` | Verified | Login/logout browser nyata, forgot/reset token sekali pakai, lockout, login history, session revoke, TOTP/recovery code |
| Ringkasan | `/overview`, `/my-workspace`, `/dashboard` | Integrated/partial | KPI, tren 7 hari, audit/work list, dan filter periode berasal dari SQL; seluruh 9 tab workspace diproyeksikan per user, centang task dan read notification tersimpan; drill-down tertentu masih fixture |
| Commercial | `/crm-sales`, `/business-development`, `/quotation`, `/sales` | Integrated | CRM edit-save-reload dan lead→prospect browser nyata; quotation dan sales workflow diuji pada feature tests |
| Operations | `/projects`, `/purchase`, `/inventory` | Integrated | Project task, PR/PO/GR/return, stock adjustment/opname, dan transfer diuji pada PostgreSQL |
| Finance/insight | `/finance`, `/reports`, `/management` | Integrated/partial | Jurnal seimbang, rekonsiliasi, report API/CSV diuji; sebagian KPI management masih fixture |
| Data/documents | `/master-data`, `/document-management`, `/document-template` | Integrated | Domain projection dan private document version/download/archive diuji |
| Communication | `/email-communication`, `/omnichannel`, `/whatsapp-integration` | Blocked external/partial | State tersimpan; pengiriman nyata hanya berjalan bila provider dikonfigurasi |
| Governance | `/general-meeting-rups`, `/workflow-approval`, `/corporate` | Integrated/partial | RUPS dan approval backend diuji; legal rules/e-signature belum production-ready |
| Intelligence | `/ai-assistant`, `/data-intelligence` | Blocked external/partial | State tersimpan; AI memerlukan API key, crawler/sumber eksternal belum lengkap |
| Administration | `/integrations`, `/security-audit`, `/settings` | Integrated/partial | Audit, riwayat login, sesi/revoke, user management, dan role guard diuji; OAuth/provider tetap eksternal |

Semua 28 route (1 login + 27 terautentikasi) tersedia dan diperiksa browser. Itu tidak berarti setiap tombol pada 28 halaman telah menjadi workflow domain penuh. Matriks rinci tetap tersedia di `docs/feature-matrix.md`.

## Perubahan checkpoint ini

- Payload baris dinamis grid tidak lagi hilang oleh validator Laravel; array kosong untuk penghapusan baris terakhir diterima.
- Warm-start `GridBridge` tidak lagi tertahan pada Promise inisialisasi yang sudah selesai.
- Fixture email CRM yang ter-redaksi dan identik diperbaiki hanya di adapter menjadi alamat unik `example.invalid`, tanpa mengubah HTML/JS/CSS prototype.
- Verifier Windows memakai database `sop_platform_test`, session file khusus browser E2E, dan cleanup PID server yang diverifikasi milik workspace.
- Playwright mock dibuat independen dari server Laravel yang kebetulan sedang aktif.
- Ditambahkan browser E2E nyata: login, 27 route, CRM persist/reload PostgreSQL, tanpa API 5xx/uncaught browser error, lalu logout.
- Konversi lead native kini transaksi PostgreSQL atomik dan idempoten: lead ditandai converted, prospect domain dibuat dan UI tetap konsisten setelah reload.
- Forgot/reset password memakai token hash 30 menit dan mencabut sesi lama; login failure/success tersimpan tenant-scoped.
- 2FA TOTP authenticator, recovery code sekali pakai, setup/enable/disable, serta session listing/revoke sudah authoritative di server.
- Dashboard kini menghitung KPI sales, project, procurement, inventory, dan personal dengan filter bulan/kuartal/tahun serta tenant isolation; pilihan company/branch fixture dinonaktifkan.
- Overview kini memproyeksikan tren penjualan tujuh hari, audit activity tenant/role-scoped, dan daftar tugas personal ke chart, activity feed, dan kedua tabel asli.
- Sembilan tab My Workspace kini memakai task, project, approval, audit, deadline/meeting, dokumen, notifikasi, outbox email, dan profil PostgreSQL milik user login.

## Remaining blockers

- Kredensial SMTP, WhatsApp/Meta, AI, OAuth, webhook, dan layanan eksternal tidak disertakan.
- Beberapa grafik, drill-down, toolbar, dan aksi prototype masih fixture atau state JSONB, bukan domain workflow lengkap.
- Pixel-diff terhadap gambar referensi belum tersedia; integritas sumber beku dan tujuh viewport sudah diuji.
- Hardening produksi (queue worker, backup/restore drill, observability, rate policy final, security review, dan UAT bisnis) tetap diperlukan.
