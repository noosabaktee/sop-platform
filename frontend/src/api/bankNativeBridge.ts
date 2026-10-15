import {api} from './client';
import {showFormModal, showSelectModal} from './modalHelper';

type Account={id:string;code:string;name:string;type:string};
type Bank={id:string;name:string;account_number:string|null;currency:string};

/** Creates bank accounts and imports statement lines via the existing Cash & Bank toolbar. */
export class BankNativeBridge {
 private working=false;
 private listener=(event:MouseEvent)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||String(error)))};
 constructor(private readonly refresh:()=>Promise<unknown>){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private notice(message:string){
  const toast=document.querySelector<HTMLElement>('[data-page-id="finance"] .toast');
  if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,5500)}else window.alert(message);
 }
 private async handle(event:MouseEvent){
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-bd-act="add"]');
  if(!button||!button.closest('[data-page-id="finance"] [data-bd-panel="cash"]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(this.working)return;
  this.working=true;button.disabled=true;document.body.classList.add('sop-api-busy');
  try{
   const choice = await showSelectModal({
     title: 'Aksi Kas & Rekening Bank',
     icon: 'lucide:landmark',
     subtitle: 'Pilih transaksi perbankan yang ingin dilakukan:',
     defaultValue: '1',
     options: [
       {
         value: '1',
         label: 'Tambah Akun / Rekening Bank Baru',
         description: 'Daftarkan nomor rekening bank perusahaan yang terhubung ke COA.',
         badge: 'Akun Baru',
       },
       {
         value: '2',
         label: 'Impor Mutasi Rekening Bank (Statement)',
         description: 'Catat mutasi arus kas masuk atau keluar dari rekening koran bank.',
         badge: 'Mutasi',
       },
       {
         value: '3',
         label: 'Rekonsiliasi Mutasi dengan Jurnal Akuntansi',
         description: 'Cocokkan mutasi kas riil perbankan dengan catatan jurnal pembukuan sistem.',
         badge: 'Rekonsiliasi',
       },
     ],
     submitText: 'Lanjutkan',
   });
   if(choice===null)return;
   if(choice==='1')await this.createAccount();
   else if(choice==='2')await this.importStatement();
   else if(choice==='3')await this.reconcile();
   await this.refresh();window.dispatchEvent(new Event('sop:domain-updated'));
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
 private async createAccount(){
  const accounts=(await api.get('/api/v1/operational/accounting/options')).data.data.accounts as Account[];
  const assets=accounts.filter(item=>item.type==='asset');
  if(!assets.length)throw new Error('Tidak ada akun aset yang dapat digunakan sebagai akun bank.');

  const formValues = await showFormModal<{
    coa_id: string;
    name: string;
    account_number?: string;
    currency: string;
  }>({
    title: 'Tambah Rekening Bank Perusahaan',
    icon: 'lucide:landmark',
    submitText: 'Simpan Akun Bank',
    fields: [
      {
        name: 'coa_id',
        label: 'Tautkan Akun COA (Chart of Accounts)',
        type: 'select',
        required: true,
        options: assets.map(a => ({value: a.id, label: `${a.code} — ${a.name}`})),
      },
      {
        name: 'name',
        label: 'Nama Bank & Cabang',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Bank BCA KCU Sudirman',
      },
      {
        name: 'account_number',
        label: 'Nomor Rekening Bank (Opsional)',
        type: 'text',
        placeholder: 'Contoh: 123-456-7890',
        halfWidth: true,
      },
      {
        name: 'currency',
        label: 'Mata Uang',
        type: 'text',
        required: true,
        value: 'IDR',
        placeholder: 'IDR',
        halfWidth: true,
      },
    ],
  });
  if(!formValues) return;

  const currency = formValues.currency.trim().toUpperCase();
  if(!/^[A-Z]{3}$/.test(currency)) throw new Error('Mata uang harus kode ISO tiga huruf (contoh: IDR, USD).');

  await api.post('/api/v1/operational/banks',{
    coa_id: formValues.coa_id,
    name: formValues.name.trim(),
    account_number: formValues.account_number?.trim() || undefined,
    currency,
  });
  this.notice('Akun rekening bank berhasil disimpan.');
 }
 private async importStatement(){
  const banks=(await api.get('/api/v1/operational/banks')).data.data.accounts as Bank[];
  if(!banks.length)throw new Error('Buat akun bank terlebih dahulu.');

  const today = new Date().toISOString().slice(0, 10);
  const defaultRef = `TRX-${Date.now().toString().slice(-6)}`;

  const formValues = await showFormModal<{
    bank_id: string;
    reference: string;
    amount: number;
    value_date: string;
    description?: string;
  }>({
    title: 'Impor Mutasi Rekening Bank',
    icon: 'lucide:arrow-down-up',
    submitText: 'Simpan Mutasi',
    fields: [
      {
        name: 'bank_id',
        label: 'Pilih Rekening Bank',
        type: 'select',
        required: true,
        options: banks.map(b => ({
          value: b.id,
          label: `${b.name} (${b.currency})${b.account_number ? ' — ' + b.account_number : ''}`,
        })),
      },
      {
        name: 'amount',
        label: 'Nilai Mutasi (Rp)',
        type: 'number',
        required: true,
        step: 0.01,
        placeholder: '+ Masuk atau - Keluar',
        helpText: 'Gunakan angka positif (+) untuk dana masuk/kredit, negatif (-) untuk dana keluar/debit.',
        halfWidth: true,
      },
      {
        name: 'value_date',
        label: 'Tanggal Mutasi Transaksi',
        type: 'date',
        required: true,
        value: today,
        halfWidth: true,
      },
      {
        name: 'reference',
        label: 'Nomor Referensi Transaksi Bank',
        type: 'text',
        required: true,
        value: defaultRef,
      },
      {
        name: 'description',
        label: 'Keterangan Mutasi (Opsional)',
        type: 'textarea',
        placeholder: 'Contoh: Penerimaan pembayaran termin 1 via transfer ATM...',
      },
    ],
  });
  if(!formValues) return;

  if(formValues.amount === 0) throw new Error('Nilai mutasi tidak boleh 0.');

  await api.post(`/api/v1/operational/banks/${formValues.bank_id}/statements`,{
    reference: formValues.reference.trim(),
    amount: String(formValues.amount),
    value_date: formValues.value_date,
    description: formValues.description?.trim() || undefined,
  });
  this.notice('Mutasi bank berhasil disimpan. Silakan lanjutkan rekonsiliasi dengan jurnal akuntansi.');
 }
 private async reconcile(){
  const data=(await api.get('/api/v1/operational/banks')).data.data as {lines:Array<{id:string;reference:string;amount:string;account_name:string;journal_line_id:string|null}>};
  const pending=data.lines.filter(item=>!item.journal_line_id);
  if(!pending.length)throw new Error('Tidak ada mutasi bank yang menunggu rekonsiliasi.');

  const statementId = await showSelectModal({
    title: 'Pilih Mutasi Bank untuk Rekonsiliasi',
    icon: 'lucide:git-compare',
    subtitle: 'Pilih baris mutasi bank yang belum dicocokkan dengan catatan jurnal:',
    options: pending.map(item => ({
      value: item.id,
      label: `${item.account_name} — Ref: ${item.reference}`,
      description: `Nilai mutasi: Rp ${Number(item.amount).toLocaleString('id-ID', {minimumFractionDigits: 2})}`,
      badge: Number(item.amount) >= 0 ? '+ Masuk' : '- Keluar',
    })),
    submitText: 'Cari Jurnal Cocok',
  });
  if(!statementId) return;

  const statement = pending.find(p => p.id === statementId);
  if(!statement) return;

  const candidates=(await api.get(`/api/v1/operational/bank-statements/${statement.id}/candidates`)).data.data as Array<{id:string;number:string;posting_date:string;description:string;debit:string;credit:string}>;
  if(!candidates.length)throw new Error('Tidak ada jurnal posted dengan akun dan nilai yang cocok untuk mutasi ini.');

  const journalId = await showSelectModal({
    title: `Cocokkan Mutasi: ${statement.reference}`,
    icon: 'lucide:check-check',
    subtitle: `Pilih jurnal pembukuan yang sesuai dengan mutasi Rp ${Number(statement.amount).toLocaleString('id-ID', {minimumFractionDigits: 2})}:`,
    options: candidates.map(j => ({
      value: j.id,
      label: `${j.number} (${j.posting_date})`,
      description: `${j.description || 'Tanpa keterangan'} · Debit: Rp ${Number(j.debit).toLocaleString('id-ID')} · Kredit: Rp ${Number(j.credit).toLocaleString('id-ID')}`,
    })),
    submitText: 'Konfirmasi Rekonsiliasi',
  });
  if(!journalId) return;

  const journal = candidates.find(j => j.id === journalId);
  await api.post(`/api/v1/operational/bank-statements/${statement.id}/match`,{journal_line_id:journalId});
  this.notice(`Mutasi ${statement.reference} berhasil direkonsiliasi dengan jurnal ${journal?.number || ''}.`);
 }
}
