import { api } from "./client";
import { exportDataToExcel } from "../utils/excelExport";

type Dashboard = {
  company: string;
  period: string;
  period_start: string;
  sales_revenue: number;
  outstanding_ar: number;
  opportunity_value: number;
  projects: number;
  pending_approvals: number;
  last_refreshed_at: string;
};
type Payables = { bills: Array<{ amount: string; paid_amount: string }> };
type Banks = { accounts: Array<{ ledger_balance: string }> };
type Accounting = { balanced: boolean };
const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  }).format(value);
const csv = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

/** Makes the frozen Management export/report controls disclose an SQL snapshot. */
export class ManagementNativeBridge {
  private busy = false;
  install() {
    document.addEventListener("click", this.onClick, true);
  }
  uninstall() {
    document.removeEventListener("click", this.onClick, true);
  }
  private toast(message: string) {
    const root = document.querySelector<HTMLElement>(
      '[data-page-id="management"]',
    );
    const node = root?.querySelector<HTMLElement>(".toast");
    if (node) {
      node.textContent = message;
      node.hidden = false;
      window.setTimeout(() => (node.hidden = true), 5000);
    } else window.alert(message);
  }
  private readonly onClick = (event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-action="mgmt:export"],[data-action="mgmt:report"]',
    );
    if (!button || !button.closest('[data-page-id="management"]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.busy) return;
    void this.run(
      button.dataset.action === "mgmt:export" ? "export" : "report",
    );
  };
  private async snapshot() {
    const [dashboard, payables, banks, accounting] = await Promise.all([
      api.get("/api/v1/dashboard?period=year"),
      api.get("/api/v1/operational/payables"),
      api.get("/api/v1/operational/banks"),
      api.get("/api/v1/operational/accounting"),
    ]);
    const d = dashboard.data.data as Dashboard,
      p = payables.data.data as Payables,
      b = banks.data.data as Banks,
      a = accounting.data.data as Accounting;
    return {
      d,
      ap: (p.bills || []).reduce(
        (sum, bill) =>
          sum + Math.max(0, Number(bill.amount) - Number(bill.paid_amount)),
        0,
      ),
      cash: (b.accounts || []).reduce(
        (sum, account) => sum + Number(account.ledger_balance || 0),
        0,
      ),
      balanced: Boolean(a.balanced),
    };
  }
  private download(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  private async run(action: "export" | "report") {
    this.busy = true;
    document.body.classList.add("sop-api-busy");
    try {
      const { d, ap, cash, balanced } = await this.snapshot();
      const rows: [string, string | number][] = [
        ["Perusahaan", d.company],
        ["Periode", `${d.period} sejak ${d.period_start}`],
        ["Revenue", money(d.sales_revenue)],
        ["Piutang usaha", money(d.outstanding_ar)],
        ["Utang usaha", money(ap)],
        ["Kas dan bank", money(cash)],
        ["Pipeline aktif", money(d.opportunity_value)],
        ["Project aktif", d.projects],
        ["Approval menunggu", d.pending_approvals],
        ["Trial balance", balanced ? "Balanced" : "Tidak balance"],
        ["Diperbarui", new Date(d.last_refreshed_at).toLocaleString("id-ID")],
      ];
      if (action === "export") {
        const filename = `sop-executive-${new Date().toISOString().slice(0, 10)}.xlsx`;
        exportDataToExcel([["Metrik", "Nilai"], ...rows], filename, {
          sheetName: "Ringkasan Eksekutif",
        });
        this.toast("Ekspor laporan ringkasan eksekutif Excel (.xlsx) selesai.");
        return;
      }
      const root = document.querySelector<HTMLElement>(
          '[data-page-id="management"]',
        ),
        dialog = root?.querySelector<HTMLDialogElement>("dialog");
      if (!dialog) {
        this.toast("Dialog laporan tidak tersedia.");
        return;
      }
      const title = dialog.querySelector<HTMLElement>('[data-detail="title"]'),
        description = dialog.querySelector<HTMLElement>(
          '[data-detail="description"]',
        ),
        body = dialog.querySelector<HTMLElement>('[data-detail="body"]');
      if (title) title.textContent = "Laporan Eksekutif";
      if (description)
        description.textContent = `Ringkasan Eksekutif ${d.company}`;
      if (body) {
        const list = document.createElement("ul");
        list.style.margin = "0";
        list.style.paddingLeft = "18px";
        rows.forEach(([metric, value]) => {
          const item = document.createElement("li");
          item.textContent = `${metric}: ${value}`;
          list.append(item);
        });
        body.replaceChildren(list);
      }
      if (!dialog.open) dialog.showModal();
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } } };
      this.toast(
        "Laporan eksekutif gagal: " +
          (e.response?.data?.message || String(error)),
      );
    } finally {
      this.busy = false;
      document.body.classList.remove("sop-api-busy");
    }
  }
}
