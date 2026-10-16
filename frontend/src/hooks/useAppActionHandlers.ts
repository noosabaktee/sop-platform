import { useEffect } from "react";
import { api } from "../api/client";
import type { User } from "../types/auth";
import type { Snapshot } from "../types/prototype";
import type { GridBridge } from "../api/gridBridge";
import type { ModuleStateBridge } from "../api/moduleStateBridge";
import { refreshNativeKpis } from "../api/kpiProjection";
import {
  handleNativeWorkspaceAction,
  refreshNativeWorkspace,
} from "../api/workspaceProjection";
import {
  exportTableElementToExcel,
  exportDataToExcel,
} from "../utils/excelExport";

export function useAppActionHandlers(
  bridge: GridBridge | null,
  modules: ModuleStateBridge | null,
  user: User | null,
) {
  useEffect(() => {
    if (!bridge || !modules) return;

    // 1. Real CSV Import
    const handleImport = (event: MouseEvent) => {
      const el = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-crm-act="import"],[data-bd-act="import"],[data-qt-act="import"],[data-mtx-act="import"],[data-action="md:import"]',
      );
      if (!el) return;

      const page = el.closest<HTMLElement>("[data-prototype-page]");
      const route = page?.dataset.route || "";
      const panel = el.closest<HTMLElement>(
        "[data-crm-panel],[data-bd-panel],[data-qt-panel],[data-mtx-panel],[data-tabpanel]",
      );
      const activeTab = page?.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      const panelId =
        panel?.dataset.crmPanel ||
        panel?.dataset.bdPanel ||
        panel?.dataset.qtPanel ||
        panel?.dataset.mtxPanel ||
        panel?.dataset.tabpanel ||
        activeTab?.dataset.tab ||
        "";

      if (!bridge.has(route, panelId)) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".csv,text/csv";
      fileInput.hidden = true;
      document.body.appendChild(fileInput);

      fileInput.addEventListener(
        "change",
        () => {
          const selected = fileInput.files?.[0];
          if (!selected) {
            fileInput.remove();
            return;
          }
          void selected
            .text()
            .then((text) => bridge.importCSV(route, panelId, text))
            .catch((err) => console.error("Import CSV gagal", err))
            .finally(() => fileInput.remove());
        },
        { once: true },
      );

      fileInput.click();
    };

    // 2. Real Excel (.xlsx) Export
    const handleExport = (event: MouseEvent) => {
      const btn = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-action="doc:export"],[data-action="mt:export"],[data-action="cor:export"],[data-action="sec:export"],[data-crm-act="export"],[data-bd-act="export"],[data-action="md:export"]',
      );
      if (!btn) return;

      const page = btn.closest<HTMLElement>("[data-prototype-page]");
      if (!page) return;

      const selected = page.querySelector<HTMLElement>(
        "[data-tabpanel]:not([hidden])",
      );
      const visible = selected || page;
      const table = visible.querySelector<HTMLTableElement>("table");

      let values: string[][] = [];

      if (!table) {
        values = [
          ...visible.querySelectorAll<HTMLElement>(".list-item,.keyrow,.row"),
        ]
          .map((el) => [el.innerText.replace(/\s+/g, " ").trim()])
          .filter((row) => row[0]);

        if (!values.length) {
          window.alert("Tidak ada data untuk diekspor pada tab ini.");
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const filename =
        (page.dataset.route || "sop").replace(/^\//, "").replaceAll("/", "-") +
        "-" +
        (selected?.dataset.tabpanel || "data") +
        ".xlsx";

      try {
        if (table) {
          exportTableElementToExcel(table, filename, selected?.dataset.tabpanel || "Data");
        } else {
          exportDataToExcel(values, filename, { sheetName: selected?.dataset.tabpanel || "Data" });
        }
      } catch (err) {
        console.error("Gagal mengekspor data ke Excel:", err);
        window.alert("Tidak dapat mengekspor data ke Excel: " + String(err));
      }
    };

    // 3. Domain protection & validation interceptors
    const handleDomainProtection = (event: Event) => {
      bridge.protectDomainEdit(event);
    };

    // 4. Native Prototype sync on user mutation
    const handleNativeAction = () => {
      bridge.scheduleSync();
      modules.scheduleSync();
      window.setTimeout(() => bridge.reconcileProjectedSelects(), 0);
    };

    // 5. Dashboard Tab and Range updates
    const handleDashboardTab = (event: Event) => {
      const btn = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-action="dash:tab"],[data-action="ws:tab"],[data-action="dash:refresh"],[data-action="dash:reset"],[data-action="dash:filter"],[data-action="kravio-range:change"],[data-action="kravio:refresh"],[role="tab"]',
      );
      if (btn && user) {
        window.setTimeout(
          () => void refreshNativeKpis().catch(console.error),
          40,
        );
        window.setTimeout(() => {
          bridge.reconcileProjectedSelects();
          void refreshNativeWorkspace().catch(console.error);
        }, 50);
      }
    };

    // 6. Workspace Tasks & Calendar Actions
    const handleWorkspace = (event: Event) => {
      void handleNativeWorkspaceAction(event).catch((err) => {
        console.error(err);
        window.alert("Perubahan workspace gagal disimpan ke server.");
      });
    };

    // 7. Manual Refresh Button
    const handleRefresh = (event: MouseEvent) => {
      const el = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-action="kravio:refresh"],[data-action="dash:refresh"]',
      );
      if (!el) return;

      window.setTimeout(() => {
        void api
          .get("/api/v1/grid-snapshots")
          .then((res) => bridge.loadSnapshots(res.data.data as Snapshot[]))
          .catch(console.error);
      }, 0);
    };

    // Attach listeners
    document.addEventListener("click", handleDomainProtection, true);
    document.addEventListener("input", handleDomainProtection, true);
    document.addEventListener("focusin", handleDomainProtection, true);
    document.addEventListener("change", handleDomainProtection, true);

    document.addEventListener("click", handleDashboardTab, true);
    document.addEventListener("change", handleDashboardTab, true);

    document.addEventListener("click", handleWorkspace, true);
    document.addEventListener("change", handleWorkspace, true);

    document.addEventListener("click", handleImport, true);
    document.addEventListener("click", handleExport, true);

    document.addEventListener("click", handleNativeAction, true);
    document.addEventListener("change", handleNativeAction, true);
    document.addEventListener("drop", handleNativeAction, true);
    document.addEventListener("keyup", handleNativeAction, true);
    document.addEventListener("submit", handleNativeAction, true);

    document.addEventListener("click", handleRefresh, true);

    return () => {
      document.removeEventListener("click", handleDomainProtection, true);
      document.removeEventListener("input", handleDomainProtection, true);
      document.removeEventListener("focusin", handleDomainProtection, true);
      document.removeEventListener("change", handleDomainProtection, true);

      document.removeEventListener("click", handleDashboardTab, true);
      document.removeEventListener("change", handleDashboardTab, true);

      document.removeEventListener("click", handleWorkspace, true);
      document.removeEventListener("change", handleWorkspace, true);

      document.removeEventListener("click", handleImport, true);
      document.removeEventListener("click", handleExport, true);

      document.removeEventListener("click", handleNativeAction, true);
      document.removeEventListener("change", handleNativeAction, true);
      document.removeEventListener("drop", handleNativeAction, true);
      document.removeEventListener("keyup", handleNativeAction, true);
      document.removeEventListener("submit", handleNativeAction, true);

      document.removeEventListener("click", handleRefresh, true);
    };
  }, [bridge, modules, user]);
}

export { useAppActionHandlers as usePrototypeActionHandlers };

