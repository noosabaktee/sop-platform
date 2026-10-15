import {api} from './client';
import type {GridBridge} from './gridBridge';

type Option={id:string;name:string;code?:string};
type Opportunity={id:string;name:string;customer:string;owner:string|null;amount:string;probability:number;stage:string};
const title=(value:string)=>value.replace(/\b\w/g,c=>c.toUpperCase());

/** Replaces only the Business Development opportunity fixture with domain records. */
export class CrmOpportunityNativeBridge {
 private listener=(event:Event)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||String(error)))};
 constructor(private readonly grid:GridBridge){}
 install(){document.addEventListener('click',this.listener,true);document.addEventListener('change',this.listener,true);void this.refresh()}
 uninstall(){document.removeEventListener('click',this.listener,true);document.removeEventListener('change',this.listener,true)}
 private notice(message:string){const toast=document.querySelector<HTMLElement>('[data-page-id="business-development"] .toast');if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,5500)}else window.alert(message)}
 async refresh(){
  const rows=(await api.get('/api/v1/operational/crm/opportunities')).data.data as Opportunity[];
  this.grid.mergeDomainRows('/business-development','opportunities','db-',rows.map(item=>({
   __id:'db-'+item.id,name:item.name,market:item.customer,value:Number(item.amount)/1_000_000,
   prob:item.probability,owner:item.owner||'—',status:title(item.stage)
  })));
 }
 private async handle(event:Event){
  const target=event.target as HTMLElement;
  const stage=target.closest<HTMLSelectElement>('select[data-bd-key="status"][data-bd-id]');
  if(stage&&event.type==='change'&&stage.closest('[data-page-id="business-development"] [data-bd-panel="opportunities"]')&&stage.dataset.bdId?.startsWith('db-')){
   event.preventDefault();event.stopImmediatePropagation();
   const id=stage.dataset.bdId.slice(3);const value=stage.value.toLowerCase();
   await api.patch(`/api/v1/operational/crm/opportunities/${id}`,{stage:value});
   if(value==='won'&&window.confirm('Opportunity Won. Buat Project dari opportunity ini sekarang?')){
    const result=await api.post(`/api/v1/operational/crm/opportunities/${id}/project`,{});
    this.notice(`Project ${result.data.data.code} dibuat dari opportunity Won.`);
   }else this.notice('Stage opportunity diperbarui.');
   await this.refresh();window.dispatchEvent(new Event('sop:domain-updated'));return;
  }
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-bd-act="add"]');
  if(!button||!button.closest('[data-page-id="business-development"] [data-bd-panel="opportunities"]'))return;
  event.preventDefault();event.stopImmediatePropagation();button.disabled=true;document.body.classList.add('sop-api-busy');
  try{
   const options=(await api.get('/api/v1/operational/crm/options')).data.data as {customers:Option[];owners:Option[]};
   if(!options.customers.length)throw new Error('Tambahkan customer aktif di Master Data terlebih dahulu.');
   const customer=options.customers[(Number(window.prompt(options.customers.map((item,index)=>`${index+1}. ${item.code||''} ${item.name}`).join('\n'),'1'))||1)-1];if(!customer)return;
   const name=window.prompt('Nama opportunity:');if(!name?.trim())return;
   const amount=window.prompt('Nilai opportunity (Rp):','0');if(!amount||!/^\d{1,14}(?:\.\d{1,2})?$/.test(amount.trim()))throw new Error('Nilai opportunity tidak valid.');
   const probability=window.prompt('Probabilitas 0–100:','20');if(!probability||!/^\d{1,3}$/.test(probability)||Number(probability)>100)throw new Error('Probabilitas harus 0–100.');
   const stages=['new','qualified','proposal','negotiation','won','lost'];
   const stage=stages[(Number(window.prompt(stages.map((item,index)=>`${index+1}. ${title(item)}`).join('\n'),'1'))||1)-1];if(!stage)return;
   const owner=options.owners[(Number(window.prompt(options.owners.map((item,index)=>`${index+1}. ${item.name}`).join('\n'),'1'))||1)-1];
   await api.post('/api/v1/operational/crm/opportunities',{customer_id:customer.id,name:name.trim(),amount:amount.trim(),probability:Number(probability),stage,owner_id:owner?.id});
   await this.refresh();window.dispatchEvent(new Event('sop:domain-updated'));this.notice('Opportunity tersimpan ke PostgreSQL.');
  }finally{button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
}
