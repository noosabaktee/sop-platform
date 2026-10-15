import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';
import {refreshNativeWorkspace} from './workspaceProjection';
import {refreshNativeKpis} from './kpiProjection';

/** Captures native Projects task mutations before the prototype's fixture handler. */
export class ProjectTaskNativeBridge {
 private listener=(event:Event)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||'Aksi task gagal disimpan.'))};
 constructor(private readonly operational:OperationalProjectionBridge){}
 install(){document.addEventListener('click',this.listener,true);document.addEventListener('change',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true);document.removeEventListener('change',this.listener,true)}
 private notice(message:string){const toast=document.querySelector<HTMLElement>('[data-page-id="projects"] .toast');if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,4500)}else window.alert(message)}
 private async refresh(){await this.operational.refresh();window.dispatchEvent(new Event('sop:domain-updated'));await Promise.allSettled([refreshNativeWorkspace(),refreshNativeKpis()])}
 private async handle(event:Event){
  const target=event.target as HTMLElement;
  if(!target.closest('[data-prototype-page][data-route="/projects"]'))return;
  const panel=target.closest<HTMLElement>('[data-bd-panel="task"]');if(!panel)return;
  const status=target.closest<HTMLSelectElement>('select[data-bd-key="status"][data-bd-id]');
  if(status&&event.type==='change'&&status.dataset.bdId?.startsWith('db-')){
   event.preventDefault();event.stopImmediatePropagation();
   const value=status.value.toLowerCase().replaceAll(' ','_');
   await api.patch(`/api/v1/operational/project-tasks/${status.dataset.bdId.slice(3)}`,{status:value==='to_do'?'todo':value});
   await this.refresh();this.notice('Status task tersimpan ke PostgreSQL.');return;
  }
  const button=target.closest<HTMLElement>('[data-bd-act]');if(!button||event.type!=='click')return;
  const act=button.dataset.bdAct||'';if(!['add','delrow','assign'].includes(act))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(act==='delrow'){
   const id=button.dataset.bdId||'';if(!id.startsWith('db-')||!window.confirm('Hapus task ini?'))return;
   await api.delete(`/api/v1/operational/project-tasks/${id.slice(3)}`);await this.refresh();this.notice('Task dihapus.');return;
  }
  if(act==='assign'){
   const pending=(window as unknown as {SOPBridge?:{getPendingRows:(route:string,panel:string)=>{selected:string[]}}}).SOPBridge?.getPendingRows('/projects','task');
   const selected=(pending?.selected||[]).filter(id=>id.startsWith('db-'));if(!selected.length)throw new Error('Pilih minimal satu task.');
   const users=(await api.get('/api/v1/operational/projects/options')).data.data.users as Array<{id:string;name:string}>;
   const assignee=users[(Number(window.prompt(users.map((user,index)=>`${index+1}. ${user.name}`).join('\n'),'1'))||1)-1];if(!assignee)return;
   await Promise.all(selected.map(id=>api.patch(`/api/v1/operational/project-tasks/${id.slice(3)}`,{assignee_id:assignee.id})));
   await this.refresh();this.notice(`${selected.length} task ditugaskan ke ${assignee.name}.`);return;
  }
  const data=(await api.get('/api/v1/operational/projects')).data.data.projects as Array<{id:string;code:string;name:string}>;
  const chosen=data[(Number(window.prompt(data.map((p,i)=>`${i+1}. ${p.code} — ${p.name}`).join('\n'),'1'))||1)-1];if(!chosen)return;
  const title=window.prompt('Judul task:');if(!title?.trim())return;
  await api.post(`/api/v1/operational/projects/${chosen.id}/tasks`,{title:title.trim(),status:'todo'});
  await this.refresh();this.notice('Task dibuat dan ditautkan ke project.');
 }
}
