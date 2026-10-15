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
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
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
export function showFormModal<T = Record<string, any>>(options: FormModalOptions): Promise<T | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'sop-modal-overlay';

    const card = document.createElement('div');
    card.className = `sop-modal-card ${options.large ? 'sop-modal-card-lg' : ''}`;

    const icon = options.icon || 'lucide:file-edit';
    const iconColor = options.iconColor || '#217346';

    const header = document.createElement('div');
    header.className = 'sop-modal-header';
    header.innerHTML = `
      <h3 class="sop-modal-title">
        <iconify-icon noobserver icon="${icon}" style="color:${iconColor}"></iconify-icon>
        ${escapeHtml(options.title)}
      </h3>
      <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
    `;

    const form = document.createElement('form');
    
    // Group fields into rows if halfWidth is true
    let fieldsHtml = '';
    let inRow = false;

    options.fields.forEach((field, idx) => {
      const isNextHalf = options.fields[idx + 1]?.halfWidth;

      if (field.halfWidth && !inRow) {
        fieldsHtml += '<div class="sop-form-row">';
        inRow = true;
      }

      fieldsHtml += renderField(field);

      if (inRow && (!field.halfWidth || !isNextHalf || idx === options.fields.length - 1)) {
        fieldsHtml += '</div>';
        inRow = false;
      }
    });

    form.innerHTML = `
      <div class="sop-modal-body">
        ${options.subtitle ? `<p style="margin:0 0 16px 0;font-size:13px;color:#64748b;line-height:1.5;">${escapeHtml(options.subtitle)}</p>` : ''}
        ${fieldsHtml}
      </div>
      <div class="sop-modal-footer">
        <button type="button" class="sop-btn sop-btn-secondary cancel-btn">${escapeHtml(options.cancelText || 'Batal')}</button>
        <button type="submit" class="sop-btn sop-btn-primary">${escapeHtml(options.submitText || 'Simpan')}</button>
      </div>
    `;

    card.append(header, form);
    overlay.append(card);
    document.body.append(overlay);

    const close = (result: T | null) => {
      overlay.remove();
      document.removeEventListener('keydown', onEsc);
      resolve(result);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(null);
    };
    document.addEventListener('keydown', onEsc);

    header.querySelector('.close-btn')?.addEventListener('click', () => close(null));
    form.querySelector('.cancel-btn')?.addEventListener('click', () => close(null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });

    // Auto-focus first input
    setTimeout(() => {
      const firstInput = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input:not([readonly]), select, textarea');
      firstInput?.focus();
    }, 50);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data: Record<string, any> = {};

      options.fields.forEach((f) => {
        const rawVal = fd.get(f.name);
        if (f.type === 'number') {
          data[f.name] = rawVal !== null && rawVal !== '' ? Number(rawVal) : 0;
        } else {
          data[f.name] = rawVal !== null ? String(rawVal).trim() : '';
        }
      });

      close(data as T);
    });
  });
}

/**
 * Display a modern choice/action modal
 */
