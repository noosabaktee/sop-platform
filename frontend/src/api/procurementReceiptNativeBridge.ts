import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';

/** Posts a goods receipt from the existing native PO detail action. */
export class ProcurementReceiptNativeBridge {
 private listener=(event:Event)=>{void this.handle(event).catch(error=>window.alert(error?.response?.data?.message||'Penerimaan barang gagal.'))};
 constructor(private readonly operational:OperationalProjectionBridge){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private async handle(event:Event){
  const target=event.target as HTMLElement;if(event.type!=='click'||!target.closest('[data-prototype-page][data-route="/purchase"] [data-bd-panel="order"]'))return;
  const button=target.closest<HTMLElement>('[data-bd-act="viewrow"]');const id=button?.dataset.bdId||'';if(!id.startsWith('db-'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(window.prompt('Aksi Purchase Order: receive','receive')?.trim().toLowerCase()!=='receive')return;
  const [orderResponse,optionsResponse]=await Promise.all([api.get(`/api/v1/operational/procurement/orders/${id.slice(3)}`),api.get('/api/v1/operational/procurement/options')]);
  const order=orderResponse.data.data as {lines:Array<{id:string;sku:string;product:string;quantity:string;received_quantity:string}>};
  const warehouses=optionsResponse.data.data.warehouses as Array<{id:string;code:string;name:string}>;
  const warehouse=warehouses[(Number(window.prompt(warehouses.map((w,i)=>`${i+1}. ${w.code} — ${w.name}`).join('\n'),'1'))||1)-1];if(!warehouse)return;
  const lines:Array<{order_line_id:string;quantity:string}>=[];
  for(const line of order.lines){const outstanding=Number(line.quantity)-Number(line.received_quantity);if(outstanding<=0)continue;
   const quantity=window.prompt(`Jumlah diterima ${line.sku} — ${line.product} (maks. ${outstanding.toFixed(4)}):`,outstanding.toFixed(4));
   if(quantity===null)continue;
   if(!/^\d{1,14}(?:\.\d{1,4})?$/.test(quantity.trim())||Number(quantity)<=0||Number(quantity)>outstanding)throw new Error(`Kuantitas ${line.product} tidak valid.`);
   lines.push({order_line_id:line.id,quantity:quantity.trim()});
  }
  if(!lines.length)throw new Error('Tidak ada kuantitas PO yang dipilih untuk diterima.');
  await api.post(`/api/v1/workflows/purchase-orders/${id.slice(3)}/receive`,{warehouse_id:warehouse.id,received_at:new Date().toISOString().slice(0,10),reference:`RCV-${Date.now()}`,lines});
  await this.operational.refresh();window.dispatchEvent(new Event('sop:domain-updated'));
 }
}
