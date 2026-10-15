import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';
import {refreshNativeWorkspace} from './workspaceProjection';
import {refreshNativeKpis} from './kpiProjection';

/** Persists the Project-list toolbar and status controls in the frozen UI. */
export class ProjectNativeBridge {
 private listener=(event:Event)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||'Project gagal disimpan.'))};
 constructor(private readonly operational:OperationalProjectionBridge){}
 install(){document.addEventListener('click',this.listener,true);document.addEventListener('change',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true);document.removeEventListener('change',this.listener,true)}
 private notice(message:string){const toast=document.querySelector<HTMLElement>('[data-page-id="projects"] .toast');if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,4500)}else window.alert(message)}
 private async refresh(){await this.operational.refresh();window.dispatchEvent(new Event('sop:domain-updated'));await Promise.allSettled([refreshNativeWorkspace(),refreshNativeKpis()])}
 private async handle(event:Event){
  const target=event.target as HTMLElement;
  if(!target.closest('[data-prototype-page][data-route="/projects"]'))return;
  const panel=target.closest<HTMLElement>('[data-bd-panel="list"]');if(!panel)return;
  const status=target.closest<HTMLSelectElement>('select[data-bd-key="status"][data-bd-id]');
  if(status&&event.type==='change'&&status.dataset.bdId?.startsWith('db-')){
   event.preventDefault();event.stopImmediatePropagation();
   await api.patch(`/api/v1/operational/projects/${status.dataset.bdId.slice(3)}`,{status:status.value.toLowerCase().replaceAll(' ','_')});
   await this.refresh();this.notice('Status project tersimpan ke PostgreSQL.');return;
  }
  const button=target.closest<HTMLElement>('[data-bd-act="add"]');if(!button||event.type!=='click')return;
  event.preventDefault();event.stopImmediatePropagation();
  const options=(await api.get('/api/v1/operational/projects/options')).data.data as {customers:Array<{id:string;name:string}>;users:Array<{id:string;name:string}>};
  if(!options.customers.length)throw new Error('Tambahkan customer aktif terlebih dahulu.');
  const code=window.prompt('Kode project (contoh PRJ-001):');if(!code?.trim())return;
  const name=window.prompt('Nama project:');if(!name?.trim())return;
  const customer=options.customers[(Number(window.prompt(options.customers.map((row,index)=>`${index+1}. ${row.name}`).join('\n'),'1'))||1)-1];if(!customer)return;
  const manager=options.users[(Number(window.prompt(`Pilih manager:\n${options.users.map((row,index)=>`${index+1}. ${row.name}`).join('\n')}`,'1'))||1)-1];if(!manager)return;
  await api.post('/api/v1/operational/projects',{code:code.trim(),name:name.trim(),customer_id:customer.id,manager_id:manager.id,status:'planning'});
  await this.refresh();this.notice('Project dibuat dan tersimpan.');
 }
}
