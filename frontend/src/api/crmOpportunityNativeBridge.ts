import {api} from './client';
import type {GridBridge} from './gridBridge';

type Option = {id: string; name: string; code?: string};
type Opportunity = {id: string; name: string; customer: string; owner: string | null; amount: string; probability: number; stage: string};
type Tender = {id: string; code: string; name: string; client: string; value: string; deadline: string | null; bid: string; status: string; owner_name: string | null; project_code: string | null};
type Proposal = {id: string; code: string; name: string; client: string; template: string; version: string; status: string; owner_name: string | null; value: string};

const title = (value: string) => value.replace(/\b\w/g, c => c.toUpperCase());

/** Connects Business Development opportunities, tenders, and proposals to PostgreSQL domain workflows. */
export class CrmOpportunityNativeBridge {
  private listener = (event: Event) => {
    void this.handle(event).catch(error => this.notice(error?.response?.data?.message || String(error)));
  };

  constructor(private readonly grid: GridBridge) {}

  install() {
    document.addEventListener('click', this.listener, true);
    document.addEventListener('change', this.listener, true);
    void this.refresh();
  }

  uninstall() {
    document.removeEventListener('click', this.listener, true);
    document.removeEventListener('change', this.listener, true);
  }

  private notice(message: string) {
    const toast = document.querySelector<HTMLElement>('[data-page-id="business-development"] .toast');
    if (toast) {
      toast.textContent = message;
      toast.hidden = false;
      setTimeout(() => (toast.hidden = true), 5500);
    } else {
      window.alert(message);
    }
  }

  async refresh() {
    await Promise.all([this.refreshOpportunities(), this.refreshTenders(), this.refreshProposals()]);
  }

  private async refreshOpportunities() {
    try {
      const rows = (await api.get('/api/v1/operational/crm/opportunities')).data.data as Opportunity[];
      this.grid.mergeDomainRows('/business-development', 'opportunities', 'db-', rows.map(item => ({
        __id: 'db-' + item.id,
        name: item.name,
        market: item.customer,
        value: Number(item.amount) / 1_000_000,
        prob: item.probability,
        owner: item.owner || '—',
        status: title(item.stage),
      })));
    } catch (e) {
      console.error('Gagal memuat CRM opportunities:', e);
    }
  }

  private async refreshTenders() {
    try {
      const rows = (await api.get('/api/v1/operational/bd/tenders')).data.data as Tender[];
      this.grid.mergeDomainRows('/business-development', 'tender', 'db-', rows.map(item => ({
        __id: 'db-' + item.id,
        name: item.name,
        client: item.client,
        value: Number(item.value) / 1_000_000,
        deadline: item.deadline || '—',
        bid: item.bid,
        status: item.status,
      })));
    } catch (e) {
      console.error('Gagal memuat BD tenders:', e);
    }
  }

  private async refreshProposals() {
    try {
      const rows = (await api.get('/api/v1/operational/bd/proposals')).data.data as Proposal[];
      this.grid.mergeDomainRows('/business-development', 'proposal', 'db-', rows.map(item => ({
        __id: 'db-' + item.id,
        name: item.name,
        client: item.client,
        template: item.template,
        version: item.version,
        owner: item.owner_name || '—',
        status: item.status,
      })));
    } catch (e) {
      console.error('Gagal memuat BD proposals:', e);
    }
  }

