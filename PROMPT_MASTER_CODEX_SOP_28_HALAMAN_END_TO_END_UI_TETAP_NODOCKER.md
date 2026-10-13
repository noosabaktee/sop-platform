# MASTER PROMPT CODEX — SELESAIKAN SOP PLATFORM 28 HALAMAN END-TO-END, UI/UX DIKUNCI, TANPA DOCKER

## PERAN DAN MISI

Bertindak sebagai tim senior full-stack engineer (React/TypeScript, Laravel/PHP, PostgreSQL, QA E2E, security, DevOps lokal Windows) yang bertugas **MELANJUTKAN DAN MENYELESAIKAN proyek yang saya lampirkan**, bukan membuat contoh, prototype baru, atau sekadar menulis rencana. Saya ingin aplikasi SOP Integrated Business Management Platform yang seluruh **28 route**-nya dapat digunakan dengan workflow bisnis nyata dan penyimpanan PostgreSQL, sesuai PRD. Laksanakan pekerjaan dengan memodifikasi source code langsung di workspace Codex, menjalankan aplikasi/tes yang dapat dijalankan, memperbaiki hasilnya, dan menyerahkan kode final, laporan tes, serta panduan instalasi.

**KETENTUAN TERPENTING: UI/UX yang sekarang SUDAH SAYA SETUJUI. JANGAN UBAH SEDIKIT PUN.** Tampilan harus tetap *pixel-perfect* terhadap HTML prototype asli dan versi project terakhir. Prioritas sumber kebenaran:
1. `references/prototype.original.html` / `references/prototype(2).html`, `frontend/public/reference/prototype.html`, atau file prototype asli yang saya lampirkan: **sumber kebenaran tertinggi untuk UI/UX, DOM, perilaku interaksi visual, dan navigasi**.
2. `SOP-PRD.md` / `references/SOP-PRD.original.md`: **sumber kebenaran fitur, aktor, aturan bisnis, dan acceptance criteria**.
3. ZIP/source code SOP **terakhir** yang saya lampirkan (`SOP_Tahap_2_3_4_5_LoginFix_UI_Tetap_NoDocker` atau direktori hasil ekstraksinya): **basis kode yang harus dilanjutkan**.
4. Master prompt terdahulu dan dokumentasi `docs/`: rujukan tambahan; audit fakta implementasi sendiri, jangan menganggap pernyataan “sudah” di README otomatis berarti lolos tes.

Jika ada perbedaan antara dokumen lama dan kode, laporkan konflik spesifiknya, pertahankan UI sesuai prototype, dan ikuti PRD untuk perilaku bisnis. **Jangan menunggu izin untuk perbaikan teknis yang bisa diputuskan dari sumber tersebut.** Tanya hanya bila membutuhkan rahasia/kredensial eksternal atau keputusan bisnis/legal yang sama sekali tidak tersedia.

## A. LARANGAN ABSOLUT (WAJIB DITAATI)

