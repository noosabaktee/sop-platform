# SOP Platform — Tahap 2 sampai 5 (lanjutan, 13 Oktober 2026)

## Ketentuan yang tidak berubah
- `frontend/src/styles/prototype.css`, `frontend/public/prototype-original.js`, `frontend/public/prototype-extras.js`, dan `frontend/public/original-body.html` tidak diedit.
- Framework React + Laravel + PostgreSQL, tanpa Docker.
- Tetap gunakan **backend milik ZIP ini** beserta migration baru; jangan menggabungkan controller lama dari ZIP sebelumnya.

## Perbaikan login (sebelum tahap lanjutan)
- `VITE_API_BASE_URL=http://127.0.0.1:8000/api` dahulu menghasilkan request `/api/api/login` (base path duplikat).
- Client API menghapus `/api` di akhir URL, kemudian memakai proxy same-origin Vite saat development, dengan cookie Sanctum dan `X-XSRF-TOKEN` aktif.
- Default `frontend/.env`: `VITE_API_BASE_URL=` (kosong), `vite.config.ts` meneruskan `/api` & `/sanctum` ke `127.0.0.1:8000`.
- Jika login gagal, tampilkan pesan berdasarkan HTTP 419/401/422/429/koneksi. Lihat Network tab dan `backend/storage/logs/laravel.log`.

## Tahap 2 — Workflow bisnis
- **Stock Opname**: snapshot produk/gudang, input hitungan, verifikasi seluruh baris, validasi snapshot belum berubah, posting selisih sebagai pergerakan stok dan jurnal koreksi akun `1300`/`5100` dalam satu transaksi PostgreSQL. Endpoint `/api/v1/operational/inventory/stocktakes`.
- **Project Cost**: pencatatan biaya proyek, referensi unik, ringkasan actual cost dibanding budget/contract. Endpoints `/api/v1/operational/projects/costs`. Ini **bukan** revenue recognition lengkap; laba/margin dibiarkan kosong jika belum ada linking revenue.
- **Cash & Bank**: bank account, mutasi bank, match/unmatch satu-ke-satu ke baris jurnal ter-posting berdasarkan COA dan nominal, audit. Endpoint `/api/v1/operational/banks`.
- **Meeting/RUPS**: daftar, draft, schedule, held, minutes, catatan voting, close; dipisah per perusahaan. Endpoint `/api/v1/corporate/meetings`. Pengujian legal quorum dan ketentuan voting yurisdiksi perlu konfigurasi tersendiri sebelum penggunaan resmi.
- Data ringkas stock opname, bank dan cost ditampilkan melalui **grid asli** sebagai proyeksi read-only agar transaksi tidak bisa dipalsukan dengan inline edit; mutasi dilakukan pada API terotorisasi.

## Tahap 3 — Integrasi
- `/api/v1/integrations/status` menampilkan flag konfigurasi.
- `/api/v1/communications/send` dapat mengirim lewat SMTP atau Meta WhatsApp Cloud API *hanya bila provider dikonfigurasi*, dengan idempotency key, audit, pembatasan role, dan status pengiriman; bukan simulasi ketika belum tersedia.
- `/api/v1/ai/chat` menggunakan `SOP_AI_API_KEY` bila dikonfigurasi; tidak mengirim data SQL ke provider dan tidak mengeksekusi tindakan bisnis. Tombol **Kirim Email** native memakai endpoint SMTP dengan status nyata; tombol sync inbox serta tombol send WhatsApp pada kontak fixture ditolak tanpa provider/kontak nyata agar tidak muncul toast keberhasilan palsu. Tombol **Kirim AI** native memakai endpoint AI opsional. Koneksi masuk tidak diimplementasikan.
- Integrasi inbox/sinkronisasi dua arah, WhatsApp template approved & opt-in registry, chatbot/AI agent, scheduler, OAuth provider, dan webhook acknowledgement **belum lengkap**. Kredensial eksternal tidak termasuk ZIP.

## Tahap 4 — Reports
- GET `/api/v1/reports/data?type=sales|finance|projects|purchase|inventory`, di-scope berdasarkan perusahaan dan izin role.
- GET `/api/v1/reports/export.csv?type=...`, CSV server-side, UTF-8 BOM, escaping nilai berawalan karakter formula spreadsheet.
- Laporan yang didukung dari tombol **Export** asli di halaman Reports kini mengambil data dari backend; yang belum memiliki SQL source ditolak alih-alih mengekspor contoh statis.
- Sebagian grafik/dashboards milik prototype di halaman selain yang diproyeksikan masih memuat angka contoh. Laporan pajak, neraca penuh, arus kas, dan scheduler report belum valid untuk production.

## Tahap 5 — QA
- Tes feature `backend/tests/Feature/OperationalCompletionTest.php` untuk stock opname, bank, RUPS, laporan, provider belum dikonfigurasi, dan pembatasan role.
- Periksa sintaks PHP semua file, parse TS/TSX, jalankan skrip adapter bridge, dan integritas berkas UI.
- **Belum lulus Laravel integration tests** di lingkungan pembuat: Composer dan ekstensi pdo_pgsql tidak tersedia. Tes wajib dijalankan pada database `sop_platform_test` yang terpisah dari data kerja. Jangan menganggap source-level checks sama dengan E2E.

## Status jujur
Ini revisi nyata tahap 2–5 namun **belum 100% semua 28 halaman end-to-end**, khususnya tombol frontend workflow RUPS, bank, opname lanjutan dan beberapa integrasi provider belum terhubung ke form interaktif sepenuhnya. Semua endpoint di atas siap dihubungkan ke frontend, namun harus diverifikasi di mesin pengembang melalui PostgreSQL, login, browser dan role permissions sebelum dinyatakan selesai.
