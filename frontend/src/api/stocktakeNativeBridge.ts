import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';

type Warehouse={id:string;name:string;code?:string};
type Stocktake={id:string;number:string;warehouse:string;status:string};
type Line={id:string;product:string;sku:string;expected_qty:string;counted_qty:string|null};

/** Runs authoritative stocktake operations from the existing Stock Opname toolbar. */
export class StocktakeNativeBridge {
 private working=false;
 private listener=(event:MouseEvent)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||String(error)))};
 constructor(private readonly operational:OperationalProjectionBridge){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private notice(message:string){
  const toast=document.querySelector<HTMLElement>('[data-page-id="inventory"] .toast');
  if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,6000)}else window.alert(message);
 }
 private async refresh(){await this.operational.inventory();window.dispatchEvent(new Event('sop:domain-updated'))}
 private async handle(event:MouseEvent){
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-bd-act="add"]');
  if(!button||!button.closest('[data-page-id="inventory"] [data-bd-panel="opname"]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(this.working)return;
  this.working=true;button.disabled=true;document.body.classList.add('sop-api-busy');
  try{
   const choice=window.prompt('Pilih aksi Stock Opname:\n1. Mulai opname baru\n2. Isi hitungan dan posting opname berjalan','1');
   if(choice===null)return;
   if(choice.trim()==='1')await this.start();
   else if(choice.trim()==='2')await this.countAndPost();
   else throw new Error('Pilih 1 atau 2.');
   await this.refresh();
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
 private async start(){
  const options=(await api.get('/api/v1/operational/procurement/options')).data.data as {warehouses:Warehouse[]};
  if(!options.warehouses.length)throw new Error('Belum ada gudang aktif di Master Data.');
  const warehouse=options.warehouses[(Number(window.prompt(options.warehouses.map((item,index)=>`${index+1}. ${item.code||''} ${item.name}`).join('\n'),'1'))||1)-1];
  if(!warehouse)return;
  const note=window.prompt('Catatan opname (opsional):')||undefined;
  const result=await api.post('/api/v1/operational/inventory/stocktakes',{warehouse_id:warehouse.id,note});
  this.notice(`Stock opname ${(result.data.data as {id:string}).id} dibuat. Gunakan aksi Tambah lagi lalu pilih 2 untuk mengisi hitungan.`);
 }
 private async countAndPost(){
  const active=(await api.get('/api/v1/operational/inventory/stocktakes')).data.data as Stocktake[];
  const pending=active.filter(item=>item.status==='counting');
  if(!pending.length)throw new Error('Tidak ada stock opname berstatus counting.');
  const stocktake=pending[(Number(window.prompt(pending.map((item,index)=>`${index+1}. ${item.number} - ${item.warehouse}`).join('\n'),'1'))||1)-1];
  if(!stocktake)return;
  const detail=(await api.get(`/api/v1/operational/inventory/stocktakes/${stocktake.id}`)).data.data as {lines:Line[]};
  if(!detail.lines.length)throw new Error('Stock opname tidak memiliki baris produk.');
  for(const line of detail.lines){
   const value=window.prompt(`Hitung ${line.sku} - ${line.product}\nStok snapshot: ${line.expected_qty}`,line.counted_qty||line.expected_qty);
   if(value===null)throw new Error('Pengisian opname dibatalkan. Tidak ada transaksi yang diposting.');
   if(!/^\d{1,12}(?:\.\d{1,4})?$/.test(value.trim()))throw new Error(`Jumlah ${line.product} tidak valid.`);
   await api.put(`/api/v1/operational/inventory/stocktakes/${stocktake.id}/lines/${line.id}`,{counted_qty:value.trim()});
  }
  const posted=await api.post(`/api/v1/operational/inventory/stocktakes/${stocktake.id}/post`);
  this.notice(`Stock opname diposting; ${(posted.data as {adjustments?:number}).adjustments||0} koreksi stok dan jurnal dibuat.`);
 }
}
