import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';
import {showFormModal, showSelectModal} from './modalHelper';

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
   const choice = await showSelectModal({
     title: 'Aksi Stock Opname',
     icon: 'lucide:clipboard-list',
     subtitle: 'Pilih tahapan stock opname fisik gudang:',
     defaultValue: '1',
     options: [
       {
         value: '1',
         label: 'Mulai Sesi Opname Baru',
         description: 'Mengambil snapshot stok sistem saat ini untuk gudang yang dipilih.',
         badge: 'Baru',
       },
       {
         value: '2',
         label: 'Input Hasil Hitungan Fisik & Posting Opname',
         description: 'Memasukkan hasil hitung fisik dan posting otomatis selisih ke jurnal penyesuaian.',
         badge: 'Posting',
       },
     ],
     submitText: 'Lanjutkan',
   });
   if(!choice) return;

   if(choice === '1') await this.start();
   else if(choice === '2') await this.countAndPost();
   await this.refresh();
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
 private async start(){
  const options=(await api.get('/api/v1/operational/procurement/options')).data.data as {warehouses:Warehouse[]};
  if(!options.warehouses.length)throw new Error('Belum ada gudang aktif di Master Data.');

  const formValues = await showFormModal<{warehouse_id: string; note?: string}>({
    title: 'Mulai Sesi Stock Opname Baru',
    icon: 'lucide:warehouse',
    submitText: 'Mulai Opname',
    fields: [
      {
        name: 'warehouse_id',
        label: 'Gudang yang Diopname',
        type: 'select',
        required: true,
        options: options.warehouses.map(w => ({value: w.id, label: `${w.code ? w.code + ' — ' : ''}${w.name}`})),
      },
      {
        name: 'note',
        label: 'Catatan / Alasan Opname (Opsional)',
        type: 'textarea',
        placeholder: 'Contoh: Stock opname rutin akhir bulan Oktober 2026',
      },
    ],
  });
  if(!formValues) return;

  const result=await api.post('/api/v1/operational/inventory/stocktakes',{warehouse_id:formValues.warehouse_id,note:formValues.note?.trim() || undefined});
  const stocktakeId = (result.data.data as {id:string}).id;
  this.notice(`Sesi Stock Opname ${stocktakeId} berhasil dibuat. Lanjutkan penghitungan fisik melalui menu "Isi hitungan".`);
 }
 private async countAndPost(){
  const active=(await api.get('/api/v1/operational/inventory/stocktakes')).data.data as Stocktake[];
  const pending=active.filter(item=>item.status==='counting');
  if(!pending.length)throw new Error('Tidak ada stock opname berstatus counting.');

  const stocktakeId = await showSelectModal({
    title: 'Pilih Sesi Opname Berjalan',
    icon: 'lucide:check-circle',
    subtitle: 'Pilih dokumen opname yang sedang berjalan:',
    options: pending.map(s => ({
      value: s.id,
      label: `${s.number} — ${s.warehouse}`,
      badge: 'Counting',
    })),
    submitText: 'Buka Form Hitung',
  });
  if(!stocktakeId) return;

  const stocktake = pending.find(s => s.id === stocktakeId);
  if(!stocktake) return;

  const detail=(await api.get(`/api/v1/operational/inventory/stocktakes/${stocktake.id}`)).data.data as {lines:Line[]};
  if(!detail.lines.length)throw new Error('Stock opname tidak memiliki baris produk.');

  const countFields = detail.lines.map(line => {
    const defaultQty = line.counted_qty !== null && line.counted_qty !== undefined ? line.counted_qty : line.expected_qty;
    return {
      name: `line_${line.id}`,
      label: `${line.sku} — ${line.product} (Stok Sistem: ${line.expected_qty})`,
      type: 'number' as const,
      required: true,
      min: 0,
      step: 0.01,
      value: Number(defaultQty),
    };
  });

  const countValues = await showFormModal<Record<string, any>>({
    title: `Hitungan Fisik: ${stocktake.number}`,
    icon: 'lucide:calculator',
    subtitle: 'Masukkan jumlah fisik aktual hasil perhitungan di lapangan. Selisih akan otomatis diposting sebagai adjustment dan jurnal akuntansi:',
    submitText: 'Posting & Tutup Opname',
    fields: countFields,
    large: true,
  });
  if(!countValues) throw new Error('Pengisian opname dibatalkan. Tidak ada transaksi yang diposting.');

  for(const line of detail.lines){
   const val = countValues[`line_${line.id}`];
   const counted_qty = String(val !== undefined ? val : line.expected_qty);
   await api.put(`/api/v1/operational/inventory/stocktakes/${stocktake.id}/lines/${line.id}`,{counted_qty});
  }

  const posted=await api.post(`/api/v1/operational/inventory/stocktakes/${stocktake.id}/post`);
  const adjustments = (posted.data as {adjustments?:number}).adjustments||0;
  this.notice(`Stock opname berhasil diposting; ${adjustments} koreksi stok dan jurnal penyesuaian otomatis dibuat.`);
 }
}