export function showSelectModal(options: SelectModalOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'sop-modal-overlay';

    const card = document.createElement('div');
    card.className = 'sop-modal-card';

    const icon = options.icon || 'lucide:list-filter';
    const iconColor = options.iconColor || '#217346';

    const header = document.createElement('div');
    header.className = 'sop-modal-header';
    header.innerHTML = `
      <h3 class="sop-modal-title">
        <iconify-icon noobserver icon="${icon}" style="color:${iconColor}"></iconify-icon>
        ${escapeHtml(options.title)}
      </h3>
      <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
    `;

    const form = document.createElement('form');
    
    const optionsHtml = options.options.map((opt, i) => {
      const isSelected = options.defaultValue ? opt.value === options.defaultValue : i === 0;
      return `
        <label style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid ${isSelected ? '#217346' : '#e2e8f0'};border-radius:8px;background:${isSelected ? '#f0fdf4' : '#ffffff'};cursor:pointer;margin-bottom:8px;transition:all 0.15s ease;" class="sop-choice-item">
          <input type="radio" name="sop_choice" value="${escapeHtml(opt.value)}" ${isSelected ? 'checked' : ''} style="margin-top:3px;accent-color:#217346">
          <div style="flex:1">
            <div style="font-size:13.5px;font-weight:600;color:#0f172a;display:flex;align-items:center;gap:6px">
              ${escapeHtml(opt.label)}
              ${opt.badge ? `<span style="font-size:11px;background:#e2e8f0;padding:2px 6px;border-radius:4px;font-weight:normal">${escapeHtml(opt.badge)}</span>` : ''}
            </div>
            ${opt.description ? `<div style="font-size:12.5px;color:#64748b;margin-top:2px;line-height:1.4">${escapeHtml(opt.description)}</div>` : ''}
          </div>
        </label>
      `;
    }).join('');

    form.innerHTML = `
      <div class="sop-modal-body">
        ${options.subtitle ? `<p style="margin:0 0 14px 0;font-size:13px;color:#64748b;line-height:1.5">${escapeHtml(options.subtitle)}</p>` : ''}
        <div class="sop-choice-container">
          ${optionsHtml}
        </div>
      </div>
      <div class="sop-modal-footer">
        <button type="button" class="sop-btn sop-btn-secondary cancel-btn">${escapeHtml(options.cancelText || 'Batal')}</button>
        <button type="submit" class="sop-btn sop-btn-primary">${escapeHtml(options.submitText || 'Pilih')}</button>
      </div>
    `;

    card.append(header, form);
    overlay.append(card);
    document.body.append(overlay);

    // Dynamic border highlight on radio selection
    const choiceItems = form.querySelectorAll('.sop-choice-item');
    form.querySelectorAll<HTMLInputElement>('input[name="sop_choice"]').forEach(radio => {
      radio.addEventListener('change', () => {
        choiceItems.forEach(item => {
          const r = item.querySelector('input') as HTMLInputElement;
          if (r?.checked) {
            (item as HTMLElement).style.borderColor = '#217346';
            (item as HTMLElement).style.backgroundColor = '#f0fdf4';
          } else {
            (item as HTMLElement).style.borderColor = '#e2e8f0';
            (item as HTMLElement).style.backgroundColor = '#ffffff';
          }
        });
      });
    });

    const close = (result: string | null) => {
      overlay.remove();
      document.removeEventListener('keydown', onEsc);
      resolve(result);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(null);
    };
    document.addEventListener('keydown', onEsc);

    header.querySelector('.close-btn')?.addEventListener('click', () => close(null));
    form.querySelector('.cancel-btn')?.addEventListener('click', () => close(null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const chosen = fd.get('sop_choice');
      close(chosen ? String(chosen) : null);
    });
  });
}

/**
 * Display a modern confirmation modal replacing window.confirm()
 */
export function showConfirmModal(options: ConfirmModalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'sop-modal-overlay';

    const card = document.createElement('div');
    card.className = 'sop-modal-card';
    card.style.maxWidth = '460px';

    const icon = options.icon || (options.isDanger ? 'lucide:alert-triangle' : 'lucide:help-circle');
    const iconColor = options.isDanger ? '#dc2626' : '#217346';

    const header = document.createElement('div');
    header.className = 'sop-modal-header';
    header.innerHTML = `
      <h3 class="sop-modal-title">
        <iconify-icon noobserver icon="${icon}" style="color:${iconColor}"></iconify-icon>
        ${escapeHtml(options.title)}
      </h3>
      <button type="button" class="sop-modal-close close-btn" aria-label="Tutup">&times;</button>
    `;

    const body = document.createElement('div');
    body.className = 'sop-modal-body';
    body.innerHTML = `
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.6">${escapeHtml(options.message)}</p>
    `;

    const footer = document.createElement('div');
    footer.className = 'sop-modal-footer';
    footer.innerHTML = `
      <button type="button" class="sop-btn sop-btn-secondary cancel-btn">${escapeHtml(options.cancelText || 'Batal')}</button>
      <button type="button" class="sop-btn ${options.isDanger ? 'sop-btn-danger' : 'sop-btn-primary'} confirm-btn">${escapeHtml(options.confirmText || 'Ya, Lanjutkan')}</button>
    `;

    card.append(header, body, footer);
    overlay.append(card);
    document.body.append(overlay);

    const close = (result: boolean) => {
      overlay.remove();
      document.removeEventListener('keydown', onEsc);
      resolve(result);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', onEsc);

    header.querySelector('.close-btn')?.addEventListener('click', () => close(false));
    footer.querySelector('.cancel-btn')?.addEventListener('click', () => close(false));
    footer.querySelector('.confirm-btn')?.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
  });
}

