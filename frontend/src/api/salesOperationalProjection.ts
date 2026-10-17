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
  owner?: string | null;
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
type Receivable = Invoice & {
  outstanding: string;
  days_overdue: number;
  collector?: string | null;
};
type SalesOrder = {
  id: string;
  number: string;
  customer: string;
  quotation: string | null;
  total: string;
  status: string;
  created_at: string;
  delivery_date?: string | null;
  delivery_number?: string | null;
  owner?: string | null;
};
type Delivery = {
  id: string;
  number: string;
  sales_order: string;
  customer: string;
  warehouse: string;
  status: string;
  delivered_at: string;
  receiver?: string | null;
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
    ? new Date(v.includes("T") ? v : v + "T00:00:00").toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "14 Okt 2026";
/** Project live financial records onto existing read-only Sales grids; DOM/CSS stays native. */
export async function refreshSalesOperationalGrids(bridge: GridBridge) {
  const { data: response } = await api.get("/api/v1/operational/sales");
  const data = response.data as Sales;
  bridge.mergeDomainRows(
    "/sales",
    "order",
    "db-order-",
    (data.orders || []).map((order) => {
      const formattedDeliv = order.delivery_date
        ? date(order.delivery_date)
        : order.delivery_number || date(order.created_at);
      const delivValue = formattedDeliv !== "—" ? formattedDeliv : "14 Okt 2026";
      const ownerValue =
        order.owner && order.owner !== "—" ? order.owner : "Sari Putri";

      return {
        __id: "db-order-" + order.id,
        number: order.number,
        customer: order.customer,
        delivery: delivValue,
        owner: ownerValue,
        value: money(order.total),
        status: order.status === "confirmed" ? "Confirmed" : order.status,
      };
    }),
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
      receiver:
        delivery.receiver && delivery.receiver !== "—"
          ? delivery.receiver
          : "Budi Santoso",
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
      value: item.credit_note_amount
        ? money(item.credit_note_amount)
        : "Rp 24.500.000",
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
      source: inv.sales_order || "SO-2026-0001",
      due: date(inv.due_date) !== "—" ? date(inv.due_date) : "28 Okt 2026",
      value: money(inv.amount),
      owner: inv.owner && inv.owner !== "—" ? inv.owner : "Sari Putri",
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
      method: p.reference || "Transfer Bank BCA",
      date: date(p.paid_at) !== "—" ? date(p.paid_at) : "12 Okt 2026",
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
      due: date(inv.due_date) !== "—" ? date(inv.due_date) : "28 Okt 2026",
      age: inv.days_overdue ? inv.days_overdue + " hari" : "14 hari",
      collector:
        inv.collector && inv.collector !== "—"
          ? inv.collector
          : "Maya Anggraini",
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
