/**
 * Standard Modern Modal System for SOP Applications
 * Provides user-friendly, beautifully styled modal dialogs
 * replacing outdated browser window.prompt() and window.confirm().
 */

export interface FormFieldOption {
  value: string | number;
  label: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  value?: string | number;
  options?: FormFieldOption[];
  min?: number;
  max?: number;
  step?: number | string;
  halfWidth?: boolean;
  helpText?: string;
  readOnly?: boolean;
}

export interface FormModalOptions {
  title: string;
  icon?: string;
  iconColor?: string;
  subtitle?: string;
  fields: FormFieldConfig[];
  submitText?: string;
  cancelText?: string;
  large?: boolean;
}

export interface SelectOptionItem {
  value: string;
  label: string;
  description?: string;
  badge?: string;
}

export interface SelectModalOptions {
  title: string;
  icon?: string;
  iconColor?: string;
  subtitle?: string;
  options: SelectOptionItem[];
  submitText?: string;
  cancelText?: string;
  defaultValue?: string;
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

/**
 * Display a multi-field structured modal form
 */
export function showFormModal<T = Record<string, any>>(
  options: FormModalOptions,
): Promise<T | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "sop-modal-overlay";

    const card = document.createElement("div");
    card.className = `sop-modal-card ${options.large ? "sop-modal-card-lg" : ""}`;

    const icon = options.icon || "lucide:file-edit";
    const iconColor = options.iconColor || "#217346";

    const header = document.createElement("div");
    header.className = "sop-modal-header";
    header.innerHTML = `
      <h3 class="sop-modal-title">
        <iconify-icon noobserver icon="${icon}" style="color:${iconColor}"></iconify-icon>
        ${escapeHtml(options.title)}
      </h3>
      <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
    `;

    const form = document.createElement("form");

    // Group fields into rows if halfWidth is true
    let fieldsHtml = "";
    let inRow = false;

    options.fields.forEach((field, idx) => {
      const isNextHalf = options.fields[idx + 1]?.halfWidth;

      if (field.halfWidth && !inRow) {
        fieldsHtml += '<div class="sop-form-row">';
        inRow = true;
      }

      fieldsHtml += renderField(field);

      if (
        inRow &&
        (!field.halfWidth || !isNextHalf || idx === options.fields.length - 1)
      ) {
        fieldsHtml += "</div>";
        inRow = false;
      }
    });

    form.innerHTML = `
      <div class="sop-modal-body">
        ${options.subtitle ? `<p style="margin:0 0 16px 0;font-size:13px;color:#64748b;line-height:1.5;">${escapeHtml(options.subtitle)}</p>` : ""}
        ${fieldsHtml}
      </div>
      <div class="sop-modal-footer">
        <button type="button" class="sop-btn sop-btn-secondary cancel-btn">${escapeHtml(options.cancelText || "Batal")}</button>
        <button type="submit" class="sop-btn sop-btn-primary">${escapeHtml(options.submitText || "Simpan")}</button>
      </div>
    `;

    card.append(header, form);
    overlay.append(card);
    document.body.append(overlay);

    const close = (result: T | null) => {
      overlay.remove();
      document.removeEventListener("keydown", onEsc);
      resolve(result);
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

    // Auto-focus first input
    setTimeout(() => {
      const firstInput = form.querySelector<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input:not([readonly]), select, textarea");
      firstInput?.focus();
    }, 50);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data: Record<string, any> = {};

      options.fields.forEach((f) => {
        const rawVal = fd.get(f.name);
        if (f.type === "number") {
          data[f.name] = rawVal !== null && rawVal !== "" ? Number(rawVal) : 0;
        } else {
          data[f.name] = rawVal !== null ? String(rawVal).trim() : "";
        }
      });

      close(data as T);
    });
  });
}

/**
 * Display a modern choice/action modal
 */
