import { api } from "./client";
import { showConfirmModal } from "./modalHelper";

type TemplateRecord = {
  id: string;
  code: string;
  name: string;
  category: string;
  version: number;
  variables: Record<string, any>;
};

export class DocumentTemplateBridge {
  private active = false;
  private templates: TemplateRecord[] = [];

  install() {
    this.active = true;
    document.addEventListener("click", this.onClick, true);
    window.addEventListener("hashchange", this.onRoute);
    return this.refresh();
  }

  uninstall() {
    this.active = false;
    document.removeEventListener("click", this.onClick, true);
    window.removeEventListener("hashchange", this.onRoute);
  }

  private onRoute = () => {
    if (location.hash === "#/document-template") {
      void this.refresh().catch(console.error);
    }
  };

  private page() {
    return document.querySelector<HTMLElement>('[data-page-id="doctemplate"]');
  }

  private toast(message: string) {
    const node = document.querySelector<HTMLElement>(
      '[data-page-id="doctemplate"] .toast',
    );
    if (node) {
      node.textContent = message;
      node.hidden = false;
      window.setTimeout(() => (node.hidden = true), 5000);
    } else {
      window.alert(message);
    }
  }

  private getActiveTab(): string {
    const page = this.page();
    if (!page) return "quotation";
    const tab = page.querySelector<HTMLElement>(
      '#tpl-tabs [role="tab"][aria-selected="true"]',
    );
    return tab?.dataset.tab || "quotation";
  }

  async refresh() {
    if (!this.active || location.hash !== "#/document-template") return;
    try {
      const res = await api.get("/api/v1/document-templates");
      this.templates = res.data.data as TemplateRecord[];
      this.hydrateAll();
      this.injectDownloadButtons();
    } catch (e) {
      console.error("Gagal memuat document templates:", e);
    }
  }

  private hydrateAll() {
    const page = this.page();
    if (!page) return;

    this.templates.forEach((tpl) => {
      const panel = page.querySelector<HTMLElement>(
        `[data-tabpanel="${tpl.code}"]`,
      );
      if (!panel) return;

      const vars = tpl.variables || {};

      // Update inputs
      panel
        .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          "[data-tpl-var]",
        )
        .forEach((input) => {
          const key = input.dataset.tplVar;
          if (
            key &&
            vars[key] !== undefined &&
            input.value !== String(vars[key])
          ) {
            input.value = String(vars[key]);
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });

      // Update toggles
      panel
        .querySelectorAll<HTMLInputElement>("input[data-tpl-toggle]")
        .forEach((chk) => {
          const key = chk.dataset.tplToggle;
          if (key && vars[key] !== undefined) {
            const on = Boolean(vars[key]);
            chk.checked = on;
            const parent = chk.closest<HTMLElement>(".toggle");
            if (parent) parent.dataset.on = String(on);
            chk.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });

      // Update version badge if KPI exists
      const verKpi = panel.querySelector<HTMLElement>(
        '[data-kind="Versi template"] .kpi__value',
      );
      if (verKpi) {
        verKpi.textContent = `v${tpl.version}`;
      }
    });
  }

  private injectDownloadButtons() {
    const page = this.page();
    if (!page) return;

    page
      .querySelectorAll<HTMLElement>(".preview-card .section-card__heading")
      .forEach((head) => {
        if (head.querySelector('[data-action="tpl:render-vault"]')) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-ghost";
        btn.dataset.action = "tpl:render-vault";
        btn.style.marginLeft = "auto";
        btn.style.fontSize = "12px";
        btn.style.padding = "4px 8px";
        btn.style.display = "inline-flex";
        btn.style.alignItems = "center";
        btn.style.gap = "4px";
        btn.innerHTML =
          '<iconify-icon noobserver icon="lucide:archive" aria-hidden="true"></iconify-icon><span>Arsip ke Vault</span>';
        head.appendChild(btn);
      });
  }

  private onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const page = this.page();
    if (!page || !page.contains(target)) return;

    const actionEl = target.closest<HTMLElement>("[data-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    if (action === "tpl:save") {
      event.preventDefault();
      event.stopImmediatePropagation();
      void this.saveActiveTemplate();
    } else if (action === "tpl:reset") {
      event.preventDefault();
      event.stopImmediatePropagation();
      void this.resetActiveTemplate();
    } else if (action === "tpl:render-vault") {
      event.preventDefault();
      event.stopImmediatePropagation();
      void this.renderToVault();
    }
  };

