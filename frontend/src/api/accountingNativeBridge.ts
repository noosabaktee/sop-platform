import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';
import {showFormModal, showSelectModal, showConfirmModal} from './modalHelper';

type Account={id:string;code:string;name:string;type:string};

/** Posts balanced manual journals from the existing Accounting toolbar. */
export class AccountingNativeBridge {
 private working=false;
 private listener=(event:MouseEvent)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||String(error)))};
 constructor(private readonly operational:OperationalProjectionBridge){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private notice(message:string){
  const toast=document.querySelector<HTMLElement>('[data-page-id="finance"] .toast');
  if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,5500)}else window.alert(message);
 }
 private ulid(){
  const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';let time=Date.now();let prefix='';
  for(let i=0;i<10;i++){prefix=alphabet[time%32]+prefix;time=Math.floor(time/32)}
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  return prefix+[...bytes].map(byte=>alphabet[byte%32]).join('');
 }
 private async handle(event:MouseEvent){
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-bd-act="add"]');
  if(!button||!button.closest('[data-page-id="finance"] [data-bd-panel="accounting"]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(this.working)return;
  this.working=true;button.disabled=true;document.body.classList.add('sop-api-busy');
  try{
   const action = await showSelectModal({
     title: 'Aksi Akuntansi & Keuangan',
     icon: 'lucide:book-open',
     subtitle: 'Pilih jenis transaksi akuntansi yang ingin diproses:',
     defaultValue: '1',
     options: [
       {
         value: '1',
         label: 'Input Jurnal Manual (General Journal)',
         description: 'Catat transaksi penyesuaian atau mutasi jurnal debit dan kredit berimbang.',
         badge: 'Jurnal',
       },
       {
         value: '2',
         label: 'Posting Tagihan Vendor (Vendor Bill)',
         description: 'Akui tagihan utang usaha dari dokumen penerimaan barang (Goods Receipt).',
         badge: 'Tagihan',
       },
       {
         value: '3',
         label: 'Bayar Tagihan Vendor (Bill Payment)',
         description: 'Catat pelunasan tagihan vendor melalui kas atau rekening bank.',
         badge: 'Pembayaran',
       },
       {
         value: '4',
         label: 'Tutup Periode Akuntansi (Closing Period)',
         description: 'Kunci periode pembukuan agar tidak ada perubahan transaksi di masa lalu.',
         badge: 'Tutup Buku',
       },
     ],
     submitText: 'Lanjutkan',
   });
   if(action===null)return;
   if(action==='2'){await this.postVendorBill();await this.refresh();return;}
   if(action==='3'){await this.payVendorBill();await this.refresh();return;}
   if(action==='4'){await this.closePeriod();return;}

   const accounts=(await api.get('/api/v1/operational/accounting/options')).data.data.accounts as Account[];
   if(accounts.length<2)throw new Error('Minimal dua akun COA aktif diperlukan.');

   const today = new Date().toISOString().slice(0, 10);
   const formValues = await showFormModal<{
     description: string;
     amount: number;
     debit_id: string;
     credit_id: string;
     date: string;
   }>({
     title: 'Input Jurnal Manual Berimbang',
     icon: 'lucide:scale',
     submitText: 'Posting Jurnal',
     fields: [
       {
         name: 'description',
         label: 'Deskripsi / Keterangan Transaksi',
         type: 'text',
         required: true,
         placeholder: 'Contoh: Penyesuaian beban listrik dan air bulan berjalan',
       },
       {
         name: 'amount',
         label: 'Nilai Transaksi (Rp)',
         type: 'number',
         required: true,
         min: 1,
         step: 0.01,
         placeholder: 'Contoh: 2500000',
         halfWidth: true,
       },
       {
         name: 'date',
         label: 'Tanggal Posting',
         type: 'date',
         required: true,
         value: today,
         halfWidth: true,
       },
       {
         name: 'debit_id',
         label: 'Akun DEBIT (+ Aset / Beban)',
         type: 'select',
         required: true,
         options: accounts.map(a => ({value: a.id, label: `${a.code} — ${a.name} (${a.type})`})),
       },
       {
         name: 'credit_id',
         label: 'Akun KREDIT (+ Kewajiban / Modal / Pendapatan)',
         type: 'select',
         required: true,
         options: accounts.map(a => ({value: a.id, label: `${a.code} — ${a.name} (${a.type})`})),
       },
     ],
   });

   if (!formValues) return;
   if (formValues.debit_id === formValues.credit_id) {
     throw new Error('Akun debit dan kredit harus berbeda.');
   }
   if (!formValues.amount || formValues.amount <= 0) {
     throw new Error('Nilai jurnal harus positif.');
   }

   await api.post('/api/v1/operational/accounting/journal',{
    date: formValues.date,
    description: formValues.description.trim(),
    source_id: this.ulid(),
    lines: [
      {account_id: formValues.debit_id, debit: String(formValues.amount), credit: '0.00'},
      {account_id: formValues.credit_id, debit: '0.00', credit: String(formValues.amount)},
    ],
   });
   await this.refresh();
   this.notice('Jurnal umum berimbang berhasil diposting ke General Ledger.');
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
 private async refresh(){await this.operational.refresh();window.dispatchEvent(new Event('sop:domain-updated'));}

 private async postVendorBill(){
  const data=(await api.get('/api/v1/operational/payables/options')).data.data as {receipts:Array<{id:string;number:string;vendor:string;received_at:string}>};
  if(!data.receipts.length)throw new Error('Tidak ada Goods Receipt yang dapat ditagihkan.');

  const receiptId = await showSelectModal({
    title: 'Pilih Goods Receipt',
    icon: 'lucide:file-text',
    subtitle: 'Pilih bukti penerimaan barang yang akan diposting tagihannya:',
    options: data.receipts.map(r => ({
      value: r.id,
      label: `${r.number} — ${r.vendor}`,
      badge: r.received_at,
    })),
    submitText: 'Lanjutkan',
  });
  if(!receiptId) return;

  const receipt = data.receipts.find(r => r.id === receiptId);
  if(!receipt) return;

  const detail=(await api.get(`/api/v1/operational/procurement/receipts/${receipt.id}`)).data.data as {lines:Array<{id:string;product:string;billable_quantity:string}>};
  const eligibleLines = detail.lines.filter(l => Number(l.billable_quantity) > 0);
  if (!eligibleLines.length) throw new Error('Semua barang dalam Goods Receipt ini sudah ditagihkan.');

  const defaultDueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const billFields = [
    {
      name: 'due_date',
      label: 'Tanggal Jatuh Tempo Tagihan',
      type: 'date' as const,
      value: defaultDueDate,
    },
    ...eligibleLines.map(line => ({
      name: `qty_${line.id}`,
      label: `Kuantitas Ditagih: ${line.product} (Maks: ${Number(line.billable_quantity).toFixed(2)})`,
      type: 'number' as const,
      required: true,
      min: 0,
      max: Number(line.billable_quantity),
      step: 0.01,
      value: Number(line.billable_quantity),
    })),
  ];

  const billValues = await showFormModal<Record<string, any>>({
    title: `Posting Tagihan Vendor (${receipt.number})`,
    icon: 'lucide:receipt',
    submitText: 'Posting Tagihan',
    fields: billFields,
  });
  if(!billValues) return;

  const lines: Array<{goods_receipt_line_id: string; quantity: string}> = [];
  for (const line of eligibleLines) {
    const qty = Number(billValues[`qty_${line.id}`] || 0);
    if (qty > 0) {
      lines.push({goods_receipt_line_id: line.id, quantity: String(qty)});
    }
  }
  if (!lines.length) throw new Error('Minimal harus ada 1 kuantitas barang yang ditagihkan.');

  await api.post('/api/v1/operational/payables/bills', {
    goods_receipt_id: receipt.id,
    due_date: billValues.due_date || undefined,
    lines,
    idempotency_key:`ui-vendor-bill-${crypto.randomUUID()}`
  });
  this.notice(`Tagihan vendor untuk ${receipt.number} berhasil diposting ke utang usaha.`);
 }

 private async payVendorBill(){
  const data=(await api.get('/api/v1/operational/payables/options')).data.data as {bills:Array<{id:string;number:string;vendor:string;amount:string;paid_amount:string}>;banks:Array<{id:string;name:string}>};
  if(!data.bills.length)throw new Error('Tidak ada tagihan vendor yang masih terbuka.');

  const billId = await showSelectModal({
    title: 'Pilih Tagihan Vendor',
    icon: 'lucide:file-spreadsheet',
    subtitle: 'Pilih faktur tagihan yang akan dibayarkan:',
    options: data.bills.map(b => {
      const remaining = Number(b.amount) - Number(b.paid_amount);
      return {
        value: b.id,
        label: `${b.number} — ${b.vendor}`,
        description: `Sisa tagihan: Rp ${remaining.toLocaleString('id-ID', {minimumFractionDigits: 2})}`,
      };
    }),
    submitText: 'Lanjutkan',
  });
  if(!billId) return;

  const bill = data.bills.find(b => b.id === billId);
  if(!bill) return;

  const outstanding = Number(bill.amount) - Number(bill.paid_amount);
  const today = new Date().toISOString().slice(0, 10);

  const bankOptions = [
    {value: '', label: 'Kas Operasional / Kas Kecil'},
    ...data.banks.map(bank => ({value: bank.id, label: bank.name})),
  ];

  const paymentValues = await showFormModal<{
    amount: number;
    bank_account_id?: string;
    paid_at: string;
    reference?: string;
  }>({
    title: `Pembayaran Tagihan (${bill.number})`,
    icon: 'lucide:credit-card',
    submitText: 'Proses Pembayaran',
    fields: [
      {
        name: 'outstanding_info',
        label: 'Sisa Tagihan Belum Dibayar',
        type: 'text',
        readOnly: true,
        value: `Rp ${outstanding.toLocaleString('id-ID', {minimumFractionDigits: 2})}`,
      },
      {
        name: 'amount',
        label: 'Jumlah Pembayaran (Rp)',
        type: 'number',
        required: true,
        min: 1,
        max: outstanding,
        step: 0.01,
        value: outstanding,
        halfWidth: true,
      },
      {
        name: 'paid_at',
        label: 'Tanggal Pembayaran',
        type: 'date',
        required: true,
        value: today,
        halfWidth: true,
      },
      {
        name: 'bank_account_id',
        label: 'Sumber Dana (Rekening Bank / Kas)',
        type: 'select',
        options: bankOptions,
      },
      {
        name: 'reference',
        label: 'Nomor Referensi Transaksi (Opsional)',
        type: 'text',
        placeholder: 'Contoh: TRF-MANDIRI-449102',
      },
    ],
  });
  if(!paymentValues) return;

  await api.post(`/api/v1/operational/payables/bills/${bill.id}/payments`,{
    amount: String(paymentValues.amount),
    paid_at: paymentValues.paid_at,
    bank_account_id: paymentValues.bank_account_id || undefined,
    reference: paymentValues.reference?.trim() || undefined,
    idempotency_key:`ui-vendor-pay-${crypto.randomUUID()}`
  });
  this.notice(`Pembayaran ${bill.number} berhasil diposting ke buku besar.`);
 }

 private async closePeriod(){
  const defaultDate=new Date().toISOString().slice(0,10);
  const formValues = await showFormModal<{starts_on: string; ends_on: string; note?: string}>({
    title: 'Tutup Periode Akuntansi',
    icon: 'lucide:lock',
    iconColor: '#dc2626',
    subtitle: 'Kunci pembukuan akuntansi untuk mencegah perubahan transaksi pada periode yang telah diaudit:',
    submitText: 'Tutup Periode',
    fields: [
      {
        name: 'starts_on',
        label: 'Awal Periode Pembukuan',
        type: 'date',
        required: true,
        value: defaultDate,
        halfWidth: true,
      },
      {
        name: 'ends_on',
        label: 'Akhir Periode Pembukuan',
        type: 'date',
        required: true,
        value: defaultDate,
        halfWidth: true,
      },
      {
        name: 'note',
        label: 'Catatan Penutupan Periode (Opsional)',
        type: 'textarea',
        placeholder: 'Contoh: Tutup buku akhir bulan dan audit internal selesai.',
      },
    ],
  });
  if(!formValues) return;

  const confirmed = await showConfirmModal({
    title: 'Konfirmasi Penutupan Periode',
    message: `Tutup periode ${formValues.starts_on} s.d. ${formValues.ends_on}? Semua posting jurnal dan transaksi baru pada rentang tanggal tersebut akan ditolak oleh sistem.`,
    confirmText: 'Ya, Tutup Periode Sekarang',
    isDanger: true,
  });
  if(!confirmed) return;

  await api.post('/api/v1/operational/accounting/periods',{
    starts_on: formValues.starts_on,
    ends_on: formValues.ends_on,
    note: formValues.note?.trim() || undefined,
  });
  this.notice(`Periode ${formValues.starts_on} s.d. ${formValues.ends_on} berhasil ditutup.`);
 }
}