export function showSelectModal(
  options: SelectModalOptions,
): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "sop-modal-overlay";

    const card = document.createElement("div");
    card.className = "sop-modal-card";

    const icon = options.icon || "lucide:list-filter";
    const iconColor = options.iconColor || "#217346";

    const header = document.createElement("div");
    header.className = "sop-modal-header";
    header.innerHTML = `
      <h3 class="sop-modal-title">
        <iconify-icon noobserver icon="${icon}" style="color:${iconColor}"></iconify-icon>
        ${escapeHtml(options.title)}
      </h3>
      <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
    `;

    const form = document.createElement("form");

    const optionsHtml = options.options
      .map((opt, i) => {
        const isSelected = options.defaultValue
          ? opt.value === options.defaultValue
          : i === 0;
        return `
        <label style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid ${isSelected ? "#217346" : "#e2e8f0"};border-radius:8px;background:${isSelected ? "#f0fdf4" : "#ffffff"};cursor:pointer;margin-bottom:8px;transition:all 0.15s ease;" class="sop-choice-item">
          <input type="radio" name="sop_choice" value="${escapeHtml(opt.value)}" ${isSelected ? "checked" : ""} style="margin-top:3px;accent-color:#217346">
          <div style="flex:1">
            <div style="font-size:13.5px;font-weight:600;color:#0f172a;display:flex;align-items:center;gap:6px">
              ${escapeHtml(opt.label)}
              ${opt.badge ? `<span style="font-size:11px;background:#e2e8f0;padding:2px 6px;border-radius:4px;font-weight:normal">${escapeHtml(opt.badge)}</span>` : ""}
            </div>
            ${opt.description ? `<div style="font-size:12.5px;color:#64748b;margin-top:2px;line-height:1.4">${escapeHtml(opt.description)}</div>` : ""}
          </div>
        </label>
      `;
      })
      .join("");

    form.innerHTML = `
      <div class="sop-modal-body">
        ${options.subtitle ? `<p style="margin:0 0 14px 0;font-size:13px;color:#64748b;line-height:1.5">${escapeHtml(options.subtitle)}</p>` : ""}
        <div class="sop-choice-container">
          ${optionsHtml}
        </div>
      </div>
      <div class="sop-modal-footer">
        <button type="button" class="sop-btn sop-btn-secondary cancel-btn">${escapeHtml(options.cancelText || "Batal")}</button>
        <button type="submit" class="sop-btn sop-btn-primary">${escapeHtml(options.submitText || "Pilih")}</button>
      </div>
    `;

    card.append(header, form);
    overlay.append(card);
    document.body.append(overlay);

    // Dynamic border highlight on radio selection
    const choiceItems = form.querySelectorAll(".sop-choice-item");
    form
      .querySelectorAll<HTMLInputElement>('input[name="sop_choice"]')
      .forEach((radio) => {
        radio.addEventListener("change", () => {
          choiceItems.forEach((item) => {
            const r = item.querySelector("input") as HTMLInputElement;
            if (r?.checked) {
              (item as HTMLElement).style.borderColor = "#217346";
              (item as HTMLElement).style.backgroundColor = "#f0fdf4";
            } else {
              (item as HTMLElement).style.borderColor = "#e2e8f0";
              (item as HTMLElement).style.backgroundColor = "#ffffff";
            }
          });
        });
      });

    const close = (result: string | null) => {
      overlay.remove();
      document.removeEventListener("keydown", onEsc);
      resolve(result);
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
      const chosen = fd.get("sop_choice");
      close(chosen ? String(chosen) : null);
    });
  });
}

/**
 * Display a modern confirmation modal replacing window.confirm()
 */
export function showConfirmModal(
  options: ConfirmModalOptions,
): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "sop-modal-overlay";

    const card = document.createElement("div");
    card.className = "sop-modal-card";
    card.style.maxWidth = "460px";

    const icon =
      options.icon ||
      (options.isDanger ? "lucide:alert-triangle" : "lucide:help-circle");
    const iconColor = options.isDanger ? "#dc2626" : "#217346";

    const header = document.createElement("div");
    header.className = "sop-modal-header";
    header.innerHTML = `
      <h3 class="sop-modal-title">
        <iconify-icon noobserver icon="${icon}" style="color:${iconColor}"></iconify-icon>
        ${escapeHtml(options.title)}
      </h3>
      <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
    `;

    const body = document.createElement("div");
    body.className = "sop-modal-body";
    body.innerHTML = `
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.6">${escapeHtml(options.message)}</p>
    `;

    const footer = document.createElement("div");
    footer.className = "sop-modal-footer";
    footer.innerHTML = `
      <button type="button" class="sop-btn sop-btn-secondary cancel-btn">${escapeHtml(options.cancelText || "Batal")}</button>
      <button type="button" class="sop-btn ${options.isDanger ? "sop-btn-danger" : "sop-btn-primary"} confirm-btn">${escapeHtml(options.confirmText || "Ya, Lanjutkan")}</button>
    `;

    card.append(header, body, footer);
    overlay.append(card);
    document.body.append(overlay);

    const close = (result: boolean) => {
      overlay.remove();
      document.removeEventListener("keydown", onEsc);
      resolve(result);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onEsc);

    header
      .querySelector(".close-btn")
      ?.addEventListener("click", () => close(false));
    footer
      .querySelector(".cancel-btn")
      ?.addEventListener("click", () => close(false));
    footer
      .querySelector(".confirm-btn")
      ?.addEventListener("click", () => close(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
  });
}

