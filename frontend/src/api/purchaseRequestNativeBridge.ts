import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';

/** Turns the frozen Purchase Request “Tambah” action into a real PR draft. */
export class PurchaseRequestNativeBridge {
 private listener=(event:Event)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||'Purchase Request gagal dibuat.'))};
 constructor(private readonly operational:OperationalProjectionBridge){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private notice(message:string){const toast=document.querySelector<HTMLElement>('[data-page-id="purchase"] .toast');if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,4500)}else window.alert(message)}
 private async refresh(){await this.operational.refresh();window.dispatchEvent(new Event('sop:domain-updated'))}
 private async handle(event:Event){
  if(event.type!=='click')return;const target=event.target as HTMLElement;
  const panel=target.closest<HTMLElement>('[data-prototype-page][data-route="/purchase"] [data-bd-panel="request"]');if(!panel)return;
  const button=target.closest<HTMLElement>('[data-bd-act]');const action=button?.dataset.bdAct||'';
  if(!['add','viewrow'].includes(action))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(action==='viewrow'){
   const id=button?.dataset.bdId||'';if(!id.startsWith('db-'))return;
   const choice=window.prompt('Aksi Purchase Request: submit atau order','submit')?.trim().toLowerCase();if(!choice)return;
   if(choice==='submit'){
    await api.post(`/api/v1/workflows/purchase-requests/${id.slice(3)}/submit`);
    await this.refresh();this.notice('PR disubmit ke workflow approval.');return;
   }
   if(choice==='order'){
    const options=(await api.get('/api/v1/operational/procurement/options')).data.data as {vendors:Array<{id:string;code:string;name:string}>};
    const vendor=options.vendors[(Number(window.prompt(options.vendors.map((v,i)=>`${i+1}. ${v.code} — ${v.name}`).join('\n'),'1'))||1)-1];if(!vendor)return;
    await api.post(`/api/v1/workflows/purchase-requests/${id.slice(3)}/order`,{vendor_id:vendor.id});
    await this.refresh();this.notice('Purchase Order dibuat dari PR approved.');
   }
   return;
  }
  const data=(await api.get('/api/v1/operational/procurement/options')).data.data as {products:Array<{id:string;sku:string;name:string;standard_cost:number}>;projects:Array<{id:string;code:string;name:string}>};
  if(!data.products.length)throw new Error('Produk aktif tidak tersedia.');
  const product=data.products[(Number(window.prompt(data.products.map((p,i)=>`${i+1}. ${p.sku} — ${p.name}`).join('\n'),'1'))||1)-1];if(!product)return;
  const quantity=Number(window.prompt('Jumlah kebutuhan:','1'));if(!Number.isFinite(quantity)||quantity<=0)return;
  const unitPrice=Number(window.prompt('Estimasi harga satuan:',String(product.standard_cost||0)));if(!Number.isFinite(unitPrice)||unitPrice<0)return;
  const project=data.projects.length?data.projects[(Number(window.prompt(`Project (0 tanpa project):\n${data.projects.map((p,i)=>`${i+1}. ${p.code} — ${p.name}`).join('\n')}`,'0'))||0)-1]:undefined;
  await api.post('/api/v1/workflows/purchase-requests',{project_id:project?.id,lines:[{product_id:product.id,quantity,unit_price:unitPrice}]});
  await this.refresh();this.notice('Purchase Request draft tersimpan di PostgreSQL. Submit dan approval tetap mengikuti workflow.');
 }
}
