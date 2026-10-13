# SOP Platform — Kelanjutan Integrasi Operasional

Tanggal: 13 Oktober 2026. **Tampilan tidak diubah**: `prototype.css`, `original-body.html`, `prototype-original.js`, dan `prototype-extras.js` tetap sama dengan ZIP terakhir yang disetujui. **Tidak menggunakan Docker.**

## Yang benar-benar ditambahkan dalam source code ini

1. **Warehouse Transfer** dalam PostgreSQL: tabel `warehouse_transfers` (migration `2026_10_13_000015_create_warehouse_transfers.php`), FK perusahaan/produk/gudang/pengguna, idempotency key unik per perusahaan, dan audit trail.
2. **State machine gudang:** draft → in_transit → received. Stok dikurangi dari gudang asal saat `ship`, ditambahkan ke tujuan saat `receive`; `cancel` hanya diizinkan sebelum `ship`. Operasi dikunci dalam transaksi dan pengiriman memeriksa saldo sehingga tidak bisa memindahkan stok melebihi saldo. Request yang diulang tidak melakukan dua kali posting. Idempotency key yang dipakai dengan payload berbeda ditolak (409).
3. **Tabel Warehouse Transfer asli**: tombol tambah baris, kolom From/To/Item/Qty, Simpan, perubahan status dan penghapusan draft terhubung ke endpoint transfer. Tidak ada editor generik maupun modal baru. Input produk dan gudang memakai nama/kode yang sudah ada di Master Data. Jika stok kurang, status tidak berubah dan API mengembalikan kesalahan.
4. **Antrian approval bersama:** Purchase Request yang menunggu persetujuan sekarang tampil bersama Quotation di Workflow & Approval. Setujui/Tolak PR memanggil endpoint Laravel masing-masing, bukan perubahan status dummy. PR tidak menyediakan workflow *request revision*; gunakan Tolak dengan alasan bila perlu.
5. **Proyeksi SQL pada UI asli**: request/order/receipt/return di Purchase, stock/movement/transfer di Inventory, jurnal di Finance (Accounting), project dan task di Project, melengkapi Quotation serta Sales dari patch sebelumnya.
6. **Batas sumber data:** baris transaksi yang diambil dari tabel SQL tidak disimpan ulang dalam `grid_snapshots`, dan edit/deletion palsu pada baris transaksi yang hanya memiliki API baca diblokir. Tampilan dari data SQL kini menggantikan contoh statis pada panel yang diproyeksikan. Saat PostgreSQL belum berisi transaksi, panel tersebut dapat kosong — bukan menampilkan data bisnis palsu.
7. **Konsistensi status:** value status dari PostgreSQL yang tidak tercantum di opsi demo pada select asli dimasukkan sebagai `option` runtime saja, tanpa mengubah CSS, spacing, class maupun layout.
8. **Sinkronisasi awal:** aplikasi menunggu proyeksi domain pertama sebelum seeding grid demo untuk mengurangi risiko tab menampilkan transaksi contoh saat API masih memuat.

## API baru (memerlukan session Sanctum login)

```text
GET  /api/v1/operational/inventory/transfers
POST /api/v1/operational/inventory/transfers
POST /api/v1/operational/inventory/transfers/{id}/ship
POST /api/v1/operational/inventory/transfers/{id}/receive
POST /api/v1/operational/inventory/transfers/{id}/cancel
```

Contoh pembuatan lewat API (nilai ULID harus diambil dari endpoint options):

```json
{
  "product_id":"<ULID_PRODUK>",
  "from_warehouse_id":"<ULID_GUDANG_ASAL>",
  "to_warehouse_id":"<ULID_GUDANG_TUJUAN>",
  "quantity":"2.5000",
  "idempotency_key":"transfer-uji-unique-0001"
}
```

## Cara memperbarui database lokal tanpa Docker

Pastikan sudah ada PostgreSQL serta koneksi `backend/.env` yang benar. **Pada database yang berisi data, gunakan migrate biasa, BUKAN migrate:fresh.**

```powershell
cd backend
composer install
php artisan config:clear
php artisan migrate
php artisan serve
```

```powershell
cd frontend
npm install
npm run dev
```

Gunakan role `admin`, `manager`, `super_admin`, atau `warehouse` untuk transfer. Jika `warehouse` belum punya akun uji, admin dapat membuatnya melalui pengelolaan pengguna yang sudah ditambahkan sebelumnya. Untuk uji transfer dengan stok nyata, gudang asal dan tujuan harus berbeda dan sama-sama aktif; jika baru ada satu gudang, tambah satu gudang kedua pada Master Data.

## QA dan status kebenaran

**Pemeriksaan yang dilakukan dalam lingkungan penyusun:**

- Semua PHP yang dimodifikasi lolos `php -l`.
- TypeScript/TSX yang dimodifikasi lolos pemeriksaan sintaks melalui compiler TypeScript global.
- `node scripts/test-domain-projection.cjs`: uji bahwa proyeksi transaksi tidak menulis balik ke grid snapshots.
- `node scripts/test-native-transfer.cjs`: uji adapter ke jalur create/ship/receive/cancel dan pengulangan idempotency key melalui mock API.
- `node frontend/src/tests/grid_bridge_test.cjs` dan `module_bridge_test.cjs`: tes adapter simulasi.
- `python scripts/check-source-integrity.py`: parity CSS dan route serta tidak adanya file Docker Compose.

**Belum diverifikasi di lingkungan ini:** `composer install`, `npm install`, `php artisan migrate`, Laravel feature test menggunakan PostgreSQL, build Vite maupun browser Playwright. Lingkungan ini tidak memiliki dependensi vendor / modul `pdo_pgsql` dan akses DNS npm tidak tersedia. Test Laravel ditambahkan (`WarehouseTransferTest`, `ProcurementApprovalUiTest`) dan dimasukkan ke `scripts/verify-e2e-local.ps1` untuk dijalankan pada komputer pengguna memakai database `sop_platform_test` yang terpisah.

**Belum selesai end-to-end untuk semua 28 halaman:** semua fungsi transaksi panel lain selain yang terdaftar di atas, cash/bank reconciliation, stock opname, inventori FIFO/reservasi, workflow Project lengkap, statutory finance, integrasi email/WhatsApp/AI, SSO/2FA, RUPS, e-signature, provider eksternal, semua tombol import/export/XLSX, dan semua visual-regression + browser tests. Jangan gunakan project untuk produksi sebelum diverifikasi dan menyelesaikan cakupan yang tersisa.
