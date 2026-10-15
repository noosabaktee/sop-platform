# Matriks Implementasi Semua Route (14 Oktober 2026)

**Baca kolom batasan sebelum menganggap modul selesai.** Tidak ada perubahan pada file CSS dan markup HTML prototype yang telah disetujui. JavaScript prototype hanya ditambah hook state untuk persistence.

| Route | UI/UX | Data API/PostgreSQL | Batasan penting |
|---|---|---|---|
| `/login` | Asli | Sanctum login/logout, reset token, lockout, TOTP/recovery, session revoke | SSO eksternal belum tersedia |
| `/overview` | Asli | KPI, tren penjualan 7 hari, audit activity, dan pekerjaan personal diproyeksikan dari PostgreSQL | Sparkline/perbandingan dekoratif belum memakai historical baseline lengkap |
| `/my-workspace` | Asli | Seluruh 9 tab diproyeksikan dari task, project, approval, audit, kalender, dokumen, notifikasi, email, dan profil per-user | Create/detail umum belum semuanya workflow penuh; centang task dan read notification sudah authoritative |
| `/dashboard` | Asli | KPI lintas fungsi, periode bulan/kuartal/tahun, tenant dan freshness dari PostgreSQL | Grafik/tabel drill-down tertentu masih fixture; company/branch fixture dinonaktifkan |
| `/crm-sales` | Asli | Grid Leads dan Prospects tersinkron ke domain PostgreSQL; Customer 360 memproyeksikan master customer dan AR/revenue aktual; owner/PIC dipetakan ke user tenant dan konversi lead menjalankan workflow domain | Aktivitas/follow-up dan forecast masih grid generik |
| `/business-development` | Asli | Panel Opportunity diproyeksikan dari PostgreSQL, membuat opportunity domain dengan customer/owner tenant-scoped, dan mengonversi opportunity Won menjadi Project | Panel BD lain masih grid_rows; workflow tender/proposal belum selesai |
| `/quotation` | Asli | Builder native menyimpan draft dan submit quotation ter-normalisasi ke PostgreSQL; line yang cocok dengan nama/SKU master produk membawa product ID tenant-scoped ke Sales Order dan Delivery; daftar quotation diproyeksikan dari API | PDF quotation dan seluruh aksi daftar belum tersedia |
| `/sales` | Asli | Aksi native Sales Order mengonversi quotation approved, Delivery / BAST parsial/penuh mengurangi stok dan memposting HPP dengan nilai net sesudah diskon quotation, retur parsial/penuh mengembalikan stok dan membalik HPP, invoice serta pembayaran/AR memakai API ter-normalisasi; klik retur membuat credit note idempoten yang membalik pendapatan, PPN, piutang, serta refund kas otomatis bila invoice telah dibayar | — |
| `/projects` | Asli | Proyeksi project/task dan biaya PostgreSQL; toolbar native membuat project, mengubah status, mengelola task, serta memasukkan biaya yang memperbarui profitabilitas | Gantt dan budget/RAB belum terhubung penuh ke ledger |
| `/purchase` | Asli | Aksi native membuat PR, submit/order, menerima PO parsial per baris, serta return GR menjalankan REST transaksi PR → approval → PO → GR → return | Approval bertingkat belum tersedia di native UI |
| `/inventory` | Asli | Stock ledger dari PR/PO/GR, return, adjustment native, transfer, serta stock opname native yang membuat koreksi dan jurnal | FIFO, serial/batch, serta sebagian grid inventory belum tersedia sebagai workflow domain |
| `/finance` | Asli | Double-entry invoice/payment/GR/return, jurnal manual, tagihan vendor parsial dari GR dan pembayarannya, credit note AP otomatis hanya untuk bagian retur yang sudah ditagihkan beserta refund vendor bila telah dibayar, period close yang memblokir posting server-side, pembuatan akun bank, impor mutasi, serta kandidat rekonsiliasi dari toolbar native; trial balance API | — |
| `/reports` | Asli | Tabel native dan ekspor CSV membaca agregat SQL sales, purchase, project, inventory, dan finance, dengan filter periode API | Builder ad-hoc dan semua visualisasi masih belum agregasi domain penuh |
| `/management` | Asli | KPI native utama untuk revenue, pipeline, AR, AP, kas/bank, trial balance, proyek, dan PO diproyeksikan dari PostgreSQL | Tabel/grafik eksekutif dan KPI strategis yang belum memiliki domain masih fixture |
| `/master-data` | Asli | CRUD grid_rows + proyeksi SQL nyata untuk Customers, Vendors, Products, Warehouses, Departments | Modul lain masih grid_rows; hanya aksi commit, bukan seed fixture, diproyeksikan |
| `/document-management` | Asli | Module state + binary file privat, versioning, kategori/folder & download melalui tombol asli | Virus scanning, approval & e-signature belum lengkap |
| `/document-template` | Asli | Module state JSONB | Variables/template edit persisted; document versioning belum lengkap |
| `/email-communication` | Asli | State UI persisted; Compose/Kirim memakai endpoint SMTP backend yang idempoten, mencatat outbox dan audit, serta mengembalikan gagal bila provider menolak | Memerlukan mailer SMTP/OAuth yang benar-benar dikonfigurasi di backend |
| `/omnichannel` | Asli | Module state JSONB | Provider chat eksternal belum tersambung |
| `/whatsapp-integration` | Asli | State UI persisted; tombol Kirim memanggil WhatsApp Cloud API backend dengan nomor E.164 eksplisit, idempotensi, audit, dan tanpa mengirim kontak contoh UI | Memerlukan token, phone ID, dan kontak yang sudah opt-in dari provider |
| `/general-meeting-rups` | Asli | Module state JSONB | Voting internal persisted; quorum/legal signature belum terimplementasi |
| `/workflow-approval` | Asli | Queue native memutuskan approval quotation dan purchase request, dengan audit dan notifikasi domain | Approval bertingkat, delegation, dan SLA belum tersedia |
| `/corporate` | Asli | Meeting/resolution diproyeksikan dari API domain; upload dan download dokumen corporate memakai Document Vault privat | Editor agenda/minutes dan workflow legal lengkap belum tersedia |
| `/ai-assistant` | Asli | Chat UI memakai provider AI backend; hanya pertanyaan eksplisit yang dikirim tanpa akses/tool ke data tenant | Memerlukan API key provider AI di backend; tidak membuat database write dari jawaban |
| `/data-intelligence` | Asli | Module state JSONB | Scraper/source crawler belum benar-benar berjalan |
| `/integrations` | Asli | State konfigurasi UI persisted; Sync/Uji Email, WhatsApp, dan AI membaca status konfigurasi backend tanpa mengekspos credential atau mengklaim koneksi provider berhasil | Status hanya menunjukkan konfigurasi, bukan verifikasi kredensial/provider; OAuth/payment/banking/webhook memerlukan provider dan kredensial eksternal |
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
