import { api } from "./client";
import type { OperationalProjectionBridge } from "./operationalProjectionBridge";
import { showFormModal } from "./modalHelper";

/** Routes the existing receipt detail control to the stock/accounting return workflow. */
export class ProcurementReturnNativeBridge {
  private listener = (event: Event) => {
    void this.handle(event).catch((error) =>
      window.alert(error?.response?.data?.message || "Retur gagal diposting."),
    );
  };
  constructor(private readonly operational: OperationalProjectionBridge) {}
  install() {
    document.addEventListener("click", this.listener, true);
  }
  uninstall() {
    document.removeEventListener("click", this.listener, true);
  }
  private async handle(event: Event) {
    const target = event.target as HTMLElement;
    if (
      event.type !== "click" ||
      !target.closest(
        '[data-prototype-page][data-route="/purchase"] [data-bd-panel="receipt"]',
      )
    )
      return;
    const button = target.closest<HTMLElement>('[data-bd-act="viewrow"]');
    const id = button?.dataset.bdId || "";
    if (!id.startsWith("db-")) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const detail = (
      await api.get(`/api/v1/operational/procurement/receipts/${id.slice(3)}`)
    ).data.data as {
      lines: Array<{
        id: string;
        sku: string;
        product: string;
        quantity: string;
        returned_quantity: string;
      }>;
    };
    const lines = detail.lines.filter(
      (line) => Number(line.quantity) > Number(line.returned_quantity),
    );
    if (!lines.length)
      throw new Error("Semua item Goods Receipt sudah diretur.");

    const formValues = await showFormModal<{
      line_id: string;
      quantity: number;
      reason: string;
    }>({
      title: "Retur Penerimaan Barang (Goods Receipt Return)",
      icon: "lucide:undo-2",
      iconColor: "#dc2626",
      submitText: "Proses Retur Barang",
      fields: [
        {
          name: "line_id",
          label: "Item Barang yang Diretur",
          type: "select",
          required: true,
          options: lines.map((line) => {
            const rem = (
              Number(line.quantity) - Number(line.returned_quantity)
            ).toFixed(2);
            return {
              value: line.id,
              label: `${line.sku} — ${line.product} (Tersedia: ${rem})`,
            };
          }),
        },
        {
          name: "quantity",
          label: "Jumlah Barang yang Diretur",
          type: "number",
          required: true,
          min: 1,
          step: 0.01,
          value: 1,
        },
        {
          name: "reason",
          label: "Alasan Retur Barang",
          type: "textarea",
          required: true,
          placeholder:
            "Contoh: Barang mengalami kerusakan fisik saat transit atau tidak sesuai PO.",
        },
      ],
    });

    if (!formValues) return;
    const selectedLine = lines.find((l) => l.id === formValues.line_id);
    if (!selectedLine) return;
    const remaining =
      Number(selectedLine.quantity) - Number(selectedLine.returned_quantity);
    if (formValues.quantity <= 0 || formValues.quantity > remaining) {
      throw new Error(
        `Jumlah retur harus antara 1 dan ${remaining.toFixed(2)}.`,
      );
    }

    await api.post(`/api/v1/workflows/goods-receipts/${id.slice(3)}/return`, {
      receipt_line_id: selectedLine.id,
      quantity: formValues.quantity,
      reason: formValues.reason.trim(),
    });
    await this.operational.refresh();
    window.dispatchEvent(new Event("sop:domain-updated"));
  }
}
