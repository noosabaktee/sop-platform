import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';
import {showFormModal} from './modalHelper';

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

  const [orderResponse,optionsResponse]=await Promise.all([api.get(`/api/v1/operational/procurement/orders/${id.slice(3)}`),api.get('/api/v1/operational/procurement/options')]);
  const order=orderResponse.data.data as {lines:Array<{id:string;sku:string;product:string;quantity:string;received_quantity:string}>};
  const warehouses=optionsResponse.data.data.warehouses as Array<{id:string;code:string;name:string}>;
  if (!warehouses.length) throw new Error('Tidak ada data gudang aktif.');

  const outstandingLines = order.lines.filter(l => Number(l.quantity) - Number(l.received_quantity) > 0);
  if (!outstandingLines.length) throw new Error('Semua barang dalam Purchase Order ini sudah diterima lengkap.');

  const today = new Date().toISOString().slice(0, 10);
  const defaultRef = `RCV-${Date.now().toString().slice(-6)}`;

  const formFields = [
    {
      name: 'warehouse_id',
      label: 'Gudang Penerimaan Barang',
      type: 'select' as const,
      required: true,
      options: warehouses.map(w => ({value: w.id, label: `${w.code} — ${w.name}`})),
      halfWidth: true,
    },
    {
      name: 'received_at',
      label: 'Tanggal Penerimaan',
      type: 'date' as const,
      required: true,
      value: today,
      halfWidth: true,
    },
    {
      name: 'reference',
      label: 'Nomor Surat Jalan / Referensi Vendor',
      type: 'text' as const,
      required: true,
      value: defaultRef,
    },
    ...outstandingLines.map(line => {
      const remaining = Number(line.quantity) - Number(line.received_quantity);
      return {
        name: `line_${line.id}`,
        label: `Kuantitas Diterima: ${line.sku} — ${line.product} (Sisa PO: ${remaining.toFixed(2)})`,
        type: 'number' as const,
        required: true,
        min: 0,
        max: remaining,
        step: 0.01,
        value: remaining,
      };
    }),
  ];

  const formValues = await showFormModal<Record<string, any>>({
    title: 'Penerimaan Barang (Goods Receipt)',
    icon: 'lucide:package-check',
    submitText: 'Proses Penerimaan',
    fields: formFields,
    large: true,
  });
  if (!formValues) return;

  const lines: Array<{order_line_id: string; quantity: string}> = [];
  for (const line of outstandingLines) {
    const qty = Number(formValues[`line_${line.id}`] || 0);
    if (qty > 0) {
      lines.push({order_line_id: line.id, quantity: String(qty)});
    }
  }
  if (!lines.length) throw new Error('Tidak ada barang yang dipilih untuk diterima.');

  await api.post(`/api/v1/workflows/purchase-orders/${id.slice(3)}/receive`, {
    warehouse_id: formValues.warehouse_id,
    received_at: formValues.received_at,
    reference: String(formValues.reference || defaultRef).trim(),
    lines,
  });
  await this.operational.refresh();
  window.dispatchEvent(new Event('sop:domain-updated'));
 }
}