1. **DILARANG MENGUBAH UI/UX.** Tidak boleh redesign, improve, modernisasi, beautify, menyederhanakan, improvisasi, maupun mengganti konsep desain.
2. Jangan mengubah warna, gradients, font Inter/font family, font size/weight, line height, letter spacing, margin, padding, gap/spacing, ukuran card, radius, border, shadow, ikon, posisi tombol, layout, ukuran sidebar/header, tinggi baris tabel, alignment, breakpoint, responsive behavior, mobile bottom navigation, dark mode, animasi, hover, focus, label, bahasa, isi menu, tabs, drawer, modal, dan urutan navigasi.
3. **JANGAN mengubah, mengganti, atau menulis ulang tabel interaktif dengan tabel generik.** Klik sel harus tetap mengedit inline seperti prototype; jangan membuka modal editor hanya karena baris atau sel tabel diklik. Modal/drawer hanya boleh muncul jika memang ada pada aksi prototype tersebut. Pertahankan checkbox, multi-select, sort, filter, search, pagination, resize, keyboard navigation, copy/paste, import/export, toolbar, dan perilaku asal. Handsontable diperlukan untuk grid editable menurut PRD; terapkan tanpa memunculkan tampilan default Handsontable yang berbeda. Jika mengganti renderer merusak parity, pertahankan markup/behavior asli dan rencanakan integrasi grid yang kompatibel—jangan mengorbankan kesamaan visual.
4. Jangan menambah Tailwind, Bootstrap, Material UI, Ant Design, shadcn/ui, atau library visual yang mengganti tampilan. Jangan menambahkan popup `alert()` generik untuk kegagalan grid bila prototype menyediakan feedback/notification sendiri. Loading/error/empty states harus mengikuti visual dan pola native prototype, bukan redesign.
5. **DILARANG menggunakan Docker, Docker Compose, Laravel Sail, atau mewajibkan WSL.** Wajib dapat berjalan langsung di Windows PowerShell dengan PHP, Composer, Node.js, npm, dan PostgreSQL lokal. Jangan menggunakan SQLite sebagai fallback database bisnis.
6. **DILARANG menganggap localStorage, IndexedDB, fixture JavaScript, `grid_rows` JSONB, `grid_snapshots`, atau `module_states` sebagai pengganti relasi tabel transaksi/domain PostgreSQL.** Boleh dipakai sebagai cache UI, preferensi, draft/presentation state yang tepat; data bisnis authoritative tetap di tabel domain PostgreSQL terstruktur. Jangan menyimpan token/password rahasia di localStorage.
7. **DILARANG tombol palsu**: tombol Add, Edit, Delete, Save, Cancel, Import, Export, Submit, Approve, Reject, Download, Upload, Search, Filter, Reset, Print, pagination, bulk action, dsb. harus memanggil fungsi nyata sesuai PRD. Tidak boleh toast “berhasil” jika API gagal atau provider belum terhubung.
8. Dilarang hanya membuat skeleton backend, controller stub, pseudocode, PRD ulang, dokumentasi, atau placeholder dan menyatakan selesai. **Yang diminta adalah source code berfungsi.** Jangan memperbarui nilai KPI dengan angka hardcoded/dummy pada runtime aplikasi.
9. Dilarang melakukan destructive command (`migrate:fresh`, `db:wipe`, `DROP DATABASE`, `TRUNCATE`) terhadap database pengguna yang sudah berisi data tanpa persetujuan eksplisit. Tes destruktif hanya untuk DB uji terpisah. Seeder idempotent dan migration aman dijalankan ulang.
10. Dilarang mengganti framework: **frontend React.js + TypeScript + Vite, backend Laravel REST API + Sanctum, database PostgreSQL**. Jangan konversi ke Next/Nuxt/Vue/Angular/Svelte, jangan membuat backend Express/Node pengganti Laravel.
11. Dilarang merombak UI atas alasan refactor. Jika kode memerlukan restrukturisasi, pertahankan DOM dan tampilan hasil akhir identik. Jangan menghilangkan halaman/submenu atau mengganti data yang memang wajib ada di prototype tanpa alasan bisnis.
12. Dilarang mengaku **100% end-to-end/production-ready** bila belum menjalankan dan lulus build, migrations, feature tests, integrasi PostgreSQL, browser E2E, dan visual regression. Buat laporan hasil faktual PASS/FAIL/BLOCKED beserta log dan bukti.

### Bekukan aset UI
Anggap file berikut immutable kecuali perubahan teknis yang terbukti mutlak perlu dan **lulus byte diff untuk CSS/markup visual serta screenshot visual regression**:
- `frontend/src/styles/prototype.css`
- `frontend/public/original-body.html`
- `frontend/public/prototype-original.js`
- `frontend/public/prototype-extras.js`
- referensi prototype asli

**Jangan menyentuh CSS/HTML hanya untuk mempermudah integrasi API.** Tambahkan adapter/controller nonvisual di file terpisah, atau perubahan JavaScript minimum pada event binding bila diperlukan. Simpan SHA-256 baseline dan verifikasi kembali sebelum final. Catatan: JavaScript prototype boleh dipatch untuk koneksi API selama semua efek visual dan interaksi native tetap identik.

## B. INSPEKSI AWAL REPO (KERJAKAN, JANGAN LANGSUNG GENERATE ULANG)

