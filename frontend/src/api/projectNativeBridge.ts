import {api} from './client';
import type {OperationalProjectionBridge} from './operationalProjectionBridge';
import {refreshNativeWorkspace} from './workspaceProjection';
import {refreshNativeKpis} from './kpiProjection';
import {showFormModal} from './modalHelper';

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
   await this.refresh();this.notice('Status proyek berhasil diperbarui.');return;
  }
  const button=target.closest<HTMLElement>('[data-bd-act="add"]');if(!button||event.type!=='click')return;
  event.preventDefault();event.stopImmediatePropagation();
  const options=(await api.get('/api/v1/operational/projects/options')).data.data as {customers:Array<{id:string;name:string}>;users:Array<{id:string;name:string}>};
  if(!options.customers.length)throw new Error('Tambahkan customer aktif terlebih dahulu.');

  const formValues = await showFormModal<{code: string; name: string; customer_id: string; manager_id: string}>({
    title: 'Tambah Proyek Baru',
    icon: 'lucide:briefcase',
    submitText: 'Simpan Proyek',
    fields: [
      {
        name: 'code',
        label: 'Kode Proyek',
        type: 'text',
        required: true,
        placeholder: 'Contoh: PRJ-001',
        halfWidth: true,
      },
      {
        name: 'name',
        label: 'Nama Proyek',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Implementasi Sistem ERP Terpadu',
        halfWidth: true,
      },
      {
        name: 'customer_id',
        label: 'Pelanggan / Klien',
        type: 'select',
        required: true,
        options: options.customers.map(c => ({ value: c.id, label: c.name })),
        halfWidth: true,
      },
      {
        name: 'manager_id',
        label: 'Project Manager',
        type: 'select',
        required: true,
        options: options.users.map(u => ({ value: u.id, label: u.name })),
        halfWidth: true,
      },
    ],
  });

  if (!formValues) return;
  await api.post('/api/v1/operational/projects', {
    code: formValues.code.trim(),
    name: formValues.name.trim(),
    customer_id: formValues.customer_id,
    manager_id: formValues.manager_id,
    status: 'planning',
  });
  await this.refresh();
  this.notice('Proyek berhasil dibuat dan tersimpan.');
 }
}
