import {api} from './client';
type Audit={id:string;action:string;entity_type:string;entity_id:string;actor:string|null;ip_address:string|null;created_at:string};
type LoginEvent={id:string;email:string;successful:boolean;reason:string|null;ip_address:string|null;user_agent:string|null;created_at:string};
type Session={id:string;ip_address:string|null;user_agent:string|null;last_activity:string;current:boolean};
/** Displays authoritative immutable-in-app audit_events in the original datatable classes. */
export class SecurityAuditBridge {
 private events:Audit[]=[];
 private logins:LoginEvent[]=[];
 private sessions:Session[]=[];
 private live=false;
 private timer:number|undefined;
 async install(){this.live=true;
  await this.refresh();window.addEventListener('hashchange',this.schedule);
  document.addEventListener('click',this.onClick,true);
 }
 uninstall(){this.live=false;if(this.timer)clearTimeout(this.timer);
  window.removeEventListener('hashchange',this.schedule);document.removeEventListener('click',this.onClick,true);
 }
 private schedule=()=>{if(this.timer)clearTimeout(this.timer);this.timer=window.setTimeout(()=>this.render(),110)};
 async refresh(){const [audit,logins,sessions]=await Promise.all([
  api.get('/api/v1/security/audit-events',{params:{per_page:100}}),api.get('/api/v1/security/login-history'),api.get('/api/v1/security/sessions')]);
  this.events=audit.data.data as Audit[];this.logins=logins.data.data as LoginEvent[];this.sessions=sessions.data.data as Session[];this.schedule();}
 private onClick=(event:MouseEvent)=>{
  const button=(event.target as HTMLElement).closest<HTMLElement>('[data-action="sec:revoke"],[data-action="sec:revoke-all"]');
  if(!button){this.schedule();return}
  event.preventDefault();event.stopImmediatePropagation();
  const request=button.dataset.action==='sec:revoke-all'?api.delete('/api/v1/security/sessions'):
   api.delete(`/api/v1/security/sessions/${encodeURIComponent(button.dataset.sessionId||'')}`);
  void request.then(()=>this.refresh()).catch(error=>window.alert(error?.response?.data?.message||'Sesi gagal dicabut.'));
 };
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
  this.renderLogins(page);this.renderSessions(page);
 }
 private renderLogins(page:HTMLElement|null|undefined){
  const body=page?.querySelector<HTMLTableSectionElement>('[data-tabpanel="login"] .datatable tbody');if(!body)return;
  body.replaceChildren();for(const event of this.logins){const row=document.createElement('tr');
   const values=[new Date(event.created_at).toLocaleString('id-ID'),event.email,event.successful?'Sukses':'Gagal',event.ip_address||'—',event.user_agent||'—'];
   values.forEach((value,index)=>{const cell=document.createElement('td');cell.textContent=value;if(index===2)cell.className=event.successful?'chip done':'chip risk';row.append(cell)});body.append(row)}
 }
 private renderSessions(page:HTMLElement|null|undefined){
  const body=page?.querySelector<HTMLElement>('[data-tabpanel="session"] .section-card__body');if(!body)return;
  body.replaceChildren();for(const session of this.sessions){const row=document.createElement('div');row.className='sess'+(session.current?' this':'');
   const icon=document.createElement('span');icon.className='ic';icon.innerHTML='<iconify-icon noobserver icon="lucide:monitor" aria-hidden="true"></iconify-icon>';
   const detail=document.createElement('div');detail.className='b';const title=document.createElement('b');title.textContent=(session.user_agent||'Perangkat')+(session.current?' · perangkat ini':'');
   const meta=document.createElement('span');meta.textContent=`${session.ip_address||'IP tidak tersedia'} · ${new Date(session.last_activity).toLocaleString('id-ID')}`;detail.append(title,meta);row.append(icon,detail);
   if(session.current){const chip=document.createElement('span');chip.className='chip done';chip.textContent='Aktif';row.append(chip)}
   else{const button=document.createElement('button');button.type='button';button.className='btn-ghost danger';button.dataset.action='sec:revoke';button.dataset.sessionId=session.id;button.textContent='Revoke';row.append(button)}body.append(row)}
  const value=page?.querySelector<HTMLElement>('[data-tabpanel="session"] .info-tile .it-value');if(value)value.textContent=String(this.sessions.length);
 }
}
