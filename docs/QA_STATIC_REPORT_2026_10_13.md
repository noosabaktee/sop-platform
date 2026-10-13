# QA Report — Pemeriksaan yang benar-benar dilakukan

Tidak ada klaim bahwa test Laravel/PostgreSQL/browser telah lulus. Di lingkungan penyusunan tidak ditemukan `composer`, PostgreSQL binary/server, atau ekstensi PHP `pdo_pgsql`. Source code dikompilasi sebagian menggunakan pemeriksaan sintaks saja. User harus menjalankan test pada PC yang memiliki PostgreSQL lokal.

- Semua file `.php`: diperiksa dengan `php -l`.
- `.ts/.tsx` frontend: diperiksa parsing/transpile menggunakan TypeScript CLI yang tersedia, tanpa build React lengkap.
- `frontend/src/tests/grid_bridge_test.cjs` dan `module_bridge_test.cjs`: uji adapter API simulasi; **bukan server PostgreSQL nyata**.
- Hash SHA-256 `frontend/src/styles/prototype.css`, `frontend/public/prototype-original.js`, `frontend/public/original-body.html`, `frontend/public/prototype-extras.js`: dibandingkan versi ZIP referensi yang disetujui, tanpa perubahan.
- Pengujian Laravel baru *ditulis tetapi belum dijalankan* di `backend/tests/Feature/ProcurementInventoryAccountingTest.php`, `DocumentVaultTest.php`, `ProjectTasksAuditTest.php`, serta pengujian sales cycle dan perbaikan posting pajak.

## Checklist sebelum menyebut selesai

- [ ] `php artisan migrate` pada PostgreSQL lokal benar-benar lulus.
- [ ] `php artisan migrate:fresh --seed` pada **test DB terpisah** benar-benar lulus.
- [ ] `php artisan test` semua tes benar-benar lulus pada PostgreSQL.
- [ ] `npm run build` tanpa error.
- [ ] Browser/Playwright run semua 28 route dan semua 7 viewport, termasuk screenshot regression.
- [ ] Cross-module mutations dari tombol native bukan data statis / JSON state saja.
- [ ] Aktivasi dan pengujian provider Email/WhatsApp/AI berdasarkan kredensial yang disediakan.
- [ ] Security penetration test, document malware scanning, concurrency & accounting reconciliation.

- Endpoint transaksi generik diamankan dari penulisan tanpa workflow; pengujian Laravel `DomainWorkflowProtectionTest.php` ditambahkan (belum dijalankan).
- Penghitungan uang skala integer diuji secara mandiri untuk kuantitas 2,5000 × harga 1.000,10 = 2.500,25.