1. Ekstrak dan pelajari seluruh project, baca PRD utuh, source prototype asli, migration, model, controller, route, React bridges, tests, dan docs.
2. Identifikasi semua 28 route, tab, subtab, table/grid, form/input, tombol `data-action`, `data-route`, dropdown, modal, drawer, kalender, chart, upload/download, import/export, dan event handler. Jangan berhenti setelah memeriksa Dashboard.
3. Jalankan dependency install, build, dan startup lokal; audit `php artisan route:list`, foreign key, policies, API requests, browser console, dan Network. Cari endpoint yang salah/duplikat, handler yang memanggil modal generik, dan state yang disimpan ke objek JS tanpa API.
4. Audit `frontend/src/pages/ExactPrototype.tsx` dan bridge yang ada (`gridBridge`, `moduleStateBridge`, `quotationBuilderBridge`, `approvalWorkflowBridge`, `operationalProjectionBridge`, `inventoryTransferNativeBridge`, `completionBridge`, dll.). Hindari init dua kali, race condition mount/unmount, listener ganda, request ganda, dan overwriting database oleh fixture saat refresh.
5. Telusuri tabel `grid_rows`, `grid_snapshots`, `module_states`, serta tabel domain. Buat matriks **UI ACTION → API ENDPOINT → SERVICE → DOMAIN TABLE → TEST CASE**. Migrasikan aksi bisnis yang masih generik ke endpoint domain secara bertahap tanpa mengganti UI.
6. Buat dokumen `docs/IMPLEMENTATION_TRACKER.md` berisi daftar lengkap tindakan untuk setiap halaman, status `NOT_STARTED/IN_PROGRESS/PASS/FAIL/BLOCKED`, endpoint, query/tabel, dan test yang membuktikannya. **Dokumen ini bukan pengganti implementasi**.
7. Catat output dan kegagalan nyata, lanjutkan memperbaiki kode. Jangan menyerahkan hanya laporan audit.

## C. PERBAIKAN KRITIS YANG SUDAH DITEMUKAN DI WINDOWS

Pastikan instalasi fresh langsung berhasil (tanpa memperlakukan ZIP lama sebagai database lama):
- Laravel `/up` harus HTTP 200. Sebelumnya `HTTP 500 InvalidArgumentException: Please provide a valid cache path.` Terjadi karena folder `storage/framework/views`/cache dan `bootstrap/cache` belum ada setelah ekstraksi ZIP. Buat semua direktori yang diperlukan (`storage/framework/views`, `storage/framework/cache/data`, `storage/framework/sessions`, `storage/logs`, `bootstrap/cache`), gunakan `.gitkeep` agar ikut source archive, pastikan writable, dan berikan setup script idempotent PowerShell.
- Login gagal dan popup `Gagal memuat data PostgreSQL` harus didiagnosis dan diperbaiki di source, **bukan disembunyikan**. Periksa Laravel log, HTTP 401/419/422/500, cookie, CSRF, session, dan request grid snapshots. Jika tidak autentik, jangan melakukan request protected sebelum sesi valid atau membuat popup database palsu.
- Setup development same-origin lewat proxy Vite: `/api` dan `/sanctum` → `http://127.0.0.1:8000`, React di `http://127.0.0.1:5173`. `frontend/.env` lokal gunakan `VITE_API_BASE_URL=` kosong; hindari URL `/api/api/...`, konsisten `127.0.0.1` vs `localhost`, `withCredentials`, `X-XSRF-TOKEN`, cookies Sanctum, CSRF route.
- Backend `.env.example` harus benar untuk PostgreSQL lokal, `APP_KEY`, session store, view cache, CORS/Sanctum stateful domain. Jangan hardcode credential pribadi.
- Seeder menyediakan akun development `admin@sop.local`, password diambil dari `SOP_SEED_PASSWORD` (fallback development `ChangeMe-2026!`), di-hash via model Laravel, dan dites dapat login lalu logout. Password default hanya untuk lokal dan wajib diganti sebelum deploy.
- `php artisan migrate --seed` pada database baru **harus lulus** PostgreSQL; `php artisan migrate:fresh --seed` boleh dites hanya pada DB uji kosong khusus. Telusuri self-FK `project_tasks.parent_id` yang sebelumnya error `SQLSTATE[42830]: there is no unique constraint matching ... project_tasks`; atur primary key/unique constraint sebelum foreign key ditambahkan. Uji migration `up` dan `down` secara aman.
- Jaga relasi, FK, indeks, UUID/ULID type consistency, transaksi DB, rollback, concurrency/locking, unique numbering, precision currency/decimal, timezone dan audit.
- Hindari pop-up browser error tak informatif dan infinite loading; gunakan loading/skeleton/progress sesuai komponen native yang sudah ada, bedakan network vs 401/419/500, retry, dan jangan menghapus input draft ketika request gagal.

## D. DAFTAR WAJIB 28 ROUTE DAN FITUR

