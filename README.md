# Verifikasi lokal terpadu — 14 Oktober 2026

Setup aman tanpa Docker:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\verify-local.ps1
```

Verifier menolak database test yang sama dengan database aplikasi atau yang namanya tidak berakhiran `_test`/`_testing`. Hasil audit terbaru: 62 Laravel tests (380 assertions), build production, 11 Playwright UI tests, source/contract checks, serta browser E2E nyata login → Overview SQL → CRM save/reload → lead ke prospect → Dashboard/Workspace SQL → 27 route → logout telah lulus pada `sop_platform_test`. Database aplikasi `sop_platform` tidak direset.

Laporan authoritative terbaru: [implementation tracker](docs/IMPLEMENTATION_TRACKER.md), [test report](docs/TEST_REPORT.md), [schema/workflow](docs/DB_SCHEMA_AND_WORKFLOWS.md), [API reference](docs/API_REFERENCE.md), dan [UI parity](docs/UI_PARITY_REPORT.md). Klaim lama di bagian bawah dipertahankan sebagai riwayat; bila bertentangan, gunakan kelima laporan terbaru tersebut.

# UPDATE 13 Oktober 2026 — Tahap 2–5, login fix, tanpa Docker

**UI/UX frozen:** berkas HTML/CSS/JS asli prototype tidak diubah.

Lihat **[Panduan instalasi baru dan login](docs/LOGIN_FRESH_INSTALL.md)** serta
**[Perubahan tahap 2–5 dan keterbatasan](docs/TAHAP_2_5_PROGRESS.md)**.

Untuk instalasi lokal fresh **kosongkan `VITE_API_BASE_URL=` pada frontend/.env**,
karena Vite sudah proxy `/api` dan `/sanctum` ke Laravel. Login development dibuat
oleh seeder; panduan di atas memuat akun dan prosedur diagnosis.

**Peringatan:** API workflow ditambah, tetapi tidak semua tombol pada 28 halaman
sudah terhubung end-to-end. Provider eksternal perlu kredensial. Periksa
feature tests di database `sop_platform_test` sebelum production.

---

# Kelanjutan 13 Oktober 2026 — Warehouse Transfer dan Workflow Approval PR

**Tampilan yang sudah disetujui tetap utuh dan tidak ada Docker.** Revisi ini menambahkan transaksi warehouse transfer (draft → dikirim → diterima, ledger stok dengan idempotency), menghubungkan aksi transfer dari tabel asli, memasukkan approval Purchase Request ke halaman Workflow, dan memproyeksikan Purchase, Inventory, Finance Accounting, serta Project dari PostgreSQL. Baris transaksi domain tidak lagi ditulis ulang sebagai grid dummy. Detail dan batasan: [`docs/CHANGELOG_INTEGRASI_TRANSFER_APPROVAL_2026-10-13.md`](docs/CHANGELOG_INTEGRASI_TRANSFER_APPROVAL_2026-10-13.md).

Untuk database existing: `cd backend; php artisan migrate` (bukan `migrate:fresh`). Jalankan Laravel dan React secara lokal sesuai langkah instalasi di bawah. **Belum seluruh 28 halaman selesai end-to-end; pengujian langsung PostgreSQL dan browser wajib dilakukan sebelum penggunaan produksi.**

---

# Pembaruan source code: operasi bisnis, ledger & dokumen — 13 Oktober 2026

**Patch keamanan:** CRUD generik tidak dapat melewati workflow untuk PO/PR, invoice, quotation, sales order, atau pergerakan stok. Izin tulis master data sekarang disaring berdasarkan role, dengan pengujian perlindungan tambahan.

**UI/UX tetap sama dengan versi yang disetujui; tidak ada Docker.** Source code ini menambahkan alur purchase request/PO/goods receipt/return, stok, jurnal double-entry, task proyek, file upload privat/versioning, audit log asli, dan notifikasi approval. Import CSV pada toolbar Project/Purchase/Inventory/Finance juga dihubungkan ke PostgreSQL. Baca [docs/IMPLEMENTASI_OPERASIONAL_LANJUTAN.md](docs/IMPLEMENTASI_OPERASIONAL_LANJUTAN.md) untuk endpoint, tata cara uji, dan batasannya.

**Jangan klaim platform 28 halaman sudah selesai end-to-end:** fitur provider eksternal dan sejumlah tombol native masih belum terhubung domain transaksi. Pada database berisi data, gunakan `php artisan migrate`, bukan `migrate:fresh`.

---

# SOP Integrated Business Management Platform — Native UI + PostgreSQL Integration

## Pembaruan integrasi 13 Oktober 2026 — Quotation, Approval & Sales end-to-end (parsial)

Revisi ini menghubungkan **Create Quotation → Simpan Draft → Submit Approval → Keputusan Approver** pada form asli ke transaksi PostgreSQL dengan validasi nominal di server; serta memproyeksikan Invoice, Payment, dan AR dari tabel SQL ke grid asli tanpa mengganti UI. Tambahan: perbaikan pencarian JSONB, race condition reload snapshot, regression tests Laravel, dan skrip verifikasi Windows **tanpa Docker**. Lihat `docs/CHANGELOG_E2E_CONTINUATION.md`.

**Status:** belum seluruh platform end-to-end. Seluruh 28 halaman, workflow provider eksternal, dan Laravel+PostgreSQL runtime belum terbukti lulus. Jangan gunakan pada produksi tanpa test PostgreSQL+browser nyata. Script `scripts/verify-e2e-local.ps1` tidak menjalankan `migrate:fresh` serta mewajibkan database pengujian terpisah agar pengujian `RefreshDatabase` tidak menghapus data operasional.


**UI/UX dikunci:** `frontend/src/styles/prototype.css`, `frontend/public/original-body.html`, dan seluruh CSS token/layout asli **tidak diubah**. Tampilan memakai prototype yang sudah disetujui. Backend dan bridge data saja yang direvisi.

## Lingkup revisi ini

1. Memperbaiki foreign key `project_tasks.parent_id`: tabel dibuat dahulu beserta primary key; kemudian FK self-reference ditambahkan melalui `Schema::table` di migration yang sama. Ini menyelesaikan SQLSTATE 42830 PostgreSQL.
2. Menambah tabel **`grid_rows`** dengan ULID primary key, JSONB payload, `row_key` unik per grid, `company_id`, versi record, soft-delete dan audit trail. CRUD committed dari 11 modul tabel asli sekarang menjadi perubahan record SQL sesungguhnya. Endpoint snapshot tetap kompatibel dengan UI yang telah disepakati.
3. Frontend memakai **deteksi perubahan di seluruh grid yang terdaftar** tanpa hanya mengandalkan selector CRM. Tambah, simpan/edit, hapus/bulk delete, status/kanban drag-drop dan perubahan lain yang mengubah `state.rows` yang sudah committed disinkronkan ke API secara serial. Saat refresh, backend mengembalikan rekaman PostgreSQL, bukan fixture yang ditimpa ulang.
4. `Import CSV` untuk grid terdaftar menulis baris baru ke SQL. `Export CSV` native prototype tetap dipakai. Data contoh hanya di-seed saat grid belum pernah diregistrasi untuk perusahaan itu.
5. Delete di backend melakukan soft delete record `grid_rows` yang dihapus dari UI. Sistem melakukan pengecekan versi snapshot (HTTP 409 jika tab/browser lain menimpa versi usang).
6. Docker dan dependensi Laravel Sail **dihapus**. Jalankan PHP, Composer, Node.js, dan PostgreSQL langsung di Windows/macOS/Linux.

## Ekstensi untuk halaman non-grid (13 Oktober 2026)

Revisi ini menambah `module_states` JSONB untuk **13 halaman** yang sebelumnya hanya mengubah data JavaScript di browser. Adapter `ModuleStateBridge` memuat state sebelum render asli dan menulis perubahan kembali ke PostgreSQL dengan optimistic locking dan audit trail:

- Document Management (metadata/fixtures), Document Template (editor variables)
- Email & Communication (message state), Omnichannel, WhatsApp Integration (conversation state)
- General Meeting & RUPS (voting state), Workflow & Approval (queue state), Corporate
- AI Assistant (conversation state), Data Intelligence (source fixtures)
- Integrations (connection/configuration state), Security & Audit (session-display state), Settings (user/role/configuration display state)

**Yang sudah diperiksa melalui tes adapter simulasi (belum PostgreSQL asli):** penyimpanan state internal antarsesi untuk data yang dimodifikasi handler asli, dengan rollback kesalahan pada API dan pemeriksaan versi. Semua pengubahan tersebut dilakukan tanpa mengubah markup halaman ataupun CSS aslinya.

**Yang BELUM benar-benar bekerja sebagai sistem produksi:** `module_states` untuk Settings **tidak mengubah akun login di tabel `users`**; toggle koneksi Integrations **tidak benar-benar mengotentikasi provider**; Email/WhatsApp **tidak mengirim pesan ke provider eksternal**, AI **belum memanggil layanan model**, upload/approval/e-signature **belum memiliki backend workflow lengkap**. Halaman Overview dan sebagian KPI Dashboard kini membaca agregasi backend; My Workspace serta sebagian besar grafik/list Dashboard masih memuat data statis dari prototype. `grid_rows` juga **belum otomatis terhubung dengan semua tabel transaksi ter-normalisasi**. Jangan menyebut seluruh PRD selesai atau siap produksi.

Untuk kontrol audit/Settings/Integrations, hanya role `super_admin`, `admin`, dan `manager` yang dapat membaca/mengubah state konfigurasi. Pengguna biasa tidak memuat state tersebut.

> Penting: ini **bukan klaim bahwa seluruh PRD selesai**. Pekerjaan ini memperbaiki CRUD tabel yang di-mount di 11 modul: CRM, Business Development, Quotation, Sales, Projects, Purchase, Inventory, Finance, Reports, Management, Master Data. 13 modul tambahan kini menyimpan state internal di PostgreSQL, namun email provider, WhatsApp, AI, dokumen, approval lintas transaksi, finance ledger penuh, dan integrasi provider masih membutuhkan backend domain masing-masing. Model domain (`customers`, `invoices`, dll.) **belum disinkronkan otomatis** dengan `grid_rows`; untuk itu diperlukan implementasi aturan domain dan validasi transaksi masing-masing. Jangan gunakan sebagai aplikasi produksi sampai integrasi tersebut selesai dan lolos QA.

## Prasyarat (TANPA DOCKER)

- PostgreSQL terinstal dan service **running** pada `127.0.0.1:5432`.
- PHP >= 8.2 dengan ekstensi `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `pdo`, `fileinfo` aktif.
- Composer 2 dan Node.js 22+ + npm.
- Database `sop_platform` dan akun PostgreSQL yang berizin (misalnya `postgres` pada instalasi lokal).

