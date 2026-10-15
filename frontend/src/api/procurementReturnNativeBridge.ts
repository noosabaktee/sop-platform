import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';

/** Routes the existing receipt detail control to the stock/accounting return workflow. */
export class ProcurementReturnNativeBridge {
 private listener=(event:Event)=>{void this.handle(event).catch(error=>window.alert(error?.response?.data?.message||'Retur gagal diposting.'))};
 constructor(private readonly operational:OperationalProjectionBridge){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private async handle(event:Event){
  const target=event.target as HTMLElement;if(event.type!=='click'||!target.closest('[data-prototype-page][data-route="/purchase"] [data-bd-panel="receipt"]'))return;
  const button=target.closest<HTMLElement>('[data-bd-act="viewrow"]');const id=button?.dataset.bdId||'';if(!id.startsWith('db-'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(window.prompt('Aksi Goods Receipt: return','return')?.trim().toLowerCase()!=='return')return;
  const detail=(await api.get(`/api/v1/operational/procurement/receipts/${id.slice(3)}`)).data.data as {lines:Array<{id:string;sku:string;product:string;quantity:string;returned_quantity:string}>};
  const lines=detail.lines.filter(line=>Number(line.quantity)>Number(line.returned_quantity));if(!lines.length)throw new Error('Semua item Goods Receipt sudah diretur.');
  const line=lines[(Number(window.prompt(lines.map((row,i)=>`${i+1}. ${row.sku} — ${row.product}`).join('\n'),'1'))||1)-1];if(!line)return;
  const remaining=Number(line.quantity)-Number(line.returned_quantity);const quantity=Number(window.prompt(`Jumlah retur (maks. ${remaining.toFixed(4)}):`,remaining.toFixed(4)));const reason=window.prompt('Alasan retur:');if(!Number.isFinite(quantity)||quantity<=0||quantity>remaining||!reason?.trim())return;
  await api.post(`/api/v1/workflows/goods-receipts/${id.slice(3)}/return`,{receipt_line_id:line.id,quantity,reason:reason.trim()});
  await this.operational.refresh();window.dispatchEvent(new Event('sop:domain-updated'));
 }
}
