# Change Log — 13 Oktober 2026

1. **SQLSTATE[42830]** pada `project_tasks.parent_id`: constraints dipisahkan sehingga PK `project_tasks.id` ada ketika PostgreSQL memasang self-referencing FK. Foreign key memakai `nullOnDelete()` bila parent dihapus.
2. **Tanpa Docker**: file compose dan `laravel/sail` dihapus, setup murni Composer, PHP artisan, PostgreSQL lokal, dan Vite.
3. **CRUD row-level**: migration `grid_rows` memungkinkan insert, update, soft delete dengan ID, JSONB, versi, tenant isolation, audit trail. Grid snapshot tetap dipertahankan untuk backward compatibility dan optimistic concurrency.
4. **CRUD UI**: `gridBridge.ts` memantau seluruh native grid yang terdaftar. React capture dispatch melakukan pemeriksaan state committed setelah handler native selesai untuk click, change, drop, keyup, submit. Tidak hanya CRM/BD.
5. **Lazy grids**: native grid yang diinisialisasi saat user membuka tab baru juga di-seed sekali tanpa menimpa data lama.
6. **Import**: CSV diparse dan disimpan sebagai rows nyata; native export CSV tetap dipakai.
7. **UI freeze**: prototype.css, original-body.html, dan prototype-original.js tetap sama dengan revisi UI terakhir. Tidak dilakukan perubahan visual dan tidak menambah modal baru.
8. **Backend tests**: test CRUD insert/update/delete/reload/soft delete, optimistic conflict 409, seed-only tidak overwrite, tenant isolation, duplicate keys, dan foreign parent task.

**Batasan:** seluruh 28 halaman belum selesai secara domain. Beberapa handler asli tetap menjalankan demo state dan belum memiliki endpoint domain. Koneksi Laravel ke PostgreSQL dan browser E2E belum dapat dites di lingkungan pengeditan ini karena Composer/PostgreSQL server/installed dependencies tidak tersedia. Hasil baru bisa dinyatakan lulus setelah tes di local environment pengguna.

## 13 Oktober — cakupan non-grid

9. Migration `module_states` (JSONB, ULID, company, section, version, audit) untuk 13 non-grid route; tidak mengganti CSS atau DOM.
10. React memuat grid snapshot dan module state bersama sebelum mengeksekusi original JS. Login melakukan reload lengkap agar state backend tidak kalah oleh demo fixtures.
11. Hook state ditempel di JavaScript original tepat sebelum render masing-masing modul, tanpa mengubah markup/tampilan.
12. Simpan perubahan state secara serial dengan optimistic conflict 409, seeded once, dan tenant isolation. 5 test Laravel tambahan ditulis.
13. CSV export asli tetap tersedia; tombol ekspor yang tadinya hanya menampilkan dialog di Document, Meeting, Corporate, Security sekarang mengunduh CSV dari tabel/list yang tampil, tanpa mengganti tombol/markup.
14. **Tidak diklaim selesai:** sebagian page non-grid menyimpan state saja (provider/integrasi nyata masih dummy), normalized domain belum selalu tersinkronkan dengan grid rows.