  private collectVariables(code: string): Record<string, any> {
    const page = this.page();
    if (!page) return {};
    const panel = page.querySelector<HTMLElement>(`[data-tabpanel="${code}"]`);
    if (!panel) return {};

    const vars: Record<string, any> = {};

    panel
      .querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("[data-tpl-var]")
      .forEach((input) => {
        const key = input.dataset.tplVar;
        if (key) vars[key] = input.value;
      });

    panel
      .querySelectorAll<HTMLInputElement>("input[data-tpl-toggle]")
      .forEach((chk) => {
        const key = chk.dataset.tplToggle;
        if (key) vars[key] = chk.checked;
      });

    const colorInput = panel.querySelector<HTMLInputElement>(
      "[data-tpl-logo-color]",
    );
    if (colorInput) vars.logoColor = colorInput.value;

    return vars;
  }

  private async saveActiveTemplate() {
    const code = this.getActiveTab();
    const variables = this.collectVariables(code);

    document.body.classList.add("sop-api-busy");
    try {
      const res = await api.post("/api/v1/document-templates", {
        code,
        variables,
      });

      // Also render and archive directly into Document Vault
      const renderRes = await api.post(
        `/api/v1/document-templates/${code}/render`,
        {
          variables,
        },
      );

      window.dispatchEvent(new CustomEvent("sop:documents-updated"));
      this.toast(
        `Template ${code} berhasil disimpan (v${res.data.data.version}) & diarsipkan ke Document Vault (SHA-256: ${renderRes.data.data.sha256.slice(0, 8)}...).`,
      );
      await this.refresh();
    } catch (e: any) {
      this.toast(
        "Gagal menyimpan template: " + (e.response?.data?.message || e.message),
      );
    } finally {
      document.body.classList.remove("sop-api-busy");
    }
  }

  private async resetActiveTemplate() {
    const code = this.getActiveTab();
    const confirmed = await showConfirmModal({
      title: "Reset Template Variables",
      message: `Apakah Anda yakin ingin mereset variabel template "${code}" ke nilai standar bawaan sistem?`,
      confirmText: "Ya, Reset Template",
      isDanger: true,
    });
    if (!confirmed) return;

    document.body.classList.add("sop-api-busy");
    try {
      const res = await api.post(`/api/v1/document-templates/${code}/reset`);
      this.toast(`Template ${code} berhasil direset ke versi bawaan.`);
      await this.refresh();
    } catch (e: any) {
      this.toast(
        "Gagal mereset template: " + (e.response?.data?.message || e.message),
      );
    } finally {
      document.body.classList.remove("sop-api-busy");
    }
  }

  private async renderToVault() {
    const code = this.getActiveTab();
    const variables = this.collectVariables(code);

    document.body.classList.add("sop-api-busy");
    try {
      const res = await api.post(`/api/v1/document-templates/${code}/render`, {
        variables,
      });

      const { download_url, title, sha256 } = res.data.data;
      window.dispatchEvent(new CustomEvent("sop:documents-updated"));

      // Trigger download
      const response = await api.get(download_url, { responseType: "blob" });
      const url = URL.createObjectURL(
        new Blob([response.data], { type: "text/html" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      this.toast(
        `Dokumen berhasil dirender & diunduh (SHA-256: ${sha256.slice(0, 10)}...).`,
      );
    } catch (e: any) {
      this.toast(
        "Gagal merender dokumen: " + (e.response?.data?.message || e.message),
      );
    } finally {
      document.body.classList.remove("sop-api-busy");
    }
  }
}
