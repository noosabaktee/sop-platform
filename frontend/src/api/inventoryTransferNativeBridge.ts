import {api} from './client';
import type {GridBridge} from './gridBridge';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';

type Option={id:string;name:string;sku?:string;code?:string};
type Options={products:Option[];warehouses:Option[]};
type TransferRow={__id:string;__new?:boolean;[key:string]:unknown};

/** Wires the exact native transfer table to real PostgreSQL ledger transactions.
 * No replacement table, modal, form or CSS is introduced. */
export class InventoryTransferNativeBridge {
 private installed=false;
 private working=false;
 private keys=new Map<string,string>();
 private options:Options|null=null;
 constructor(private grid:GridBridge,private operational:OperationalProjectionBridge){}
 install(){
  this.installed=true;
  document.addEventListener('click',this.onClick,true);
  window.addEventListener('hashchange',this.onRoute);
  void this.loadOptions();
 }
 uninstall(){this.installed=false;document.removeEventListener('click',this.onClick,true);window.removeEventListener('hashchange',this.onRoute)}
 private readonly onRoute=()=>{if(location.hash==='#/inventory')void this.loadOptions()};
 private async loadOptions(){
  try{const result=await api.get('/api/v1/operational/procurement/options');this.options=result.data.data as Options;}
  catch(error){console.error('Tidak dapat memuat produk/gudang transfer',error)}
 }
 private alert(text:string){
  const toast=document.querySelector<HTMLElement>('[data-page-id="inventory"] .toast');
  if(toast){toast.textContent=text;toast.hidden=false;window.setTimeout(()=>toast.hidden=true,5500)}
  else window.alert(text);
 }
 private readonly onClick=(event:MouseEvent)=>{
  if(!this.installed)return;
  const el=(event.target as HTMLElement).closest<HTMLElement>('[data-bd-act="commit"],[data-bd-act="delete"],[data-bd-act="delrow"]');
  if(!el||!el.closest('[data-page-id="inventory"] [data-tabpanel="transfer"]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(this.working)return;
  const action=el.dataset.bdAct;
  void this.execute(action==='commit'?'save':'cancel',el);
 };
 private choose(list:Option[],value:unknown,attribute:'sku'|'code'='code'):Option|undefined{
  const input=String(value||'').trim().toLowerCase();
  return list.find(item=>item.id===input||item.name.toLowerCase()===input||String(item[attribute]||'').toLowerCase()===input);
 }
 private async create(row:TransferRow){
  if(!this.options)throw Error('Daftar gudang dan produk masih dimuat.');
  const product=this.choose(this.options.products,row.item,'sku');
  const from=this.choose(this.options.warehouses,row.from);
  const to=this.choose(this.options.warehouses,row.to);
  if(!product||!from||!to)throw Error('Masukkan nama atau kode produk/gudang yang tercatat di Master Data.');
  const qty=String(row.qty||'').trim().replace(',','.');
  if(!/^\d{1,12}(?:\.\d{1,4})?$/.test(qty)||Number(qty)<=0)throw Error('Qty transfer harus angka positif maksimal 4 desimal.');
  let key=this.keys.get(row.__id);if(!key){key='native-transfer-'+crypto.randomUUID();this.keys.set(row.__id,key)}
  await api.post('/api/v1/operational/inventory/transfers',{
   product_id:product.id,from_warehouse_id:from.id,to_warehouse_id:to.id,
   quantity:qty,idempotency_key:key});
   this.keys.delete(row.__id); // same temporary UI row ID can be reused after refresh
 }
 private async execute(action:'save'|'cancel',button:HTMLElement){
  const snapshot=this.grid.getPendingRows('/inventory','transfer');
  const byId=new Map(snapshot.rows.map(row=>[row.__id,row]));
  const staged=snapshot.staged.map(key=>byId.get(key)).filter(Boolean) as TransferRow[];
  const selected=action==='cancel'?snapshot.selected.map(key=>byId.get(key)).filter(Boolean) as TransferRow[]:[];
  if(action==='save'&&!staged.length){this.alert('Tidak ada perubahan transfer yang perlu disimpan.');return;}
  if(action==='cancel'&&!selected.length){this.alert('Pilih transfer draft yang ingin dibatalkan.');return;}
  this.working=true;button.setAttribute('aria-busy','true');document.body.classList.add('sop-api-busy');
  try{
   if(action==='save'){
    for(const row of staged){
     if(row.__new){await this.create(row);continue;}
     if(!row.__id.startsWith('db-'))throw Error('Baris transaksi tidak dikenali.');
     const id=row.__id.slice(3);
     const desired=String(row.status||'').trim().toLowerCase();
     const original=snapshot.rows.find(r=>r.__id===row.__id);
     if(!original)throw Error('Transfer tidak ditemukan.');
     if(desired==='in transit'||desired==='in_transit')await api.post(`/api/v1/operational/inventory/transfers/${id}/ship`);
     else if(desired==='received')await api.post(`/api/v1/operational/inventory/transfers/${id}/receive`);
     else if(desired==='draft')throw Error('Status Draft tidak mengubah transaksi; gunakan pembatalan jika perlu.');
     else throw Error('Status transfer tidak valid. Pilih In transit atau Received.');
    }
   }else{
    for(const row of selected){
     if(row.__new)continue; // discard uncommitted native row on refresh
     if(!row.__id.startsWith('db-'))throw Error('Hanya transfer dari database yang dapat dibatalkan.');
     await api.post(`/api/v1/operational/inventory/transfers/${row.__id.slice(3)}/cancel`);
    }
   }
   await this.operational.inventory();
   this.alert(action==='save'?'Transfer tersimpan di PostgreSQL.':'Transfer draft dibatalkan di PostgreSQL.');
  }catch(error){
   const e=error as {response?:{data?:{message?:string;errors?:Record<string,string[]>}}};
   const field=Object.values(e.response?.data?.errors||{})[0]?.[0];
   this.alert('Aksi transfer gagal: '+(field||e.response?.data?.message||String(error)));
   // If a server write succeeded before another failed, reload authoritative truth.
   // The native row can then be re-created by the user with corrected values.
   await this.operational.inventory().catch(console.error);
  }finally{this.working=false;button.removeAttribute('aria-busy');document.body.classList.remove('sop-api-busy')}
 }
}
