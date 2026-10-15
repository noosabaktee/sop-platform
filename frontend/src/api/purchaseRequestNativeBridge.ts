import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';
import {showFormModal, showSelectModal} from './modalHelper';

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
   const choice = await showSelectModal({
     title: 'Aksi Purchase Request',
     icon: 'lucide:clipboard-check',
     subtitle: 'Pilih tindakan lanjutan untuk dokumen Purchase Request ini:',
     defaultValue: 'submit',
     options: [
       {
         value: 'submit',
         label: 'Submit ke Workflow Approval',
         description: 'Kirim dokumen PR ke atasan / manajemen untuk disetujui.',
         badge: 'Approval',
       },
       {
         value: 'order',
         label: 'Terbitkan Purchase Order (PO)',
         description: 'Konversi PR yang telah disetujui menjadi Purchase Order ke vendor.',
         badge: 'PO',
       },
     ],
     submitText: 'Lanjutkan',
   });
   if(!choice) return;

   if(choice==='submit'){
    await api.post(`/api/v1/workflows/purchase-requests/${id.slice(3)}/submit`);
    await this.refresh();this.notice('PR berhasil dikirim ke workflow approval.');return;
   }
   if(choice==='order'){
    const options=(await api.get('/api/v1/operational/procurement/options')).data.data as {vendors:Array<{id:string;code:string;name:string}>};
    if (!options.vendors.length) throw new Error('Belum ada data vendor aktif.');
    const vendorId = await showSelectModal({
      title: 'Pilih Vendor Rekanan',
      icon: 'lucide:truck',
      subtitle: 'Pilih vendor penerima Purchase Order:',
      options: options.vendors.map(v => ({
        value: v.id,
        label: `${v.code} — ${v.name}`,
      })),
      submitText: 'Terbitkan PO',
    });
    if(!vendorId) return;
    await api.post(`/api/v1/workflows/purchase-requests/${id.slice(3)}/order`,{vendor_id:vendorId});
    await this.refresh();this.notice('Purchase Order berhasil diterbitkan dari PR yang disetujui.');
   }
   return;
  }
  const data=(await api.get('/api/v1/operational/procurement/options')).data.data as {products:Array<{id:string;sku:string;name:string;standard_cost:number}>;projects:Array<{id:string;code:string;name:string}>};
  if(!data.products.length)throw new Error('Produk aktif tidak tersedia.');

  const formValues = await showFormModal<{
    product_id: string;
    quantity: number;
    unit_price: number;
    project_id?: string;
  }>({
    title: 'Buat Draft Purchase Request',
    icon: 'lucide:shopping-cart',
    submitText: 'Simpan Purchase Request',
    fields: [
      {
        name: 'product_id',
        label: 'Produk / Barang Kebutuhan',
        type: 'select',
        required: true,
        options: data.products.map(p => ({
          value: p.id,
          label: `${p.sku} — ${p.name}`,
        })),
      },
      {
        name: 'quantity',
        label: 'Jumlah Kebutuhan (Quantity)',
        type: 'number',
        required: true,
        min: 1,
        step: 1,
        value: 1,
        halfWidth: true,
      },
      {
        name: 'unit_price',
        label: 'Estimasi Harga Satuan (Rp)',
        type: 'number',
        required: true,
        min: 0,
        step: 0.01,
        value: Number(data.products[0]?.standard_cost || 0),
        halfWidth: true,
      },
      {
        name: 'project_id',
        label: 'Tautkan ke Proyek (Opsional)',
        type: 'select',
        options: [
          {value: '', label: '-- Tanpa Proyek (Pengadaan Umum) --'},
          ...data.projects.map(p => ({value: p.id, label: `${p.code} — ${p.name}`})),
        ],
      },
    ],
  });

  if (!formValues) return;
  if (!formValues.quantity || formValues.quantity <= 0) throw new Error('Jumlah kebutuhan harus lebih dari 0.');

  await api.post('/api/v1/workflows/purchase-requests', {
    project_id: formValues.project_id || undefined,
    lines: [{
      product_id: formValues.product_id,
      quantity: formValues.quantity,
      unit_price: formValues.unit_price,
    }],
  });
  await this.refresh();
  this.notice('Draft Purchase Request berhasil disimpan.');
 }
}
