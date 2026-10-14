# Test Report

Tanggal: 14 Oktober 2026  
Target data: PostgreSQL `sop_platform_test` (terpisah dari `sop_platform`)  
Perintah utama: `powershell -ExecutionPolicy Bypass -File .\scripts\verify-local.ps1`

## Hasil tervalidasi

| Suite | Hasil |
|---|---:|
| Laravel feature/integration | 62 passed, 380 assertions |
| Frontend TypeScript + Vite production build | Pass, 147 modules |
| Grid adapter contract | Pass, termasuk create/update/import/delete/reload/concurrent mount dan warm start |
| Module-state adapter contract | Pass |
| Playwright mock/UI regression | 11 passed |
| Viewport login | 7 ukuran: 1920x1080 sampai 375x812 |
| Browser Laravel + PostgreSQL nyata | 1 passed: login, CRM save/reload/lead→prospect/reload, Dashboard period API, 9-panel Workspace, 27 route, logout |
| Source/UI integrity | Pass: 28 route, 11 grid route, 13 module-state route, 3 SQL projection route, no Docker Compose; unintegrated UI-only route kosong |
| Domain projection contract | Pass |
| Native warehouse transfer contract | Pass |

## Skenario risiko yang tercakup

- autentikasi, CSRF/session, logout;
- forgot/reset password, lockout, login history, TOTP challenge/recovery, session revoke;
- tenant isolation dan role authorization;
- stale version/optimistic concurrency;
- seed tidak menimpa perubahan pengguna;
- transaksi sales, procurement, inventory, transfer, accounting, project, RUPS, dan bank;
- journal balance, idempotency, negative stock guard, serta cross-company denial;
- private document upload/version/download/archive;
- persistence dan konversi lead→prospect CRM sesudah browser reload pada PostgreSQL nyata;
- agregasi Dashboard berdasarkan periode dan tenant, seluruh proyeksi personal Workspace, serta read-notification isolation;
- tidak ada response API 5xx atau uncaught browser error pada alur browser nyata.

## Catatan

Build menampilkan warning minifier untuk token literal `scrollbar-thin` pada CSS prototype. File beku tidak diubah karena warning tidak menggagalkan build dan perubahan berisiko mengubah paritas UI.

Pengujian provider eksternal tidak dijalankan tanpa kredensial. Endpoint sengaja tidak memalsukan status sukses saat provider belum dikonfigurasi.
