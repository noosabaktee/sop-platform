import { api } from "./client";

type Counts = Record<string, number>;
type Activity = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor: string | null;
  created_at: string;
};
type WorkItem = {
  id: string;
  record: string;
  description: string;
  context: string;
  priority: string;
  owner: string;
  status: string;
  module: string;
  deadline: string | null;
};
type KPI = {
  company: string;
  customers: number;
  quotations: number;
  projects: number;
  opportunities: number;
  opportunity_value: number;
  open_project_tasks: number;
  pending_approvals: number;
  sales_revenue: number;
  outstanding_ar: number;
  last_refreshed_at: string;
  projects_summary: { overdue_tasks: number };
  procurement: { request_status: Counts; order_status: Counts };
  inventory: { products: number; warehouses: number; stock_value: number };
  personal: {
    assigned_open_tasks: number;
    managed_projects: number;
    unread_notifications: number;
  };
  overview: {
    deadlines_this_week: number;
    daily_sales: { date: string; label: string; value: number }[];
    activities: Activity[];
    work_items: WorkItem[];
  };
};
const idr = (n: number) =>
  n >= 1_000_000_000
    ? `Rp ${(n / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`
    : `Rp ${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
const total = (counts: Counts, excluded: string[] = []) =>
  Object.entries(counts || {})
    .filter(([key]) => !excluded.includes(key))
    .reduce((sum, [, value]) => sum + Number(value), 0);
const selectedPeriod = () => {
  const overview = document.querySelector<HTMLElement>(
    '[data-route="/overview"]',
  );
  if (location.hash === "#/overview") {
    const value =
      overview?.querySelector<HTMLSelectElement>(
        '[data-target="dashboard"] select',
      )?.value || "Last month";
    return value.includes("quarter")
      ? "quarter"
      : value.includes("week")
        ? "week"
        : "month";
  }
  const value =
    document.querySelector<HTMLSelectElement>(
      '[data-route="/dashboard"] [data-filter="periode"]',
    )?.value || "Bulan ini";
  return value.startsWith("Kuartal")
    ? "quarter"
    : value.startsWith("Tahun")
      ? "year"
      : "month";
};
const title = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\./g, " › ")
    .replace(/\b\w/g, (x) => x.toUpperCase());
const localDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "14 Okt 2026";
const setText = (node: Element | null | undefined, value: unknown) => {
  if (node) node.textContent = String(value ?? "");
};

const overviewTableSkeletonMap = new WeakMap<HTMLTableElement, HTMLTableRowElement>();
let cachedActivityTemplate: HTMLElement | null = null;

function projectOverview(overview: HTMLElement, data: KPI) {
  const metrics: Record<string, number> = {
    tickets: data.opportunities,
    resolution: data.pending_approvals,
    compliance: data.overview.deadlines_this_week,
  };
  overview
    .querySelectorAll<HTMLElement>('[data-component="kravio-metric"]')
    .forEach((card) => {
      const value = metrics[card.dataset.metric || ""];
      if (Number.isFinite(value))
        setText(card.querySelector('[data-part="value"]'), value);
    });
  const bars = overview.querySelectorAll<HTMLButtonElement>(
      ".c-kravio-chart__bar",
    ),
    max = Math.max(1, ...data.overview.daily_sales.map((point) => point.value));
  bars.forEach((bar, index) => {
    const point = data.overview.daily_sales[index];
    if (!point) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    bar.style.setProperty(
      "--bar-height",
      `${Math.max(2, (point.value / max) * 100)}%`,
    );
    bar.dataset.value = String(point.value);
    bar.dataset.day = point.label;
    bar.setAttribute("aria-label", `${point.label}: ${idr(point.value)}`);
  });
  setText(
    overview.querySelector(".c-kravio-chart__total"),
    idr(data.overview.daily_sales.reduce((sum, point) => sum + point.value, 0)),
  );
  const updates = overview.querySelector<HTMLElement>(
      '[data-component="kravio-updates"]',
    ),
    list = updates?.querySelector<HTMLElement>('[data-part="list"]');
  if (list) {
    if (!cachedActivityTemplate) {
      const template = list.querySelector<HTMLElement>(":scope > div");
      if (template) {
        cachedActivityTemplate = template.cloneNode(true) as HTMLElement;
      }
    }

    if (cachedActivityTemplate) {
      list.querySelectorAll(":scope > div").forEach((node) => node.remove());
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const emptyEl = list.querySelector<HTMLElement>('[data-part="empty"]');
      if (!data.overview.activities.length) {
        if (emptyEl) emptyEl.hidden = false;
      } else {
        if (emptyEl) emptyEl.hidden = true;
        data.overview.activities.forEach((item) => {
          const wrapper = cachedActivityTemplate!.cloneNode(true) as HTMLElement,
            date = new Date(item.created_at),
            days = Math.floor(
              (today.getTime() -
                new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                ).getTime()) /
                86400000,
            );
          wrapper.dataset.period =
            days <= 0 ? "today" : days === 1 ? "yesterday" : "week";
          wrapper.hidden = days > 0;
          const article = wrapper.querySelector<HTMLElement>(
            '[data-component="kravio-activity"]',
          );
          if (article) article.dataset.nodeId = `audit.${item.id}`;
          setText(wrapper.querySelector('[data-part="title"]'), title(item.action));
          setText(
            wrapper.querySelector('[data-part="time"]'),
            date.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
          setText(
            wrapper.querySelector('[data-part="description"]'),
            `${title(item.entity_type)} ${item.entity_id} · ${item.actor || "Sistem"}`,
          );
          list.insertBefore(wrapper, emptyEl);
        });
      }

      setText(
        updates?.querySelector('[data-part="count"] strong'),
        data.overview.activities.filter(
          (item) => new Date(item.created_at) >= today,
        ).length,
      );
    }
  }

  const fillTable = (
    table: HTMLTableElement | null,
    items: WorkItem[],
    focus = false,
  ) => {
    const tbody = table?.tBodies[0];
    if (!table || !tbody) return;

    let skeleton = overviewTableSkeletonMap.get(table);
    if (!skeleton) {
      const template = tbody.querySelector<HTMLTableRowElement>("tr");
      if (template) {
        skeleton = template.cloneNode(true) as HTMLTableRowElement;
        skeleton.removeAttribute("data-template-row");
        overviewTableSkeletonMap.set(table, skeleton);
      }
    }
    if (!skeleton) return;

    tbody.replaceChildren();
    if (!items.length) {
      const row = document.createElement("tr"),
        cell = document.createElement("td");
      cell.colSpan = table?.tHead?.rows[0]?.cells.length || 7;
      cell.style.textAlign = "center";
      cell.style.padding = "24px";
      cell.style.color = "var(--text-muted, #64748b)";
      cell.textContent = focus
        ? "Tidak ada fokus pekerjaan terbuka saat ini."
        : "Tidak ada pekerjaan atau SLA terbuka.";
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }
    items.forEach((item) => {
      const row = skeleton!.cloneNode(true) as HTMLTableRowElement;
      row.dataset.record = item.record;
      if (focus) {
        setText(row.cells[1], `${item.record} ${item.context}`);
        setText(row.cells[2], item.module);
        setText(row.cells[3], item.owner);
        setText(
          row.cells[4]?.querySelector('[data-part="label"],.status-chip'),
          title(item.status),
        );
        setText(row.cells[5], localDate(item.deadline));
        setText(row.cells[6], item.description);
      } else {
        const label = row.cells[0]?.querySelector("label");
        if (label?.lastChild) label.lastChild.textContent = item.record;
        setText(row.cells[1], item.description);
        setText(
          row.cells[2]?.querySelector('[data-part="label"]'),
          item.priority,
        );
        setText(row.cells[3]?.querySelector('[data-part="name"]'), item.owner);
        setText(
          row.cells[4]?.querySelector('[data-part="label"]'),
          title(item.status),
        );
        setText(row.cells[5], item.module);
        setText(row.cells[6], localDate(item.deadline));
      }
      tbody.appendChild(row);
    });
  };
  fillTable(
    overview.querySelector<HTMLTableElement>(
      '[data-component="kravio-table"] table',
    ),
    data.overview.work_items,
  );
  fillTable(
    overview.querySelector<HTMLTableElement>(".focus-grid"),
    data.overview.work_items,
    true,
  );
  const count = data.overview.work_items.length,
    info = `Menampilkan ${count ? 1 : 0}–${count} dari ${count} record`;
  setText(
    overview.querySelector(
      '[data-component="kravio-table"] [data-part="page-info"]',
    ),
    info,
  );
  setText(overview.querySelector('[data-part="focus-info"]'), info);
  const focusPages = overview.querySelector<HTMLElement>(
    '[data-part="focus-pages"]',
  );
  if (focusPages) focusPages.replaceChildren();
  overview
    .querySelectorAll<HTMLButtonElement>(
      '[data-action="focus:prev"],[data-action="focus:next"]',
    )
    .forEach((button) => (button.disabled = true));
}

function projectManagement(
  data: KPI,
  optional: PromiseSettledResult<{ data: { data: unknown } }>[],
) {
  const root = document.querySelector<HTMLElement>(
    '[data-route="/management"]',
  );
  if (!root) return;
  const accounting =
    optional[0]?.status === "fulfilled"
      ? (optional[0].value.data.data as { balanced?: boolean })
      : undefined;
  const payables =
    optional[1]?.status === "fulfilled"
      ? (optional[1].value.data.data as {
          bills?: Array<{ amount: string; paid_amount: string }>;
        })
      : undefined;
  const banks =
    optional[2]?.status === "fulfilled"
      ? (optional[2].value.data.data as {
          accounts?: Array<{ ledger_balance: string }>;
        })
      : undefined;
  const totalAp = (payables?.bills || []).reduce(
    (sum, bill) =>
      sum + Math.max(0, Number(bill.amount) - Number(bill.paid_amount)),
    0,
  );
  const cash = (banks?.accounts || []).reduce(
    (sum, account) => sum + Number(account.ledger_balance || 0),
    0,
  );
  root.querySelectorAll<HTMLElement>(".kpi").forEach((card) => {
    const label = (
      card.querySelector<HTMLElement>(".kpi__title")?.innerText || ""
    ).toLowerCase();
    let value: string | undefined;
    if (/revenue/.test(label)) value = idr(data.sales_revenue);
    else if (/pipeline value|weighted forecast|commit/.test(label))
      value = idr(data.opportunity_value);
    else if (/total ar/.test(label)) value = idr(data.outstanding_ar);
    else if (/total ap/.test(label) && payables) value = idr(totalAp);
    else if (/cash position|total kas|total kas & bank/.test(label) && banks)
      value = idr(cash);
    else if (/trial balance/.test(label) && accounting)
      value = accounting.balanced ? "Balanced" : "Tidak balance";
    else if (/project aktif/.test(label)) value = String(data.projects);
    else if (/sales order/.test(label))
      value = String(
        total(data.procurement.order_status, ["draft", "cancelled", "closed"]),
      );
    else if (/pipeline/.test(label)) value = idr(data.opportunity_value);
    if (value !== undefined) {
      const node = card.querySelector<HTMLElement>(".kpi__value");
      if (node) node.textContent = value;
      card.dataset.value = value;
    }
  });
}

/** Projects live SQL aggregates into the original Overview and Dashboard DOM. */
export async function refreshNativeKpis() {
  const { data: result } = await api.get(
      `/api/v1/dashboard?period=${selectedPeriod()}`,
    ),
    data = result.data as KPI;
  const overview = document.querySelector<HTMLElement>(
    '[data-route="/overview"]',
  );
  if (overview) projectOverview(overview, data);
  const dashboard = document.querySelector<HTMLElement>(
    '[data-route="/dashboard"]',
  );
  const company = dashboard?.querySelector<HTMLSelectElement>(
    '[data-filter="company"]',
  );
  if (company) {
    company.replaceChildren(new Option(data.company, data.company, true, true));
    company.disabled = true;
    company.title = "Dashboard dibatasi ke company akun Anda";
  }
  const branch = dashboard?.querySelector<HTMLSelectElement>(
    '[data-filter="branch"]',
  );
  if (branch) {
    branch.value = "Semua cabang";
    branch.disabled = true;
    branch.title = "Data cabang belum tersedia pada skema operasional";
  }
  const activeOrders = total(data.procurement.order_status, [
    "done",
    "completed",
    "cancelled",
    "closed",
  ]);
  const activeRequests = total(data.procurement.request_status, [
    "done",
    "completed",
    "cancelled",
    "closed",
    "rejected",
  ]);
  dashboard?.querySelectorAll<HTMLElement>(".kpi").forEach((card) => {
    const label = (
      card.querySelector<HTMLElement>(".kpi__title")?.innerText || ""
    ).toLowerCase();
    let value: string | undefined;
    if (/ar outstanding|outstanding ar|piutang/.test(label))
      value = idr(data.outstanding_ar);
    else if (/pipeline value|nilai pipeline/.test(label))
      value = idr(data.opportunity_value);
    else if (/revenue|pendapatan/.test(label)) value = idr(data.sales_revenue);
    else if (/total customer|jumlah pelanggan|customers/.test(label))
      value = String(data.customers);
    else if (/quotation/.test(label)) value = String(data.quotations);
    else if (/active project|project aktif|proyek aktif/.test(label))
      value = String(data.projects);
    else if (/managed project/.test(label))
      value = String(data.personal.managed_projects);
    else if (/overdue task/.test(label))
      value = String(data.projects_summary.overdue_tasks);
    else if (/assigned task|my task|task saya/.test(label))
      value = String(data.personal.assigned_open_tasks);
    else if (/open task/.test(label)) value = String(data.open_project_tasks);
    else if (/pending approval|menunggu persetujuan/.test(label))
      value = String(data.pending_approvals);
    else if (/unread notification/.test(label))
      value = String(data.personal.unread_notifications);
    else if (/purchase request|permintaan pembelian/.test(label))
      value = String(activeRequests);
    else if (/po aktif|purchase order|active po/.test(label))
      value = String(activeOrders);
    else if (/stock value|inventory value|nilai persediaan/.test(label))
      value = idr(data.inventory.stock_value);
    else if (/warehouse|gudang/.test(label))
      value = String(data.inventory.warehouses);
    else if (/product|item/.test(label))
      value = String(data.inventory.products);
    if (value !== undefined) {
      const node = card.querySelector<HTMLElement>(".kpi__value");
      if (node) node.textContent = value;
      card.dataset.value = value;
    }
  });
  const fresh = dashboard?.querySelector<HTMLElement>(
    '[data-part="dash-fresh-time"]',
  );
  if (fresh)
    fresh.textContent = new Date(data.last_refreshed_at).toLocaleTimeString(
      "id-ID",
      { hour: "2-digit", minute: "2-digit" },
    );
  const optional = await Promise.allSettled([
    api.get("/api/v1/operational/accounting"),
    api.get("/api/v1/operational/payables"),
    api.get("/api/v1/operational/banks"),
  ]);
  projectManagement(data, optional);
}
