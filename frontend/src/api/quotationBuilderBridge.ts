import { api } from "./client";
import type { GridBridge } from "./gridBridge";
import { showSelectModal, showQuotationModal } from "./modalHelper";

type Option = { id: string; name: string; code?: string };
type Options = { customers: Option[]; owners: Option[]; products: Option[] };
type Quote = {
  id: string;
  number: string;
  customer: string;
  owner: string;
  valid_until: string | null;
  total: string;
  status: string;
};
type SavedQuote = { id: string; number: string };

const titles: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  sent: "Sent",
  negotiation: "Negotiation",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Revisi",
  expired: "Expired",
};
const money = (value: string) =>
  "Rp " +
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    Number(value),
  );

/** Functional quotation builder using the approved prototype DOM, not a replacement UI. */
export class QuotationBuilderBridge {
  private options: Options | null = null;
  private currentId: string | null = null;
  private cachedQuotes: Quote[] = [];
  private active = false;
  private saving = false;
  private observer: MutationObserver | null = null;
  constructor(private readonly grid: GridBridge) {}
  async install() {
    // Register immediately: a fast click must never fall through to the mock toast.
    this.active = true;
    document.addEventListener("click", this.onClick, true);
    window.addEventListener("sop:workflow-updated", this.onWorkflow);
    try {
      const { data } = await api.get("/api/v1/quotation-builder/options");
      this.options = data.data as Options;
      this.hydrateSelects();
      const root = document.querySelector<HTMLElement>(
        '[data-page-id="quotation"]',
      );
      if (root) {
        this.observer = new MutationObserver(() => {
          this.hydrateSelects();
          this.enhanceQuotationTables();
        });
        this.observer.observe(root, { subtree: true, childList: true });
      }
      await this.refreshList();
    } catch (error) {
      console.error("Quotation API belum tersedia:", error);
    }
  }
  uninstall() {
    this.active = false;
    this.observer?.disconnect();
    document.removeEventListener("click", this.onClick, true);
    window.removeEventListener("sop:workflow-updated", this.onWorkflow);
  }
  private replaceOptions(select: HTMLSelectElement, opts: Option[]) {
    if (!opts.length) return;
    const signature = opts.map((o) => o.id).join("|");
    if (select.dataset.dbOptions === signature) return;
    const previous = select.value;
    const previousName = select.selectedOptions[0]?.textContent?.trim();
    select.replaceChildren(
      ...opts.map((o) => {
        const item = document.createElement("option");
        item.value = o.id;
        item.textContent = o.name;
        return item;
      }),
    );
    const matched = opts.find(
      (o) => o.id === previous || o.name === previousName,
    );
    if (matched) select.value = matched.id;
    select.dataset.dbOptions = signature;
  }
  private hydrateSelects() {
    if (!this.options) return;
    const root = document.querySelector<HTMLElement>(
      '[data-page-id="quotation"]',
    );
    if (!root) return;
    const customer = root.querySelector<HTMLSelectElement>(
      '[data-qt-field="customer"]',
    );
    const owner = root.querySelector<HTMLSelectElement>(
      '[data-qt-field="owner"]',
    );
    if (customer) this.replaceOptions(customer, this.options.customers);
    if (owner) this.replaceOptions(owner, this.options.owners);
  }
  private inform(message: string, error = false) {
    const element = document.querySelector<HTMLElement>(
      '[data-page-id="quotation"] .toast',
    );
    if (element) {
      element.textContent = message;
      element.hidden = false;
      window.setTimeout(() => {
        element.hidden = true;
      }, 5000);
    }
    if (error) console.error(message);
  }
  private readonly onWorkflow = () => {
    void this.refreshList().catch(console.error);
  };
  private readonly onClick = (event: MouseEvent) => {
    if (!this.active) return;
    const target = event.target as HTMLElement;
    const root = target.closest<HTMLElement>('[data-page-id="quotation"]');
    if (!root) return;

    // 1. Intercept Header "Buat quotation" or Grid "+ Tambah" button to open modal
    const addBtn = target.closest<HTMLElement>(
      '[data-action="q:new"], [data-qt-act="add"]',
    );
    if (addBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void this.openCreateModal();
      return;
    }

    // 2. Intercept dummy spreadsheet buttons
    const dummyBtn = target.closest<HTMLElement>(
      '[data-qt-act="commit"], [data-qt-act="discard"], [data-qt-act="import"], [data-qt-act="assign"], [data-qt-act="delete"]',
    );
    if (dummyBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.inform(
        "Tabel quotation adalah pencatatan resmi. Gunakan tombol 'Tambah Quotation' atau 'Edit'/'Aksi'.",
      );
      return;
    }

    const action = target.closest<HTMLElement>(
      '[data-qt-act="savedraft"],[data-qt-act="submit"],[data-qt-act="resetbuilder"]',
    );
    if (action) {
      if (action.dataset.qtAct === "resetbuilder") {
        this.currentId = null;
        const noteEl = root.querySelector<HTMLElement>(".qt-builder-note");
        if (noteEl) {
          noteEl.textContent = "Draft · numbering otomatis per company/branch/periode";
          noteEl.style.color = "";
        }
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (this.saving) return;
      const submit = action.dataset.qtAct === "submit";
      void this.save(submit, action as HTMLButtonElement);
      return;
    }

    const rowEl = target.closest<HTMLElement>("[data-qt-id]");
    const id = rowEl?.dataset.qtId || "";
    if (id.startsWith("q-domain-")) {
      const quoteId = id.replace("q-domain-", "");
      if (target.closest('[data-qt-act="delrow"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.inform(
          "Dokumen penawaran resmi telah terbit dan terkunci demi kepatuhan audit.",
        );
        return;
      }
      if (target.closest('[data-qt-act="editdraft"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void this.openEditModal(quoteId);
        return;
      }
      if (target.closest('[data-qt-act="rowaction"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void this.handleRowAction(quoteId);
        return;
      }
      // If user clicks anywhere on a read-only cell, gently inform without intrusive modal
      if (target.closest(".qt-cell")) {
        this.inform(
          "Tabel quotation adalah pencatatan resmi. Gunakan tombol 'Aksi' atau 'Edit' di sebelah kanan untuk memproses.",
        );
        return;
      }
      return;
    }
  };

  async openCreateModal() {
    if (!this.options) {
      try {
        const { data } = await api.get("/api/v1/quotation-builder/options");
        this.options = data.data as Options;
      } catch (err) {
        this.inform("Gagal memuat opsi master data quotation.", true);
        return;
      }
    }
    const result = await showQuotationModal({
      isEdit: false,
      options: this.options,
    });
    if (!result) return;

    document.body.classList.add("sop-api-busy");
    try {
      const createRes = await api.post(
        "/api/v1/quotation-builder/draft",
        result.payload,
      );
      const saved = createRes.data.data as SavedQuote;
      if (result.submit) {
        await api.post(`/api/v1/workflows/quotations/${saved.id}/submit`, {});
      }
      await this.refreshList();
      this.inform(
        `${saved.number} berhasil ${result.submit ? "dikirim untuk persetujuan" : "disimpan sebagai draft"}.`,
      );
      window.dispatchEvent(new Event("sop:workflow-updated"));
      window.dispatchEvent(new Event("sop:domain-updated"));
    } catch (error) {
      const response = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const first = Object.values(
        response.response?.data?.errors || {},
      )[0]?.[0];
      this.inform(
        first || response.response?.data?.message || String(error),
        true,
      );
    } finally {
      document.body.classList.remove("sop-api-busy");
    }
  }

  async openEditModal(quoteId: string) {
    if (!this.options) {
      try {
        const { data } = await api.get("/api/v1/quotation-builder/options");
        this.options = data.data as Options;
      } catch (err) {
        this.inform("Gagal memuat opsi master data quotation.", true);
        return;
      }
    }

    document.body.classList.add("sop-api-busy");
    try {
      const res = await api.get(`/api/v1/quotation-builder/${quoteId}`);
      const data = res.data.data as {
        quotation: {
          id: string;
          number: string;
          customer_id: string;
          owner_id: string | null;
          contact_name: string | null;
          currency: string;
          payment_terms: string | null;
          valid_until: string | null;
          tax_percent: number;
          discount_percent: number;
        };
        items: Array<{
          description: string;
          quantity: number | string;
          unit_price: string;
          line_total: string;
        }>;
      };

      const q = data.quotation;
      const initialData = {
        id: q.id,
        number: q.number,
        customer_id: q.customer_id,
        owner_id: q.owner_id || "",
        contact_name: q.contact_name || "",
        currency: q.currency || "IDR",
        payment_terms: q.payment_terms || "NET 30",
        valid_until: q.valid_until ? q.valid_until.slice(0, 10) : "",
        tax_percent: Number(q.tax_percent ?? 11),
        discount_percent: Number(q.discount_percent ?? 0),
        items: data.items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
        })),
      };

      document.body.classList.remove("sop-api-busy");
      const result = await showQuotationModal({
        isEdit: true,
        initialData,
        options: this.options,
      });
      if (!result) return;

      document.body.classList.add("sop-api-busy");
      const saveRes = await api.post(
        "/api/v1/quotation-builder/draft",
        result.payload,
      );
      const saved = saveRes.data.data as SavedQuote;
      if (result.submit) {
        await api.post(`/api/v1/workflows/quotations/${saved.id}/submit`, {});
      }
      await this.refreshList();
      this.inform(
        `${saved.number} berhasil diperbarui ${result.submit ? "dan diajukan untuk persetujuan" : "sebagai draft"}.`,
      );
      window.dispatchEvent(new Event("sop:workflow-updated"));
      window.dispatchEvent(new Event("sop:domain-updated"));
    } catch (error) {
      const response = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const first = Object.values(
        response.response?.data?.errors || {},
      )[0]?.[0];
      this.inform(
        first || response.response?.data?.message || String(error),
        true,
      );
    } finally {
      document.body.classList.remove("sop-api-busy");
    }
  }

