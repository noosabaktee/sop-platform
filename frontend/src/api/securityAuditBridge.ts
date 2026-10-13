import {api} from './client';
type Audit={id:string;action:string;entity_type:string;entity_id:string;actor:string|null;ip_address:string|null;created_at:string};
/** Displays authoritative immutable-in-app audit_events in the original datatable classes. */
export class SecurityAuditBridge {
 private events:Audit[]=[];
 private live=false;
 private timer:number|undefined;
 async install(){this.live=true;
  await this.refresh();window.addEventListener('hashchange',this.schedule);
  document.addEventListener('click',this.schedule);
 }
 uninstall(){this.live=false;if(this.timer)clearTimeout(this.timer);
  window.removeEventListener('hashchange',this.schedule);document.removeEventListener('click',this.schedule);
 }
 private schedule=()=>{if(this.timer)clearTimeout(this.timer);this.timer=window.setTimeout(()=>this.render(),110)};
 async refresh(){const response=await api.get('/api/v1/security/audit-events',{params:{per_page:100}});
  this.events=response.data.data as Audit[];this.schedule();}
 private render(){if(!this.live||location.hash!=='#/security-audit')return;
  const page=document.querySelector<HTMLElement>('[data-page-id="security"]');
  const table=page?.querySelector<HTMLTableElement>('[data-tabpanel="trail"] .datatable');
  if(!table?.tBodies[0])return;
  const body=table.tBodies[0];body.replaceChildren();
  for(const event of this.events){const tr=document.createElement('tr');
   const cells=[new Date(event.created_at).toLocaleString('id-ID'),event.actor||'System',event.action,
    `${event.entity_type}:${event.entity_id}`,event.ip_address||'—'];
   for(const value of cells){const td=document.createElement('td');td.textContent=value;tr.append(td)}body.append(tr);
  }
  if(!this.events.length){const tr=document.createElement('tr');const td=document.createElement('td');
   td.colSpan=5;td.textContent='Belum ada audit event untuk perusahaan ini.';tr.append(td);body.append(tr);}
  const label=page?.querySelector<HTMLElement>('[data-tabpanel="trail"] .info-tile .it-value');
  if(label)label.textContent=String(this.events.length);
 }
}
