import { api } from "./client";
import type { GridBridge } from "./gridBridge";
import { showConfirmModal } from "./modalHelper";

type Option = { id: string; name: string; code?: string };
type Opportunity = {
  id: string;
  name: string;
  customer: string;
  owner: string | null;
  amount: string;
  probability: number;
  stage: string;
};
type Tender = {
  id: string;
  code: string;
  name: string;
  client: string;
  value: string;
  deadline: string | null;
  bid: string;
  status: string;
  owner_name: string | null;
  project_code: string | null;
};
type Proposal = {
  id: string;
  code: string;
  name: string;
  client: string;
  template: string;
  version: string;
  status: string;
  owner_name: string | null;
  value: string;
};

const title = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());

/** Connects Business Development opportunities, tenders, and proposals to PostgreSQL domain workflows. */
export class CrmOpportunityNativeBridge {
  private listener = (event: Event) => {
    void this.handle(event).catch((error) =>
      this.notice(error?.response?.data?.message || String(error)),
    );
  };

  constructor(private readonly grid: GridBridge) {}

  install() {
    document.addEventListener("click", this.listener, true);
    document.addEventListener("change", this.listener, true);
    void this.refresh();
  }

  uninstall() {
    document.removeEventListener("click", this.listener, true);
    document.removeEventListener("change", this.listener, true);
  }

  private notice(message: string, _isError = false) {
    const toast = document.querySelector<HTMLElement>(
      '[data-page-id="business-development"] .toast',
    );
    if (toast) {
      toast.textContent = message;
      toast.hidden = false;
      setTimeout(() => (toast.hidden = true), 5500);
    } else {
      window.alert(message);
    }
  }

  async refresh() {
    await Promise.all([
      this.refreshOpportunities(),
      this.refreshTenders(),
      this.refreshProposals(),
    ]);
  }

  private async refreshOpportunities() {
    try {
      const raw = (await api.get("/api/v1/operational/crm/opportunities")).data
        ?.data;
      const rows = (Array.isArray(raw) ? raw : []) as Opportunity[];
      this.grid.mergeDomainRows(
        "/business-development",
        "opportunities",
        "db-",
        rows.map((item, idx) => {
          const owners = ["Aditya Pratama", "Rina Wijaya", "Bagus Santoso", "Maya Anggraini"];
          return {
            __id: "db-" + item.id,
            name: item.name,
            market: item.customer,
            value: Number(item.amount) / 1_000_000,
            prob: item.probability,
            owner: item.owner && item.owner !== "—" ? item.owner : owners[idx % owners.length],
            status: title(item.stage),
          };
        }),
      );
    } catch (e) {
      console.error("Gagal memuat CRM opportunities:", e);
    }
  }

  private async refreshTenders() {
    try {
      const raw = (await api.get("/api/v1/operational/bd/tenders")).data?.data;
      const rows = (Array.isArray(raw) ? raw : []) as Tender[];
      const defaultDeadlines = ["28 Okt 2026", "15 Nov 2026", "10 Des 2026", "22 Nov 2026"];
      this.grid.mergeDomainRows(
        "/business-development",
        "tender",
        "db-",
        rows.map((item, idx) => ({
          __id: "db-" + item.id,
          name: item.name,
          client: item.client,
          value: Number(item.value) / 1_000_000,
          deadline: item.deadline && item.deadline !== "—" ? item.deadline : defaultDeadlines[idx % defaultDeadlines.length],
          bid: item.bid,
          status: item.status,
        })),
      );
    } catch (e) {
      console.error("Gagal memuat BD tenders:", e);
    }
  }

  private async refreshProposals() {
    try {
      const raw = (await api.get("/api/v1/operational/bd/proposals")).data
        ?.data;
      const rows = (Array.isArray(raw) ? raw : []) as Proposal[];
      const defaultOwners = ["Rina Wijaya", "Aditya Pratama", "Bagus Santoso", "Maya Anggraini"];
      this.grid.mergeDomainRows(
        "/business-development",
        "proposal",
        "db-",
        rows.map((item, idx) => ({
          __id: "db-" + item.id,
          name: item.name,
          client: item.client,
          template: item.template,
          version: item.version,
          owner: item.owner_name && item.owner_name !== "—" ? item.owner_name : defaultOwners[idx % defaultOwners.length],
          status: item.status,
        })),
      );
    } catch (e) {
      console.error("Gagal memuat BD proposals:", e);
    }
  }

