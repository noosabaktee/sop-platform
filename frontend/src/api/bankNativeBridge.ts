import {api} from './client';

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
   const choice=window.prompt('Pilih aksi Cash & Bank:\n1. Tambah akun bank\n2. Impor mutasi bank\n3. Rekonsiliasi mutasi dengan jurnal','1');
   if(choice===null)return;
   if(choice.trim()==='1')await this.createAccount();
   else if(choice.trim()==='2')await this.importStatement();
   else if(choice.trim()==='3')await this.reconcile();
   else throw new Error('Pilih 1 atau 2.');
   await this.refresh();window.dispatchEvent(new Event('sop:domain-updated'));
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
 private async createAccount(){
  const accounts=(await api.get('/api/v1/operational/accounting/options')).data.data.accounts as Account[];
  const assets=accounts.filter(item=>item.type==='asset');
  if(!assets.length)throw new Error('Tidak ada akun aset yang dapat digunakan sebagai akun bank.');
  const coa=assets[(Number(window.prompt(assets.map((item,index)=>`${index+1}. ${item.code} - ${item.name}`).join('\n'),'1'))||1)-1];if(!coa)return;
  const name=window.prompt('Nama akun bank:');if(!name?.trim())return;
  const accountNumber=window.prompt('Nomor akun (opsional):')||undefined;
  const currency=(window.prompt('Mata uang (contoh IDR):','IDR')||'IDR').trim().toUpperCase();
  if(!/^[A-Z]{3}$/.test(currency))throw new Error('Mata uang harus kode ISO tiga huruf.');
  await api.post('/api/v1/operational/banks',{coa_id:coa.id,name:name.trim(),account_number:accountNumber,currency});
  this.notice('Akun bank tersimpan di PostgreSQL.');
 }
 private async importStatement(){
  const banks=(await api.get('/api/v1/operational/banks')).data.data.accounts as Bank[];
  if(!banks.length)throw new Error('Buat akun bank terlebih dahulu.');
  const bank=banks[(Number(window.prompt(banks.map((item,index)=>`${index+1}. ${item.name} (${item.currency})`).join('\n'),'1'))||1)-1];if(!bank)return;
  const reference=window.prompt('Referensi mutasi:');if(!reference?.trim())return;
  const amount=window.prompt('Nilai mutasi (+ masuk, - keluar):');
  if(!amount||!(/^-?\d{1,12}(?:\.\d{1,2})?$/).test(amount.trim())||Number(amount)===0)throw new Error('Nilai mutasi tidak valid.');
  const valueDate=window.prompt('Tanggal mutasi (YYYY-MM-DD):',new Date().toISOString().slice(0,10));if(!valueDate)return;
  const description=window.prompt('Deskripsi mutasi (opsional):')||undefined;
  await api.post(`/api/v1/operational/banks/${bank.id}/statements`,{reference:reference.trim(),amount:amount.trim(),value_date:valueDate,description});
  this.notice('Mutasi bank diimpor. Rekonsiliasikan dengan jurnal yang sesuai.');
 }
 private async reconcile(){
  const data=(await api.get('/api/v1/operational/banks')).data.data as {lines:Array<{id:string;reference:string;amount:string;account_name:string;journal_line_id:string|null}>};
  const pending=data.lines.filter(item=>!item.journal_line_id);
  if(!pending.length)throw new Error('Tidak ada mutasi bank yang menunggu rekonsiliasi.');
  const statement=pending[(Number(window.prompt(pending.map((item,index)=>`${index+1}. ${item.account_name} — ${item.reference} (${item.amount})`).join('\n'),'1'))||1)-1];if(!statement)return;
  const candidates=(await api.get(`/api/v1/operational/bank-statements/${statement.id}/candidates`)).data.data as Array<{id:string;number:string;posting_date:string;description:string;debit:string;credit:string}>;
  if(!candidates.length)throw new Error('Tidak ada jurnal posted dengan akun dan nilai yang cocok untuk mutasi ini.');
  const journal=candidates[(Number(window.prompt(candidates.map((item,index)=>`${index+1}. ${item.number} | ${item.posting_date} | ${item.description||'-'}`).join('\n'),'1'))||1)-1];if(!journal)return;
  await api.post(`/api/v1/operational/bank-statements/${statement.id}/match`,{journal_line_id:journal.id});
  this.notice(`Mutasi ${statement.reference} direkonsiliasi dengan ${journal.number}.`);
 }
}
