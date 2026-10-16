import { api } from "./client";
import type { GridBridge } from "./gridBridge";

type WorkflowSnapshot = {
  route: string;
  panel_id: string;
  rows: { __id: string; [key: string]: unknown }[];
  version: number;
};

export class CrmWorkflowBridge {
  private observer: MutationObserver | null = null;
  private onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const leadBtn = target.closest<HTMLElement>(
      '[data-crm-panel="leads"] [data-crm-act="convert"]',
    );
    if (leadBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const rowKey = leadBtn.dataset.crmId;
      if (!rowKey) return;
      leadBtn.setAttribute("disabled", "true");
      void this.grid
        .persistRoute("/crm-sales", "leads")
        .then(() =>
          api.post(
            `/api/v1/workflows/crm/leads/${encodeURIComponent(rowKey)}/convert`,
          ),
        )
        .then((response) => {
          this.grid.applyWorkflowSnapshots(
            response.data.data.snapshots as WorkflowSnapshot[],
          );
          window.dispatchEvent(new Event("sop:domain-updated"));
          window.alert("Lead berhasil dikonversi menjadi prospect.");
        })
        .catch((error) =>
          window.alert(
            error?.response?.data?.message || "Konversi lead gagal.",
          ),
        )
        .finally(() => leadBtn.removeAttribute("disabled"));
      return;
    }

    const prospectBtn = target.closest<HTMLElement>(
      '[data-crm-panel="prospects"] [data-crm-act="convert"]',
    );
    if (prospectBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const rowKey = prospectBtn.dataset.crmId;
      if (!rowKey) return;
      prospectBtn.setAttribute("disabled", "true");
      void this.convertProspect(rowKey).finally(() =>
        prospectBtn.removeAttribute("disabled"),
      );
      return;
    }
  };

  private async convertProspect(rowKey: string) {
    try {
      await this.grid.persistRoute("/crm-sales", "prospects");
      const response = await api.post(
        `/api/v1/workflows/crm/prospects/${encodeURIComponent(rowKey)}/convert`,
      );
      const data = response.data.data as {
        opportunity: { name: string };
        snapshots: WorkflowSnapshot[];
      };
      if (data.snapshots?.length)
        this.grid.applyWorkflowSnapshots(data.snapshots);
      window.dispatchEvent(new Event("sop:domain-updated"));
      window.alert(
        `Prospect berhasil dikonversi menjadi Opportunity "${data.opportunity?.name || ""}".`,
      );
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      window.alert(e.response?.data?.message || "Konversi prospect gagal.");
    }
  }

  private injectProspectConvertButtons() {
    const panel = document.querySelector<HTMLElement>(
      '[data-crm-panel="prospects"]',
    );
    if (!panel) return;
    const rows = panel.querySelectorAll<HTMLTableRowElement>(
      "table.crm-table tbody tr",
    );
    rows.forEach((tr) => {
      const actionsCell = tr.querySelector<HTMLElement>("td.crm-actions");
      const delBtn = actionsCell?.querySelector<HTMLElement>(
        '[data-crm-act="delrow"]',
      );
      if (
        actionsCell &&
        delBtn &&
        !actionsCell.querySelector('[data-crm-act="convert"]')
      ) {
        const rowId = delBtn.dataset.crmId || "";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "crm-rowbtn";
        btn.dataset.crmAct = "convert";
        btn.dataset.crmId = rowId;
        btn.setAttribute("aria-label", "Konversi prospect");
        btn.textContent = "Konversi";
        actionsCell.insertBefore(btn, delBtn);
      }
    });
  }

  constructor(private grid: GridBridge) {}
  install() {
    document.addEventListener("click", this.onClick, true);
    const crmRoot = document.querySelector<HTMLElement>(
      '[data-page-id="crm-sales"]',
    );
    if (crmRoot) {
      this.observer = new MutationObserver(() =>
        this.injectProspectConvertButtons(),
      );
      this.observer.observe(crmRoot, { subtree: true, childList: true });
    }
    this.injectProspectConvertButtons();
  }
  uninstall() {
    this.observer?.disconnect();
    document.removeEventListener("click", this.onClick, true);
  }
}
