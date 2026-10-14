import {api} from './client';

type Row={id:string;[key:string]:unknown};
type Workspace={tasks:Row[];projects:Row[];approvals:Row[];activities:Row[];calendar:Row[];documents:Row[];notifications:Row[];emails:Row[];profile:Row[]};
const text=(node:Element|null|undefined,value:unknown)=>{if(node)node.textContent=String(value??'—')};
const safe=(value:unknown)=>String(value??'—').replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
const date=(value:unknown)=>value?new Date(String(value)).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:String(value).includes('T')?'2-digit':undefined,minute:String(value).includes('T')?'2-digit':undefined}):'—';
const label=(row:HTMLTableRowElement,value:unknown)=>{const target=row.cells[0]?.querySelector('label');if(target?.lastChild)target.lastChild.textContent=String(value??'—');else text(row.cells[0],value)};

function fill(panel:HTMLElement|null,data:Row[],update:(row:HTMLTableRowElement,item:Row)=>void){
 const table=panel?.querySelector<HTMLTableElement>('table.sop-table'),tbody=table?.tBodies[0],template=tbody?.querySelector<HTMLTableRowElement>('tr');
 if(!table||!tbody||!template)return;
 const skeleton=template.cloneNode(true) as HTMLTableRowElement;tbody.replaceChildren();
 if(!data.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=table.tHead?.rows[0]?.cells.length||7;cell.textContent='Tidak ada data untuk pengguna ini.';row.appendChild(cell);tbody.appendChild(row);return}
 for(const item of data){const row=skeleton.cloneNode(true) as HTMLTableRowElement;row.dataset.recordId=String(item.id??'');row.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(x=>x.checked=false);update(row,item);tbody.appendChild(row)}
}

/** Replaces all nine My Workspace fixture tables with user-scoped SQL projections. */
export async function refreshNativeWorkspace(){
 const page=document.querySelector<HTMLElement>('[data-route="/my-workspace"]');if(!page)return;
 const {data:response}=await api.get('/api/v1/workspace');const state=response.data as Workspace;
 const panel=(id:string)=>page.querySelector<HTMLElement>(`.ws-panel[data-panel="${id}"]`);
 fill(panel('my-workspace'),state.tasks,(row,item)=>{label(row,item.title);text(row.cells[1],'Projects');text(row.cells[2]?.querySelector('.chip'),'Medium');text(row.cells[3]?.querySelector('.chip'),safe(item.status));text(row.cells[4],date(item.due_at));text(row.cells[5],item.project);row.dataset.status=String(item.status);row.dataset.priority='Medium'});
 fill(panel('dashboard'),state.projects,(row,item)=>{label(row,`${item.code} ${item.name}`);text(row.cells[1],item.customer);text(row.cells[2]?.querySelector('.chip'),safe(item.status));text(row.cells[3],`${item.progress??0}%`);text(row.cells[4],'Saya');text(row.cells[5],date(item.due_at));row.dataset.status=String(item.status)});
 fill(panel('crm-sales'),state.approvals,(row,item)=>{label(row,item.number||item.subject_type);text(row.cells[1],safe(item.subject_type));text(row.cells[2],item.total?`Rp ${Number(item.total).toLocaleString('id-ID')}`:'—');text(row.cells[3],item.requester);text(row.cells[4],date(item.created_at));text(row.cells[5]?.querySelector('.chip'),'Pending');row.dataset.status='Pending'});
 fill(panel('business-development'),state.activities,(row,item)=>{label(row,safe(item.action));text(row.cells[1],safe(item.entity_type));text(row.cells[2],item.entity_id);text(row.cells[3],date(item.created_at));text(row.cells[4]?.querySelector('.chip'),'Tercatat');row.dataset.status='Done'});
 fill(panel('quotation'),state.calendar,(row,item)=>{label(row,item.title);text(row.cells[1],item.kind);text(row.cells[2],item.context);text(row.cells[3],date(item.starts_at));text(row.cells[4]?.querySelector('.chip'),safe(item.status));row.dataset.status=String(item.status)});
 fill(panel('sales'),state.documents,(row,item)=>{label(row,item.title);text(row.cells[1],safe(item.category));text(row.cells[2],item.folder);text(row.cells[3],`v${item.version}`);text(row.cells[4],date(item.updated_at));text(row.cells[5]?.querySelector('.chip'),safe(item.status));row.dataset.status=String(item.status)});
 fill(panel('projects'),state.notifications,(row,item)=>{const detail=(item.data&&typeof item.data==='object'?item.data:{}) as Record<string,unknown>;label(row,detail.message||detail.title||safe(item.type));text(row.cells[1],'In-app');text(row.cells[2],safe(item.type));text(row.cells[3],date(item.created_at));text(row.cells[4]?.querySelector('.chip'),item.read_at?'Read':'Unread');row.dataset.status=item.read_at?'Read':'Unread'});
 fill(panel('purchase'),state.emails,(row,item)=>{label(row,item.subject||'(Tanpa subjek)');text(row.cells[1],item.recipient);text(row.cells[2],'Outbox');text(row.cells[3],date(item.sent_at||item.created_at));text(row.cells[4]?.querySelector('.chip'),safe(item.status));row.dataset.status=String(item.status)});
 fill(panel('inventory'),state.profile,(row,item)=>{label(row,item.field);text(row.cells[1],item.value);text(row.cells[2],item.visibility);text(row.cells[3],date(new Date().toISOString()));row.dataset.status=''});
}

/** Checkbox completes an assigned task; notification detail marks it read. */
export async function handleNativeWorkspaceAction(event:Event):Promise<boolean>{
 const target=event.target as HTMLElement,page=target.closest<HTMLElement>('[data-route="/my-workspace"]');if(!page)return false;
 const row=target.closest<HTMLTableRowElement>('tr[data-record-id]'),panel=target.closest<HTMLElement>('.ws-panel[data-panel]');if(!row||!panel)return false;
 if(panel.dataset.panel==='my-workspace'&&target.matches('input[data-action="table:select"]')&&(target as HTMLInputElement).checked){
  event.preventDefault();event.stopImmediatePropagation();await api.patch(`/api/v1/operational/project-tasks/${row.dataset.recordId}`,{status:'done'});await refreshNativeWorkspace();return true;
 }
 if(panel.dataset.panel==='projects'&&target.closest('[data-action="table:detail"]')){
  event.preventDefault();event.stopImmediatePropagation();await api.post(`/api/v1/workspace/notifications/${row.dataset.recordId}/read`);await refreshNativeWorkspace();return true;
 }
 return false;
}