  private async loadDraftIntoBuilder(quoteId: string) {
    document.body.classList.add("sop-api-busy");
    try {
      const res = await api.get(`/api/v1/quotation-builder/${quoteId}`);
      const data = res.data.data as {
        quotation: {
          id: string;
          number: string;
          customer_id: string;
          owner_id: string | null;
          contact_name: string | null;
          currency: string;
          payment_terms: string | null;
          valid_until: string | null;
          tax_percent: number;
          discount_percent: number;
        };
        items: Array<{
          description: string;
          quantity: number | string;
          unit_price: string;
          line_total: string;
        }>;
      };

      const q = data.quotation;
      this.currentId = q.id;

      const root = document.querySelector<HTMLElement>(
        '[data-page-id="quotation"]',
      );
      if (!root) return;

      const createTab = root.querySelector<HTMLButtonElement>(
        '[data-action="dash:tab"][data-panel="create"]',
      );
      if (createTab) {
        createTab.click();
      }

      this.hydrateSelects();

      const setField = (name: string, val: string | null | undefined) => {
        const el = root.querySelector<HTMLInputElement | HTMLSelectElement>(
          `[data-qt-field="${name}"]`,
        );
        if (el && val != null) el.value = val;
      };

      setField("customer", q.customer_id);
      setField("owner", q.owner_id || "");
      setField("contact", q.contact_name || "");
      setField("currency", q.currency || "IDR");
      setField("terms", q.payment_terms || "NET 30");
      setField("validUntil", q.valid_until ? q.valid_until.slice(0, 10) : "");

      const taxInput = root.querySelector<HTMLInputElement>(
        '[data-qt-sum="tax"]',
      );
      if (taxInput) taxInput.value = String(q.tax_percent ?? 11);
      const discountInput = root.querySelector<HTMLInputElement>(
        '[data-qt-sum="discount"]',
      );
      if (discountInput) discountInput.value = String(q.discount_percent ?? 0);

      const linesWrap = root.querySelector<HTMLElement>("[data-qt-lines]");
      if (linesWrap && data.items.length) {
        const lines = data.items.map((it) => ({
          name: it.description,
          qty: Number(it.quantity) || 1,
          price: Math.round(Number(it.unit_price) / 1000000),
          total: Number(it.line_total),
        }));

        linesWrap.innerHTML = `
          <table class="qt-lines-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Qty</th>
                <th scope="col">Harga (jt)</th>
                <th scope="col">Subtotal</th>
                <th scope="col" aria-label="Aksi"></th>
              </tr>
            </thead>
            <tbody>
              ${lines
                .map(
                  (l, i) => `
                <tr>
                  <td>${l.name}</td>
                  <td><input type="number" min="1" value="${l.qty}" data-qt-line="${i}" data-qt-key="qty" aria-label="Qty ${l.name}"></td>
                  <td><input type="number" min="0" value="${l.price}" data-qt-line="${i}" data-qt-key="price" aria-label="Harga ${l.name}"></td>
                  <td class="qt-subtotal">Rp ${(l.qty * l.price).toLocaleString("id-ID")} jt</td>
                  <td><button type="button" class="qt-rowbtn danger" data-qt-act="delline" data-qt-line="${i}" aria-label="Hapus item"><iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon></button></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `;
      }

      const sum = root.querySelector<HTMLElement>("[data-qt-summary]");
      if (sum && data.items.length) {
        const subtotal = data.items.reduce(
          (acc, it) =>
            acc +
            (Number(it.quantity) || 1) *
              Math.round(Number(it.unit_price) / 1000000),
          0,
        );
        const discountVal = subtotal * ((q.discount_percent ?? 0) / 100);
        const taxVal =
          (subtotal - discountVal) * ((q.tax_percent ?? 11) / 100);
        const grandTotal = subtotal - discountVal + taxVal;
        const fmtMoney = (v: number) =>
          "Rp " + Math.round(v).toLocaleString("id-ID");
        sum.innerHTML = `
          <div class="qt-sum-row"><span>Subtotal</span><strong>${fmtMoney(subtotal * 1000000)}</strong></div>
          <div class="qt-sum-row"><span>Diskon <input type="number" min="0" max="100" value="${q.discount_percent ?? 0}" data-qt-sum="discount" aria-label="Diskon %">%</span><strong>-${fmtMoney(discountVal * 1000000)}</strong></div>
          <div class="qt-sum-row"><span>Tax (PPN) <input type="number" min="0" max="100" value="${q.tax_percent ?? 11}" data-qt-sum="tax" aria-label="Tax %">%</span><strong>${fmtMoney(taxVal * 1000000)}</strong></div>
          <div class="qt-sum-row qt-sum-row--total"><span>Grand total</span><strong>${fmtMoney(grandTotal * 1000000)}</strong></div>
        `;
      }

      const noteEl = root.querySelector<HTMLElement>(".qt-builder-note");
      if (noteEl) {
        noteEl.innerHTML = `<strong>Mengedit Draft: ${q.number}</strong> · Perbarui item lalu klik 'Simpan draft' atau 'Submit for approval'`;
        noteEl.style.color = "#047857";
      }

      const builderSection = root.querySelector<HTMLElement>(".qt-builder");
      builderSection?.scrollIntoView({ block: "start", behavior: "smooth" });

      this.inform(`Draft quotation ${q.number} dimuat ke form builder.`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      this.inform(
        e.response?.data?.message || "Gagal memuat draft quotation.",
        true,
      );
    } finally {
      document.body.classList.remove("sop-api-busy");
    }
  }

  private async handleRowAction(quoteId: string) {
    try {
      const res = await api.get(`/api/v1/quotation-builder/${quoteId}`);
      const data = res.data.data as {
        quotation: {
          number: string;
          status: string;
          customer_name: string;
          total: string;
        };
        items: Array<{
          description: string;
          quantity: string;
          line_total: string;
        }>;
      };
      const q = data.quotation;
      const formattedTotal = new Intl.NumberFormat("id-ID").format(
        Number(q.total),
      );
      const statusTitle = titles[q.status] || q.status;

      const actionOptions = [
        {
          value: "1",
          label: "Buka / Cetak Dokumen PDF Resmi",
          description:
            "Buka tampilan cetak PDF quotation dengan kop surat dan tanda tangan.",
          badge: "PDF",
        },
        {
          value: "2",
          label: "Buat Draft Revisi Baru",
          description:
            "Duplikasi dan buat nomor versi revisi baru dari penawaran ini.",
          badge: "Revisi",
        },
      ];

      if (q.status === "approved") {
        actionOptions.push({
          value: "3",
          label: "Konversi Menjadi Sales Order",
          description:
            "Proses quotation yang telah disetujui menjadi pesanan penjualan resmi.",
          badge: "Sales Order",
        });
      } else if (["draft", "revision_requested"].includes(q.status)) {
        actionOptions.push({
          value: "3",
          label: "Kirim Dokumen untuk Approval",
          description:
            "Kirimkan draf penawaran harga ini ke atasan untuk disetujui.",
          badge: "Approval",
        });
      }

      const choice = await showSelectModal({
        title: `Aksi Penawaran: ${q.number}`,
        icon: "lucide:file-text",
        subtitle: `Pelanggan: ${q.customer_name} · Total: Rp ${formattedTotal} · Status: ${statusTitle}`,
        options: actionOptions,
        submitText: "Jalankan Aksi",
        defaultValue: "1",
      });

      if (choice === null) return;
      if (choice.trim() === "1") {
        window.open(`/api/v1/quotation-builder/${quoteId}/document`, "_blank");
        this.inform(`Membuka dokumen cetak PDF untuk ${q.number}.`);
        return;
      }
      if (choice.trim() === "2") {
        const revised = await api.post(
          `/api/v1/quotation-builder/${quoteId}/revise`,
        );
        await this.refreshList();
        this.inform(revised.data.message || "Draft revisi berhasil dibuat.");
        window.dispatchEvent(new Event("sop:workflow-updated"));
        return;
      }
      if (choice.trim() === "3") {
        if (q.status === "approved") {
          await api.post(`/api/v1/workflows/quotations/${quoteId}/convert`);
          this.inform(`Quotation ${q.number} dikonversi menjadi Sales Order.`);
          window.dispatchEvent(new Event("sop:domain-updated"));
          return;
        }
        if (["draft", "revision_requested"].includes(q.status)) {
          await api.post(`/api/v1/workflows/quotations/${quoteId}/submit`);
          await this.refreshList();
          this.inform(`Quotation ${q.number} dikirim untuk approval.`);
          window.dispatchEvent(new Event("sop:workflow-updated"));
          return;
        }
      }
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      this.inform(
        e.response?.data?.message || "Gagal memproses aksi quotation.",
        true,
      );
    }
  }
  private getPayload() {
    this.hydrateSelects();
    const root = document.querySelector<HTMLElement>(
      '[data-page-id="quotation"]',
    );
    if (!root || !this.options)
      throw new Error("Pilihan quotation belum dimuat dari database.");
    const field = (name: string) =>
      root.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-qt-field="${name}"]`,
      )?.value || "";
    const percent = (name: string) =>
      Number(
        root.querySelector<HTMLInputElement>(`[data-qt-sum="${name}"]`)
          ?.value || 0,
      );
    const normalize = (value: string) =>
      value.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
    const products = new Map<string, string>();
    for (const product of this.options.products) {
      products.set(normalize(product.name), product.id);
      if (product.code?.trim())
        products.set(normalize(product.code), product.id);
    }
    const lines = [
      ...root.querySelectorAll<HTMLTableRowElement>("[data-qt-lines] tbody tr"),
    ].map((tr) => {
      const qty = Number(
        tr.querySelector<HTMLInputElement>('[data-qt-key="qty"]')?.value,
      );
      const priceMillions = Number(
        tr.querySelector<HTMLInputElement>('[data-qt-key="price"]')?.value,
      );
      const description = tr.querySelector("td")?.textContent?.trim() || "";
      return {
        description,
        product_id: products.get(normalize(description)),
        quantity: qty,
        unit_price: Math.round(priceMillions * 1000000).toFixed(2),
      };
    });
    if (!lines.length)
      throw new Error("Quotation harus memiliki minimal satu item.");
    if (
      lines.some(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          !Number.isFinite(Number(item.unit_price)) ||
          Number(item.unit_price) < 0,
      )
    )
      throw new Error("Periksa kembali kuantitas dan harga quotation.");
    const customer = field("customer");
    if (!this.options.customers.some((x) => x.id === customer))
      throw new Error("Pilih customer dari database perusahaan.");
    const tax = percent("tax"),
      discount = percent("discount");
    if (
      !Number.isInteger(tax) ||
      !Number.isInteger(discount) ||
      tax < 0 ||
      tax > 100 ||
      discount < 0 ||
      discount > 100
    )
      throw new Error("Pajak dan diskon harus berupa persentase bulat 0–100.");
    return {
      id: this.currentId,
      customer_id: customer,
      owner_id: field("owner") || undefined,
      contact_name: field("contact"),
      payment_terms: field("terms"),
      currency: field("currency"),
      valid_until: field("validUntil"),
      tax_percent: tax,
      discount_percent: discount,
      items: lines,
    };
  }
  private async save(submit: boolean, button: HTMLButtonElement) {
    this.saving = true;
    button.disabled = true;
    document.body.classList.add("sop-api-busy");
    try {
      const payload = this.getPayload();
      const result = await api.post("/api/v1/quotation-builder/draft", payload);
      const saved = result.data.data as SavedQuote;
      this.currentId = saved.id;
      if (submit) {
        await api.post(`/api/v1/workflows/quotations/${saved.id}/submit`, {});
        this.currentId = null;
      }
      await this.refreshList();
      this.inform(
        `${saved.number} berhasil ${submit ? "dikirim untuk persetujuan" : "disimpan sebagai draft"}.`,
      );
    } catch (error) {
      const response = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const first = Object.values(
        response.response?.data?.errors || {},
      )[0]?.[0];
      this.inform(
        first || response.response?.data?.message || String(error),
        true,
      );
    } finally {
      button.disabled = false;
      this.saving = false;
      document.body.classList.remove("sop-api-busy");
    }
  }
  async refreshList() {
    if (!this.active) return;
    const { data } = await api.get("/api/v1/quotation-builder/list");
    const quotes = data.data as Quote[];
    this.cachedQuotes = quotes;
    const toRow = (q: Quote) => ({
      __id: "q-domain-" + q.id,
      number: q.number,
      customer: q.customer,
      owner: q.owner,
      validUntil: q.valid_until || "",
      total: money(q.total),
      status: titles[q.status] || q.status,
    });
    this.grid.mergeDomainRows(
      "/quotation",
      "list",
      "q-domain-",
      quotes.map(toRow),
    );
    for (const [panel, status] of Object.entries({
      draft: "draft",
      pending: "pending_approval",
      sent: "sent",
      negotiation: "negotiation",
      approved: "approved",
      rejected: "rejected",
      expired: "expired",
    })) {
      this.grid.mergeDomainRows(
        "/quotation",
        panel,
        "q-domain-",
        quotes
          .filter(
            (q) =>
              q.status === status ||
              (status === "rejected" && q.status === "revision_requested"),
          )
          .map(toRow),
      );
    }
    this.enhanceQuotationTables(quotes);
  }

  private enhanceQuotationTables(quotes?: Quote[]) {
    const list = quotes || this.cachedQuotes;
    if (!list.length) return;
    const root = document.querySelector<HTMLElement>(
      '[data-page-id="quotation"]',
    );
    if (!root) return;

    const panels = root.querySelectorAll<HTMLElement>("[data-qt-panel]");
    panels.forEach((panel) => {
      panel.dataset.domainLocked = "true";

      let banner = panel.querySelector<HTMLElement>(".sop-context-banner");
      if (!banner) {
        banner = document.createElement("div");
        banner.className = "sop-context-banner tone-blue";
        banner.innerHTML = `
          <div class="sop-context-icon" aria-hidden="true">
            <iconify-icon noobserver icon="lucide:file-check"></iconify-icon>
          </div>
          <div class="sop-context-body">
            <div class="sop-context-head">
              <h3 class="sop-context-title">Pencatatan Resmi Penawaran Harga (Quotation)</h3>
              <span class="sop-context-badge">Audit Terverifikasi</span>
            </div>
            <p class="sop-context-desc">Tabel ini menyajikan dokumen penawaran harga resmi perusahaan yang terhubung langsung dengan basis data sistem.</p>
            <div class="sop-context-flow">
              <strong>Alur resmi:</strong> Klik tombol <strong>Tambah Quotation</strong> untuk membuat penawaran harga baru melalui formulir resmi. Untuk quotation berstatus <em>Draft</em>, klik tombol <strong>Edit</strong> untuk memperbarui data item/harga via dialog modal. Untuk quotation yang telah disetujui (<em>Approved</em>), klik tombol <strong>Aksi</strong> untuk mencetak PDF, membuat revisi baru, atau konversi menjadi Sales Order.
            </div>
          </div>
        `;
        const toolbar = panel.querySelector<HTMLElement>("[data-qt-toolbar]");
        const tableWrap = panel.querySelector<HTMLElement>(
          "[data-qt-tablewrap]",
        );
        const target = toolbar || tableWrap;
        if (target && target.parentElement) {
          target.parentElement.insertBefore(banner, target);
        } else {
          panel.prepend(banner);
        }
      }

      const addBtn = panel.querySelector<HTMLButtonElement>('[data-qt-act="add"]');
      if (addBtn && !addBtn.dataset.enhanced) {
        addBtn.dataset.enhanced = "true";
        addBtn.innerHTML =
          '<iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon> Tambah Quotation';
        addBtn.title = "Buat quotation baru via formulir modal resmi";
      }

      panel.querySelectorAll<HTMLInputElement>(".qt-cell").forEach((input) => {
        input.readOnly = true;
        input.tabIndex = -1;
        input.setAttribute(
          "title",
          "Terkunci: Data resmi tersimpan di database.",
        );
      });

      panel.querySelectorAll<HTMLTableRowElement>("tr").forEach((tr) => {
        const idEl = tr.querySelector<HTMLElement>("[data-qt-id]");
        const id = idEl?.dataset.qtId || "";
        if (!id.startsWith("q-domain-")) return;
        const quoteId = id.replace("q-domain-", "");
        const quote = list.find((q) => q.id === quoteId);
        if (!quote) return;

        const actionsCell = tr.querySelector<HTMLTableCellElement>(
          ".qt-actions",
        );
        if (!actionsCell) return;
        if (actionsCell.dataset.enhanced === id) return;
        actionsCell.dataset.enhanced = id;

        const isDraft = ["draft", "revision_requested"].includes(quote.status);
        if (isDraft) {
          actionsCell.innerHTML = `
            <div style="display:inline-flex;align-items:center;gap:4px">
              <button type="button" class="qt-rowbtn" data-qt-act="editdraft" data-qt-id="${id}" style="padding:4px 8px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;background:#217346;color:#ffffff;border-radius:4px" title="Buka dialog formulir untuk mengedit draft quotation ini">
                <iconify-icon noobserver icon="lucide:pencil"></iconify-icon> Edit
              </button>
              <button type="button" class="qt-rowbtn" data-qt-act="rowaction" data-qt-id="${id}" style="padding:4px 8px;font-size:11px;font-weight:500;display:inline-flex;align-items:center;gap:4px;border:1px solid #cbd5e1;border-radius:4px;background:#f8fafc" title="Menu opsi & alur penawaran">
                <iconify-icon noobserver icon="lucide:more-horizontal"></iconify-icon> Aksi
              </button>
            </div>
          `;
        } else {
          actionsCell.innerHTML = `
            <button type="button" class="qt-rowbtn" data-qt-act="rowaction" data-qt-id="${id}" style="padding:4px 9px;font-size:11px;font-weight:500;display:inline-flex;align-items:center;gap:4px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:4px" title="Buka PDF, Buat Revisi, atau Konversi">
              <iconify-icon noobserver icon="lucide:file-text"></iconify-icon> Aksi
            </button>
          `;
        }
      });
    });
  }
}
