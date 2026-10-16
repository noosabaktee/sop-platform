import { api } from "./client";
import type { GridBridge } from "./gridBridge";
import { showSelectModal } from "./modalHelper";

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
        this.observer = new MutationObserver(() => this.hydrateSelects());
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

    const action = target.closest<HTMLElement>(
      '[data-qt-act="savedraft"],[data-qt-act="submit"],[data-qt-act="resetbuilder"]',
    );
    if (action) {
      if (action.dataset.qtAct === "resetbuilder") {
        this.currentId = null;
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
      event.preventDefault();
      event.stopImmediatePropagation();
      void this.handleRowAction(quoteId);
      return;
    }
  };

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
  }
}
