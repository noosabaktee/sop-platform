# PostgreSQL Schema

Tiga migration: identitas/master data, transaksi, workflow/data-grid.

- `companies` 1:N `users`, `customers`, `vendors`, `products`, `quotations`, `projects`.
- `leads` N:1 `customers` (opsional) dan `users` owner; `opportunities` N:1 `leads` serta `customers`.
- `quotations` 1:N `quotation_items`, N:1 `customers`; `sales_orders` mengacu ke `quotations` dan `customers`; `invoices` mengacu ke `sales_orders` dan `customers`; `payments` N:1 `invoices`.
- `projects` 1:N `project_tasks`, terhubung ke `customers` dan manager (`users`).
- `purchase_requests` mengacu ke project dan requester, `purchase_orders` mengacu ke request dan vendor.
- `inventory_movements` mengacu ke produk dan gudang.
- `journal_entries` 1:N `journal_lines`, yang mengacu ke `chart_of_accounts`.
- `business_records` menyimpan grid lain yang belum diimplementasikan sebagai domain khusus. Tenant-scoped, JSONB untuk cells/fields, soft delete, version.
- `approvals`, `audit_events`, `notifications`, `documents` untuk cross-cutting.

Semua uang memakai `decimal(20,2)` (jangan float), stok `decimal(18,4)` dan timestamp memakai timezone.

**Batasan yang belum ditangani:** nomor transaksi concurrency-safe; accounting posting otomatis; balance validation double entry; reversals; multi-currency exchange history; quota/versioning dokumen; permissions granular. Semua masih harus ditambahkan sebelum production.