### 1. Siapkan database lokal

Gunakan pgAdmin Query Tool (database postgres) atau terminal PostgreSQL:

```sql
CREATE DATABASE sop_platform;
```

Jika `sop_platform` sudah ada, **tidak perlu dibuat lagi**. Gunakan kredensial PostgreSQL lokal yang sudah kamu miliki di file `.env`.

### 2. Jalankan Laravel

Terminal 1 (PowerShell):

```powershell
cd sop-platform\backend
Copy-Item .env.example .env
composer install
php artisan key:generate
```

Ubah bagian PostgreSQL pada `backend/.env` sesuai instalasi lokal (contoh menggunakan user `postgres`):

```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sop_platform
DB_USERNAME=postgres
DB_PASSWORD=PASSWORD_POSTGRES_LOKAL
SESSION_DRIVER=database
```

Lalu jalankan:

```powershell
php artisan config:clear
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

**Perhatian:** `migrate:fresh --seed` menghapus *seluruh isi* tabel database target lalu membuat ulang data contoh. **Jangan jalankan** pada database berisi data penting. Untuk database existing yang tidak boleh direset, gunakan `php artisan migrate` (tanpa `fresh`). Jika sudah `migrate:fresh --seed` pada versi gagal sebelumnya, setelah mengganti project file kamu bisa menjalankannya ulang untuk development DB.

### 3. Jalankan React

Terminal 2 (PowerShell):

```powershell
cd sop-platform\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Buka http://localhost:5173/#/login. Akun demo dari seeder adalah **`admin@sop.local`** dengan password **`ChangeMe-2026!`** bila kamu tidak menetapkan `SOP_SEED_PASSWORD` lain. Ganti kredensial demo sebelum mengakses aplikasi melalui jaringan.