Seluruh route harus punya UI yang sama dengan prototype, proteksi permission, data PostgreSQL yang benar, dan aksi native yang benar. Audit seluruh tab/submenu pada masing-masing route:

1. `/login`: login, logout, forgot/reset password, email verification, 2FA (jika PRD), session expired, lockout/rate limit, session management dan login history. Sanctum cookie auth, secure password.
2. `/overview`: KPI dan widget dari SQL real, pencarian/drill-down, filter periode, refresh states.
3. `/my-workspace`: my tasks, projects, approvals, activities, calendar, documents, notifications, email, profile; data berdasarkan user dan permission, action lintas modul benar.
4. `/dashboard`: executive, sales, finance, project, procurement, inventory, personal dashboards; semua KPI/chart real, filter, drill-down, export.
5. `/crm-sales`: leads, prospects, customers, contacts, activities/follow-up, pipeline, forecast, history; CRUD, convert lead → opportunity/customer, ownership, deduplication.
6. `/business-development`: opportunities, market intelligence, target account, prospect mapping, partnership, tender/bidding, competitor, proposal, reports.
7. `/quotation`: list/create/edit, item/price/tax/discount, numbering, draft, submit approval, approve/reject, revision, negotiation, send, convert ke SO; tabel dan form asli.
8. `/sales`: sales order, delivery/BAST, invoice, return, payment receipt, accounts receivable, commission; partial payment, outstanding, reversal dan tidak melanggar status transaksi.
9. `/projects`: project list/dashboard, WBS, task/subtask, Gantt, milestone, team/PIC, progress, budget/RAB, costs, procurement, risks/issues, documents, profitability; dependency dan status sesuai aturan.
10. `/purchase`: purchase request, approval, purchase order, goods receipt, purchase return, vendors, prices/contracts, vendor evaluation; procure-to-pay.
11. `/inventory`: stock, movement ledger, stock card, transfer antar-gudang, opname, adjustment, serial/batch, valuation, reservation, negatif stock policy; atomic updates.
12. `/finance`: AR/AP, accounting/journal, COA, cash/bank, reconciliation, tax, period close, financial statements, balanced debit-credit, immutable posted journals, correction via reversal.
13. `/reports`: sales/purchase/inventory/project/finance/tax/management reports, KPI, analytics, saved filter, custom report whitelist, CSV/XLSX/PDF export sesuai fitur prototype; angka dari SQL.
14. `/management`: executive/company KPI, profitability, risk, strategic initiatives, financial/cash/pipeline performance, decisions, drilldown.
15. `/master-data`: company, COA, customers, vendors, products/services, assets, departments, employees, warehouses, pricing/tax, banks, cost centers; CRUD, archive/dependency rules, import/export.
16. `/document-management`: upload private, metadata, folder/category, preview, download, version, approval, access control, archive, associated transaction; jangan menampilkan upload sukses tanpa file tersimpan.
17. `/document-template`: editor template, variables, versions, preview, generate document (quotation/invoice/PO/SO/BAST/contract/report/email), scope, signature/stamp sesuai PRD.
18. `/email-communication`: inbox, sent, draft, thread, compose/send, attachments, labels, templates, shared mailbox, SMTP/provider sync bila configured, delivery log.
19. `/omnichannel`: unified inbox, contact threads, assignments, tags, SLA, source connectors, bot/handoff, analytics.
20. `/whatsapp-integration`: accounts, templates, opt-in, contacts, message/broadcast, outbound/inbound webhook, status delivery, reminders, compliance; **no fake send**.
21. `/general-meeting-rups`: agenda, schedule, shareholders, attendance, quorum/voting sesuai aturan configured, resolutions, minutes, documents, action items.
22. `/workflow-approval`: inbox, pending/history, approval matrix, multi-step approvals, delegation, escalation, SLA, approval/reject/revision, audit real; sinkron dengan transaksi.
23. `/corporate`: corporate calendar, board/management meetings, resolutions, corporate docs, action items, linked RUPS.
24. `/ai-assistant`: AI chat, context permissions, citations/source references, document summarization/report support; real provider behind backend when API key configured; human confirmation untuk aksi sensitif, no hallucinated database writes.
25. `/data-intelligence`: source registry, scraping/import jobs bila legal/authorized, scheduler, raw vs cleaned data, provenance, confidence, monitoring, lead/market/competitor data, alerts.
26. `/integrations`: Email/Outlook, Google/Microsoft Workspace, WhatsApp, payment, banking, webhook/API, external systems; config storage encrypted, connection/test status dari provider asli, retry/idempotency/audit.
27. `/security-audit`: real audit trail, access logs, login history, data changes, security events, session revoke, RBAC, company isolation.
28. `/settings`: real user CRUD, roles/permissions/policies, approval matrix, numbering, notifications, localization, config, integrations, backup/restore and safe access, not just toggling JSON.

