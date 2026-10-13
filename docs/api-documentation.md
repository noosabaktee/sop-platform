# REST API awal

Semua endpoint versi 1 memerlukan session Sanctum dan cookie CSRF, kecuali login.

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/sanctum/csrf-cookie` | Inisialisasi cookie CSRF |
| POST | `/api/login` | Login email dan password |
| POST | `/api/logout` | Membatalkan sesi |
| GET | `/api/v1/me` | Pengguna aktif |
| GET | `/api/v1/dashboard` | KPI teragregasi dari tabel transaksional |
| GET | `/api/v1/records?route=/crm-sales&view_key=0&table_index=0` | Record per tab dan tabel, tenant-scoped |
| POST | `/api/v1/records` | Create business record |
| GET | `/api/v1/records/{id}` | Detail |
| PUT | `/api/v1/records/{id}` | Update dengan version check |
| DELETE | `/api/v1/records/{id}` | Soft delete |
| POST | `/api/v1/records/{id}/transition` | `submit`, `approve`, `reject` |
| GET | `/api/v1/approvals` | Daftar approval |
| POST | `/api/v1/approvals/{id}/decision` | Keputusan approval |

| GET/POST | `/api/v1/domains/{domain}` | Resource domain relational, dengan scope perusahaan |
| GET/PUT/DELETE | `/api/v1/domains/{domain}/{id}` | Operasi domain berdasarkan ID |

**Contoh request create**

```json
{"route":"/crm-sales","view_key":"0","table_index":0,"cells":["Lead 001","PT Nusantara"],"fields":{"Lead":"Lead 001","Company":"PT Nusantara"}}
```

Data contoh setiap tab menggunakan `business_records`. Entitas inti `customers`, `quotations`, `invoices`, `projects`, dll. sudah memiliki tabel normalisasi dan relasi namun **belum seluruhnya terhubung ke UI dan endpoint domain khusus**. Jangan menganggap API generic sebagai implementasi lengkap domain keuangan/ERP.
