# E2E integration continuation — 13 October 2026

## Scope completed in this revision

The original approved visual artifacts are **byte-identical** to the previous archive (`prototype.css`, `bridge.css`, `prototype-original.js`, `prototype-extras.js`, `original-body.html`, `prototype.html`). No Docker files are required.

1. **Quotation builder**: native `Simpan draft` and `Submit for approval` now bypass their original demo-only dialogs and use the real PostgreSQL-backed Laravel APIs. The dropdown choices are sourced from the company's active customers and users. The form's line-item quantities/prices are read from the original grid. A server-side transaction calculates subtotal, discount, tax, and total using integer minor units, persists quotation items, and emits an audit event. Submitting creates a real transaction approval. Previously submitted quotations are protected against direct draft editing.
2. **Quotation list**: live quotation rows are merged into the original native list/status tables with stable domain row IDs. Existing native design and controls are preserved. Their generic legacy fixture rows still exist; legacy row editing is NOT full normalized-domain CRUD.
3. **Sales Invoice / Payment / AR views**: read-only native tables now also display company-scoped PostgreSQL invoice/payment/AR records, with outstanding amount calculated using PostgreSQL NUMERIC subtraction. No finance numbers are fabricated by these new projections.
4. **PostgreSQL JSONB search**: `RecordController` search now casts the JSONB field to text for `ILIKE`, fixing a PostgreSQL operator error.
5. **Removed a data-loading race**: the React prototype was loading grid snapshots twice; the second load could overwrite in-progress native edits. Initial data now loads once before the prototype handlers.
6. **Added tests**: `QuotationBuilderTest`, `SalesOperationalViewTest`, `FullSalesCycleTest`; existing `SalesWorkflowTest` setup now creates an unsold quotation rather than incorrectly assuming seeded quotations have no Sales Order.
7. **Approval UI**: native My Approval / Pending cards now load real tenant-scoped quotation approval records; approve, reject (mandatory reason), request revision, and bulk approve reach the normalized PostgreSQL workflow API. Disabled actions respect approver roles. Browser mock queue handlers are intercepted; native styles/markup are reused.
8. **Revision workflow**: an approver can request revision with a reason; quotation status changes to `revision_requested`, and the sales user may edit/save and resubmit it. Audit records every decision.
9. **Local verification script**: `scripts/verify-e2e-local.ps1` performs nondestructive Laravel migrations, targeted Feature tests and frontend build. It requires a separate `sop_platform_test` PostgreSQL DB with `.env.testing`; it refuses to run `RefreshDatabase` against the operational database. It does NOT use Docker or `migrate:fresh`. Added `phpunit.xml` and `.env.testing.example`.

## API additions

- `GET /api/v1/quotation-builder/options`
- `GET /api/v1/quotation-builder/list`
- `POST /api/v1/quotation-builder/draft`
- `GET /api/v1/operational/sales`

Existing workflow APIs remain: quotation submit/decision/convert, order invoice, invoice payment.

## What is not done yet (do not claim finished)

- This does **not** finish all native CRUD actions of all 28 pages as normalized transactions. 11 grid modules use `grid_rows`; 13 additional pages persist JSONB state. Some native UI still represents seeded demonstration fixtures.
- Generic edits to existing quotation rows in status/list tables are persisted to the grid layer, but **not always to normalized `quotations` records**. Quotation builder create/update/submit DOES use normalized records.
- My Approval / Pending quotation approval buttons are bound to the database. Delegation, SLA/escalation, approval matrix editing and non-quotation approvals are still prototype-only. The current backend lists 50 recent approval records; weekly KPI counts are therefore not guaranteed complete until a dedicated aggregate endpoint is implemented.
- Delivery/BAST, inventory valuation, full general ledger, project accounting, document uploads and provider integrations (email, WhatsApp, AI, banking, tax) are not production-complete.
- PostgreSQL actual migration, Laravel PHPUnit Feature tests, npm build and Playwright E2E could not be run in this environment (no Composer, PostgreSQL client/server, `pdo_pgsql` or installed node dependencies). We ran PHP syntax checks, TypeScript transpilation parsing, static source comparison and JavaScript adapter simulations only.

## How to test on Windows without Docker

Keep existing DB intact; configure `backend/.env` and `frontend/.env`, install Composer and npm dependencies. **First create a distinct test DB** `CREATE DATABASE sop_platform_test;`, and copy `backend/.env.testing.example` to `backend/.env.testing` (use the correct PostgreSQL test credentials). Never set the testing DB equal to the app DB. Then run in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-e2e-local.ps1
```

Use a **dedicated PostgreSQL test database** for `RefreshDatabase` Feature tests; never point destructive test execution at the operational `sop_platform` database. Start separate backend/frontend terminals using the README instructions.