  private async handle(event: Event) {
    const target = event.target as HTMLElement;

    // 1. Handle Status Changes
    const stage = target.closest<HTMLSelectElement>('select[data-bd-key="status"][data-bd-id]');
    if (stage && event.type === 'change' && stage.dataset.bdId?.startsWith('db-')) {
      const id = stage.dataset.bdId.slice(3);

      if (stage.closest('[data-page-id="business-development"] [data-bd-panel="opportunities"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const value = stage.value.toLowerCase();
        await api.patch(`/api/v1/operational/crm/opportunities/${id}`, {stage: value});
        if (value === 'won' && window.confirm('Opportunity Won. Buat Project dari opportunity ini sekarang?')) {
          const result = await api.post(`/api/v1/operational/crm/opportunities/${id}/project`, {});
          this.notice(`Project ${result.data.data.code} dibuat dari opportunity Won.`);
        } else {
          this.notice('Stage opportunity diperbarui.');
        }
        await this.refresh();
        window.dispatchEvent(new Event('sop:domain-updated'));
        return;
      }

      if (stage.closest('[data-page-id="business-development"] [data-bd-panel="tender"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const status = stage.value;
        await api.patch(`/api/v1/operational/bd/tenders/${id}/status`, {status});
        if (status.toLowerCase() === 'won' && window.confirm('Tender berstatus Won! Buat Project dari tender ini sekarang?')) {
          const result = await api.post(`/api/v1/operational/bd/tenders/${id}/project`, {});
          this.notice(`Project ${result.data.data.code} dibuat dari tender Won.`);
        } else {
          this.notice(`Status tender diperbarui menjadi ${status}.`);
        }
        await this.refresh();
        window.dispatchEvent(new Event('sop:domain-updated'));
        return;
      }

      if (stage.closest('[data-page-id="business-development"] [data-bd-panel="proposal"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const status = stage.value;
        await api.patch(`/api/v1/operational/bd/proposals/${id}/status`, {status});
        this.notice(`Status proposal diperbarui menjadi ${status}.`);
        await this.refresh();
        window.dispatchEvent(new Event('sop:domain-updated'));
        return;
      }
    }

    // 2. Handle Add Actions
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-bd-act="add"]');
    if (!button) return;

    if (button.closest('[data-page-id="business-development"] [data-bd-panel="opportunities"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;
      document.body.classList.add('sop-api-busy');
      try {
        const options = (await api.get('/api/v1/operational/crm/options')).data.data as {customers: Option[]; owners: Option[]};
        if (!options.customers.length) throw new Error('Tambahkan customer aktif di Master Data terlebih dahulu.');
        const customer = options.customers[(Number(window.prompt(options.customers.map((item, index) => `${index + 1}. ${item.code || ''} ${item.name}`).join('\n'), '1')) || 1) - 1];
        if (!customer) return;
        const name = window.prompt('Nama opportunity:');
        if (!name?.trim()) return;
        const amount = window.prompt('Nilai opportunity (Rp):', '0');
        if (!amount || !/^\d{1,14}(?:\.\d{1,2})?$/.test(amount.trim())) throw new Error('Nilai opportunity tidak valid.');
        const probability = window.prompt('Probabilitas 0–100:', '20');
        if (!probability || !/^\d{1,3}$/.test(probability) || Number(probability) > 100) throw new Error('Probabilitas harus 0–100.');
        const stages = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
        const stageVal = stages[(Number(window.prompt(stages.map((item, index) => `${index + 1}. ${title(item)}`).join('\n'), '1')) || 1) - 1];
        if (!stageVal) return;
        const owner = options.owners[(Number(window.prompt(options.owners.map((item, index) => `${index + 1}. ${item.name}`).join('\n'), '1')) || 1) - 1];
        await api.post('/api/v1/operational/crm/opportunities', {
          customer_id: customer.id,
          name: name.trim(),
          amount: amount.trim(),
          probability: Number(probability),
          stage: stageVal,
          owner_id: owner?.id,
        });
        await this.refresh();
        window.dispatchEvent(new Event('sop:domain-updated'));
        this.notice('Opportunity tersimpan ke PostgreSQL.');
      } finally {
        button.disabled = false;
        document.body.classList.remove('sop-api-busy');
      }
      return;
    }

    if (button.closest('[data-page-id="business-development"] [data-bd-panel="tender"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;
      document.body.classList.add('sop-api-busy');
      try {
        const name = window.prompt('Nama Tender:');
        if (!name?.trim()) return;
        const client = window.prompt('Nama Client / Instansi:');
        if (!client?.trim()) return;
        const valJt = window.prompt('Estimasi Nilai Tender (juta Rp):', '1000');
        if (!valJt || isNaN(Number(valJt))) throw new Error('Nilai tender tidak valid.');
        const deadline = window.prompt('Batas Waktu / Deadline (YYYY-MM-DD):', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
        const bids = ['Bid', 'No-bid', 'Pending'];
        const bidChoice = bids[(Number(window.prompt(bids.map((b, i) => `${i + 1}. ${b}`).join('\n'), '1')) || 1) - 1] || 'Pending';

        await api.post('/api/v1/operational/bd/tenders', {
          name: name.trim(),
          client: client.trim(),
          value: Number(valJt) * 1_000_000,
          deadline: deadline || null,
          bid: bidChoice,
          status: 'Open',
        });

        await this.refresh();
        window.dispatchEvent(new Event('sop:domain-updated'));
        this.notice('Tender berhasil ditambahkan ke PostgreSQL.');
      } finally {
        button.disabled = false;
        document.body.classList.remove('sop-api-busy');
      }
      return;
    }

    if (button.closest('[data-page-id="business-development"] [data-bd-panel="proposal"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;
      document.body.classList.add('sop-api-busy');
      try {
        const name = window.prompt('Judul / Nama Proposal:');
        if (!name?.trim()) return;
        const client = window.prompt('Client:');
        if (!client?.trim()) return;
        const templates = ['ERP Proposal', 'Tender Proposal', 'Partnership Proposal'];
        const tpl = templates[(Number(window.prompt(templates.map((t, i) => `${i + 1}. ${t}`).join('\n'), '1')) || 1) - 1] || 'ERP Proposal';
        const valJt = window.prompt('Nilai Proposal (juta Rp):', '500');

        await api.post('/api/v1/operational/bd/proposals', {
          name: name.trim(),
          client: client.trim(),
          template: tpl,
          version: 'v1',
          status: 'Draft',
          value: Number(valJt || 0) * 1_000_000,
        });

        await this.refresh();
        window.dispatchEvent(new Event('sop:domain-updated'));
        this.notice('Proposal berhasil dibuat di PostgreSQL.');
      } finally {
        button.disabled = false;
        document.body.classList.remove('sop-api-busy');
      }
      return;
    }
  }
}
