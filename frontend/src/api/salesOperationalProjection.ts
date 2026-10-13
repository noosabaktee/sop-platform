import {api} from './client';
import type {GridBridge} from './gridBridge';
type Invoice={id:string;number:string;customer:string;sales_order:string|null;due_date:string|null;amount:string;paid_amount:string;status:string};
type Payment={id:string;number:string;customer:string;invoice:string;paid_at:string;amount:string;reference:string|null};
type Receivable=Invoice&{outstanding:string;days_overdue:number};
type Sales={invoices:Invoice[];payments:Payment[];receivables:Receivable[]};
const money=(v:string)=>'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(Number(v));
const date=(v:string|null)=>v?new Date(v+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—';
/** Project live financial records onto existing read-only Sales grids; DOM/CSS stays native. */
export async function refreshSalesOperationalGrids(bridge:GridBridge){
 const {data:response}=await api.get('/api/v1/operational/sales');
 const data=response.data as Sales;
 bridge.mergeDomainRows('/sales','invoice','db-invoice-',data.invoices.map(inv=>({
  __id:'db-invoice-'+inv.id,number:inv.number,customer:inv.customer,
  source:inv.sales_order||'—',due:date(inv.due_date),value:money(inv.amount),
  owner:'—',status:inv.status==='paid'?'Paid':inv.due_date&&inv.due_date<new Date().toISOString().slice(0,10)?'Overdue':'Invoiced'
 })));
 bridge.mergeDomainRows('/sales','payment','db-payment-',data.payments.map(p=>({
  __id:'db-payment-'+p.id,number:p.number,invoice:p.invoice,customer:p.customer,
  method:p.reference||'Transfer',date:date(p.paid_at),value:money(p.amount),status:'Received'
 })));
 bridge.mergeDomainRows('/sales','ar','db-ar-',data.receivables.map(inv=>({
  __id:'db-ar-'+inv.id,customer:inv.customer,invoice:inv.number,due:date(inv.due_date),
  age:inv.days_overdue?inv.days_overdue+' hari':'—',collector:'—',value:money(inv.outstanding),
  status:inv.days_overdue===0?'Belum jatuh tempo':inv.days_overdue<=30?'1–30 hari':inv.days_overdue<=60?'31–60 hari':'>60 hari'
 })));
}
