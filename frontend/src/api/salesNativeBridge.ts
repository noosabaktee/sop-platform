import { api } from "./client";
import { refreshSalesOperationalGrids } from "./salesOperationalProjection";
import type { GridBridge } from "./gridBridge";
import {
  showFormModal,
  showSelectModal,
  showConfirmModal,
} from "./modalHelper";

/** Converts the existing Sales read-only detail action into authorized workflows. */
export class SalesNativeBridge {
  private listener = (event: Event) => {
    void this.handle(event).catch((error) =>
      this.notice(error?.response?.data?.message || "Workflow Sales gagal."),
    );
  };
  constructor(private readonly grid: GridBridge) {}
  install() {
    document.addEventListener("click", this.listener, true);
  }
  uninstall() {
    document.removeEventListener("click", this.listener, true);
  }
  private notice(message: string) {
    const toast = document.querySelector<HTMLElement>(
      '[data-page-id="sales"] .toast',
    );
    if (toast) {
      toast.textContent = message;
      toast.hidden = false;
      setTimeout(() => (toast.hidden = true), 5000);
    } else window.alert(message);
  }
  private async refresh() {
    await refreshSalesOperationalGrids(this.grid);
    window.dispatchEvent(new Event("sop:domain-updated"));
  }
  private async handle(event: Event) {
    if (event.type !== "click") return;
    const target = event.target as HTMLElement;
    const panel = target.closest<HTMLElement>(
      '[data-prototype-page][data-route="/sales"] [data-bd-panel]',
    );
    if (!panel) return;
    const button = target.closest<HTMLElement>("[data-bd-act]");
    const id = button?.dataset.bdId || "";
    const name = panel.dataset.bdPanel || "";
    const action = button?.dataset.bdAct || "";
    if (!["order", "delivery", "return", "invoice", "ar"].includes(name))
      return;
    const validOrderAction = name === "order" && action === "add";
    const validDeliveryAction = name === "delivery" && action === "add";
    const validReturnAction = name === "return" && action === "add";
    const validCreditAction =
      name === "return" && action === "viewrow" && id.startsWith("db-return-");
    const validInvoiceAction =
      ["invoice", "ar"].includes(name) &&
      action === "viewrow" &&
      id.startsWith("db-");
    if (
      !validOrderAction &&
      !validDeliveryAction &&
      !validReturnAction &&
      !validCreditAction &&
      !validInvoiceAction
    )
      return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (name === "order") {
      const choice = await showSelectModal({
        title: "Aksi Penjualan (Sales Order & Invoice)",
        icon: "lucide:shopping-bag",
        subtitle: "Pilih aksi alur kerja penjualan yang ingin diproses:",
        options: [
          {
            value: "1",
            label: "Konversi Quotation Approved menjadi Sales Order",
            description:
              "Memproses penawaran harga yang telah disetujui menjadi pesanan resmi.",
            badge: "SO",
          },
          {
            value: "2",
            label: "Posting Tagihan (Invoice) dari Sales Order yang Ada",
            description:
              "Menerbitkan faktur tagihan dan posting jurnal piutang usaha.",
            badge: "Invoice",
          },
        ],
        submitText: "Lanjutkan",
      });
      if (!choice) return;

      if (choice === "2") {
        const operational = (await api.get("/api/v1/operational/sales")).data
          .data as {
          orders: Array<{
            id: string;
            number: string;
            customer: string;
            status: string;
          }>;
          invoices: Array<{ sales_order: string | null }>;
        };
        const invoiced = new Set(
          operational.invoices
            .map((item) => item.sales_order)
            .filter((item): item is string => Boolean(item)),
        );
        const eligible = operational.orders.filter(
          (item) => item.status === "confirmed" && !invoiced.has(item.number),
        );
        if (!eligible.length)
          throw new Error(
            "Tidak ada Sales Order confirmed yang belum memiliki invoice.",
          );

        const formValues = await showFormModal<{
          order_id: string;
          due_date?: string;
        }>({
          title: "Terbitkan Faktur Tagihan (Sales Invoice)",
          icon: "lucide:file-invoice",
          submitText: "Posting Invoice",
          fields: [
            {
              name: "order_id",
              label: "Pilih Sales Order",
              type: "select",
              required: true,
              options: eligible.map((item) => ({
                value: item.id,
                label: `${item.number} — ${item.customer}`,
              })),
            },
            {
              name: "due_date",
              label: "Tanggal Jatuh Tempo (Opsional)",
              type: "date",
            },
          ],
        });
        if (!formValues) return;

        const order = eligible.find((o) => o.id === formValues.order_id);
        await api.post(
          `/api/v1/workflows/sales-orders/${formValues.order_id}/invoice`,
          { due_date: formValues.due_date || undefined },
        );
        await this.refresh();
        this.notice(
          `Invoice dan jurnal piutang berhasil dibuat dari ${order?.number || "Sales Order"}.`,
        );
        return;
      }

      const result = (await api.get("/api/v1/quotation-builder/list")).data
        .data as Array<{
        id: string;
        number: string;
        customer: string;
        status: string;
      }>;
      const approved = result.filter((item) => item.status === "approved");
      if (!approved.length)
        throw new Error("Tidak ada quotation approved yang siap dikonversi.");

      const quotationId = await showSelectModal({
        title: "Pilih Penawaran (Quotation Approved)",
        icon: "lucide:check-circle",
        subtitle: "Pilih dokumen penawaran harga yang akan dikonversi:",
        options: approved.map((q) => ({
          value: q.id,
          label: `${q.number} — ${q.customer}`,
        })),
        submitText: "Konversi ke SO",
      });
      if (!quotationId) return;

      const converted = await api.post(
        `/api/v1/workflows/quotations/${quotationId}/convert`,
        {},
      );
      const orderId = (converted.data.data as { id: string }).id;

      const postInvoiceNow = await showConfirmModal({
        title: "Sales Order Berhasil Dibuat",
        message:
          "Sales Order telah diterbitkan. Apakah Anda ingin langsung menerbitkan faktur tagihan (invoice) sekarang?",
        confirmText: "Ya, Terbitkan Invoice",
        cancelText: "Nanti Saja",
      });

      if (postInvoiceNow) {
        const invoiceForm = await showFormModal<{ due_date?: string }>({
          title: "Jatuh Tempo Faktur Penjualan",
          icon: "lucide:calendar",
          submitText: "Posting Tagihan",
          fields: [
            {
              name: "due_date",
              label: "Tanggal Jatuh Tempo (Opsional)",
              type: "date",
            },
          ],
        });
        await api.post(`/api/v1/workflows/sales-orders/${orderId}/invoice`, {
          due_date: invoiceForm?.due_date || undefined,
        });
        this.notice(
          "Sales Order, invoice, dan jurnal piutang berhasil dibuat.",
        );
      } else {
        this.notice("Sales Order berhasil dibuat dari quotation approved.");
      }
      await this.refresh();
      return;
    }

    if (name === "delivery") {
      const data = (await api.get("/api/v1/operational/sales")).data.data as {
        orders: Array<{
          id: string;
          number: string;
          customer: string;
          status: string;
        }>;
      };
      const orders = data.orders.filter((order) =>
        ["confirmed", "partial_delivered"].includes(order.status),
      );
      if (!orders.length)
        throw new Error("Tidak ada Sales Order yang siap dikirim.");

      const orderId = await showSelectModal({
        title: "Pilih Sales Order untuk Pengiriman (BAST)",
        icon: "lucide:truck",
        subtitle: "Pilih order penjualan yang akan diproses pengirimannya:",
        options: orders.map((o) => ({
          value: o.id,
          label: `${o.number} — ${o.customer}`,
          badge: o.status,
        })),
        submitText: "Lanjutkan",
      });
      if (!orderId) return;

      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const orderDetail = (
        await api.get(`/api/v1/operational/sales/orders/${order.id}/delivery`)
      ).data.data as {
        lines: Array<{
          product_id: string;
          product: string;
          quantity: string;
          delivered_quantity: string;
        }>;
      };
      const eligibleLines = orderDetail.lines.filter(
        (line) => Number(line.quantity) - Number(line.delivered_quantity) > 0,
      );
      if (!eligibleLines.length)
        throw new Error("Tidak ada barang tersisa untuk dikirim.");

      const inventory = (await api.get("/api/v1/operational/inventory")).data
        .data as {
        balances: Array<{ warehouse_id: string; warehouse: string }>;
      };
      const warehouses = [
        ...new Map(
          inventory.balances.map((row) => [row.warehouse_id, row.warehouse]),
        ).entries(),
      ].map(([id, name]) => ({ id, name }));
      if (!warehouses.length) throw new Error("Tidak ada gudang dengan stok.");

      // Form modal for warehouse and line quantities
      const formFields = [
        {
          name: "warehouse_id",
          label: "Gudang Pengeluaran Barang",
          type: "select" as const,
          required: true,
          options: warehouses.map((w) => ({ value: w.id, label: w.name })),
        },
        ...eligibleLines.map((line, idx) => {
          const remaining =
            Number(line.quantity) - Number(line.delivered_quantity);
          return {
            name: `qty_${line.product_id}`,
            label: `Jumlah Kirim: ${line.product} (Maks: ${remaining.toFixed(2)})`,
            type: "number" as const,
            required: true,
            min: 0,
            max: remaining,
            step: 0.01,
            value: remaining,
          };
        }),
      ];

      const deliveryValues = await showFormModal<Record<string, any>>({
        title: `Pengiriman Barang / BAST (${order.number})`,
        icon: "lucide:truck",
        submitText: "Proses Pengiriman",
        fields: formFields,
      });
      if (!deliveryValues) return;

      const lines: Array<{ product_id: string; quantity: string }> = [];
      for (const line of eligibleLines) {
        const qty = Number(deliveryValues[`qty_${line.product_id}`] || 0);
        if (qty > 0) {
          lines.push({ product_id: line.product_id, quantity: String(qty) });
        }
      }
      if (!lines.length)
        throw new Error(
          "Minimal harus ada 1 barang yang dikirim dengan jumlah > 0.",
        );

      await api.post(`/api/v1/workflows/sales-orders/${order.id}/deliver`, {
        warehouse_id: deliveryValues.warehouse_id,
        lines,
        idempotency_key: `ui-delivery-${crypto.randomUUID()}`,
      });
      await this.refresh();
      this.notice(
        `Delivery / BAST ${order.number} tersimpan; stok dan HPP diposting.`,
      );
      return;
    }

    if (name === "return") {
      if (action === "viewrow") {
        const confirmed = await showConfirmModal({
          title: "Terbitkan Credit Note",
          message:
            "Buat credit note untuk retur ini? Nilai akan otomatis mengurangi piutang invoice yang masih terbuka.",
          confirmText: "Ya, Terbitkan Credit Note",
        });
        if (!confirmed) return;
        const result = await api.post(
          `/api/v1/workflows/sales-returns/${id.slice("db-return-".length)}/credit-note`,
          {},
        );
        await this.refresh();
        this.notice(
          result.data.already_exists
            ? "Credit note sudah pernah dibuat."
            : "Credit note dibuat; pendapatan, PPN, piutang, dan refund bila diperlukan telah diposting.",
        );
        return;
      }

      const data = (await api.get("/api/v1/operational/sales")).data.data as {
        deliveries: Array<{
          id: string;
          number: string;
          customer: string;
          status: string;
        }>;
      };
      const deliveries = data.deliveries.filter((row) =>
        ["delivered", "partially_returned"].includes(row.status),
      );
      if (!deliveries.length)
        throw new Error("Tidak ada delivery yang dapat diretur.");

      const deliveryId = await showSelectModal({
        title: "Pilih Dokumen Pengiriman (Delivery/BAST)",
        icon: "lucide:undo-2",
        subtitle:
          "Pilih dokumen pengiriman yang barangnya akan diretur oleh pelanggan:",
        options: deliveries.map((d) => ({
          value: d.id,
          label: `${d.number} — ${d.customer}`,
          badge: d.status,
        })),
        submitText: "Lanjutkan",
      });
      if (!deliveryId) return;

      const delivery = deliveries.find((d) => d.id === deliveryId);
      if (!delivery) return;

      const detail = (
        await api.get(`/api/v1/operational/sales/deliveries/${delivery.id}`)
      ).data.data as {
        lines: Array<{
          id: string;
          product: string;
          quantity: string;
          returned_quantity: string;
        }>;
      };
      const eligibleReturnLines = detail.lines.filter(
        (l) => Number(l.quantity) - Number(l.returned_quantity) > 0,
      );
      if (!eligibleReturnLines.length)
        throw new Error("Semua barang dalam pengiriman ini sudah diretur.");

      const returnFields = [
        {
          name: "reason",
          label: "Alasan Retur Penjualan",
          type: "textarea" as const,
          required: true,
          placeholder:
            "Contoh: Barang cacat atau tidak sesuai kesepakatan spesifikasi...",
        },
        ...eligibleReturnLines.map((line) => {
          const remaining =
            Number(line.quantity) - Number(line.returned_quantity);
          return {
            name: `qty_${line.id}`,
            label: `Jumlah Retur: ${line.product} (Maks: ${remaining.toFixed(2)})`,
            type: "number" as const,
            required: true,
            min: 0,
            max: remaining,
            step: 0.01,
            value: 0,
          };
        }),
      ];

      const returnValues = await showFormModal<Record<string, any>>({
        title: `Retur Penjualan (${delivery.number})`,
        icon: "lucide:undo-2",
        iconColor: "#dc2626",
        submitText: "Proses Retur",
        fields: returnFields,
      });
      if (!returnValues) return;

      const lines: Array<{ delivery_line_id: string; quantity: string }> = [];
      for (const line of eligibleReturnLines) {
        const qty = Number(returnValues[`qty_${line.id}`] || 0);
        if (qty > 0) {
          lines.push({ delivery_line_id: line.id, quantity: String(qty) });
        }
      }
      if (!lines.length)
        throw new Error(
          "Minimal harus ada 1 barang yang diretur dengan jumlah > 0.",
        );

      await api.post(
        `/api/v1/workflows/sales-deliveries/${delivery.id}/return`,
        {
          reason: String(returnValues.reason || "").trim(),
          lines,
          idempotency_key: `ui-sales-return-${crypto.randomUUID()}`,
        },
      );
      await this.refresh();
      this.notice(`Retur ${delivery.number} diterima; stok dan HPP dibalik.`);
      return;
    }

    const invoiceId = id.slice(
      name === "invoice" ? "db-invoice-".length : "db-ar-".length,
    );
    const operational = (await api.get("/api/v1/operational/sales")).data
      .data as {
      invoices: Array<{
        id: string;
        amount: string;
        paid_amount: string;
        number: string;
      }>;
    };
    const invoice = operational.invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;

    const outstanding = Number(invoice.amount) - Number(invoice.paid_amount);
    if (outstanding <= 0) throw new Error("Invoice sudah lunas.");

    const today = new Date().toISOString().slice(0, 10);
    const paymentForm = await showFormModal<{
      amount: number;
      reference: string;
      paid_at: string;
    }>({
      title: `Penerimaan Pembayaran (${invoice.number})`,
      icon: "lucide:credit-card",
      submitText: "Konfirmasi Pembayaran",
      fields: [
        {
          name: "outstanding_info",
          label: "Sisa Tagihan Belum Dibayar",
          type: "text",
          readOnly: true,
          value: `Rp ${outstanding.toLocaleString("id-ID", { minimumFractionDigits: 2 })}`,
        },
        {
          name: "amount",
          label: "Jumlah Pembayaran Diterima (Rp)",
          type: "number",
          required: true,
          min: 1,
          max: outstanding,
          step: 0.01,
          value: outstanding,
          halfWidth: true,
        },
        {
          name: "paid_at",
          label: "Tanggal Pembayaran",
          type: "date",
          required: true,
          value: today,
          halfWidth: true,
        },
        {
          name: "reference",
          label: "Nomor Bukti Transaksi / Referensi (Opsional)",
          type: "text",
          placeholder: "Contoh: TRF-BCA-10293847",
        },
      ],
    });
    if (!paymentForm) return;

    await api.post(`/api/v1/workflows/invoices/${invoiceId}/payments`, {
      amount: String(paymentForm.amount),
      paid_at: paymentForm.paid_at,
      reference: paymentForm.reference.trim() || undefined,
      idempotency_key: `ui-payment-${crypto.randomUUID()}`,
    });
    await this.refresh();
    this.notice(
      "Pembayaran diterima dan jurnal kas/piutang berhasil diposting.",
    );
  }
}
