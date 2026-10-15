import {api} from './client';
import {refreshSalesOperationalGrids} from './salesOperationalProjection';
import type {GridBridge} from './gridBridge';

/** Converts the existing Sales read-only detail action into authorized workflows. */
export class SalesNativeBridge {
 private listener=(event:Event)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||'Workflow Sales gagal.'))};
 constructor(private readonly grid:GridBridge){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private notice(message:string){const toast=document.querySelector<HTMLElement>('[data-page-id="sales"] .toast');if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,5000)}else window.alert(message)}
 private async refresh(){await refreshSalesOperationalGrids(this.grid);window.dispatchEvent(new Event('sop:domain-updated'))}
 private async handle(event:Event){
  if(event.type!=='click')return;const target=event.target as HTMLElement;
  const panel=target.closest<HTMLElement>('[data-prototype-page][data-route="/sales"] [data-bd-panel]');if(!panel)return;
  const button=target.closest<HTMLElement>('[data-bd-act]');const id=button?.dataset.bdId||'';
  const name=panel.dataset.bdPanel||'';const action=button?.dataset.bdAct||'';if(!['order','delivery','return','invoice','ar'].includes(name))return;
  const validOrderAction=name==='order'&&action==='add';
  const validDeliveryAction=name==='delivery'&&action==='add';
  const validReturnAction=name==='return'&&action==='add';
  const validCreditAction=name==='return'&&action==='viewrow'&&id.startsWith('db-return-');
  const validInvoiceAction=['invoice','ar'].includes(name)&&action==='viewrow'&&id.startsWith('db-');
  if(!validOrderAction&&!validDeliveryAction&&!validReturnAction&&!validCreditAction&&!validInvoiceAction)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(name==='order'){
   const choice=window.prompt('Pilih aksi:\n1. Konversi quotation approved menjadi Sales Order\n2. Posting invoice dari Sales Order yang sudah ada','1');
   if(choice===null)return;
   if(choice.trim()==='2'){
    const operational=(await api.get('/api/v1/operational/sales')).data.data as {orders:Array<{id:string;number:string;customer:string;status:string}>;invoices:Array<{sales_order:string|null}>};
    const invoiced=new Set(operational.invoices.map(item=>item.sales_order).filter((item):item is string=>Boolean(item)));
    const eligible=operational.orders.filter(item=>item.status==='confirmed'&&!invoiced.has(item.number));
    if(!eligible.length)throw new Error('Tidak ada Sales Order confirmed yang belum memiliki invoice.');
    const order=eligible[(Number(window.prompt(eligible.map((item,index)=>`${index+1}. ${item.number} - ${item.customer}`).join('\n'),'1'))||1)-1];if(!order)return;
    const dueDate=window.prompt('Jatuh tempo (YYYY-MM-DD, opsional):')||undefined;
    await api.post(`/api/v1/workflows/sales-orders/${order.id}/invoice`,{due_date:dueDate});
    await this.refresh();this.notice('Invoice dan jurnal piutang dibuat dari '+order.number+'.');return;
   }
   if(choice.trim()!=='1')throw new Error('Pilih 1 untuk quotation atau 2 untuk invoice Sales Order.');
   const result=(await api.get('/api/v1/quotation-builder/list')).data.data as Array<{id:string;number:string;customer:string;status:string}>;
   const approved=result.filter(item=>item.status==='approved');if(!approved.length)throw new Error('Tidak ada quotation approved yang siap dikonversi.');
   const quotation=approved[(Number(window.prompt(approved.map((item,index)=>`${index+1}. ${item.number} — ${item.customer}`).join('\n'),'1'))||1)-1];if(!quotation)return;
   const converted=await api.post(`/api/v1/workflows/quotations/${quotation.id}/convert`,{});
   const orderId=(converted.data.data as {id:string}).id;
   if(window.confirm('Sales Order dibuat. Posting invoice sekarang?')){
    const dueDate=window.prompt('Jatuh tempo (YYYY-MM-DD, opsional):')||undefined;
    await api.post(`/api/v1/workflows/sales-orders/${orderId}/invoice`,{due_date:dueDate});
    this.notice('Sales Order, invoice, dan jurnal piutang dibuat.');
   }else this.notice('Sales Order dibuat dari quotation approved.');
   await this.refresh();return;
  }
  if(name==='delivery'){
   const data=(await api.get('/api/v1/operational/sales')).data.data as {orders:Array<{id:string;number:string;customer:string;status:string}>};
   const orders=data.orders.filter(order=>['confirmed','partial_delivered'].includes(order.status));if(!orders.length)throw new Error('Tidak ada Sales Order yang siap dikirim.');
   const order=orders[(Number(window.prompt(orders.map((row,index)=>`${index+1}. ${row.number} — ${row.customer}`).join('\n'),'1'))||1)-1];if(!order)return;
   const orderDetail=(await api.get(`/api/v1/operational/sales/orders/${order.id}/delivery`)).data.data as {lines:Array<{product_id:string;product:string;quantity:string;delivered_quantity:string}>};
   const lines=[] as Array<{product_id:string;quantity:string}>;
   for(const line of orderDetail.lines){const remaining=Number(line.quantity)-Number(line.delivered_quantity);if(remaining<=0)continue;
    const quantity=window.prompt(`Jumlah kirim ${line.product} (maks. ${remaining}):`,remaining.toFixed(4));if(quantity===null)return;
    if(!/^\d{1,12}(?:\.\d{1,4})?$/.test(quantity.trim())||Number(quantity)<=0||Number(quantity)>remaining)throw new Error(`Jumlah kirim ${line.product} tidak valid.`);
    lines.push({product_id:line.product_id,quantity:quantity.trim()});}
   if(!lines.length)throw new Error('Tidak ada barang tersisa untuk dikirim.');
   const inventory=(await api.get('/api/v1/operational/inventory')).data.data as {balances:Array<{warehouse_id:string;warehouse:string}>};
   const warehouses=[...new Map(inventory.balances.map(row=>[row.warehouse_id,row.warehouse])).entries()].map(([id,name])=>({id,name}));
   if(!warehouses.length)throw new Error('Tidak ada gudang dengan stok.');
   const warehouse=warehouses[(Number(window.prompt(warehouses.map((row,index)=>`${index+1}. ${row.name}`).join('\n'),'1'))||1)-1];if(!warehouse)return;
   await api.post(`/api/v1/workflows/sales-orders/${order.id}/deliver`,{warehouse_id:warehouse.id,lines,idempotency_key:`ui-delivery-${crypto.randomUUID()}`});
   await this.refresh();this.notice(`Delivery / BAST ${order.number} tersimpan; stok dan HPP diposting.`);return;
  }
  if(name==='return'){
   if(action==='viewrow'){
    if(!window.confirm('Buat credit note untuk retur ini? Nilai akan mengurangi piutang invoice yang masih terbuka.'))return;
    const result=await api.post(`/api/v1/workflows/sales-returns/${id.slice('db-return-'.length)}/credit-note`,{});
    await this.refresh();this.notice(result.data.already_exists?'Credit note sudah pernah dibuat.':'Credit note dibuat; pendapatan, PPN, piutang, dan refund bila diperlukan telah diposting.');return;
   }
   const data=(await api.get('/api/v1/operational/sales')).data.data as {deliveries:Array<{id:string;number:string;customer:string;status:string}>};
   const deliveries=data.deliveries.filter(row=>['delivered','partially_returned'].includes(row.status));if(!deliveries.length)throw new Error('Tidak ada delivery yang dapat diretur.');
   const delivery=deliveries[(Number(window.prompt(deliveries.map((row,index)=>`${index+1}. ${row.number} — ${row.customer}`).join('\n'),'1'))||1)-1];if(!delivery)return;
   const reason=window.prompt('Alasan retur barang:');if(!reason?.trim())return;
   const detail=(await api.get(`/api/v1/operational/sales/deliveries/${delivery.id}`)).data.data as {lines:Array<{id:string;product:string;quantity:string;returned_quantity:string}>};
   const lines=[] as Array<{delivery_line_id:string;quantity:string}>;
   for(const line of detail.lines){const remaining=Number(line.quantity)-Number(line.returned_quantity);if(remaining<=0)continue;
    const quantity=window.prompt(`Jumlah retur ${line.product} (maks. ${remaining}):`,remaining.toFixed(4));if(quantity===null)return;
    if(!/^\d{1,12}(?:\.\d{1,4})?$/.test(quantity.trim())||Number(quantity)<=0||Number(quantity)>remaining)throw new Error(`Jumlah retur ${line.product} tidak valid.`);
    lines.push({delivery_line_id:line.id,quantity:quantity.trim()});}
   if(!lines.length)throw new Error('Tidak ada barang tersisa untuk diretur.');
   await api.post(`/api/v1/workflows/sales-deliveries/${delivery.id}/return`,{reason:reason.trim(),lines,idempotency_key:`ui-sales-return-${crypto.randomUUID()}`});
   await this.refresh();this.notice(`Retur ${delivery.number} diterima; stok dan HPP dibalik.`);return;
  }
  const invoiceId=id.slice(name==='invoice'?'db-invoice-'.length:'db-ar-'.length);
  const operational=(await api.get('/api/v1/operational/sales')).data.data as {invoices:Array<{id:string;amount:string;paid_amount:string;number:string}>};
  const invoice=operational.invoices.find(item=>item.id===invoiceId);if(!invoice)return;
  const outstanding=Number(invoice.amount)-Number(invoice.paid_amount);if(outstanding<=0)throw new Error('Invoice sudah lunas.');
  const amount=window.prompt(`Jumlah pembayaran ${invoice.number}:`,outstanding.toFixed(2));if(!amount)return;
  await api.post(`/api/v1/workflows/invoices/${invoiceId}/payments`,{amount,paid_at:new Date().toISOString().slice(0,10),reference:window.prompt('Referensi pembayaran (opsional):')||undefined,idempotency_key:`ui-payment-${crypto.randomUUID()}`});
  await this.refresh();this.notice('Pembayaran diterima dan jurnal kas/piutang dibuat.');
 }
}