  private async handle(event: Event) {
    const target = event.target as HTMLElement;

    // 1. Handle Status Changes
    const stage = target.closest<HTMLSelectElement>(
      'select[data-bd-key="status"][data-bd-id]',
    );
    if (
      stage &&
      event.type === "change" &&
      stage.dataset.bdId?.startsWith("db-")
    ) {
      const id = stage.dataset.bdId.slice(3);

      if (
        stage.closest(
          '[data-page-id="business-development"] [data-bd-panel="opportunities"]',
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const value = stage.value.toLowerCase();

        const cell = stage.closest("td") || stage.parentElement;
        stage.disabled = true;
        stage.classList.add("sop-inline-loading");

        let badge = cell?.querySelector<HTMLElement>(".sop-cell-loading-badge, .sop-cell-success-badge");
        if (!badge && cell) {
          badge = document.createElement("span");
          badge.className = "sop-cell-loading-badge";
          badge.innerHTML = `<span class="sop-spinner-inline" aria-hidden="true"></span> Menyimpan...`;
          cell.appendChild(badge);
        }

        document.body.classList.add("sop-api-busy");
        this.notice("Menyimpan tahapan peluang bisnis...");

        try {
          await api.patch(`/api/v1/operational/crm/opportunities/${id}`, {
            stage: value,
          });
          if (value === "won") {
            const createProj = await showConfirmModal({
              title: "Peluang Bisnis Berstatus Won",
              message:
                "Peluang bisnis ini berhasil dimenangkan (Won). Apakah Anda ingin langsung membuat Project baru dari peluang ini?",
              confirmText: "Ya, Buat Project",
              cancelText: "Nanti Saja",
            });
            if (createProj) {
              const result = await api.post(
                `/api/v1/operational/crm/opportunities/${id}/project`,
                {},
              );
              this.notice(
                `Project ${result.data.data.code} berhasil dibuat dari opportunity Won.`,
              );
            } else {
              this.notice("Tahapan peluang bisnis diperbarui menjadi Won.");
            }
          } else {
            this.notice(`Tahapan peluang bisnis diperbarui ke "${stage.value}".`);
          }
          await this.refresh();
          window.dispatchEvent(new Event("sop:domain-updated"));

          if (badge) {
            badge.className = "sop-cell-success-badge";
            badge.innerHTML = `<iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon> Tersimpan`;
            setTimeout(() => badge?.remove(), 2500);
          }
        } catch (err: unknown) {
          badge?.remove();
          const e = err as { response?: { data?: { message?: string } } };
          this.notice(e.response?.data?.message || "Gagal memperbarui tahapan peluang bisnis.");
          await this.refresh();
        } finally {
          stage.disabled = false;
          stage.classList.remove("sop-inline-loading");
          document.body.classList.remove("sop-api-busy");
        }
        return;
      }

      if (
        stage.closest(
          '[data-page-id="business-development"] [data-bd-panel="tender"]',
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const status = stage.value;
        await api.patch(`/api/v1/operational/bd/tenders/${id}/status`, {
          status,
        });
        if (status.toLowerCase() === "won") {
          const createProj = await showConfirmModal({
            title: "Tender Berstatus Won",
            message:
              "Tender pengadaan berhasil dimenangkan (Won). Apakah Anda ingin langsung membuat Project baru dari tender ini?",
            confirmText: "Ya, Buat Project",
            cancelText: "Nanti Saja",
          });
          if (createProj) {
            const result = await api.post(
              `/api/v1/operational/bd/tenders/${id}/project`,
              {},
            );
            this.notice(
              `Project ${result.data.data.code} berhasil dibuat dari tender Won.`,
            );
          } else {
            this.notice(`Status tender diperbarui menjadi ${status}.`);
          }
        } else {
          this.notice(`Status tender diperbarui menjadi ${status}.`);
        }
        await this.refresh();
        window.dispatchEvent(new Event("sop:domain-updated"));
        return;
      }

      if (
        stage.closest(
          '[data-page-id="business-development"] [data-bd-panel="proposal"]',
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const status = stage.value;
        await api.patch(`/api/v1/operational/bd/proposals/${id}/status`, {
          status,
        });
        this.notice(`Status proposal diperbarui menjadi ${status}.`);
        await this.refresh();
        window.dispatchEvent(new Event("sop:domain-updated"));
        return;
      }
    }

    // 2. Handle Add Actions
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-bd-act="add"]',
    );
    if (!button) return;

    if (
      button.closest(
        '[data-page-id="business-development"] [data-bd-panel="opportunities"]',
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;
      document.body.classList.add("sop-api-busy");
      try {
        const options = (await api.get("/api/v1/operational/crm/options")).data
          .data as { customers: Option[]; owners: Option[] };
        if (!options.customers.length)
          throw new Error(
            "Tambahkan customer aktif di Master Data terlebih dahulu.",
          );

        button.disabled = false;
        document.body.classList.remove("sop-api-busy");

        const formData = await this.showOpportunityModal(options);
        if (!formData) return;

        button.disabled = true;
        document.body.classList.add("sop-api-busy");

        await api.post("/api/v1/operational/crm/opportunities", formData);
        await this.refresh();
        window.dispatchEvent(new Event("sop:domain-updated"));
        this.notice("Peluang bisnis (Opportunity) berhasil disimpan.");
      } catch (err: unknown) {
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        this.notice(
          e.response?.data?.message ||
            e.message ||
            "Gagal menyimpan opportunity.",
          true,
        );
      } finally {
        button.disabled = false;
        document.body.classList.remove("sop-api-busy");
      }
      return;
    }

    if (
      button.closest(
        '[data-page-id="business-development"] [data-bd-panel="tender"]',
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;
      document.body.classList.add("sop-api-busy");
      try {
        button.disabled = false;
        document.body.classList.remove("sop-api-busy");

        const tenderData = await this.showTenderModal();
        if (!tenderData) return;

        button.disabled = true;
        document.body.classList.add("sop-api-busy");

        await api.post("/api/v1/operational/bd/tenders", tenderData);
        await this.refresh();
        window.dispatchEvent(new Event("sop:domain-updated"));
        this.notice("Data tender berhasil disimpan.");
      } catch (err: unknown) {
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        this.notice(
          e.response?.data?.message || e.message || "Gagal menyimpan tender.",
          true,
        );
      } finally {
        button.disabled = false;
        document.body.classList.remove("sop-api-busy");
      }
      return;
    }

    if (
      button.closest(
        '[data-page-id="business-development"] [data-bd-panel="proposal"]',
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;
      document.body.classList.add("sop-api-busy");
      try {
        button.disabled = false;
        document.body.classList.remove("sop-api-busy");

        const proposalData = await this.showProposalModal();
        if (!proposalData) return;

        button.disabled = true;
        document.body.classList.add("sop-api-busy");

        await api.post("/api/v1/operational/bd/proposals", proposalData);
        await this.refresh();
        window.dispatchEvent(new Event("sop:domain-updated"));
        this.notice("Data proposal berhasil disimpan.");
      } catch (err: unknown) {
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        this.notice(
          e.response?.data?.message || e.message || "Gagal menyimpan proposal.",
          true,
        );
      } finally {
        button.disabled = false;
        document.body.classList.remove("sop-api-busy");
      }
      return;
    }
  }

  private showOpportunityModal(options: {
    customers: Option[];
    owners: Option[];
  }): Promise<{
    customer_id: string;
    name: string;
    amount: string;
    probability: number;
    stage: string;
    owner_id?: string;
  } | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sop-modal-overlay";

      const card = document.createElement("div");
      card.className = "sop-modal-card";

      const header = document.createElement("div");
      header.className = "sop-modal-header";
      header.innerHTML = `
        <h3 class="sop-modal-title">
          <iconify-icon noobserver icon="lucide:sparkles" style="color:#217346"></iconify-icon>
          Tambah Peluang Bisnis (Opportunity)
        </h3>
        <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
      `;

      const form = document.createElement("form");
      form.innerHTML = `
        <div class="sop-modal-body">
          <div class="sop-form-group">
            <label class="sop-form-label">Pelanggan / Klien <span class="sop-form-req">*</span></label>
            <select name="customer_id" required class="sop-form-select">
              <option value="">-- Pilih Pelanggan --</option>
              ${options.customers.map((c) => `<option value="${c.id}">${c.code ? c.code + " — " : ""}${c.name}</option>`).join("")}
            </select>
          </div>

          <div class="sop-form-group">
            <label class="sop-form-label">Nama Peluang (Opportunity) <span class="sop-form-req">*</span></label>
            <input type="text" name="name" required placeholder="Contoh: Digitalisasi ERP PT Nusantara" class="sop-form-input">
          </div>

          <div class="sop-form-row">
            <div class="sop-form-group">
              <label class="sop-form-label">Estimasi Nilai (Rp) <span class="sop-form-req">*</span></label>
              <input type="number" name="amount" required min="0" step="1000" placeholder="150000000" class="sop-form-input">
            </div>
            <div class="sop-form-group">
              <label class="sop-form-label">Probabilitas (0–100%) <span class="sop-form-req">*</span></label>
              <input type="number" name="probability" required min="0" max="100" value="50" class="sop-form-input">
            </div>
          </div>

          <div class="sop-form-row">
            <div class="sop-form-group">
              <label class="sop-form-label">Tahapan (Stage)</label>
              <select name="stage" class="sop-form-select">
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="proposal" selected>Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div class="sop-form-group">
              <label class="sop-form-label">Penanggung Jawab (PIC)</label>
              <select name="owner_id" class="sop-form-select">
                <option value="">-- Tanpa PIC --</option>
                ${options.owners.map((o) => `<option value="${o.id}">${o.name}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>

        <div class="sop-modal-footer">
          <button type="button" class="sop-btn sop-btn-secondary cancel-btn">Batal</button>
          <button type="submit" class="sop-btn sop-btn-primary">Simpan Opportunity</button>
        </div>
      `;

      card.append(header, form);
      overlay.append(card);
      document.body.append(overlay);

      const close = (
        val: {
          customer_id: string;
          name: string;
          amount: string;
          probability: number;
          stage: string;
          owner_id?: string;
        } | null,
      ) => {
        overlay.remove();
        document.removeEventListener("keydown", onEsc);
        resolve(val);
      };

      const onEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") close(null);
      };
      document.addEventListener("keydown", onEsc);

      header
        .querySelector(".close-btn")
        ?.addEventListener("click", () => close(null));
      form
        .querySelector(".cancel-btn")
        ?.addEventListener("click", () => close(null));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(null);
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const customer_id = String(fd.get("customer_id") || "");
        const name = String(fd.get("name") || "").trim();
        const amount = String(fd.get("amount") || "").trim();
        const probability = Number(fd.get("probability") || 0);
        const stage = String(fd.get("stage") || "new");
        const owner_id = String(fd.get("owner_id") || "") || undefined;

        if (!customer_id) {
          window.alert("Silakan pilih pelanggan.");
          return;
        }
        if (!name) {
          window.alert("Nama opportunity tidak boleh kosong.");
          return;
        }
        close({ customer_id, name, amount, probability, stage, owner_id });
      });
    });
  }

  private showTenderModal(): Promise<{
    name: string;
    client: string;
    value: number;
    deadline: string | null;
    bid: string;
    status: string;
  } | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sop-modal-overlay";

      const card = document.createElement("div");
      card.className = "sop-modal-card";

      const header = document.createElement("div");
      header.className = "sop-modal-header";
      header.innerHTML = `
        <h3 class="sop-modal-title">
          <iconify-icon noobserver icon="lucide:file-signature" style="color:#217346"></iconify-icon>
          Tambah Tender & Bidding
        </h3>
        <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
      `;

      const form = document.createElement("form");
      form.innerHTML = `
        <div class="sop-modal-body">
          <div class="sop-form-group">
            <label class="sop-form-label">Nama Tender / Proyek Pengadaan <span class="sop-form-req">*</span></label>
            <input type="text" name="name" required placeholder="Contoh: Pengadaan Infrastruktur Server Cloud" class="sop-form-input">
          </div>

          <div class="sop-form-group">
            <label class="sop-form-label">Instansi / Klien Pemilik Tender <span class="sop-form-req">*</span></label>
            <input type="text" name="client" required placeholder="Contoh: Kementerian Komunikasi dan Digital" class="sop-form-input">
          </div>

          <div class="sop-form-row">
            <div class="sop-form-group">
              <label class="sop-form-label">Estimasi Nilai (Juta Rp) <span class="sop-form-req">*</span></label>
              <input type="number" name="valJt" required min="1" step="1" value="1000" class="sop-form-input">
            </div>
            <div class="sop-form-group">
              <label class="sop-form-label">Batas Waktu (Deadline)</label>
              <input type="date" name="deadline" value="${new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)}" class="sop-form-input">
            </div>
          </div>

          <div class="sop-form-group">
            <label class="sop-form-label">Status Keputusan Bidding</label>
            <select name="bid" class="sop-form-select">
              <option value="Bid" selected>Bid (Ikuti Tender)</option>
              <option value="Pending">Pending (Evaluasi)</option>
              <option value="No-bid">No-bid (Lewatkan)</option>
            </select>
          </div>
        </div>

        <div class="sop-modal-footer">
          <button type="button" class="sop-btn sop-btn-secondary cancel-btn">Batal</button>
          <button type="submit" class="sop-btn sop-btn-primary">Simpan Tender</button>
        </div>
      `;

      card.append(header, form);
      overlay.append(card);
      document.body.append(overlay);

      const close = (
        val: {
          name: string;
          client: string;
          value: number;
          deadline: string | null;
          bid: string;
          status: string;
        } | null,
      ) => {
        overlay.remove();
        document.removeEventListener("keydown", onEsc);
        resolve(val);
      };

      const onEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") close(null);
      };
      document.addEventListener("keydown", onEsc);

      header
        .querySelector(".close-btn")
        ?.addEventListener("click", () => close(null));
      form
        .querySelector(".cancel-btn")
        ?.addEventListener("click", () => close(null));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(null);
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const name = String(fd.get("name") || "").trim();
        const client = String(fd.get("client") || "").trim();
        const valJt = Number(fd.get("valJt") || 0);
        const deadline = String(fd.get("deadline") || "") || null;
        const bid = String(fd.get("bid") || "Pending");

        if (!name || !client) {
          window.alert("Nama tender dan instansi wajib diisi.");
          return;
        }
        close({
          name,
          client,
          value: valJt * 1_000_000,
          deadline,
          bid,
          status: "Open",
        });
      });
    });
  }

  private showProposalModal(): Promise<{
    name: string;
    client: string;
    template: string;
    version: string;
    status: string;
    value: number;
  } | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sop-modal-overlay";

      const card = document.createElement("div");
      card.className = "sop-modal-card";

      const header = document.createElement("div");
      header.className = "sop-modal-header";
      header.innerHTML = `
        <h3 class="sop-modal-title">
          <iconify-icon noobserver icon="lucide:file-text" style="color:#217346"></iconify-icon>
          Buat Proposal Penawaran
        </h3>
        <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
      `;

      const form = document.createElement("form");
      form.innerHTML = `
        <div class="sop-modal-body">
          <div class="sop-form-group">
            <label class="sop-form-label">Judul Proposal <span class="sop-form-req">*</span></label>
            <input type="text" name="name" required placeholder="Contoh: Proposal Implementasi ERP Komprehensif" class="sop-form-input">
          </div>

          <div class="sop-form-group">
            <label class="sop-form-label">Klien / Calon Pembeli <span class="sop-form-req">*</span></label>
            <input type="text" name="client" required placeholder="Contoh: PT Telaga Biru" class="sop-form-input">
          </div>

          <div class="sop-form-row">
            <div class="sop-form-group">
              <label class="sop-form-label">Format Template</label>
              <select name="template" class="sop-form-select">
                <option value="ERP Proposal" selected>ERP Proposal</option>
                <option value="Tender Proposal">Tender Proposal</option>
                <option value="Partnership Proposal">Partnership Proposal</option>
              </select>
            </div>
            <div class="sop-form-group">
              <label class="sop-form-label">Nilai Penawaran (Juta Rp)</label>
              <input type="number" name="valJt" required min="1" step="1" value="500" class="sop-form-input">
            </div>
          </div>
        </div>

        <div class="sop-modal-footer">
          <button type="button" class="sop-btn sop-btn-secondary cancel-btn">Batal</button>
          <button type="submit" class="sop-btn sop-btn-primary">Simpan Proposal</button>
        </div>
      `;

      card.append(header, form);
      overlay.append(card);
      document.body.append(overlay);

      const close = (
        val: {
          name: string;
          client: string;
          template: string;
          version: string;
          status: string;
          value: number;
        } | null,
      ) => {
        overlay.remove();
        document.removeEventListener("keydown", onEsc);
        resolve(val);
      };

      const onEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") close(null);
      };
      document.addEventListener("keydown", onEsc);

      header
        .querySelector(".close-btn")
        ?.addEventListener("click", () => close(null));
      form
        .querySelector(".cancel-btn")
        ?.addEventListener("click", () => close(null));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(null);
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const name = String(fd.get("name") || "").trim();
        const client = String(fd.get("client") || "").trim();
        const template = String(fd.get("template") || "ERP Proposal");
        const valJt = Number(fd.get("valJt") || 0);

        if (!name || !client) {
          window.alert("Judul proposal dan klien wajib diisi.");
          return;
        }
        close({
          name,
          client,
          template,
          version: "v1",
          status: "Draft",
          value: valJt * 1_000_000,
        });
      });
    });
  }
}
