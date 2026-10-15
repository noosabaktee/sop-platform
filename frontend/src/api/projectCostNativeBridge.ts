import {api} from './client';

type Project={id:string;code:string;name:string};
const categories=['material','labor','expense','service','other'];

/** Posts authoritative project costs from the existing Project Cost toolbar. */
export class ProjectCostNativeBridge {
 private working=false;
 private listener=(event:MouseEvent)=>{void this.handle(event).catch(error=>this.notice(error?.response?.data?.message||String(error)))};
 constructor(private readonly refresh:()=>Promise<unknown>){}
 install(){document.addEventListener('click',this.listener,true)}
 uninstall(){document.removeEventListener('click',this.listener,true)}
 private notice(message:string){
  const toast=document.querySelector<HTMLElement>('[data-page-id="projects"] .toast');
  if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,5500)}else window.alert(message);
 }
 private async handle(event:MouseEvent){
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-bd-act="add"]');
  if(!button||!button.closest('[data-page-id="projects"] [data-bd-panel="cost"]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(this.working)return;
  this.working=true;button.disabled=true;document.body.classList.add('sop-api-busy');
  try{
   const projects=(await api.get('/api/v1/operational/projects')).data.data.projects as Project[];
   if(!projects.length)throw new Error('Belum ada project untuk menerima biaya.');
   const project=projects[(Number(window.prompt(projects.map((item,index)=>`${index+1}. ${item.code} - ${item.name}`).join('\n'),'1'))||1)-1];if(!project)return;
   const category=categories[(Number(window.prompt(categories.map((item,index)=>`${index+1}. ${item}`).join('\n'),'1'))||1)-1];if(!category)return;
   const description=window.prompt('Deskripsi biaya:');if(!description?.trim())return;
   const amount=window.prompt('Nilai biaya (maksimal 2 desimal):');
   if(!amount||!/^\d{1,14}(?:\.\d{1,2})?$/.test(amount.trim())||Number(amount)<=0)throw new Error('Nilai biaya tidak valid.');
   const costDate=window.prompt('Tanggal biaya (YYYY-MM-DD):',new Date().toISOString().slice(0,10));if(!costDate)return;
   const reference=window.prompt('Referensi biaya:',`COST-${crypto.randomUUID().slice(0,8).toUpperCase()}`);if(!reference?.trim())return;
   await api.post('/api/v1/operational/projects/costs',{project_id:project.id,reference:reference.trim(),cost_date:costDate,category,description:description.trim(),amount:amount.trim()});
   await this.refresh();window.dispatchEvent(new Event('sop:domain-updated'));
   this.notice('Biaya project tersimpan dan profitabilitas diperbarui.');
  }finally{this.working=false;button.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
}
