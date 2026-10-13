import {api} from './client';
import type {GridBridge} from './gridBridge';

type Option={id:string;name:string;code?:string};
type Options={customers:Option[];owners:Option[];products:Option[]};
type Quote={id:string;number:string;customer:string;owner:string;valid_until:string|null;total:string;status:string};
type SavedQuote={id:string;number:string};

const titles:Record<string,string>={draft:'Draft',pending_approval:'Pending Approval',sent:'Sent',negotiation:'Negotiation',approved:'Approved',rejected:'Rejected',revision_requested:'Revisi',expired:'Expired'};
const money=(value:string)=>'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(Number(value));

/** Functional quotation builder using the approved prototype DOM, not a replacement UI. */
export class QuotationBuilderBridge {
 private options:Options|null=null;
 private currentId:string|null=null;
 private active=false;
 private saving=false;
 private observer:MutationObserver|null=null;
 constructor(private readonly grid:GridBridge){}
 async install(){
  // Register immediately: a fast click must never fall through to the mock toast.
  this.active=true;
  document.addEventListener('click',this.onClick,true);
  window.addEventListener('sop:workflow-updated',this.onWorkflow);
  try {
   const {data}=await api.get('/api/v1/quotation-builder/options');
   this.options=data.data as Options;
   this.hydrateSelects();
   const root=document.querySelector<HTMLElement>('[data-page-id="quotation"]');
   if(root){this.observer=new MutationObserver(()=>this.hydrateSelects());this.observer.observe(root,{subtree:true,childList:true});}
   await this.refreshList();
  }catch(error){console.error('Quotation API belum tersedia:',error);}
 }
 uninstall(){this.active=false;this.observer?.disconnect();document.removeEventListener('click',this.onClick,true);window.removeEventListener('sop:workflow-updated',this.onWorkflow);}
 private replaceOptions(select:HTMLSelectElement,opts:Option[]){
  if(!opts.length)return;
  const signature=opts.map(o=>o.id).join('|');
  if(select.dataset.dbOptions===signature)return;
  const previous=select.value;
  const previousName=select.selectedOptions[0]?.textContent?.trim();
  select.replaceChildren(...opts.map(o=>{const item=document.createElement('option');item.value=o.id;item.textContent=o.name;return item;}));
  const matched=opts.find(o=>o.id===previous || o.name===previousName);
  if(matched)select.value=matched.id;
  select.dataset.dbOptions=signature;
 }
 private hydrateSelects(){
  if(!this.options)return;
  const root=document.querySelector<HTMLElement>('[data-page-id="quotation"]');
  if(!root)return;
  const customer=root.querySelector<HTMLSelectElement>('[data-qt-field="customer"]');
  const owner=root.querySelector<HTMLSelectElement>('[data-qt-field="owner"]');
  if(customer)this.replaceOptions(customer,this.options.customers);
  if(owner)this.replaceOptions(owner,this.options.owners);
 }
 private inform(message:string,error=false){
  const element=document.querySelector<HTMLElement>('[data-page-id="quotation"] .toast');
  if(element){element.textContent=message;element.hidden=false;window.setTimeout(()=>{element.hidden=true},5000);}
  if(error)console.error(message);
 }
 private readonly onWorkflow=()=>{void this.refreshList().catch(console.error)};
 private readonly onClick=(event:MouseEvent)=>{
  if(!this.active)return;
  const action=(event.target as HTMLElement).closest<HTMLElement>('[data-qt-act="savedraft"],[data-qt-act="submit"],[data-qt-act="resetbuilder"]');
  if(!action||!action.closest('[data-page-id="quotation"]'))return;
  if(action.dataset.qtAct==='resetbuilder'){this.currentId=null;return;}
  event.preventDefault();event.stopImmediatePropagation();
  if(this.saving)return;
  const submit=action.dataset.qtAct==='submit';
  void this.save(submit,action as HTMLButtonElement);
 };
 private getPayload(){
  this.hydrateSelects();
  const root=document.querySelector<HTMLElement>('[data-page-id="quotation"]');
  if(!root||!this.options)throw new Error('Pilihan quotation belum dimuat dari database.');
  const field=(name:string)=>root.querySelector<HTMLInputElement|HTMLSelectElement>(`[data-qt-field="${name}"]`)?.value||'';
  const percent=(name:string)=>Number(root.querySelector<HTMLInputElement>(`[data-qt-sum="${name}"]`)?.value||0);
  const lines=[...root.querySelectorAll<HTMLTableRowElement>('[data-qt-lines] tbody tr')].map(tr=>{
   const qty=Number(tr.querySelector<HTMLInputElement>('[data-qt-key="qty"]')?.value);
   const priceMillions=Number(tr.querySelector<HTMLInputElement>('[data-qt-key="price"]')?.value);
   return {description:tr.querySelector('td')?.textContent?.trim()||'',quantity:qty,
    unit_price:(Math.round(priceMillions*1000000)).toFixed(2)};
  });
  if(!lines.length)throw new Error('Quotation harus memiliki minimal satu item.');
  if(lines.some(item=>!Number.isInteger(item.quantity)||item.quantity<1||!Number.isFinite(Number(item.unit_price))||Number(item.unit_price)<0))
   throw new Error('Periksa kembali kuantitas dan harga quotation.');
  const customer=field('customer');
  if(!this.options.customers.some(x=>x.id===customer))throw new Error('Pilih customer dari database perusahaan.');
  const tax=percent('tax'),discount=percent('discount');
  if(!Number.isInteger(tax)||!Number.isInteger(discount)||tax<0||tax>100||discount<0||discount>100)
   throw new Error('Pajak dan diskon harus berupa persentase bulat 0–100.');
  return {id:this.currentId,customer_id:customer,owner_id:field('owner')||undefined,
   contact_name:field('contact'),payment_terms:field('terms'),currency:field('currency'),
   valid_until:field('validUntil'),tax_percent:tax,discount_percent:discount,items:lines};
 }
 private async save(submit:boolean,button:HTMLButtonElement){
  this.saving=true;button.disabled=true;document.body.classList.add('sop-api-busy');
  try {
   const payload=this.getPayload();
   const result=await api.post('/api/v1/quotation-builder/draft',payload);
   const saved=result.data.data as SavedQuote;
   this.currentId=saved.id;
   if(submit){await api.post(`/api/v1/workflows/quotations/${saved.id}/submit`,{});this.currentId=null;}
   await this.refreshList();
   this.inform(`${saved.number} ${submit?'dikirim untuk persetujuan':'disimpan sebagai draft'} di PostgreSQL.`);
  }catch(error){
   const response=error as {response?:{data?:{message?:string;errors?:Record<string,string[]>}}};
   const first=Object.values(response.response?.data?.errors||{})[0]?.[0];
   this.inform(first||response.response?.data?.message||String(error),true);
  }finally{button.disabled=false;this.saving=false;document.body.classList.remove('sop-api-busy');}
 }
 async refreshList(){
  if(!this.active)return;
  const {data}=await api.get('/api/v1/quotation-builder/list');
  const quotes=data.data as Quote[];
  const toRow=(q:Quote)=>({__id:'q-domain-'+q.id,number:q.number,customer:q.customer,owner:q.owner,
    validUntil:q.valid_until||'',total:money(q.total),status:titles[q.status]||q.status});
  this.grid.mergeDomainRows('/quotation','list','q-domain-',quotes.map(toRow));
  for(const [panel,status] of Object.entries({draft:'draft',pending:'pending_approval',sent:'sent',
    negotiation:'negotiation',approved:'approved',rejected:'rejected',expired:'expired'})){
   this.grid.mergeDomainRows('/quotation',panel,'q-domain-',quotes.filter(q=>q.status===status || (status==='rejected' && q.status==='revision_requested')).map(toRow));
  }
 }
}