**Jangan menganggap daftar ringkas ini menggantikan PRD.** Baca semua FR-01 s.d. FR-17, NFR, flow, acceptance criteria dan prototype untuk tab serta detail yang tidak tercantum di sini.

## E. DATABASE, API, BUSINESS INTEGRITY

- Bangun / lengkapi Eloquent domain models, migrations, seeders/factories, Form Requests, API Resources, Policies/Gates, service/action layer, transactions, indexed relationships, audit trail, notifications/events/queues, soft-delete sesuai kasus.
- Setiap create/edit/delete native harus memakai endpoint nyata dan balik ke state konsisten dari server. Refresh/browser login ulang harus menunjukkan data sama, tidak kembali ke fixture. Delete wajib persisted dan aksesnya diuji; business records referensial gunakan archive/soft delete atau rejection sesuai policy.
- Jangan jadikan `grid_rows` dan `module_states` sebagai basis transaksi finansial, stok, users, approvals, dokumen, dan proyek. Sediakan mapping dari grid visual ke domain. `grid_rows` boleh sebagai compatibility/presentation layer, bukan source of truth untuk transaksi.
- Jangan gunakan generic CRUD endpoint untuk melewati status workflow: invoice final, PO, SO, approved quotation, posted journal, stock ledger, transfer received, dsb. harus diubah melalui command/transition service tervalidasi.
- Untuk semua uang: decimal, total hitung server, rounding jelas, tax/discount server-authoritative. Cek referensi dan konsistensi balance. Saat perubahan data melibatkan beberapa tabel gunakan DB transaction dengan rollback dan idempotency key. Cegah double posting dan race condition.
- Workflow utama wajib diuji: Lead → Opportunity → Quotation → Approval → Sales Order → Delivery → Invoice → Payment → AR; dan PR → Approval → PO → Goods Receipt → Stock/AP → Vendor Payment; serta Project → WBS/Task → Purchase/Inventory/Cost → Progress → Profitability; dan transfer/opname/reconcile.
- CRUD di semua tab yang mengubah master data atau transaksi harus memiliki ownership/company constraints dari authenticated user. Jangan percayai `company_id`, `role`, `user_id`, `price`, atau `status` dari browser tanpa policy/validation server.
- Perhitungan KPI/dashboard/report berasal dari query domain bisnis; filter periode/branch/owner sesuai user. Setiap drill-down harus memetakan record yang benar.
- Import CSV/XLSX: validasi kolom/tipe, preview mapping bila prototype mendukung, transaksi/pagination/batch, duplicate handling, error per-row, formula injection protection untuk export, jangan hanya menampilkan file picker. Export harus mengekspor data nyata dan menerapkan filter aktif serta permission.
- Upload file: binary file disimpan aman (private disk), metadata/file versions di PostgreSQL, download authorized dan no path traversal, batas size/MIME dan scan/validation sesuai environment.
- Provider eksternal: implementasikan integration adapters nyata dengan secret dari `.env`/encrypted storage, timeout, webhook verification, rate limit, retry, idempotency dan logging. Jika API keys belum diberikan: code + config + tests dengan mock provider **khusus testing**, tampilkan jelas `NOT CONFIGURED` dalam feedback native, jangan mengaku sudah mengirim/terhubung. Jangan hardcode secrets, jangan minta membagikannya dalam chat.
- Pastikan jobs/email/webhook failure tidak memalsukan status. Status `queued/sent/delivered/failed` harus sesuai fakta provider yang diketahui.

## F. FRONTEND TANPA MENGUBAH TAMPILAN

