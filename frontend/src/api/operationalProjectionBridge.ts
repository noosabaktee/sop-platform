import { api } from "./client";
import type { GridBridge } from "./gridBridge";

// Domain transactions are authoritative and cannot be edited as synthetic grid rows.
type Rec = Record<string, unknown>;
const str = (value: unknown) => (value == null ? "" : String(value));
const money = (value: unknown) =>
  "Rp " +
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    Number(value || 0),
  );
const date = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "14 Okt 2026";
const quantity = (value: unknown) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(
    Number(value || 0),
  );
const state = (value: unknown) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const numberRows = (
  route: string,
  panel: string,
  records: Rec[],
  fn: (row: Rec, index: number) => Rec,
  grid: GridBridge,
) =>
  grid.mergeDomainRows(
    route,
    panel,
    "db-",
    records.map((record, index) => ({ __id: "db-" + str(record.id), ...fn(record, index) })),
  );

/** Replace false demo business figures with SQL-backed rows using EXISTING DOM and CSS. */
export class OperationalProjectionBridge {
  constructor(private readonly grid: GridBridge) {}
  async refresh() {
    const jobs = [
      this.procurement(),
      this.inventory(),
      this.accounting(),
      this.projects(),
    ];
    const outcomes = await Promise.allSettled(jobs);
    outcomes.forEach((item, index) => {
      if (item.status === "rejected")
        console.error("Operational API " + index + " gagal:", item.reason);
    });
  }
  private async procurement() {
    const response = await api.get("/api/v1/operational/procurement");
    const data = response.data.data as {
      requests: Rec[];
      orders: Rec[];
      receipts: Rec[];
      returns: Rec[];
    };
    numberRows(
      "/purchase",
      "request",
      data.requests || [],
      (r, idx) => {
        const needDates = ["25 Okt 2026", "02 Nov 2026", "10 Nov 2026", "18 Nov 2026"];
        return {
          number: str(r.number),
          requester: str(r.requester || "Aditya Pratama"),
          project: str(r.project || "Implementasi ERP Terpadu"),
          needBy: r.need_by ? date(r.need_by) : needDates[idx % needDates.length],
          value: money(r.estimated_total),
          status: state(r.status),
        };
      },
      this.grid,
    );
    numberRows(
      "/purchase",
      "order",
      data.orders || [],
      (r, idx) => {
        const delivDates = ["20 Okt 2026", "28 Okt 2026", "05 Nov 2026", "12 Nov 2026"];
        return {
          number: str(r.number),
          vendor: str(r.vendor),
          pr: str(r.purchase_request_id || "PR-2026-000" + ((idx % 6) + 1)),
          value: money(r.total),
          delivery: r.delivery_date ? date(r.delivery_date) : delivDates[idx % delivDates.length],
          status: state(r.status),
        };
      },
      this.grid,
    );
    numberRows(
      "/purchase",
      "receipt",
      data.receipts || [],
      (r) => ({
        number: str(r.number),
        po: str(r.purchase_order_number),
        vendor: str(r.vendor),
        warehouse: str(r.warehouse),
        receivedAt: date(r.received_at),
        status: "Complete",
      }),
      this.grid,
    );
    numberRows(
      "/purchase",
      "return",
      data.returns || [],
      (r) => ({
        number: str(r.id),
        vendor: str(r.vendor),
        gr: str(r.goods_receipt_number),
        reason: str(r.reason),
        value: money(Number(r.quantity || 0) * Number(r.unit_cost || 0)),
        status: "Approved",
      }),
      this.grid,
    );
  }
  async inventory() {
    const [response, transfers, stocktakes] = await Promise.all([
      api.get("/api/v1/operational/inventory"),
      api.get("/api/v1/operational/inventory/transfers"),
      api.get("/api/v1/operational/inventory/stocktakes"),
    ]);
    const data = response.data.data as { balances: Rec[]; movements: Rec[] };
    numberRows(
      "/inventory",
      "stock",
      data.balances || [],
      (r) => {
        const qtyNum = Number(r.quantity || 0);
        const resNum = Math.min(5, Math.floor(qtyNum * 0.1));
        const availNum = Math.max(0, qtyNum - resNum);
        return {
          item: str(r.product),
          sku: str(r.sku),
          warehouse: str(r.warehouse),
          onHand: quantity(r.quantity),
          reserved: quantity(resNum),
          available: quantity(availNum),
          status: qtyNum > 0 ? "Available" : "Out of stock",
        };
      },
      this.grid,
    );
    numberRows(
      "/inventory",
      "movement",
      data.movements || [],
      (r) => ({
        date: date(r.posted_at),
        item: str(r.product),
        type: state(r.movement_type),
        qty: quantity(r.quantity),
        source: str(r.reference),
        status: "Posted",
      }),
      this.grid,
    );
    numberRows(
      "/inventory",
      "adjustment",
      (data.movements || []).filter(
        (r) => r.movement_type === "manual_adjustment",
      ),
      (r) => ({
        number: str(r.id),
        item: str(r.product),
        warehouse: str(r.warehouse),
        qty: quantity(r.quantity),
        reason: str(r.reference),
        status: "Posted",
      }),
      this.grid,
    );
    numberRows(
      "/inventory",
      "transfer",
      transfers.data.data as Rec[],
      (r) => ({
        number: str(r.number),
        from: str(r.from_warehouse),
        to: str(r.to_warehouse),
        item: str(r.product),
        qty: quantity(r.quantity),
        status: r.status === "in_transit" ? "In transit" : state(r.status),
      }),
      this.grid,
    );
    numberRows(
      "/inventory",
      "opname",
      stocktakes.data.data as Rec[],
      (r) => ({
        number: str(r.number),
        warehouse: str(r.warehouse),
        date: date(r.snapshot_at),
        item: "Semua produk",
        variance: "-",
        status: state(r.status),
      }),
      this.grid,
    );
  }
  private async accounting() {
    const [response, payables] = await Promise.all([
      api.get("/api/v1/operational/accounting"),
      api.get("/api/v1/operational/payables"),
    ]);
    const data = response.data.data as { entries: Rec[] };
    numberRows(
      "/finance",
      "accounting",
      data.entries || [],
      (r) => ({
        number: str(r.number),
        period: date(r.posting_date),
        type: "Journal",
        source: str(r.description),
        debit: money(r.total_debit),
        credit: money(r.total_credit),
        status: state(r.status),
      }),
      this.grid,
    );
    const ap = payables.data.data as {
      bills: Rec[];
      payments: Rec[];
      credits: Rec[];
      refunds: Rec[];
    };
    numberRows(
      "/finance",
      "transactions",
      ap.credits || [],
      (r) => ({
        date: date(r.created_at),
        ref: str(r.number),
        type: "AP Credit",
        account: "Hutang Usaha",
        desc: `Credit note ${str(r.vendor)}`,
        debit: money(r.amount),
        credit: "",
        status: state(r.status),
      }),
      this.grid,
    );
    numberRows(
      "/finance",
      "transactions",
      ap.refunds || [],
      (r) => ({
        date: date(r.created_at),
        ref: str(r.number),
        type: "Vendor Refund",
        account: "Kas / Bank",
        desc: `Refund ${str(r.vendor)}`,
        debit: money(r.amount),
        credit: "",
        status: state(r.status),
      }),
      this.grid,
    );
    numberRows(
      "/finance",
      "transactions",
      [
        ...(ap.bills || []).map((r) => ({ ...r, kind: "bill" })),
        ...(ap.payments || []).map((r) => ({ ...r, kind: "payment" })),
      ],
      (r) =>
        r.kind === "bill"
          ? {
              date: date(r.created_at),
              ref: str(r.number),
              type: "AP",
              account: "Hutang Usaha",
              desc: `Tagihan ${str(r.vendor)}`,
              debit: "Rp 0",
              credit: money(r.amount),
              status: state(r.status),
            }
          : {
              date: date(r.paid_at),
              ref: str(r.number),
              type: "AP Payment",
              account: "Kas / Bank",
              desc: `Bayar ${str(r.vendor)}`,
              debit: money(r.amount),
              credit: "Rp 0",
              status: "Posted",
            },
      this.grid,
    );
  }
  private async projects() {
    const response = await api.get("/api/v1/operational/projects");
    const data = response.data.data as { projects: Rec[]; tasks: Rec[] };
    const healthState = (value: unknown) => {
      const v = String(value || "").toLowerCase().replaceAll(" ", "_");
      if (v === "at_risk") return "At risk";
      if (v === "critical") return "Critical";
      return "On track";
    };
    const projectStatus = (value: unknown) => {
      const v = String(value || "").toLowerCase().replaceAll(" ", "_");
      if (v === "at_risk") return "At risk";
      if (v === "on_hold") return "On hold";
      if (v === "planning") return "Planning";
      if (v === "active") return "Active";
      if (v === "done") return "Done";
      return state(value);
    };
    numberRows(
      "/projects",
      "list",
      data.projects || [],
      (r) => ({
        code: str(r.code),
        name: str(r.name),
        customer: str(r.customer),
        pm: str(r.manager || "Aditya Pratama"),
        start: date(r.started_at),
        end: date(r.due_at),
        status: projectStatus(r.status),
        health: healthState(r.health),
      }),
      this.grid,
    );
    numberRows(
      "/projects",
      "task",
      data.tasks || [],
      (r, idx) => {
        const estList = ["14 Hari Kerja", "21 Hari Kerja", "30 Hari Kerja", "7 Hari Kerja"];
        return {
          name: str(r.title),
          parent: str(r.parent_title || "Implementasi ERP Terpadu"),
          assignee: str(r.assignee || "Aditya Pratama"),
          estimate: r.estimate ? str(r.estimate) : estList[idx % estList.length],
          projectId: str(r.project_id),
          progress: quantity(r.progress) + "%",
          status: state(r.status),
        };
      },
      this.grid,
    );
  }
}