### 4. Verifikasi CRUD dan module state ke PostgreSQL

1. Login ke aplikasi, buka **CRM & Sales → Leads**.
2. Edit satu sel lalu tekan tombol **Simpan** yang sudah ada di prototype; indikator progres pada bagian atas akan muncul saat HTTP request berjalan.
3. Refresh browser: perubahan harus masih terlihat. Uji **Tambah → Simpan → Refresh**, **Hapus → Refresh**, **Import CSV → Refresh**, dan **Export CSV**.
4. Cek pgAdmin di database `sop_platform`:

```sql
SELECT gs.route, gs.panel_id, gr.row_key, gr.payload, gr.deleted_at, gr.updated_at
FROM grid_rows gr
JOIN grid_snapshots gs ON gs.id = gr.grid_snapshot_id
WHERE gs.route = '/crm-sales' AND gs.panel_id = 'leads'
ORDER BY gr.position;
```

Penghapusan mengisi `deleted_at`, dan baris yang dihapus **tidak dikembalikan** oleh API.

Untuk menguji modul tambahan: buka **Settings → Roles**, edit izin/role (gunakan role admin), tutup dialog, refresh browser, lalu periksa `module_states`:

```sql
SELECT route, section, payload, version, updated_at
FROM module_states
WHERE route IN ('/settings', '/workflow-approval', '/integrations')
ORDER BY route;
```

