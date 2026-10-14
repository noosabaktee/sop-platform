# Matriks Implementasi Semua Route (14 Oktober 2026)

**Baca kolom batasan sebelum menganggap modul selesai.** Tidak ada perubahan pada file CSS dan markup HTML prototype yang telah disetujui. JavaScript prototype hanya ditambah hook state untuk persistence.

| Route | UI/UX | Data API/PostgreSQL | Batasan penting |
|---|---|---|---|
| `/login` | Asli | Sanctum login/logout, reset token, lockout, TOTP/recovery, session revoke | SSO eksternal belum tersedia |
| `/overview` | Asli | KPI, tren penjualan 7 hari, audit activity, dan pekerjaan personal diproyeksikan dari PostgreSQL | Sparkline/perbandingan dekoratif belum memakai historical baseline lengkap |
| `/my-workspace` | Asli | Seluruh 9 tab diproyeksikan dari task, project, approval, audit, kalender, dokumen, notifikasi, email, dan profil per-user | Create/detail umum belum semuanya workflow penuh; centang task dan read notification sudah authoritative |
| `/dashboard` | Asli | KPI lintas fungsi, periode bulan/kuartal/tahun, tenant dan freshness dari PostgreSQL | Grafik/tabel drill-down tertentu masih fixture; company/branch fixture dinonaktifkan |
| `/crm-sales` | Asli | CRUD grid_rows; panel Leads yang committed ikut sinkron ke tabel `leads` | CRM customer & opportunity dan konversi penuh belum terhubung domain |
| `/business-development` | Asli | CRUD grid_rows | Workflow bisnis lintas modul belum selesai |
| `/quotation` | Asli | CRUD grid_rows; tersedia workflow REST untuk `quotations` ter-normalisasi | Tombol/row UI belum semua memanggil workflow tersebut; approval PDF belum tersambung |
| `/sales` | Asli | CRUD grid_rows + REST API konversi SO, invoice, payment ter-normalisasi | Handler asli tabel belum mengarahkan semua operasi ke workflow REST |
| `/projects` | Asli | Grid CRUD + API project/task normalized (create/update/delete/status) | Grid asli, Gantt, dan budget belum terhubung penuh ke API task/ledger |
| `/purchase` | Asli | Grid CRUD + REST transaksi PR → approval → PO → GR → return | Form/tombol native belum seluruhnya menjalankan endpoint transaksi ini |
| `/inventory` | Asli | Grid CRUD + stock movement ledger dari PR/PO/GR, return, manual adjustment API | Native grid belum seluruhnya memanggil stock ledger; FIFO, opname dan transfer belum selesai |
| `/finance` | Asli | Grid CRUD + automatic double-entry invoice/payment/GR/return, jurnal manual, trial balance API | Posting langsung dari native grid, bank reconciliation, AP vendor & period close belum selesai |
| `/reports` | Asli | CRUD grid_rows | Report builder masih demo, bukan agregasi domain seluruhnya |
| `/management` | Asli | CRUD grid_rows | KPI management masih fixture |
| `/master-data` | Asli | CRUD grid_rows + proyeksi SQL nyata untuk Customers, Vendors, Products, Warehouses, Departments | Modul lain masih grid_rows; hanya aksi commit, bukan seed fixture, diproyeksikan |
| `/document-management` | Asli | Module state + binary file privat, versioning, kategori/folder & download melalui tombol asli | Virus scanning, approval & e-signature belum lengkap |
| `/document-template` | Asli | Module state JSONB | Variables/template edit persisted; document versioning belum lengkap |
| `/email-communication` | Asli | Module state JSONB | Email tidak terkirim ke provider SMTP/OAuth |
| `/omnichannel` | Asli | Module state JSONB | Provider chat eksternal belum tersambung |
| `/whatsapp-integration` | Asli | Module state JSONB | WhatsApp API tidak terhubung |
| `/general-meeting-rups` | Asli | Module state JSONB | Voting internal persisted; quorum/legal signature belum terimplementasi |
| `/workflow-approval` | Asli | Module state JSONB | Queue UI persisted; transaksi domain belum mengambil keputusan workflow |
| `/corporate` | Asli | Module state JSONB | Jadwal/dokumen legal masih fixture |
| `/ai-assistant` | Asli | Module state JSONB | Chat disimpan; AI model real belum terhubung |
| `/data-intelligence` | Asli | Module state JSONB | Scraper/source crawler belum benar-benar berjalan |
| `/integrations` | Asli | Module state JSONB | Status koneksi disimpan, bukan bukti provider terautentikasi |
| `/security-audit` | Asli | Module state + real audit API / Audit Trail native table | Login history, access log, event security dan session management masih parsial |
| `/settings` | Asli | Module state JSONB + User Management API Laravel untuk akun Settings | Permission matrix dan konfigurasi tingkat lanjut belum memengaruhi seluruh Laravel policies; undangan akun perlu activation |

## Yang bisa diuji sekarang

1. Native grid: tambah, edit, delete, import CSV, export CSV, refresh — tersimpan sebagai `grid_rows`.
2. Native non-grid state di 13 route: perubahan objek UI, persist, refresh — tersimpan di `module_states` (hanya untuk aksi yang sudah mengubah state native).
3. Login/logout dan domain CRUD API dasar.
4. Tenant/company isolation, audit events, conflict/versioning melalui feature tests.

## Persyaratan sebelum dapat dinyatakan "siap beres" untuk semua halaman

- Implementasi API domain per modul, relasi FK asli, sinkronisasi lintas transaksi, reversal/approval/accounting posting.
- Backend file storage, e-signature, notification jobs dan integrasi external dengan kredensial yang sah.
- Autentikasi lengkap, izin per-aksi per entitas, server-side validation & audit yang menyeluruh.
- Semua tombol yang masih berupa dialog penjelasan prototype dihubungkan ke aksi nyata, bukan hanya disimpan state-nya.
- Build, `migrate:fresh --seed` dan test pada PostgreSQL asli, cross-browser & 7 viewport visual regression.

**Status per 13 Oktober 2026: transaksi procurement, stock ledger, document vault dan jurnal dasar telah ditambahkan sebagai kode nyata, namun banyak toolbar/action native masih menggunakan snapshot dan provider eksternal belum tersedia. Platform belum siap produksi ataupun seluruh PRD end-to-end.**
