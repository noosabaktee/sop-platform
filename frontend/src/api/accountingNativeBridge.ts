import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';

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
   const action=window.prompt('Pilih aksi Accounting:\n1. Jurnal manual\n2. Posting tagihan vendor dari Goods Receipt\n3. Bayar tagihan vendor\n4. Tutup periode akuntansi','1');
   if(action===null)return;
   if(action.trim()==='2'){await this.postVendorBill();await this.refresh();return;}
   if(action.trim()==='3'){await this.payVendorBill();await this.refresh();return;}
   if(action.trim()==='4'){await this.closePeriod();return;}
   if(action.trim()!=='1')throw new Error('Pilih 1, 2, 3, atau 4.');
   const accounts=(await api.get('/api/v1/operational/accounting/options')).data.data.accounts as Account[];
   if(accounts.length<2)throw new Error('Minimal dua akun COA aktif diperlukan.');
   const options=accounts.map((item,index)=>`${index+1}. ${item.code} - ${item.name}`).join('\n');
   const description=window.prompt('Deskripsi jurnal manual:');if(!description?.trim())return;
   const amount=window.prompt('Nilai jurnal (maksimal 2 desimal):');
   if(!amount||!/^\d{1,14}(?:\.\d{1,2})?$/.test(amount.trim())||Number(amount)<=0)throw new Error('Nilai jurnal harus positif dengan maksimal 2 desimal.');
   const debit=accounts[(Number(window.prompt(`Pilih akun DEBIT:\n${options}`,'1'))||1)-1];if(!debit)return;
   const credit=accounts[(Number(window.prompt(`Pilih akun KREDIT:\n${options}`,'2'))||2)-1];if(!credit)return;
   if(debit.id===credit.id)throw new Error('Akun debit dan kredit harus berbeda.');
   const date=window.prompt('Tanggal posting (YYYY-MM-DD):',new Date().toISOString().slice(0,10));
   if(!date)return;
   await api.post('/api/v1/operational/accounting/journal',{
    date,description:description.trim(),source_id:this.ulid(),
    lines:[{account_id:debit.id,debit:amount.trim(),credit:'0.00'},{account_id:credit.id,debit:'0.00',credit:amount.trim()}],
   });
   await this.refresh();this.notice('Jurnal manual balanced telah diposting ke PostgreSQL.');
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
 private async refresh(){await this.operational.refresh();window.dispatchEvent(new Event('sop:domain-updated'));}
 private async postVendorBill(){
  const data=(await api.get('/api/v1/operational/payables/options')).data.data as {receipts:Array<{id:string;number:string;vendor:string;received_at:string}>};
  if(!data.receipts.length)throw new Error('Tidak ada Goods Receipt yang dapat ditagihkan.');
  const receipt=data.receipts[(Number(window.prompt(data.receipts.map((row,index)=>`${index+1}. ${row.number} — ${row.vendor}`).join('\n'),'1'))||1)-1];if(!receipt)return;
  const detail=(await api.get(`/api/v1/operational/procurement/receipts/${receipt.id}`)).data.data as {lines:Array<{id:string;product:string;billable_quantity:string}>};
  const lines:Array<{goods_receipt_line_id:string;quantity:string}>=[];
  for(const line of detail.lines){const remaining=Number(line.billable_quantity);if(remaining<=0)continue;
   const quantity=window.prompt(`Jumlah tagih ${line.product} (maks. ${remaining.toFixed(4)}):`,remaining.toFixed(4));
   if(quantity===null)continue;
   if(!/^\d{1,14}(?:\.\d{1,4})?$/.test(quantity.trim())||Number(quantity)<=0||Number(quantity)>remaining)throw new Error(`Kuantitas ${line.product} tidak valid.`);
   lines.push({goods_receipt_line_id:line.id,quantity:quantity.trim()});
  }
  if(!lines.length)throw new Error('Tidak ada kuantitas Goods Receipt yang dipilih untuk ditagihkan.');
  const dueDate=window.prompt('Jatuh tempo tagihan (YYYY-MM-DD, opsional):')||undefined;
  await api.post('/api/v1/operational/payables/bills',{goods_receipt_id:receipt.id,due_date:dueDate,lines,idempotency_key:`ui-vendor-bill-${crypto.randomUUID()}`});
  this.notice(`Tagihan vendor untuk ${receipt.number} diposting ke utang usaha.`);
 }
 private async payVendorBill(){
  const data=(await api.get('/api/v1/operational/payables/options')).data.data as {bills:Array<{id:string;number:string;vendor:string;amount:string;paid_amount:string}>;banks:Array<{id:string;name:string}>};
  if(!data.bills.length)throw new Error('Tidak ada tagihan vendor yang masih terbuka.');
  const bill=data.bills[(Number(window.prompt(data.bills.map((row,index)=>`${index+1}. ${row.number} — ${row.vendor} (sisa ${Number(row.amount)-Number(row.paid_amount)})`).join('\n'),'1'))||1)-1];if(!bill)return;
  const amount=window.prompt('Jumlah pembayaran:',(Number(bill.amount)-Number(bill.paid_amount)).toFixed(2));if(!amount)return;
  let bankAccountId:string|undefined;
  if(data.banks.length){const bank=data.banks[(Number(window.prompt(`Akun bank (0 = Kas):\n${data.banks.map((row,index)=>`${index+1}. ${row.name}`).join('\n')}`,'0'))||0)-1];bankAccountId=bank?.id;}
  await api.post(`/api/v1/operational/payables/bills/${bill.id}/payments`,{amount,paid_at:new Date().toISOString().slice(0,10),bank_account_id:bankAccountId,reference:window.prompt('Referensi pembayaran (opsional):')||undefined,idempotency_key:`ui-vendor-pay-${crypto.randomUUID()}`});
  this.notice(`Pembayaran ${bill.number} diposting.`);
 }
 private async closePeriod(){
  const defaultDate=new Date().toISOString().slice(0,10);const startsOn=window.prompt('Awal periode yang ditutup (YYYY-MM-DD):',defaultDate);if(!startsOn)return;
  const endsOn=window.prompt('Akhir periode yang ditutup (YYYY-MM-DD):',startsOn);if(!endsOn)return;
  if(!window.confirm(`Tutup periode ${startsOn} sampai ${endsOn}? Posting jurnal pada tanggal tersebut akan ditolak.`))return;
  await api.post('/api/v1/operational/accounting/periods',{starts_on:startsOn,ends_on:endsOn,note:window.prompt('Catatan penutupan (opsional):')||undefined});
  this.notice(`Periode ${startsOn} s.d. ${endsOn} ditutup.`);
 }
}
