# Database Schema and Workflows

Database utama menggunakan PostgreSQL. Semua data bisnis di-scope dengan `company_id`; uang menggunakan decimal, stok menggunakan decimal berpresisi, dan transaksi kritis dijalankan di dalam database transaction.

## Area schema

- Identity: `companies`, `users`, department/role context, session/auth data, encrypted TOTP/recovery codes, dan `login_events`.
- Commercial: `leads`, `prospects`, `customers`, `contacts`, `opportunities`, `quotations`, `quotation_items`, `sales_orders`, `invoices`, `payments`.
- Procurement/inventory: `vendors`, `products`, `warehouses`, purchase request/order/receipt/return, inventory movement, transfer, dan stocktake.
- Delivery: `projects`, `project_tasks`, dan project cost.
- Accounting: chart of accounts, journal entry/line, bank account/transaction/reconciliation.
- Governance: approvals, meetings/RUPS, audit events, notifications.
- Documents/state: private document/version metadata, `grid_snapshots`, `module_states`, dan generic records untuk UI yang belum memiliki domain khusus.

## Workflow tervalidasi

```text
Quotation draft -> submit -> approve/revise/reject
  -> Sales order -> Invoice -> Payment -> Receivable update

Purchase request -> approval -> Purchase order -> Goods receipt
  -> Inventory movement + journal -> Purchase return/reversal

Warehouse transfer draft -> ship -> receive
  -> source stock decreases once -> destination stock increases once

Stocktake snapshot -> verify -> post variance
  -> stock movement + balanced adjustment journal

Bank transaction -> match posted journal line -> unmatch (authorized)

CRM lead saved -> convert atomically -> prospect linked to original lead
  -> source grid and domain status updated -> survives reload
```

Rules penting yang diuji: idempotency, valid state transition, balanced journal, no negative stock, tenant isolation, role authorization, stale-version conflict, dan audit logging.

`grid_snapshots` adalah persistence untuk grid UI non-authoritative. Tabel domain tetap authoritative untuk transaksi; proyeksi domain read-only tidak boleh ditulis balik menjadi snapshot palsu.