function renderField(field: FormFieldConfig): string {
  const reqBadge = field.required ? '<span class="sop-form-req">*</span>' : '';
  const label = `<label class="sop-form-label">${escapeHtml(field.label)} ${reqBadge}</label>`;
  let inputHtml = '';

  const placeholderAttr = field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : '';
  const reqAttr = field.required ? 'required' : '';
  const readonlyAttr = field.readOnly ? 'readonly style="background:#f8fafc;color:#64748b"' : '';

  if (field.type === 'select') {
    const opts = (field.options || []).map(opt => {
      const isSelected = String(opt.value) === String(field.value);
      return `<option value="${escapeHtml(String(opt.value))}" ${isSelected ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`;
    }).join('');
    inputHtml = `<select name="${escapeHtml(field.name)}" ${reqAttr} class="sop-form-select">${opts}</select>`;
  } else if (field.type === 'textarea') {
    inputHtml = `<textarea name="${escapeHtml(field.name)}" ${reqAttr} ${placeholderAttr} class="sop-form-textarea">${escapeHtml(String(field.value || ''))}</textarea>`;
  } else if (field.type === 'number') {
    const minAttr = field.min !== undefined ? `min="${field.min}"` : '';
    const maxAttr = field.max !== undefined ? `max="${field.max}"` : '';
    const stepAttr = field.step !== undefined ? `step="${field.step}"` : 'step="any"';
    const valAttr = field.value !== undefined ? `value="${field.value}"` : '';
    inputHtml = `<input type="number" name="${escapeHtml(field.name)}" ${reqAttr} ${minAttr} ${maxAttr} ${stepAttr} ${valAttr} ${placeholderAttr} ${readonlyAttr} class="sop-form-input">`;
  } else if (field.type === 'date') {
    const valAttr = field.value ? `value="${escapeHtml(String(field.value))}"` : '';
    inputHtml = `<input type="date" name="${escapeHtml(field.name)}" ${reqAttr} ${valAttr} ${readonlyAttr} class="sop-form-input">`;
  } else {
    // Default text
    const valAttr = field.value ? `value="${escapeHtml(String(field.value))}"` : '';
    inputHtml = `<input type="text" name="${escapeHtml(field.name)}" ${reqAttr} ${valAttr} ${placeholderAttr} ${readonlyAttr} class="sop-form-input">`;
  }

  const helpText = field.helpText ? `<div style="font-size:12px;color:#64748b;margin-top:4px">${escapeHtml(field.helpText)}</div>` : '';

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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

  if (r === '/finance' || p === 'accounting' || p === 'bank' || p === 'cash' || p.includes('journal')) {
    return {
      moduleName: 'Modul Keuangan & Kas (Buku Besar)',
      flowDescription: 'Transaksi keuangan harus melalui pembukuan akrual atau rekonsiliasi berpasangan:',
      steps: [
        'Mutasi Kas / Bank: Lakukan pencocokan transaksi pada menu Rekonsiliasi Bank.',
        'Penyesuaian Saldo: Gunakan formulir Buat Jurnal Manual atau Jurnal Penyesuaian.',
        'Tutup Buku: Periksa status Periode Akuntansi sebelum memposting transaksi baru.',
      ],
      actionTip: 'Gunakan tombol "+ Jurnal Manual", "+ Rekonsiliasi", atau bilah aksi resmi di menu Keuangan.',
    };
  }

  if (r === '/sales' || p === 'order' || p === 'delivery' || p === 'return' || p === 'invoice') {
    return {
      moduleName: 'Modul Penjualan & Piutang (Sales)',
      flowDescription: 'Penjualan mengikuti rantai dokumen komersial terverifikasi:',
      steps: [
        'Penawaran (Quotation) diajukan dan menunggu persetujuan (Approval) manajer.',
        'Pesanan Penjualan (Sales Order) dikonfirmasi secara resmi.',
        'Pengiriman Barang (Delivery Order) otomatis memotong stok gudang.',
        'Faktur (Invoice) diterbitkan dan otomatis direkonsiliasi saat pembayaran masuk.',
      ],
      actionTip: 'Jika ada revisi, gunakan tombol Revisi Penawaran, Pengiriman Bertahap, atau Nota Kredit Penjualan.',
    };
  }

  if (r === '/purchase' || p === 'request' || p === 'order' || p === 'receipt' || p === 'bill') {
    return {
      moduleName: 'Modul Pengadaan & Pembelian (Procurement)',
      flowDescription: 'Pengadaan barang/jasa mengikuti tata kelola bertingkat:',
      steps: [
        'Buat Permintaan Pembelian (PR) melalui tombol alur pengadaan.',
        'Setelah disetujui, konfirmasi menjadi Pesanan Pembelian (PO) resmi ke vendor.',
        'Catat Penerimaan Barang (GRN) saat pesanan fisik tiba di gudang.',
        'Verifikasi Tagihan Vendor (Vendor Bill) untuk pembayaran hutang usaha.',
      ],
      actionTip: 'Gunakan tombol "+ Tambah PR", "+ Buat PO", atau menu Penerimaan Barang resmi alih-alih mengedit tabel.',
    };
  }

  if (r === '/inventory' || p === 'stock' || p === 'transfer' || p === 'opname' || p === 'adjustment') {
    return {
      moduleName: 'Modul Inventaris & Pergudangan',
      flowDescription: 'Kuantitas dan nilai stok tercatat otomatis melalui kartu mutasi:',
      steps: [
        'Penyesuaian Fisik: Gunakan menu Stock Opname / Penyesuaian Stok dengan nomor referensi.',
        'Pindah Lokasi: Buat formulir Transfer Antar Gudang dengan status Kirim -> Terima.',
        'Setiap pergerakan otomatis menghitung Harga Pokok Penjualan (HPP / Biaya Standar).',
      ],
      actionTip: 'Gunakan tombol "+ Penyesuaian Stok" atau alur Transfer Gudang resmi untuk mengubah jumlah barang.',
    };
  }

  if (r === '/projects' || p === 'cost' || p === 'task') {
    return {
      moduleName: 'Modul Proyek & Biaya Proyek',
      flowDescription: 'Anggaran proyek terikat pada kontrak pelanggan dan posting beban:',
      steps: [
        'Rincian aktivitas dicatat melalui tombol "+ Tambah Tugas".',
        'Pengeluaran proyek dicatat lewat tombol "+ Catat Biaya Proyek" dengan akun beban terkait.',
        'Pencatatan biaya otomatis membukukan jurnal beban dan hutang usaha.',
      ],
      actionTip: 'Gunakan tombol "+ Tambah Tugas" atau "+ Catat Biaya" pada tab proyek terkait.',
    };
  }

  return {
    moduleName: 'Data Transaksi Terverifikasi',
    flowDescription: 'Data ini terhubung dengan alur bisnis terpusat dan dilindungi sistem:',
    steps: [
      'Data bersumber langsung dari basis data transaksi resmi (PostgreSQL).',
      'Perubahan status mengikuti matriks persetujuan (Approval Matrix) dan peran wewenang.',
      'Sistem mencatat riwayat audit lengkap (siapa, kapan, dan perubahan apa yang dibuat).',
    ],
    actionTip: 'Gunakan tombol aksi resmi (seperti Tambah, Proses, atau Approval) yang tersedia di bilah aksi halaman ini.',
  };
}