Catatan: perubahan role di halaman Settings pada revisi ini merupakan data konfigurasi UI yang persistent, **bukan** perubahan `users.role` pada Laravel Authentication.
 Domain CRUD API lainnya tersedia di `/api/v1/domains/{domain}` namun belum dimapping end-to-end dengan seluruh tabel UI.

### 5. Pengujian (setelah Composer/npm terpasang)

```powershell
cd backend
php artisan test --filter=GridSnapshotTest
php artisan test --filter=ProjectTaskMigrationTest
php artisan test --filter=ModuleStateTest
cd ..\frontend
npm run build
npx playwright install chromium
npm run test:e2e
```

Pengujian Laravel memakai database pengujian yang harus kamu konfigurasi **secara terpisah** supaya test tidak menghapus data operasional saat RefreshDatabase.

## Referensi dan catatan teknis

- `references/prototype.original.html`: sumber original tampilan
- `docs/feature-matrix.md`: batas nyata integrasi versus demo
- `docs/bugfix-changelog.md`: detail perubahan
- `backend/database/migrations/2026_10_12_000002_create_transaction_tables.php`: foreign key project_task fix
- `backend/database/migrations/2026_10_12_000005_create_grid_rows.php`: row-level CRUD persistence
- `frontend/src/api/gridBridge.ts`: native prototype → PostgreSQL sync
- `frontend/src/api/moduleStateBridge.ts`: non-grid state → PostgreSQL sync
- `frontend/src/api/kpiProjection.ts`: sebagian KPI Overview/Dashboard dari API Laravel
- `backend/database/migrations/2026_10_12_000006_create_module_states.php`: JSONB persistence for non-grid routes
- `backend/app/Http/Controllers/Api/ModuleStateController.php`: company-scoped API with version conflicts