- Gunakan DOM/CSS/handler prototype dan route React yang sekarang. Boleh modularisasi logic React/API, jangan mengubah output DOM visual dan event behavior.
- Pastikan tabel benar-benar inline editable (bukan modal otomatis), state optimistic dipertanggungjawabkan server, error rollback per cell/row, version conflict (409), bulk operations memerlukan konfirmasi yang memang ada di prototype.
- Setiap tombol/aksi native di semua 28 halaman terpetakan jelas. Sediakan centralized API client dan error handling: 401 sesi; 419 CSRF; 422 validation; 403 permission; 409 concurrency; 500 server error. Jangan menampilkan popup “Gagal memuat PostgreSQL” untuk masalah sesi/CSRF.
- Loading skeleton/progress, empty state, validation/error, success notification harus bekerja dan konsisten dengan elemen yang sudah ada di prototype; **jangan menambah desain baru**.
- Implementasikan search/filter/sort/pagination server-side jika data besar dan pastikan tombol back/refresh/hash-route/mobile navigation, sidebar collapse, language, theme dan form works.
- Bila memerlukan Handsontable pada grid sesuai PRD: pastikan lisensi deployment sesuai penggunaan komersial, custom renderer/style tidak mengubah desain, dan keyboard/editing/performance diverifikasi. Jangan pakai komponen default dengan padding/warna/border baru.
- Jangan render data domain lalu secara otomatis menyimpannya ulang sebagai fixture `grid_snapshots`—read projection ≠ user edit. Jangan overwrite edit pengguna akibat refresh asinkron.

## G. RENCANA KERJA EKSEKUSI (KERJAKAN SAMPAI SELESAI, JANGAN HANYA DISKUSI)

1. **Baseline+smoke:** install deps, Laravel `/up`, login seed, CSRF, read-only dashboard, migration/seed PostgreSQL, build frontend. Tangani semua error install Windows (Composer cache locks, `bootstrap/cache`, missing storage directories, imports Handsontable CSS, CORS/419, FK project_tasks).
2. **Inventory tombol native:** audit tindakan per route dan per tab, simpan di implementation tracker dengan test ID.
3. **Domain completion:** perbaiki bisnis inti, master data, CRM, quote-to-cash, procure-to-pay, project, inventory, finance, roles/approval. Pastikan UI native memanggil endpoint domain (bukan hanya ada endpoint).
4. **Remaining modules:** documents/templates, meetings/RUPS, communications, corporate, settings, integrations, data intelligence, AI; provider yang memerlukan akun external harus sepenuhnya diimplementasikan dengan config interface, aman saat unconfigured.
5. **Dashboards/reports:** hapus dummy runtime, hitung KPI SQL, filter/export/drilldown benar.
6. **Full QA:** jalankan migrations + seeding PostgreSQL nyata, PHP feature/integration tests, browser E2E Playwright, visual snapshots, security/role/concurrency tests, rerun sampai PASS.
7. **Final handover:** kemas SOURCE CODE UTUH (bukan diff saja), clean `.env.example`, scripts PowerShell, README install fresh, scripts test, docs implementation matrix + PASS evidence + known limitations. Tidak perlu Docker.

Jalankan iteratif: setelah memperbaiki suatu modul, langsung test; jika gagal, baca error lalu patch sampai lulus, kemudian lanjut modul lain. **Jangan berhenti setelah satu atau dua endpoint, jangan mengirim ZIP sebagai pengganti pekerjaan.** Jika konteks atau eksekusi terbatas, simpan checkpoint di repo, daftar blocker dengan lokasi file tepat, dan lanjutkan pada sesi berikutnya tanpa mengklaim selesai. Jangan menghapus fitur yang sudah bekerja demi mengejar tes hijau.

## H. PENGUJIAN WAJIB SEBELUM KLAIM END-TO-END