function renderField(field: FormFieldConfig): string {
  const reqBadge = field.required ? '<span class="sop-form-req">*</span>' : "";
  const label = `<label class="sop-form-label">${escapeHtml(field.label)} ${reqBadge}</label>`;
  let inputHtml = "";

  const placeholderAttr = field.placeholder
    ? `placeholder="${escapeHtml(field.placeholder)}"`
    : "";
  const reqAttr = field.required ? "required" : "";
  const readonlyAttr = field.readOnly
    ? 'readonly style="background:#f8fafc;color:#64748b"'
    : "";

  if (field.type === "select") {
    const opts = (field.options || [])
      .map((opt) => {
        const isSelected = String(opt.value) === String(field.value);
        return `<option value="${escapeHtml(String(opt.value))}" ${isSelected ? "selected" : ""}>${escapeHtml(opt.label)}</option>`;
      })
      .join("");
    inputHtml = `<select name="${escapeHtml(field.name)}" ${reqAttr} class="sop-form-select">${opts}</select>`;
  } else if (field.type === "textarea") {
    inputHtml = `<textarea name="${escapeHtml(field.name)}" ${reqAttr} ${placeholderAttr} class="sop-form-textarea">${escapeHtml(String(field.value || ""))}</textarea>`;
  } else if (field.type === "number") {
    const minAttr = field.min !== undefined ? `min="${field.min}"` : "";
    const maxAttr = field.max !== undefined ? `max="${field.max}"` : "";
    const stepAttr =
      field.step !== undefined ? `step="${field.step}"` : 'step="any"';
    const valAttr = field.value !== undefined ? `value="${field.value}"` : "";
    inputHtml = `<input type="number" name="${escapeHtml(field.name)}" ${reqAttr} ${minAttr} ${maxAttr} ${stepAttr} ${valAttr} ${placeholderAttr} ${readonlyAttr} class="sop-form-input">`;
  } else if (field.type === "date") {
    const valAttr = field.value
      ? `value="${escapeHtml(String(field.value))}"`
      : "";
    inputHtml = `<input type="date" name="${escapeHtml(field.name)}" ${reqAttr} ${valAttr} ${readonlyAttr} class="sop-form-input">`;
  } else {
    // Default text
    const valAttr = field.value
      ? `value="${escapeHtml(String(field.value))}"`
      : "";
    inputHtml = `<input type="text" name="${escapeHtml(field.name)}" ${reqAttr} ${valAttr} ${placeholderAttr} ${readonlyAttr} class="sop-form-input">`;
  }

  const helpText = field.helpText
    ? `<div style="font-size:12px;color:#64748b;margin-top:4px">${escapeHtml(field.helpText)}</div>`
    : "";

  return `
    <div class="sop-form-group">
      ${label}
      ${inputHtml}
      ${helpText}
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface LockedModalOptions {
  route?: string;
  panel?: string;
  title?: string;
  message?: string;
}

let activeLockedModal: HTMLElement | null = null;

function getModuleContext(route: string, panel: string) {
  const r = route.toLowerCase();
  const p = panel.toLowerCase();

  if (
    r === "/finance" ||
    p === "accounting" ||
    p === "bank" ||
    p === "cash" ||
    p.includes("journal")
  ) {
    return {
      moduleName: "Modul Keuangan & Kas (Buku Besar)",
      flowDescription:
        "Setiap transaksi keuangan tercatat dalam buku besar dan memerlukan dokumen pendukung yang sah:",
      steps: [
        "Mutasi Kas & Bank: Lakukan pencocokan transaksi melalui menu Rekonsiliasi Bank.",
        "Koreksi Saldo: Gunakan formulir Buat Jurnal Penyesuaian atau Jurnal Memorial resmi.",
        "Tutup Buku: Pastikan status Periode Pembukuan masih terbuka sebelum membukukan transaksi baru.",
      ],
      actionTip:
        'Gunakan tombol "+ Jurnal Penyesuaian", "+ Rekonsiliasi", atau menu resmi yang tersedia di Modul Keuangan.',
    };
  }

  if (
    r === "/sales" ||
    p === "order" ||
    p === "delivery" ||
    p === "return" ||
    p === "invoice"
  ) {
    return {
      moduleName: "Modul Penjualan & Piutang Usaha",
      flowDescription:
        "Transaksi penjualan mengikuti alur dokumen komersial yang saling terhubung:",
      steps: [
        "Surat Penawaran diajukan dan menunggu persetujuan dari pejabat berwenang.",
        "Pesanan Penjualan (Sales Order) diterbitkan resmi setelah penawaran disepakati pelanggan.",
        "Surat Jalan / Pengiriman Barang otomatis memotong saldo kartu stok di gudang.",
        "Faktur Penjualan (Invoice) membukukan piutang dan diselesaikan saat penerimaan pembayaran kas/bank.",
      ],
      actionTip:
        "Jika ada revisi atau pembatalan, gunakan tombol Revisi Penawaran, Pengiriman Retur, atau Nota Retur / Kredit.",
    };
  }

  if (
    r === "/purchase" ||
    p === "request" ||
    p === "order" ||
    p === "receipt" ||
    p === "bill"
  ) {
    return {
      moduleName: "Modul Pengadaan & Hutang Usaha",
      flowDescription:
        "Pengadaan barang dan jasa memerlukan persetujuan berjenjang serta bukti penerimaan fisik:",
      steps: [
        "Buat formulir Permintaan Pembelian melalui tombol pengajuan resmi.",
        "Setelah disetujui pimpinan, terbitkan Pesanan Pembelian (PO) resmi ke pemasok.",
        "Catat Bukti Penerimaan Barang saat barang fisik telah diperiksa di gudang.",
        "Verifikasi Tagihan Pemasok untuk pembayaran hutang usaha sesuai termin.",
      ],
      actionTip:
        'Gunakan tombol "+ Tambah Permintaan", "+ Buat PO", atau menu Penerimaan Barang resmi alih-alih mengubah tabel.',
    };
  }

  if (
    r === "/inventory" ||
    p === "stock" ||
    p === "transfer" ||
    p === "opname" ||
    p === "adjustment"
  ) {
    return {
      moduleName: "Modul Persediaan & Pergudangan",
      flowDescription:
        "Kuantitas dan nilai persediaan barang tercatat otomatis melalui kartu mutasi stok:",
      steps: [
        "Selisih Fisik Barang: Gunakan formulir Berita Acara Stock Opname atau Penyesuaian Stok resmi.",
        "Pemindahan Lokasi: Buat formulir Surat Jalan Transfer Antar Gudang dengan status Kirim dan Terima.",
        "Setiap pergerakan fisik otomatis memperbarui nilai persediaan dan Harga Pokok Penjualan (HPP).",
      ],
      actionTip:
        'Gunakan tombol "+ Penyesuaian Stok" atau alur Transfer Antar Gudang resmi untuk memperbarui jumlah barang.',
    };
  }

  if (r === "/projects" || p === "cost" || p === "task") {
    return {
      moduleName: "Modul Proyek & Biaya Operasional",
      flowDescription:
        "Anggaran dan realisasi biaya proyek terikat pada kontrak kerja serta pengakuan beban:",
      steps: [
        'Rincian aktivitas pekerjaan dicatat melalui formulir "+ Tambah Aktivitas".',
        'Realisasi pengeluaran dicatat lewat formulir "+ Catat Biaya Proyek" dengan melampirkan akun beban terkait.',
        "Pencatatan biaya otomatis membukukan jurnal pengakuan beban dan kewajiban/kas perusahaan.",
      ],
      actionTip:
        'Gunakan tombol "+ Tambah Aktivitas" atau "+ Catat Biaya" pada lembar kerja proyek terkait.',
    };
  }

  return {
    moduleName: "Pencatatan Transaksi Resmi",
    flowDescription:
      "Data transaksi ini merupakan bagian dari pembukuan resmi perusahaan yang dilindungi:",
    steps: [
      "Data transaksi telah disahkan dan tercatat dalam buku besar pembukuan perusahaan.",
      "Setiap perubahan status transaksi wajib memperoleh otorisasi pejabat berwenang sesuai tata kelola perusahaan.",
      "Sistem mencatat riwayat pembukuan lengkap (nama pembuat, tanggal pencatatan, dan bukti persetujuan) demi ketertiban audit.",
    ],
    actionTip:
      "Gunakan tombol tindakan resmi (seperti Tambah Transaksi, Proses Dokumen, atau Ajukan Persetujuan) yang tersedia di bilah aksi halaman ini.",
  };
}

/**
 * Display a SweetAlert-style interactive modal when a user attempts to edit
 * a locked/authoritative transaction record directly in the table.
 */
export function showLockedTransactionModal(
  options?: LockedModalOptions,
): Promise<void> {
  if (activeLockedModal) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const route = options?.route || "";
    const panel = options?.panel || "";
    const context = getModuleContext(route, panel);

    const overlay = document.createElement("div");
    overlay.className = "sop-modal-overlay";
    activeLockedModal = overlay;

    const card = document.createElement("div");
    card.className = "sop-swal-card";

    card.innerHTML = `
      <div class="sop-swal-icon-wrapper">
        <iconify-icon noobserver icon="lucide:lock"></iconify-icon>
      </div>

      <h3 class="sop-swal-title">${escapeHtml(options?.title || "Data Transaksi Terkunci")}</h3>

      <p class="sop-swal-text">
        ${escapeHtml(options?.message || "Data transaksi ini telah dibukukan secara resmi. Untuk menjaga kepatuhan dan keabsahan pembukuan, perubahan harus melalui dokumen atau alur transaksi resmi terkait.")}
      </p>

      <button type="button" class="sop-btn-reason-toggle" id="sop-toggle-reason">
        <iconify-icon noobserver icon="lucide:help-circle"></iconify-icon>
        <span class="btn-text">Lihat Alasan &amp; Alur Resmi</span>
        <iconify-icon noobserver icon="lucide:chevron-down" class="sop-chevron"></iconify-icon>
      </button>

      <div class="sop-reason-panel" id="sop-reason-panel">
        <div class="sop-reason-badge">${escapeHtml(context.moduleName)}</div>
        
        <div class="sop-reason-section">
          <div class="sop-reason-heading">
            <iconify-icon noobserver icon="lucide:shield-check" style="color:#217346"></iconify-icon>
            Mengapa Tidak Bisa Diubah Langsung di Tabel?
          </div>
          <ul class="sop-reason-list">
            <li><strong>Kepatuhan Standar Audit &amp; Keabsahan Bukti:</strong> Data transaksi ini telah dibukukan secara sah. Pengubahan angka secara langsung pada tabel dinonaktifkan untuk mencegah terjadinya selisih pencatatan serta menjamin keabsahan laporan keuangan saat audit pembukuan.</li>
            <li><strong>Keseimbangan Jurnal &amp; Kartu Stok:</strong> Setiap transaksi terhubung langsung dengan jurnal pembukuan berpasangan (debit dan kredit), mutasi kas/bank, serta kartu persediaan barang secara otomatis. Mengubah data tanpa dokumen pendukung akan merusak keseimbangan neraca keuangan dan persediaan.</li>
          </ul>
        </div>

        <div class="sop-reason-section">
          <div class="sop-reason-heading">
            <iconify-icon noobserver icon="lucide:git-branch" style="color:#0284c7"></iconify-icon>
            Alur Resmi yang Berlaku:
          </div>
          <p style="margin:0 0 6px;color:#475569">${escapeHtml(context.flowDescription)}</p>
          <ul class="sop-reason-list">
            ${context.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ul>
        </div>

        <div class="sop-reason-section" style="background:#f1f5f9;padding:8px 10px;border-radius:6px;border-left:3px solid #217346">
          <div class="sop-reason-heading" style="color:#1e293b;font-size:11.5px">
            <iconify-icon noobserver icon="lucide:lightbulb" style="color:#d97706"></iconify-icon>
            Petunjuk Tindakan:
          </div>
          <span style="font-size:12px;color:#334155">${escapeHtml(context.actionTip)}</span>
        </div>
      </div>

      <div class="sop-swal-actions">
        <button type="button" class="sop-btn sop-btn-primary" id="sop-btn-understand">
          Saya Mengerti
        </button>
      </div>
    `;

    overlay.append(card);
    document.body.append(overlay);

    const toggleBtn =
      card.querySelector<HTMLButtonElement>("#sop-toggle-reason");
    const reasonPanel = card.querySelector<HTMLElement>("#sop-reason-panel");
    const understandBtn = card.querySelector<HTMLButtonElement>(
      "#sop-btn-understand",
    );
    const btnText = toggleBtn?.querySelector<HTMLElement>(".btn-text");

    let isExpanded = false;
    toggleBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      isExpanded = !isExpanded;
      if (isExpanded) {
        reasonPanel?.classList.add("visible");
        toggleBtn.classList.add("expanded");
        if (btnText) btnText.textContent = "Sembunyikan Alasan & Alur";
      } else {
        reasonPanel?.classList.remove("visible");
        toggleBtn.classList.remove("expanded");
        if (btnText) btnText.textContent = "Lihat Alasan & Alur Resmi";
      }
    });

    const close = () => {
      overlay.remove();
      activeLockedModal = null;
      document.removeEventListener("keydown", onEsc);
      resolve();
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") close();
    };
    document.addEventListener("keydown", onEsc);

    understandBtn?.addEventListener("click", () => close());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  });
}

export interface QuotationModalItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface QuotationModalOptions {
  isEdit?: boolean;
  initialData?: {
    id?: string;
    number?: string;
    customer_id: string;
    owner_id?: string;
    contact_name?: string;
    currency?: string;
    payment_terms?: string;
    valid_until?: string;
    tax_percent?: number;
    discount_percent?: number;
    items?: QuotationModalItem[];
  };
  options: {
    customers: Array<{ id: string; name: string }>;
    owners: Array<{ id: string; name: string }>;
    products: Array<{ id: string; name: string; code?: string }>;
  };
}

export interface QuotationModalResult {
  submit: boolean;
  payload: {
    id: string | null;
    customer_id: string;
    owner_id?: string;
    contact_name: string;
    currency: string;
    payment_terms: string;
    valid_until: string;
    tax_percent: number;
    discount_percent: number;
    items: Array<{
      description: string;
      product_id?: string;
      quantity: number;
      unit_price: string;
    }>;
  };
}

export function showQuotationModal(
  opts: QuotationModalOptions,
): Promise<QuotationModalResult | null> {
  return new Promise((resolve) => {
    const isEdit = Boolean(opts.isEdit);
    const init = opts.initialData;

    const overlay = document.createElement("div");
    overlay.className = "sop-modal-overlay";

    const card = document.createElement("div");
    card.className = "sop-modal-card sop-modal-card-xl";

    const titleText = isEdit
      ? `Edit Draft Penawaran: ${init?.number || "Draft"}`
      : "Buat Penawaran Harga Baru (Quotation)";
    const iconName = isEdit ? "lucide:file-edit" : "lucide:file-plus";

    const defaultItems: QuotationModalItem[] =
      init?.items && init.items.length
        ? init.items
        : [
            {
              description:
                opts.options.products[0]?.name || "Lisensi Sistem ERP Terpadu",
              quantity: 1,
              unit_price: 15000000,
            },
          ];

    const items = defaultItems.map((it) => ({ ...it }));

    const defaultValidUntil = (() => {
      if (init?.valid_until) return init.valid_until.slice(0, 10);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })();

    const header = document.createElement("div");
    header.className = "sop-modal-header";
    header.innerHTML = `
      <h3 class="sop-modal-title">
        <iconify-icon noobserver icon="${iconName}" style="color:#217346"></iconify-icon>
        ${escapeHtml(titleText)}
      </h3>
      <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
    `;

    const body = document.createElement("div");
    body.className = "sop-modal-body";

    body.innerHTML = `
      <div class="sop-form-row">
        <div class="sop-form-group">
          <label class="sop-form-label">Pelanggan / Klien <span class="sop-form-req">*</span></label>
          <select id="qt-modal-cust" class="sop-form-select">
            <option value="">Pilih Pelanggan...</option>
            ${opts.options.customers
              .map(
                (c) =>
                  `<option value="${escapeHtml(c.id)}" ${init?.customer_id === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="sop-form-group">
          <label class="sop-form-label">Sales PIC / Owner</label>
          <select id="qt-modal-owner" class="sop-form-select">
            <option value="">Pilih PIC...</option>
            ${opts.options.owners
              .map(
                (o) =>
                  `<option value="${escapeHtml(o.id)}" ${init?.owner_id === o.id ? "selected" : ""}>${escapeHtml(o.name)}</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>

      <div class="sop-form-row">
        <div class="sop-form-group">
          <label class="sop-form-label">Nama Kontak Pelanggan</label>
          <input type="text" id="qt-modal-contact" class="sop-form-input" placeholder="Contoh: Bpk. Andi Wijaya" value="${escapeHtml(init?.contact_name || "")}">
        </div>
        <div class="sop-form-group">
          <label class="sop-form-label">Mata Uang</label>
          <select id="qt-modal-currency" class="sop-form-select">
            <option value="IDR" ${init?.currency === "IDR" || !init?.currency ? "selected" : ""}>IDR (Rupiah)</option>
            <option value="USD" ${init?.currency === "USD" ? "selected" : ""}>USD (US Dollar)</option>
          </select>
        </div>
      </div>

      <div class="sop-form-row">
        <div class="sop-form-group">
          <label class="sop-form-label">Syarat Pembayaran</label>
          <select id="qt-modal-terms" class="sop-form-select">
            ${["NET 30", "NET 45", "50% DP / 50% finish", "Cash on Delivery"]
              .map(
                (t) =>
                  `<option value="${escapeHtml(t)}" ${init?.payment_terms === t ? "selected" : ""}>${escapeHtml(t)}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="sop-form-group">
          <label class="sop-form-label">Masa Berlaku Penawaran <span class="sop-form-req">*</span></label>
          <input type="date" id="qt-modal-valid" class="sop-form-input" value="${escapeHtml(defaultValidUntil)}">
        </div>
      </div>

      <div style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <label class="sop-form-label" style="font-size:13.5px;font-weight:600">Daftar Produk / Jasa Penawaran <span class="sop-form-req">*</span></label>
          <button type="button" class="sop-btn sop-btn-secondary" id="btn-add-line" style="min-height:30px;padding:3px 12px;font-size:12px;color:#185c37;background:#f0fdf4;border-color:#bbf7d0">
            <iconify-icon noobserver icon="lucide:plus"></iconify-icon> Tambah Item
          </button>
        </div>

        <div class="sop-modal-table-wrap">
          <table class="sop-modal-table">
            <thead>
              <tr>
                <th style="width:38%">Deskripsi Produk / Jasa</th>
                <th style="width:16%">Kuantitas</th>
                <th style="width:24%">Harga Satuan (Rp)</th>
                <th style="width:16%">Subtotal</th>
                <th style="width:6%"></th>
              </tr>
            </thead>
            <tbody id="sop-modal-lines-body">
            </tbody>
          </table>
        </div>

        <div class="sop-modal-summary-box">
          <div class="sop-modal-summary-row">
            <span>Subtotal Produk &amp; Jasa</span>
            <strong id="qt-sum-subtotal">Rp 0</strong>
          </div>
          <div class="sop-modal-summary-row">
            <span>Diskon <input type="number" min="0" max="100" id="qt-modal-discount" value="${init?.discount_percent ?? 5}" style="width:58px;min-height:28px;padding:2px 6px;text-align:center;margin:0 4px;font-size:12px;border:1px solid #cbd5e1;border-radius:4px">%</span>
            <strong id="qt-sum-discount">-Rp 0</strong>
          </div>
          <div class="sop-modal-summary-row">
            <span>Pajak (PPN) <input type="number" min="0" max="100" id="qt-modal-tax" value="${init?.tax_percent ?? 11}" style="width:58px;min-height:28px;padding:2px 6px;text-align:center;margin:0 4px;font-size:12px;border:1px solid #cbd5e1;border-radius:4px">%</span>
            <strong id="qt-sum-tax">+Rp 0</strong>
          </div>
          <div class="sop-modal-summary-row sop-modal-summary-total">
            <span>Grand Total Penawaran</span>
            <strong id="qt-sum-total">Rp 0</strong>
          </div>
        </div>
      </div>
    `;

    const footer = document.createElement("div");
    footer.className = "sop-modal-footer";
    footer.innerHTML = `
      <button type="button" class="sop-btn sop-btn-secondary cancel-btn">Batal</button>
      <button type="button" class="sop-btn sop-btn-secondary draft-btn">
        <iconify-icon noobserver icon="lucide:save"></iconify-icon> Simpan sebagai Draft
      </button>
      <button type="button" class="sop-btn sop-btn-primary submit-btn">
        <iconify-icon noobserver icon="lucide:stamp"></iconify-icon> ${isEdit ? "Simpan &amp; Ajukan" : "Buat &amp; Ajukan"}
      </button>
    `;

    card.append(header, body, footer);
    overlay.append(card);
    document.body.append(overlay);

    const tbody = body.querySelector<HTMLTableSectionElement>("#sop-modal-lines-body")!;
    const discountInput = body.querySelector<HTMLInputElement>("#qt-modal-discount")!;
    const taxInput = body.querySelector<HTMLInputElement>("#qt-modal-tax")!;

    const formatMoney = (n: number) =>
      "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));

    const recalc = () => {
      let subtotal = 0;
      tbody.querySelectorAll<HTMLTableRowElement>("tr").forEach((tr, i) => {
        const qty = Math.max(1, Number(tr.querySelector<HTMLInputElement>(".line-qty")?.value || 1));
        const price = Math.max(0, Number(tr.querySelector<HTMLInputElement>(".line-price")?.value || 0));
        const lineTotal = qty * price;
        subtotal += lineTotal;
        const subCell = tr.querySelector<HTMLElement>(".line-subtotal");
        if (subCell) subCell.textContent = formatMoney(lineTotal);
        if (items[i]) {
          items[i].quantity = qty;
          items[i].unit_price = price;
        }
      });

      const discPct = Math.min(100, Math.max(0, Number(discountInput.value || 0)));
      const taxPct = Math.min(100, Math.max(0, Number(taxInput.value || 0)));
      const discVal = subtotal * (discPct / 100);
      const taxVal = (subtotal - discVal) * (taxPct / 100);
      const grandTotal = subtotal - discVal + taxVal;

      body.querySelector("#qt-sum-subtotal")!.textContent = formatMoney(subtotal);
      body.querySelector("#qt-sum-discount")!.textContent = "-" + formatMoney(discVal);
      body.querySelector("#qt-sum-tax")!.textContent = "+" + formatMoney(taxVal);
      body.querySelector("#qt-sum-total")!.textContent = formatMoney(grandTotal);
    };

    const renderLines = () => {
      tbody.innerHTML = items
        .map(
          (item, idx) => `
        <tr data-line-idx="${idx}">
          <td>
            <input type="text" class="line-desc" list="qt-prod-datalist" value="${escapeHtml(item.description)}" placeholder="Pilih produk atau ketik..." style="width:100%">
          </td>
          <td>
            <input type="number" min="1" value="${item.quantity}" class="line-qty" style="width:100%">
          </td>
          <td>
            <input type="number" min="0" step="1000" value="${item.unit_price}" class="line-price" style="width:100%">
          </td>
          <td class="line-subtotal" style="font-weight:600;white-space:nowrap">
            ${formatMoney(item.quantity * item.unit_price)}
          </td>
          <td style="text-align:center">
            <button type="button" class="btn-del-line" style="background:transparent;border:none;color:#ef4444;cursor:pointer;padding:4px" title="Hapus baris">
              <iconify-icon noobserver icon="lucide:trash-2"></iconify-icon>
            </button>
          </td>
        </tr>
      `,
        )
        .join("");

      if (!body.querySelector("#qt-prod-datalist")) {
        const dl = document.createElement("datalist");
        dl.id = "qt-prod-datalist";
        dl.innerHTML = opts.options.products
          .map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.code || "")}</option>`)
          .join("");
        body.appendChild(dl);
      }

      recalc();
    };

    renderLines();

    body.querySelector("#btn-add-line")?.addEventListener("click", () => {
      items.push({
        description: opts.options.products[0]?.name || "Item Penawaran",
        quantity: 1,
        unit_price: 10000000,
      });
      renderLines();
    });

    tbody.addEventListener("click", (e) => {
      const del = (e.target as HTMLElement).closest(".btn-del-line");
      if (!del) return;
      const tr = del.closest<HTMLTableRowElement>("tr");
      if (!tr) return;
      const idx = Number(tr.dataset.lineIdx);
      if (items.length <= 1) {
        window.alert("Quotation harus memiliki minimal 1 item.");
        return;
      }
      items.splice(idx, 1);
      renderLines();
    });

    tbody.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const tr = target.closest<HTMLTableRowElement>("tr");
      if (!tr) return;
      const idx = Number(tr.dataset.lineIdx);
      if (target.classList.contains("line-desc") && items[idx]) {
        items[idx].description = target.value;
      }
      recalc();
    });

    discountInput.addEventListener("input", recalc);
    taxInput.addEventListener("input", recalc);

    const close = (res: QuotationModalResult | null) => {
      overlay.remove();
      document.removeEventListener("keydown", onEsc);
      resolve(res);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(null);
    };
    document.addEventListener("keydown", onEsc);

    header.querySelector(".close-btn")?.addEventListener("click", () => close(null));
    footer.querySelector(".cancel-btn")?.addEventListener("click", () => close(null));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(null);
    });

    const getPayload = (isSubmit: boolean): QuotationModalResult | null => {
      const custSelect = body.querySelector<HTMLSelectElement>("#qt-modal-cust")!;
      const custId = custSelect.value.trim();
      if (!custId) {
        custSelect.focus();
        custSelect.style.borderColor = "#ef4444";
        window.alert("Silakan pilih Pelanggan terlebih dahulu.");
        return null;
      }

      const validUntil = body.querySelector<HTMLInputElement>("#qt-modal-valid")!.value.trim();
      if (!validUntil) {
        window.alert("Masa berlaku penawaran wajib diisi.");
        return null;
      }

      const lines: Array<{
        description: string;
        product_id?: string;
        quantity: number;
        unit_price: string;
      }> = [];

      tbody.querySelectorAll<HTMLTableRowElement>("tr").forEach((tr) => {
        const desc = tr.querySelector<HTMLInputElement>(".line-desc")?.value.trim() || "";
        const qty = Number(tr.querySelector<HTMLInputElement>(".line-qty")?.value || 1);
        const price = Number(tr.querySelector<HTMLInputElement>(".line-price")?.value || 0);

        if (desc && qty > 0) {
          const matchedProd = opts.options.products.find(
            (p) => p.name.toLowerCase() === desc.toLowerCase(),
          );
          lines.push({
            description: desc,
            product_id: matchedProd?.id,
            quantity: qty,
            unit_price: price.toFixed(2),
          });
        }
      });

      if (!lines.length) {
        window.alert("Tambahkan minimal satu item produk/jasa yang valid.");
        return null;
      }

      const ownerId = body.querySelector<HTMLSelectElement>("#qt-modal-owner")!.value.trim() || undefined;
      const contactName = body.querySelector<HTMLInputElement>("#qt-modal-contact")!.value.trim();
      const currency = body.querySelector<HTMLSelectElement>("#qt-modal-currency")!.value.trim() || "IDR";
      const terms = body.querySelector<HTMLSelectElement>("#qt-modal-terms")!.value.trim() || "NET 30";
      const tax = Number(taxInput.value || 0);
      const discount = Number(discountInput.value || 0);

      return {
        submit: isSubmit,
        payload: {
          id: init?.id || null,
          customer_id: custId,
          owner_id: ownerId,
          contact_name: contactName,
          currency,
          payment_terms: terms,
          valid_until: validUntil,
          tax_percent: tax,
          discount_percent: discount,
          items: lines,
        },
      };
    };

    footer.querySelector(".draft-btn")?.addEventListener("click", () => {
      const data = getPayload(false);
      if (data) close(data);
    });

    footer.querySelector(".submit-btn")?.addEventListener("click", () => {
      const data = getPayload(true);
      if (data) close(data);
    });
  });
}

