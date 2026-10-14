import {api} from './client';
import type {GridBridge} from './gridBridge';

type WorkflowSnapshot={route:string;panel_id:string;rows:{__id:string;[key:string]:unknown}[];version:number};

export class CrmWorkflowBridge{
  private onClick=(event:MouseEvent)=>{
    const button=(event.target as HTMLElement).closest<HTMLElement>('[data-crm-panel="leads"] [data-crm-act="convert"]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    const rowKey=button.dataset.crmId;if(!rowKey)return;
    button.setAttribute('disabled','true');
    void this.grid.persistRoute('/crm-sales','leads')
      .then(()=>api.post(`/api/v1/workflows/crm/leads/${encodeURIComponent(rowKey)}/convert`))
      .then(response=>{
        this.grid.applyWorkflowSnapshots(response.data.data.snapshots as WorkflowSnapshot[]);
        window.alert('Lead berhasil dikonversi menjadi prospect dan tersimpan di PostgreSQL.');
      })
      .catch(error=>window.alert(error?.response?.data?.message||'Konversi lead gagal.'))
      .finally(()=>button.removeAttribute('disabled'));
  };
  constructor(private grid:GridBridge){}
  install(){document.addEventListener('click',this.onClick,true)}
  uninstall(){document.removeEventListener('click',this.onClick,true)}
}