- Real PostgreSQL (bukan SQLite, bukan mocked DB). Database pengujian terpisah `sop_platform_test`; tes yang refresh DB tidak boleh diarahkan ke `sop_platform` pengguna. Verifikasi migration `up/down` secara aman, FK, unique, seed idempotency dan admin login.
- Tes login/logout, CSRF, session expired, unauthorized role, cross-company access, 2FA/reset bila dibutuhkan.
- Pada **setiap route/tab** jalankan create, read setelah refresh/login ulang, update, delete/archive, search/filter/sort, import/export apabila relevan, dan validasi error. Buat per-test evidence/HTTP traces.
- Tes alur multi-tabel: lead-to-cash, purchase-to-pay, stock transfer, stock opname, cash/bank reconciliation, project costing, approvals dan reversals. Pastikan transaksi ditolak bila salah status/permission dan idempotency tidak menggandakan ledger/payment.
- Playwright real Chromium: viewport `1920x1080`, `1440x900`, `1280x800`, `1024x768`, `768x1024`, `390x844`, `375x812`. Bandingkan screenshot prototype referensi vs React hasil render per route, default/expanded/collapsed sidebar, tab, modal bawaan, dark mode, dan mobile bottom nav. Screenshot diff threshold sekecil mungkin; setiap deviasi style/layout harus diperbaiki tanpa mengubah prototype.
- Jalankan `composer install`, `php artisan optimize:clear`, `php artisan migrate --seed` (pada DB kosong), `php artisan test`, `npm ci` (atau `npm install` jika lockfile belum ada), `npm run build`, `npx playwright test`. Pastikan storage/cache bootstrap tersedia pada Windows hasil ZIP ekstraksi.
- Periksa console error, HTTP errors, stale fixture, network race, dead buttons, duplicate event listeners, requests blocked 401/419, error import/export, response status dan destructive action permissions.
- Terapkan tes API eksternal menggunakan fake server/provider test serta contract/webhook tests; **tes mocked provider tidak membuktikan layanan live tersambung**. Tuliskan status `BLOCKED: requires provider credentials` bila tidak ada kredensial, bukan PASS produksi.

**Definition of Done sebuah halaman:** seluruh fungsi yang dijanjikan PRD dan yang terlihat di prototype pada halaman itu berfungsi; data authority PostgreSQL, permissions dan transaction valid, state konsisten setelah refresh/login ulang, semua tombol interaktif asli berfungsi, tidak ada fake success, UI pixel parity tidak berubah, serta E2E real backend+PostgreSQL PASS. Untuk eksternal yang membutuhkan credential, sebutkan blocking fact dengan jujur; jangan sertifikasi penuh.

## I. OUTPUT WAJIB

Akhir pekerjaan sertakan:
1. Project React+Laravel+PostgreSQL yang telah diperbaiki **dalam repository**, siap `npm run dev` dan `php artisan serve` lokal tanpa Docker, plus ZIP source lengkap jika lingkungan mendukung.
2. `docs/IMPLEMENTATION_TRACKER.md` seluruh 28 route + tab + actions, endpoint, model/tabel dan test per aksi (bukan sekadar “implemented”).
3. `docs/TEST_REPORT.md` dengan tanggal, command yang benar-benar dijalankan, lingkungan, PASS/FAIL/BLOCKED, jumlah tes, ringkasan log kegagalan, dan screenshot path. Bedakan syntax check, mock adapter test, integration test, dan real browser E2E.
4. `docs/DB_SCHEMA_AND_WORKFLOWS.md` berisi tabel/relasi dan alur/transisi bisnis.
5. `docs/API_REFERENCE.md` daftar endpoint, auth/permissions, sample payload/responses & validation.
6. `docs/UI_PARITY_REPORT.md` per-viewport screenshot diff dan SHA-256 referensi UI.
7. `README.md` dan `scripts/setup-local.ps1`, `scripts/verify-local.ps1`: semua langkah PowerShell Windows fresh install tanpa Docker, environment variables, PostgreSQL `sop_platform` dan `sop_platform_test`, seed akun dev, cara build, test, log, backup dan troubleshooting.
8. Daftar **blocker kredensial provider eksternal** yang terisolasi dan tidak mengganggu fitur internal.

Pada laporan akhir wajib jelaskan **per route berapa lulus E2E sungguhan dari 28**, bukan sekadar “28 route terbuat”, “CSS identik”, “PHP syntax check OK”, atau “4 adapter mock test PASS”. Jika belum 28/28, lanjut mengerjakan yang gagal sejauh lingkungan memungkinkan dan laporkan yang betul-betul tidak dapat dijalankan beserta penyebab faktual.

## PERINTAH TERAKHIR

**SEKARANG KERJAKAN PERUBAHAN KODE DI REPO, JANGAN BERHENTI PADA ANALISIS ATAU PROPOSAL.** Jangan tanya saya untuk persetujuan perubahan teknis yang sudah jelas dari PRD/prototype. Jangan ubah UI/UX satu piksel pun, jangan gunakan Docker, jangan ganti teknologi, jangan bikin tabel modal editor, jangan pakai data dummy untuk bisnis nyata, jangan tampilkan kesuksesan palsu, jangan reset database pengguna. Lanjutkan perbaikan, integrasi, dan tes modul demi modul hingga 28 halaman yang bisa diverifikasi berfungsi end-to-end, lalu serahkan bukti faktual serta source code lengkap.
