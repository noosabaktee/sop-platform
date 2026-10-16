import { api } from "./client";
import type { GridBridge } from "./gridBridge";
import { exportCsvStringToExcel } from "../utils/excelExport";

type AnyRow = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "—" : String(v));
const money = (v: unknown) =>
  "Rp " +
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    Number(v || 0),
  );
const date = (v: unknown) => (v ? String(v).substring(0, 10) : "—");

/** Uses original table renderers and CSS; operational data is read-only without
 * going through its authorized domain endpoints. */
export class CompletionBridge {
  private readonly onClick = (ev: MouseEvent) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>(
      '[data-action="rep:export"], [data-bd-act="export"]',
    );
    if (!el?.closest('[data-prototype-page][data-route="/reports"]')) return;
    const page = el.closest<HTMLElement>("[data-prototype-page]");
    const active =
      page?.querySelector<HTMLElement>("[data-tabpanel]:not([hidden])")?.dataset
        .tabpanel || "";
    const panel =
      el.closest<HTMLElement>("[data-bd-panel]")?.dataset.bdPanel || active;
    const type: Record<string, string> = {
      sales: "sales",
      purchase: "purchase",
      project: "projects",
      inventory: "inventory",
      financial: "finance",
      tax: "tax",
      management: "management",
      bd: "bd",
    };
    const resolved = Object.entries(type).find(([key]) =>
      panel.toLowerCase().includes(key),
    )?.[1];
    if (!resolved) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      window.alert(
        "Laporan ini belum memiliki data transaksi aktif untuk diekspor.",
      );
      return;
    }
    ev.preventDefault();
    ev.stopImmediatePropagation();
    void this.download(resolved);
  };
  constructor(private grid: GridBridge) {}
  install() {
    document.addEventListener("click", this.onClick, true);
    return this.refresh();
  }
  uninstall() {
    document.removeEventListener("click", this.onClick, true);
  }
  private async download(type: string) {
    document.body.classList.add("sop-api-busy");
    try {
      const response = await api.get("/api/v1/reports/export.csv", {
        params: { type },
        responseType: "text",
      });
      const filename = `sop-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      exportCsvStringToExcel(
        response.data as string,
        filename,
        `Laporan ${type}`
      );
    } catch (error) {
      console.error(error);
      window.alert(
        "Ekspor data laporan tidak dapat diproses. Silakan coba lagi.",
      );
    } finally {
      document.body.classList.remove("sop-api-busy");
    }
  }
  async refresh() {
    const responses = await Promise.allSettled([
      api.get("/api/v1/operational/inventory/stocktakes"),
      api.get("/api/v1/operational/banks"),
      api.get("/api/v1/operational/projects/costs"),
    ]);
    const [stocktakes, banks, projects] = responses;
    if (stocktakes.status === "fulfilled") {
      const raw = stocktakes.value.data?.data;
      const rows = (Array.isArray(raw) ? raw : []) as AnyRow[];
      this.grid.mergeDomainRows(
        "/inventory",
        "opname",
        "db-",
        rows.map((x) => ({
          __id: "db-" + str(x.id),
          number: str(x.number),
          warehouse: str(x.warehouse),
          date: date(x.snapshot_at),
          item: "Periksa detail opname",
          variance: "—",
          status: String(x.status) === "posted" ? "Approved" : "Draft",
        })),
      );
    } else console.error("Stocktake read API:", stocktakes.reason);
    if (banks.status === "fulfilled") {
      const accountsRaw = banks.value.data?.data?.accounts;
      const linesRaw = banks.value.data?.data?.lines;
      const accounts = (Array.isArray(accountsRaw) ? accountsRaw : []) as AnyRow[];
      const lines = (Array.isArray(linesRaw) ? linesRaw : []) as AnyRow[];
      this.grid.mergeDomainRows(
        "/finance",
        "cash",
        "db-",
        accounts.map((a) => {
          const own = lines.filter((x) => x.bank_account_id === a.id);
          const newest = own.find((x) => x.matched_at);
          return {
            __id: "db-" + str(a.id),
            account: str(a.name),
            bank: str(a.account_number),
            currency: str(a.currency),
            balance: money(a.ledger_balance),
            lastRecon: newest ? date(newest.matched_at) : "—",
            status:
              own.length > 0 && own.every((x) => x.matched_at)
                ? "Reconciled"
                : "Pending",
          };
        }),
      );
    } else console.error("Bank read API:", banks.reason);
    if (projects.status === "fulfilled") {
      const { projects: plist, costs } = projects.value.data.data as {
        projects: AnyRow[];
        costs: AnyRow[];
      };
      this.grid.mergeDomainRows(
        "/projects",
        "cost",
        "db-",
        costs.map((c) => ({
          __id: "db-" + str(c.id),
          date: date(c.cost_date),
          source: str(c.category),
          desc: str(c.description),
          amount: money(c.amount),
          cc: str(c.project_code),
          status: "Posted",
        })),
      );
      this.grid.mergeDomainRows(
        "/projects",
        "profitability",
        "db-",
        plist.map((p) => ({
          __id: "db-" + str(p.id),
          project: str(p.name),
          contract: money(p.contract_value),
          revenue: "—",
          committed: "—",
          actual: money(p.actual_cost),
          profit: "—",
          margin: "—",
        })),
      );
    } else console.error("Project cost API:", projects.reason);
    await this.refreshReportTables();
  }
  private async refreshReportTables() {
    const kinds = [
      "finance",
      "sales",
      "purchase",
      "projects",
      "inventory",
      "tax",
      "management",
      "bd",
    ] as const;
    const mapping: Record<string, string> = {
      finance: "financial",
      sales: "sales",
      purchase: "purchase",
      projects: "project",
      inventory: "inventory",
      tax: "tax",
      management: "management",
      bd: "bd",
    };
    await Promise.allSettled(
      kinds.map(async (type) => {
        const {
          data: { data },
        } = await api.get("/api/v1/reports/data", { params: { type } });
        const rows = (data.rows || []) as AnyRow[];
        const values = (row: AnyRow): unknown[] => {
          switch (type) {
            case "finance":
              return [
                row.number,
                row.posting_date,
                row.description,
                row.status,
                "Posted",
              ];
            case "sales":
              return [
                row.number,
                row.customer,
                money(row.amount),
                money(row.paid_amount),
                row.status,
              ];
            case "purchase":
              return [
                row.number,
                row.vendor,
                money(row.total),
                "—",
                row.status,
              ];
            case "projects":
              return [row.name, "—", money(row.budget), "—", row.status];
            case "inventory":
              return [
                row.sku,
                row.movement_type,
                str(row.quantity),
                "—",
                row.posted_at,
              ];
            case "tax":
              return [
                row.nomor_faktur,
                date(row.tanggal),
                money(row.dpp),
                money(row.ppn_11_persen),
                row.status,
              ];
            case "management":
              return [
                row.nama_inisiatif,
                row.kode_proyek,
                money(row.nilai_kontrak),
                money(row.plafon_anggaran),
                row.status_eksekusi,
              ];
            case "bd":
              return [
                row.nama_tender,
                row.instansi,
                money(row.nilai_tender),
                str(row.status_bid),
                str(row.hasil_tender),
              ];
          }
        };
        this.grid.mergeDomainRows(
          "/reports",
          mapping[type],
          "db-",
          rows.map((row: AnyRow, i: number) => {
            const r: AnyRow = { __id: "db-" + type + "-" + i };
            values(row).forEach((value, j) => {
              r["c" + j] = str(value);
            });
            return r as { __id: string; [key: string]: unknown };
          }),
        );
      }),
    );
  }
}
