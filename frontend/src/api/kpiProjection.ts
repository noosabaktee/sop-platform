import {api} from './client';
type KPI={customers:number;quotations:number;projects:number;opportunities:number;open_project_tasks:number;pending_approvals:number;sales_revenue:number;outstanding_ar:number};
const idr=(n:number)=>'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:1}).format(n/1000000)+' jt';
/** Project live backend aggregates into existing metric text nodes. Never create or style DOM. */
export async function refreshNativeKpis(){
 const {data:result}=await api.get('/api/v1/dashboard');const data=result.data as KPI;
 const overview=document.querySelector<HTMLElement>('[data-route="/overview"]');
 const overviewMap:{[metric:string]:number}={tickets:data.opportunities,resolution:data.pending_approvals,compliance:data.open_project_tasks};
 overview?.querySelectorAll<HTMLElement>('[data-component="kravio-metric"]').forEach(card=>{
  const key=card.dataset.metric||'';const value=overviewMap[key];
  if(Number.isFinite(value)){const el=card.querySelector<HTMLElement>('[data-part="value"]');if(el)el.textContent=String(value)}
 });
 const dashboard=document.querySelector<HTMLElement>('[data-route="/dashboard"]');
 dashboard?.querySelectorAll<HTMLElement>('.kpi').forEach(card=>{
  const label=(card.querySelector<HTMLElement>('.kpi__title')?.innerText||'').toLowerCase();
  let value:string|undefined;
  if(/total customer|jumlah pelanggan/.test(label))value=String(data.customers);
  else if(/total quotation|jumlah penawaran/.test(label))value=String(data.quotations);
  else if(/active project|project aktif|proyek aktif/.test(label))value=String(data.projects);
  else if(/pending approval|menunggu persetujuan/.test(label))value=String(data.pending_approvals);
  else if(/outstanding ar|piutang outstanding/.test(label))value=idr(data.outstanding_ar);
  else if(/sales revenue|total revenue/.test(label))value=idr(data.sales_revenue);
  if(value!==undefined){const text=card.querySelector<HTMLElement>('.kpi__value');if(text)text.textContent=value}
 });
}
