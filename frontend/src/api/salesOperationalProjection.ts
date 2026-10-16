import { api } from "./client";
import type { GridBridge } from "./gridBridge";
type Invoice = {
  id: string;
  number: string;
  customer: string;
  sales_order: string | null;
  due_date: string | null;
  amount: string;
  paid_amount: string;
  status: string;
};
type Payment = {
  id: string;
  number: string;
  customer: string;
  invoice: string;
  paid_at: string;
  amount: string;
  reference: string | null;
};
type Receivable = Invoice & { outstanding: string; days_overdue: number };
type SalesOrder = {
  id: string;
  number: string;
  customer: string;
  quotation: string | null;
  total: string;
  status: string;
  created_at: string;
};
type Delivery = {
  id: string;
  number: string;
  sales_order: string;
  customer: string;
  warehouse: string;
  status: string;
  delivered_at: string;
};
type SalesReturn = {
  id: string;
  number: string;
  customer: string;
  delivery_number: string;
  reason: string;
  status: string;
  credit_note_amount?: string | null;
  credit_note_status?: string | null;
  refund_amount?: string | null;
};
type Sales = {
  orders: SalesOrder[];
  deliveries: Delivery[];
  returns: SalesReturn[];
  invoices: Invoice[];
  payments: Payment[];
  receivables: Receivable[];
};
const money = (v: string) =>
  "Rp " +
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    Number(v),
  );
const date = (v: string | null) =>
  v
    ? new Date(v + "T00:00:00").toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
/** Project live financial records onto existing read-only Sales grids; DOM/CSS stays native. */
export async function refreshSalesOperationalGrids(bridge: GridBridge) {
  const { data: response } = await api.get("/api/v1/operational/sales");
  const data = response.data as Sales;
  bridge.mergeDomainRows(
    "/sales",
    "order",
    "db-order-",
    (data.orders || []).map((order) => ({
      __id: "db-order-" + order.id,
      number: order.number,
      customer: order.customer,
      delivery: "—",
      owner: "—",
      value: money(order.total),
      status: order.status === "confirmed" ? "Confirmed" : order.status,
    })),
  );
  bridge.mergeDomainRows(
    "/sales",
    "delivery",
    "db-delivery-",
    (data.deliveries || []).map((delivery) => ({
      __id: "db-delivery-" + delivery.id,
      number: delivery.number,
      so: delivery.sales_order,
      customer: delivery.customer,
      receiver: "—",
      location: delivery.warehouse,
      status: delivery.status === "delivered" ? "Delivered" : delivery.status,
    })),
  );
  bridge.mergeDomainRows(
    "/sales",
    "return",
    "db-return-",
    (data.returns || []).map((item) => ({
      __id: "db-return-" + item.id,
      number: item.number,
      customer: item.customer,
      source: item.delivery_number,
      reason: item.reason,
      value: item.credit_note_amount ? money(item.credit_note_amount) : "—",
      status: item.refund_amount
        ? "Refunded"
        : item.credit_note_status === "posted"
          ? "Credited"
          : item.status === "received"
            ? "Approved"
            : item.status,
    })),
  );
  bridge.mergeDomainRows(
    "/sales",
    "invoice",
    "db-invoice-",
    data.invoices.map((inv) => ({
      __id: "db-invoice-" + inv.id,
      number: inv.number,
      customer: inv.customer,
      source: inv.sales_order || "—",
      due: date(inv.due_date),
      value: money(inv.amount),
      owner: "—",
      status:
        inv.status === "paid"
          ? "Paid"
          : inv.due_date && inv.due_date < new Date().toISOString().slice(0, 10)
            ? "Overdue"
            : "Invoiced",
    })),
  );
  bridge.mergeDomainRows(
    "/sales",
    "payment",
    "db-payment-",
    data.payments.map((p) => ({
      __id: "db-payment-" + p.id,
      number: p.number,
      invoice: p.invoice,
      customer: p.customer,
      method: p.reference || "Transfer",
      date: date(p.paid_at),
      value: money(p.amount),
      status: "Received",
    })),
  );
  bridge.mergeDomainRows(
    "/sales",
    "ar",
    "db-ar-",
    data.receivables.map((inv) => ({
      __id: "db-ar-" + inv.id,
      customer: inv.customer,
      invoice: inv.number,
      due: date(inv.due_date),
      age: inv.days_overdue ? inv.days_overdue + " hari" : "—",
      collector: "—",
      value: money(inv.outstanding),
      status:
        inv.days_overdue === 0
          ? "Belum jatuh tempo"
          : inv.days_overdue <= 30
            ? "1–30 hari"
            : inv.days_overdue <= 60
              ? "31–60 hari"
              : ">60 hari",
    })),
  );
}
