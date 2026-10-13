# Perbaikan integrasi lanjutan — 13 Oktober 2026

## Desain tidak berubah

File berikut dipertahankan **identik byte-for-byte** dengan revisi sebelumnya:

- `frontend/src/styles/prototype.css`
- `frontend/public/original-body.html`
- `frontend/public/prototype-original.js`
- `frontend/public/prototype-extras.js`

Seluruh penambahan dilakukan di API/backend, migrasi, frontend bridge, dan dokumen.

## Yang kini memiliki source code operasional tambahan

- **Sales workflow API**: submit quotation → keputusan approver → konversi menjadi sales order → posting invoice → pencatatan pembayaran sebagian/penuh. Menggunakan SQL transaction, pengecekan perusahaan, status guard, audit event dan idempotency key untuk pembayaran.
- **Master data projection**: saat grid native disimpan (bukan seed fixture), Customers, Vendors, Products, Warehouses, Departments dan CRM Leads diproyeksikan ke tabel SQL bisnis dengan `grid_domain_links`. Delete mengarsipkan record terhubung; tidak memutus foreign key histori.
- **Users & Access**: REST CRUD akun nyata terpisah dari module-state; perubahan user dari modul Settings terhubung via bridge. Akun baru tanpa password valid **nonaktif** sampai disiapkan melalui endpoint yang aman; browser tidak boleh menyimpan password.
- **My Workspace**: endpoint `/api/v1/workspace` mengambil task, project, approval dan notifikasi per-user; teks tiga tabel workspace utama diproyeksikan ke DOM asli tanpa mengganti CSS/komponen tabel. Dialog dan tombol workflow lanjut belum semuanya tersambung.
- **PostgreSQL**: `transaction_approvals`, `user_profiles`, `grid_domain_links`, archive flags, constraint idempotency pada payments dan foreign key morph token ULID.

## Tidak diklaim selesai

- Frontend Quotation/Sales saat ini masih mempertahankan handler prototype; **workflow API belum dipanggil oleh semua tombol UI** dan sebagian status dropdown masih berupa simulasi.
- Sebagian dashboard dan report masih menggunakan grafik/data fixture; My Workspace tabel lain tetap prototype.
- `grid_domain_links` hanya untuk enam kategori eksplisit, belum untuk seluruh workflow Purchase/Finance/Inventory/Project.
- Email/WhatsApp/AI/banking/tax memerlukan koneksi provider, kredensial dan implementasi layanan nyata.
- File upload, digital signature, user invitation/reset password/2FA, approval matrix, asset & accounting ledger belum diselesaikan end-to-end.
- **Tidak ada klaim seluruh 28 halaman siap produksi.**

## Pemeriksaan yang dilakukan di lingkungan pembuat

- Pemeriksaan sintaks semua file PHP dengan `php -l`.
- Transpilasi sintaks file TypeScript yang berubah tanpa dependency tree.
- Pengujian adapter state/grid tiruan yang ada sebelumnya.
- Perbandingan byte file visual asli.
- Tidak dapat menjalankan `composer install`, `php artisan migrate:fresh --seed`, test Laravel + PostgreSQL maupun frontend build Playwright pada mesin ini karena dependensi/driver PostgreSQL tidak terinstal dan akses unduhan eksternal terbatas.

## Pengujian nyata di mesin dengan PostgreSQL

Setelah Composer, PHP ekstensi `pdo_pgsql`, `mbstring`, dan PostgreSQL aktif, jalankan:

```powershell
cd backend
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan test
```

**Hanya gunakan migrate:fresh pada DB development kosong, karena akan menghapus semua data.**

```powershell
cd ..\frontend
npm install
npm run build
npm run dev
```

Uji `CRM/Leads` dan `Master Data/Customers` dengan tambah→simpan→refresh, edit→refresh, hapus→refresh, dan lihat `grid_rows`, `grid_domain_links`, `customers`. Pengujian workflow via endpoint untuk quotation yang sudah memiliki quotation_items perlu dilakukan sebelum produksi.
