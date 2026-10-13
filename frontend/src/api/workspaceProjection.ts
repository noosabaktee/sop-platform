import {api} from './client';

type Task={id:string;title:string;status:string;progress:number;due_at:string|null;project:string};
type Project={id:string;code:string;name:string;status:string;due_at:string|null;customer:string|null};
type Approval={id:string;number:string|null;total:string|null;requester:string|null;status:string;subject_type:string};
type Workspace={tasks:Task[];projects:Project[];approvals:Approval[]};
const text=(node:Element|null|undefined,value:unknown)=>{if(node)node.textContent=String(value??'—')};
const date=(value:string|null)=>value?new Date(value+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—';
const safe=(str:unknown)=>String(str??'').replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
/** Updates text-only and existing table row instances, preserving the native prototype table markup/CSS. */
function rowsForTable(table:HTMLTableElement,data:unknown[],update:(row:HTMLTableRowElement,item:any)=>void){
 const tbody=table.tBodies[0];if(!tbody)return;
 const template=tbody.querySelector<HTMLTableRowElement>('tr');if(!template)return;
 const skeleton=template.cloneNode(true) as HTMLTableRowElement;
 tbody.replaceChildren();
 if(!data.length){
  const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=table.tHead?.rows[0]?.cells.length||7;
  cell.textContent='Tidak ada data untuk pengguna ini.';row.appendChild(cell);tbody.appendChild(row);return;
 }
 for(const item of data){const row=skeleton.cloneNode(true) as HTMLTableRowElement;
  row.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(x=>x.checked=false);
  update(row,item);tbody.appendChild(row);
 }
}
export async function refreshNativeWorkspace(){
 const page=document.querySelector<HTMLElement>('[data-route="/my-workspace"]');
 if(!page)return;
 const result=await api.get('/api/v1/workspace');
 const state=result.data.data as Workspace;
 const tables=page.querySelectorAll<HTMLTableElement>('table.sop-table');
 if(tables[0])rowsForTable(tables[0],state.tasks,(row,item:Task)=>{
  row.dataset.recordId=item.id;const cells=row.cells;
  const label=cells[0]?.querySelector('label');if(label?.lastChild)label.lastChild.textContent=item.title;
  text(cells[1],'Project');text(cells[2]?.querySelector('.chip'),'Medium');
  text(cells[3]?.querySelector('.chip'),safe(item.status));text(cells[4],date(item.due_at));text(cells[5],item.project);
  row.dataset.status=item.status;row.dataset.priority='Medium';
 });
 if(tables[1])rowsForTable(tables[1],state.projects,(row,item:Project)=>{
  row.dataset.recordId=item.id;const cells=row.cells;
  const label=cells[0]?.querySelector('label');if(label?.lastChild)label.lastChild.textContent=`${item.code} ${item.name}`;
  text(cells[1],item.customer);text(cells[2]?.querySelector('.chip'),safe(item.status));
  text(cells[3],'—');text(cells[4],'—');text(cells[5],date(item.due_at));row.dataset.status=item.status;
 });
 if(tables[2])rowsForTable(tables[2],state.approvals,(row,item:Approval)=>{
  row.dataset.recordId=item.id;const cells=row.cells;
  const label=cells[0]?.querySelector('label');if(label?.lastChild)label.lastChild.textContent=item.number||item.subject_type;
  text(cells[1],safe(item.subject_type));text(cells[2],item.total?`Rp ${Number(item.total).toLocaleString('id-ID')}`:'—');
  text(cells[3],item.requester);text(cells[4],'—');text(cells[5]?.querySelector('.chip'),'Pending');row.dataset.status='Pending';
 });
}