/**
 * Display a SweetAlert-style interactive modal when a user attempts to edit
 * a locked/authoritative transaction record directly in the table.
 */
export function showLockedTransactionModal(options?: LockedModalOptions): Promise<void> {
  if (activeLockedModal) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const route = options?.route || '';
    const panel = options?.panel || '';
    const context = getModuleContext(route, panel);

    const overlay = document.createElement('div');
    overlay.className = 'sop-modal-overlay';
    activeLockedModal = overlay;

    const card = document.createElement('div');
    card.className = 'sop-swal-card';

    card.innerHTML = `
      <div class="sop-swal-icon-wrapper">
        <iconify-icon noobserver icon="lucide:lock"></iconify-icon>
      </div>

      <h3 class="sop-swal-title">${escapeHtml(options?.title || 'Data Transaksi Terkunci')}</h3>

      <p class="sop-swal-text">
        ${escapeHtml(options?.message || 'Data transaksi ini terkunci otomatis demi kepatuhan pembukuan. Gunakan alur/tombol resmi transaksi terkait untuk memperbarui.')}
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
            <li><strong>Integritas Pembukuan &amp; Audit Trail:</strong> Baris data ini telah tercatat secara resmi di basis data transaksi (PostgreSQL). Pengeditan manual langsung di sel tabel dinonaktifkan untuk mencegah ketidaksesuaian data dan memenuhi standar audit.</li>
            <li><strong>Keseimbangan Buku Besar &amp; Stok:</strong> Setiap transaksi terikat dengan pembukuan berpasangan (<em>double-entry ledger</em>), mutasi kas/bank, atau kartu stok otomatis.</li>
          </ul>
        </div>

        <div class="sop-reason-section">
          <div class="sop-reason-heading">
            <iconify-icon noobserver icon="lucide:git-branch" style="color:#0284c7"></iconify-icon>
            Alur Resmi yang Berlaku:
          </div>
          <p style="margin:0 0 6px;color:#475569">${escapeHtml(context.flowDescription)}</p>
          <ul class="sop-reason-list">
            ${context.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
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

    const toggleBtn = card.querySelector<HTMLButtonElement>('#sop-toggle-reason');
    const reasonPanel = card.querySelector<HTMLElement>('#sop-reason-panel');
    const understandBtn = card.querySelector<HTMLButtonElement>('#sop-btn-understand');
    const btnText = toggleBtn?.querySelector<HTMLElement>('.btn-text');

    let isExpanded = false;
    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      isExpanded = !isExpanded;
      if (isExpanded) {
        reasonPanel?.classList.add('visible');
        toggleBtn.classList.add('expanded');
        if (btnText) btnText.textContent = 'Sembunyikan Alasan & Alur';
      } else {
        reasonPanel?.classList.remove('visible');
        toggleBtn.classList.remove('expanded');
        if (btnText) btnText.textContent = 'Lihat Alasan & Alur Resmi';
      }
    });

    const close = () => {
      overlay.remove();
      activeLockedModal = null;
      document.removeEventListener('keydown', onEsc);
      resolve();
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') close();
    };
    document.addEventListener('keydown', onEsc);

    understandBtn?.addEventListener('click', () => close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  });
}


