import {api} from './client';
import {showFormModal} from './modalHelper';

type Project = {id: string; code: string; name: string};
const categories = [
  {value: 'material', label: 'Material / Bahan Baku'},
  {value: 'labor', label: 'Tenaga Kerja / Labor'},
  {value: 'expense', label: 'Operasional / Expense'},
  {value: 'service', label: 'Jasa Pihak Ketiga / Service'},
  {value: 'other', label: 'Lainnya / Other'},
];

/** Posts authoritative project costs and atomic double-entry ledger entries from the Project Cost toolbar. */
export class ProjectCostNativeBridge {
  private working = false;
  private readonly listener = (event: MouseEvent) => {
    void this.handle(event).catch((error: unknown) => {
      const e = error as {response?: {data?: {message?: string}}};
      this.notice(e.response?.data?.message || String(error));
    });
  };

  constructor(private readonly refresh: () => Promise<unknown>) {}

  install() {
    document.addEventListener('click', this.listener, true);
  }

  uninstall() {
    document.removeEventListener('click', this.listener, true);
  }

  private notice(message: string) {
    const toast = document.querySelector<HTMLElement>('[data-page-id="projects"] .toast');
    if (toast) {
      toast.textContent = message;
      toast.hidden = false;
      setTimeout(() => (toast.hidden = true), 5500);
    } else {
      window.alert(message);
    }
  }

  private async handle(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-bd-act="add"]');
    if (!button || !button.closest('[data-page-id="projects"] [data-bd-panel="cost"]')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.working) return;

    this.working = true;
    button.disabled = true;
    document.body.classList.add('sop-api-busy');

    try {
      const projects = (await api.get('/api/v1/operational/projects')).data.data.projects as Project[];
      if (!projects.length) throw new Error('Belum ada project untuk menerima biaya.');

      button.disabled = false;
      document.body.classList.remove('sop-api-busy');

      const defaultRef = `COST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const today = new Date().toISOString().slice(0, 10);

      const formValues = await showFormModal<{
        project_id: string;
        category: string;
        amount: number;
        cost_date: string;
        payment_method: string;
        reference: string;
        description: string;
      }>({
        title: 'Catat Biaya Proyek (Project Cost)',
        icon: 'lucide:receipt',
        submitText: 'Simpan & Posting Biaya',
        fields: [
          {
            name: 'project_id',
            label: 'Pilih Proyek',
            type: 'select',
            required: true,
            options: projects.map(p => ({value: p.id, label: `${p.code} — ${p.name}`})),
            halfWidth: true,
          },
          {
            name: 'category',
            label: 'Kategori Biaya',
            type: 'select',
            required: true,
            options: categories,
            halfWidth: true,
          },
          {
            name: 'amount',
            label: 'Nilai Biaya (Rp)',
            type: 'number',
            required: true,
            min: 1,
            step: 0.01,
            placeholder: 'Contoh: 15000000',
            halfWidth: true,
          },
          {
            name: 'cost_date',
            label: 'Tanggal Biaya',
            type: 'date',
            required: true,
            value: today,
            halfWidth: true,
          },
          {
            name: 'payment_method',
            label: 'Metode Pembayaran / Akun Lawan',
            type: 'select',
            required: true,
            options: [
              {value: 'cash', label: 'Kas / Bank (1100)'},
              {value: 'payable', label: 'Hutang Usaha / Operasional (2100)'},
            ],
            halfWidth: true,
          },
          {
            name: 'reference',
            label: 'Nomor Referensi',
            type: 'text',
            required: true,
            value: defaultRef,
            halfWidth: true,
          },
          {
            name: 'description',
            label: 'Deskripsi Biaya',
            type: 'textarea',
            required: true,
            placeholder: 'Jelaskan rincian pengeluaran biaya proyek ini...',
            helpText: 'Sistem akan otomatis mencatat biaya dan memposting jurnal ke General Ledger.',
          },
        ],
      });

      if (!formValues) return;

      if (!formValues.amount || formValues.amount <= 0) {
        throw new Error('Nilai biaya tidak valid.');
      }

      button.disabled = true;
      document.body.classList.add('sop-api-busy');

      const res = await api.post('/api/v1/operational/projects/costs', {
        project_id: formValues.project_id,
        reference: formValues.reference.trim(),
        cost_date: formValues.cost_date,
        category: formValues.category,
        description: formValues.description.trim(),
        amount: String(formValues.amount),
        payment_method: formValues.payment_method,
        post_to_ledger: true,
      });

      const journalNum = res.data.data?.journal_number;
      await this.refresh();
      window.dispatchEvent(new Event('sop:domain-updated'));

      const journalInfo = journalNum ? ` (Jurnal: ${journalNum})` : '';
      this.notice(`Biaya project tersimpan dan jurnal akuntansi otomatis diposting ke General Ledger${journalInfo}.`);
    } finally {
      this.working = false;
      button.disabled = false;
      document.body.classList.remove('sop-api-busy');
    }
  }
}
