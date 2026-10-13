# SOP — Implementasi tambahan berbasis transaksi nyata (13 Oktober 2026)

**Status: penambahan fungsional, BUKAN seluruh PRD selesai.** UI HTML/CSS/JavaScript asli dikunci. Semua endpoint baru memakai session Laravel Sanctum dan `company_id` pengguna.

## Yang diimplementasikan pada revisi ini

| Modul | Implementasi source code baru | Perlu pengujian langsung |
|---|---|---|
| Purchase | PR + item/nominal dihitung di server, submit approval, keputusan manager, konversi PO, idempotensi PO | Integrasi semua tombol PR/PO di UI asli |
| Goods Receipt | Partial/full receiving, validasi jumlah terhadap PO, idempotensi receipt per referensi, stok masuk | PostgreSQL runtime dan scan barang |
| Purchase Return | Validasi return terhadap diterima & stok tersedia, ledger keluar, reverse GRNI/inventory | Pengujian UI return dan AP vendor |
| Inventory | Saldo dari stock movement, kartu movement, adjustment +/- dengan penolakan stok negatif dan idempotency | Stock opname/transfer, FIFO/average costing |
| Accounting | Jurnal invoice (piutang, revenue, output VAT), pembayaran, GR/return dan jurnal manual balance, trial balance/P&L dasar | Trial Balance dalam UI, multi currency, bank recon, period close, statutory tax |
| Project | Project/task list, task create/update/delete, progress & permission assignee/PM | Tombol-tombol proyek dalam native grid belum semuanya terhubung ke task API |
| Documents | File private upload, PDF/office/image/CSV, versioning, audit, kategori/folder, download, archive | Virus scanning/e-signature/approval dokumen belum tersedia |
| Security | Real audit-event API dan pemuatan tabel Audit Trail pada UI asli | Login history & session revoke belum dibuat |
| Workflow | In-app notifications untuk submit/keputusan PR dan quotation | Email/WA provider tidak tersedia tanpa konfigurasi |
| Tabel native | Import CSV di toolbar Project/Purchase/Inventory/Finance selain modul sebelumnya | XLSX import belum tersedia |

### Endpoint baru

Semua path diawali `/api/v1` dan perlu cookie login + CSRF untuk write.

```text
GET    /operational/procurement/options
GET    /operational/procurement
POST   /workflows/purchase-requests
POST   /workflows/purchase-requests/{id}/submit
POST   /workflows/purchase-requests/{id}/decision
POST   /workflows/purchase-requests/{id}/order
POST   /workflows/purchase-orders/{id}/receive
POST   /workflows/goods-receipts/{id}/return
GET    /operational/inventory
POST   /operational/inventory/adjust
GET    /operational/accounting?from=2026-10-01&to=2026-10-31
POST   /operational/accounting/journal
GET    /operational/projects
POST   /operational/projects/{id}/tasks
PATCH  /operational/project-tasks/{id}
DELETE /operational/project-tasks/{id}
GET    /documents/files
POST   /documents/files (multipart file + title + category + folder)
GET    /documents/files/{id}/versions
GET    /documents/files/{id}/versions/{version}/download
DELETE /documents/files/{id}
GET    /security/audit-events
```

**PENTING:** Saldo stok dan jurnal dari proses domain tersebut sudah dihitung berdasarkan tabel transaksi, bukan dari `grid_rows`. Namun sejumlah editor di HTML prototype **masih menulis ke grid_rows dan belum memanggil endpoint domain di atas**. Jangan menyebut semua aksi seluruh 28 halaman sudah end-to-end. Data `grid_rows` tidak boleh dijadikan sumber posting stok/jurnal tanpa validasi dan pemetaan yang tepat.

## Perbaikan pengamanan transaksi

Endpoint generik `/api/v1/domains/{domain}` tetap dapat dibaca berdasarkan `company_id` tetapi **tidak dapat dipakai untuk membuat/mengubah/menghapus** quotation, sales order, invoice, purchase request/order, atau stock movement. Semua penulisan transaksi itu harus melewati endpoint workflow terotorisasi agar tidak melangkahi approval, saldo stok, atau jurnal. Penulisan data master dibatasi menurut role (customer/Sales, vendor/procurement, dsb). Ditambah regresi `DomainWorkflowProtectionTest.php` (belum dieksekusi pada PostgreSQL dalam lingkungan ini).

## Instalasi tanpa Docker

Dalam `backend/.env`, siapkan koneksi PostgreSQL lokal. Untuk **database lama berisi data**, jalankan:

```powershell
cd backend
composer install
php artisan config:clear
php artisan migrate
php artisan serve
```

`php artisan migrate` akan menjalankan migration 000012–000014. **Jangan jalankan `migrate:fresh` pada database yang datanya ingin disimpan.** Untuk database development kosong dan memang boleh direset: `php artisan migrate:fresh --seed`.

Di terminal lain:

```powershell
cd frontend
npm install
npm run dev
```

### QA dengan PostgreSQL terpisah

1. Buat database `sop_platform_test` di pgAdmin.
2. Duplikat `backend/.env.testing.example` menjadi `.env.testing` dan atur user/password lokal.
3. Jalankan dari root di PowerShell: `powershell -ExecutionPolicy Bypass -File .\scripts\verify-e2e-local.ps1`.
4. Pastikan database test **berbeda** dari database aplikasi. Test Laravel memakai `RefreshDatabase` dan akan mengosongkan tabel database pengujian.
5. Jalankan Playwright secara terpisah setelah backend/frontend berjalan: `cd frontend; npm run test:e2e`.

**Yang sudah bisa diperiksa pada lingkungan pembuat:** sintaks PHP, parsing TypeScript, dua pengujian adapter simulasi, dan kesamaan hash aset visual. Composer vendor/PostgreSQL/PDO pgsql tidak tersedia, sehingga `php artisan migrate`, tes PHP integration dan browser UI belum berhasil dieksekusi di sini.

## Contoh alur backend nyata

1. `GET /operational/procurement/options` dapatkan `product_id`, `vendor_id`, `warehouse_id` yang benar.
2. `POST /workflows/purchase-requests` dengan `lines: [{product_id,quantity:"2.0000",unit_price:"1250.00"}]`.
3. `POST /workflows/purchase-requests/{id}/submit` sebagai requester.
4. `POST /workflows/purchase-requests/{id}/decision` dengan `{decision:"approved"}` sebagai manager lain.
5. `POST /workflows/purchase-requests/{id}/order` dengan `{vendor_id}`.
6. Baca `purchase_order_lines` untuk memperoleh `order_line_id`.
7. `POST /workflows/purchase-orders/{id}/receive` dengan `{warehouse_id,received_at:"2026-10-13",reference:"REF-UNIK-0001",lines:[{order_line_id,quantity:"1.0000"}]}`.
8. `GET /operational/inventory` menunjukkan stok bertambah. `GET /operational/accounting` menunjukkan jurnal inventori dan GRNI seimbang.
9. `POST /workflows/goods-receipts/{id}/return` bila ada barang yang benar-benar diretur.

### Batas yang masih terbuka

Belum ada integrasi penyedia Email/WhatsApp/AI, SSO/2FA, engine invoice vendor/AP final, stock transfer/FIFO, inventory reservation, seluruh procurement native-form UI workflow, legal RUPS voting/quorum, e-signature tersertifikasi, dokumen antivirus, full report builder, dan uji lintas seluruh 28 halaman. Semua ini tetap membutuhkan kode, konfigurasi, dan pengujian tambahan; jangan menganggapnya lulus hanya karena tampilannya persis.
