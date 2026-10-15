import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';

type Option={id:string;name:string;sku?:string;code?:string};

/** Posts stock corrections through the immutable inventory ledger from native toolbar. */
export class InventoryAdjustmentNativeBridge {
 private working=false;
 private listener=(event:MouseEvent)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||String(error)))};
 constructor(private readonly operational:OperationalProjectionBridge){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private notice(message:string){const toast=document.querySelector<HTMLElement>('[data-page-id="inventory"] .toast');if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,5500)}else window.alert(message)}
 private async handle(event:MouseEvent){
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-bd-act="add"]');
  if(!button||!button.closest('[data-page-id="inventory"] [data-bd-panel="adjustment"]'))return;
  event.preventDefault();event.stopImmediatePropagation();if(this.working)return;
  this.working=true;button.disabled=true;document.body.classList.add('sop-api-busy');
  try{
   const options=(await api.get('/api/v1/operational/procurement/options')).data.data as {products:Option[];warehouses:Option[]};
   const product=options.products[(Number(window.prompt(options.products.map((item,index)=>`${index+1}. ${item.sku||''} ${item.name}`).join('\n'),'1'))||1)-1];if(!product)return;
   const warehouse=options.warehouses[(Number(window.prompt(options.warehouses.map((item,index)=>`${index+1}. ${item.code||''} ${item.name}`).join('\n'),'1'))||1)-1];if(!warehouse)return;
   const quantity=window.prompt('Kuantitas koreksi (+ masuk, - keluar):');
   if(!quantity||!(/^-?\d{1,12}(?:\.\d{1,4})?$/).test(quantity.trim())||Number(quantity)===0)throw new Error('Kuantitas koreksi tidak valid.');
   const reason=window.prompt('Alasan koreksi (minimal 6 karakter):');if(!reason?.trim()||reason.trim().length<6)throw new Error('Alasan koreksi minimal 6 karakter.');
   const batch=window.prompt('Nomor Batch / Lot (opsional):')?.trim()||undefined;
   const expiry=batch?window.prompt('Tanggal Kadaluarsa (YYYY-MM-DD, opsional):')?.trim()||undefined:undefined;
   await api.post('/api/v1/operational/inventory/adjust',{
    product_id:product.id,
    warehouse_id:warehouse.id,
    quantity:quantity.trim(),
    reason:reason.trim(),
    batch_number:batch,
    expiry_date:expiry,
    idempotency_key:`native-adjustment-${crypto.randomUUID()}`
   });
   await this.operational.inventory();window.dispatchEvent(new Event('sop:domain-updated'));
   this.notice('Koreksi stok diposting ke inventory ledger.');
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
}
