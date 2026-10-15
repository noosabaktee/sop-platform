import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';
import {showFormModal} from './modalHelper';

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
   if (!options.products.length || !options.warehouses.length) throw new Error('Data produk atau gudang belum tersedia.');

   button.disabled = false;
   document.body.classList.remove('sop-api-busy');

   const formValues = await showFormModal<{
     product_id: string;
     warehouse_id: string;
     quantity: number;
     reason: string;
     batch_number?: string;
     expiry_date?: string;
   }>({
     title: 'Penyesuaian Stok (Inventory Adjustment)',
     icon: 'lucide:sliders',
     submitText: 'Posting Koreksi Stok',
     fields: [
       {
         name: 'product_id',
         label: 'Pilih Produk',
         type: 'select',
         required: true,
         options: options.products.map(p => ({value: p.id, label: `${p.sku ? p.sku + ' — ' : ''}${p.name}`})),
         halfWidth: true,
       },
       {
         name: 'warehouse_id',
         label: 'Lokasi Gudang',
         type: 'select',
         required: true,
         options: options.warehouses.map(w => ({value: w.id, label: `${w.code ? w.code + ' — ' : ''}${w.name}`})),
         halfWidth: true,
       },
       {
         name: 'quantity',
         label: 'Kuantitas Koreksi',
         type: 'number',
         required: true,
         step: 0.01,
         placeholder: '+10 atau -5',
         helpText: 'Gunakan angka positif (+) untuk penambahan stok fisik, negatif (-) untuk pengurangan.',
       },
       {
         name: 'reason',
         label: 'Alasan Koreksi (Minimal 6 Karakter)',
         type: 'textarea',
         required: true,
         placeholder: 'Contoh: Penyesuaian stok rusak akibat kelembaban gudang...',
       },
       {
         name: 'batch_number',
         label: 'Nomor Batch / Lot (Opsional)',
         type: 'text',
         placeholder: 'Contoh: BATCH-2026-X1',
         halfWidth: true,
       },
       {
         name: 'expiry_date',
         label: 'Tanggal Kadaluarsa (Opsional)',
         type: 'date',
         halfWidth: true,
       },
     ],
   });

   if (!formValues) return;

   if (formValues.quantity === 0) throw new Error('Kuantitas koreksi tidak boleh 0.');
   if (!formValues.reason || formValues.reason.trim().length < 6) throw new Error('Alasan koreksi minimal 6 karakter.');

   button.disabled = true;
   document.body.classList.add('sop-api-busy');

   await api.post('/api/v1/operational/inventory/adjust',{
    product_id: formValues.product_id,
    warehouse_id: formValues.warehouse_id,
    quantity: String(formValues.quantity),
    reason: formValues.reason.trim(),
    batch_number: formValues.batch_number?.trim() || undefined,
    expiry_date: formValues.expiry_date || undefined,
    idempotency_key:`native-adjustment-${crypto.randomUUID()}`
   });
   await this.operational.inventory();window.dispatchEvent(new Event('sop:domain-updated'));
   this.notice('Koreksi stok berhasil diposting ke inventory ledger.');
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
}