**Kondisi QA**: pemeriksaan CSS byte-for-byte, JS syntax dan PHP lint berhasil dilakukan. Laravel dependencies/Composer serta PostgreSQL runtime dan browser E2E tidak tersedia di lingkungan penyusunan sehingga `migrate:fresh --seed`, build penuh, dan test integrasi belum bisa diklaim lulus di mesin pengguna.

## Tambahan source code lanjutan — 13 Oktober 2026

Baca **`docs/CHANGELOG_REAL_DB_2026-10-13.md`** untuk daftar implementasi baru, batasan serta langkah pengujian. UI yang disetujui tetap dikunci. Saat ini ada API workflow yang lebih lengkap, proyeksi beberapa master data, akun Settings terhubung ke akun Laravel, dan My Workspace per-user; **bukan pernyataan seluruh PRD sudah selesai**.

**Endpoint baru (wajib cookie Sanctum login):**

- `POST /api/v1/workflows/quotations/{id}/submit`
- `POST /api/v1/workflows/quotations/{id}/decision` — JSON `{"decision":"approved"}` (admin/manager)
- `POST /api/v1/workflows/quotations/{id}/convert`
- `POST /api/v1/workflows/sales-orders/{id}/invoice`
- `POST /api/v1/workflows/invoices/{id}/payments` — JSON `{"amount":"1000000.00","paid_at":"2026-10-13","idempotency_key":"unique-business-request-key"}`
- `GET /api/v1/workflows/transaction-approvals`
- `GET /api/v1/workspace`, `POST /api/v1/workspace/notifications/{id}/read`
- `GET/POST /api/v1/admin/users`, `PATCH/DELETE /api/v1/admin/users/{id}`

`backend/database/migrations/2026_10_12_000007...` sampai `000010...` merupakan migration baru; tidak perlu menghapus database lama. Jalankan **`php artisan migrate`** pada database existing yang harus dipertahankan, bukan `migrate:fresh`.


## Verifikasi workflow terbaru (tanpa Docker)

- Login menggunakan role Sales, buka Quotation, buat draft dari customer yang ada di PostgreSQL lalu tekan **Submit for Approval**.
- Login sebagai Manager/Super Admin, buka Workflow & Approval: kartu approval dari API menampilkan quotation yang disubmit. Coba **Setujui**, **Tolak**, **Minta revisi**, dan **Bulk approve** pada data pengujian. Setiap keputusan menggunakan HTTP API, bukan simulasi JavaScript.
- Jika **Minta revisi**, beri alasan, lalu Sales dapat mengubah dan mengirim ulang quotation tersebut melalui form asli.
- Invoice, Payment Receipt, dan AR pada halaman Sales menampilkan proyeksi SQL. Pembuatan Sales Order / invoice / payment secara penuh masih tersedia melalui API workflow, belum semua tombol asli halaman Sales disambungkan.
- Sebelum menjalankan pengujian: `CREATE DATABASE sop_platform_test;` di PostgreSQL, lalu `Copy-Item backend\.env.testing.example backend\.env.testing` dan sesuaikan kredensial test. `scripts/verify-e2e-local.ps1` akan menolak database test yang sama dengan database aplikasi.

**Batasan:** aplikasi ini masih **belum seluruhnya end-to-end** untuk 28 halaman. Pekerjaan yang belum selesai dicatat dengan jelas di `docs/CHANGELOG_E2E_CONTINUATION.md` dan `docs/feature-matrix.md`.
