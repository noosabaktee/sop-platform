# API Reference

Base lokal: `http://127.0.0.1:8000`. Browser development memakai proxy Vite sehingga cookie Sanctum tetap same-origin. Semua endpoint `/api/v1/*` memerlukan session login kecuali endpoint auth yang dinyatakan lain.

## Auth dan state

| Method | Endpoint | Kegunaan |
|---|---|---|
| GET | `/sanctum/csrf-cookie` | Menginisialisasi CSRF cookie |
| POST | `/api/login` | Login akun aktif |
| POST | `/api/two-factor-challenge` | Menyelesaikan challenge TOTP/recovery code |
| POST | `/api/forgot-password` | Meminta token reset (respons generik anti-enumerasi) |
| POST | `/api/reset-password` | Reset password token sekali pakai dan revoke sesi |
| POST | `/api/logout` | Logout dan invalidasi session |
| GET | `/api/v1/me` | User login |
| GET | `/api/v1/security/login-history` | Riwayat login tenant/user sesuai role |
| GET/DELETE | `/api/v1/security/sessions...` | Daftar dan revoke sesi user |
| POST/DELETE | `/api/v1/security/two-factor...` | Setup, enable, atau disable TOTP |
| GET/PUT | `/api/v1/grid-snapshots` | Load/commit grid non-authoritative dengan version check |
| GET/PUT | `/api/v1/module-states` | Load/commit state halaman dengan version check |
| GET/POST/PATCH/DELETE | `/api/v1/admin/users...` | User management terotorisasi |
| GET | `/api/v1/dashboard?period=week\|month\|quarter\|year` | Agregat tenant-scoped untuk Overview/Dashboard |
| GET | `/api/v1/workspace` | Sembilan proyeksi operasional milik user login |
| POST | `/api/v1/workspace/notifications/{id}/read` | Menandai notifikasi milik user sebagai dibaca |

## Workflow/domain utama

- Quotation builder dan decisions: `/api/v1/quotation-builder/*`, `/api/v1/workflows/quotations/*`.
- CRM lead conversion: `POST /api/v1/workflows/crm/leads/{rowKey}/convert`.
- Transaction approval: `/api/v1/workflows/transaction-approvals`, purchase-request decisions.
- Sales projection/workflow: `/api/v1/operational/sales` dan endpoint transaksi sales.
- Procurement/inventory/accounting/projects: `/api/v1/operational/*`.
- Warehouse transfer: create, ship, receive, cancel di `/api/v1/operational/inventory/transfers/*`.
- Stocktake: `/api/v1/operational/inventory/stocktakes`.
- Bank reconciliation: `/api/v1/operational/banks`.
- Documents: `/api/v1/documents/files` serta version download.
- Reports: `/api/v1/reports/data` dan `/api/v1/reports/export.csv`.
- Audit: `/api/v1/security/audit-events`.
- Optional providers: `/api/v1/integrations/status`, `/api/v1/communications/send`, `/api/v1/ai/chat`.

Daftar authoritative lengkap dapat dilihat dengan:

```powershell
cd backend
php artisan route:list --path=api
```

Respons validasi menggunakan 422, unauthenticated 401, forbidden 403, dan konflik versi 409. Endpoint provider mengembalikan kegagalan eksplisit bila belum dikonfigurasi; tidak ada keberhasilan simulasi.
