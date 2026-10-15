import {api} from './client';

type Status={email:boolean;whatsapp:boolean;ai:boolean;provider_note:string};

/** Prevents frozen provider cards from claiming a connection based only on local UI state. */
export class IntegrationStatusBridge {
 private busy=false;
 install(){document.addEventListener('click',this.onClick,true)}
 uninstall(){document.removeEventListener('click',this.onClick,true)}
 private note(message:string){const root=document.querySelector<HTMLElement>('[data-page-id="integrations"]');const toast=root?.querySelector<HTMLElement>('.toast');if(toast){toast.textContent=message;toast.hidden=false;window.setTimeout(()=>toast.hidden=true,6000)}else window.alert(message)}
 private async status(){return (await api.get('/api/v1/integrations/status')).data.data as Status}
 private readonly onClick=(event:MouseEvent)=>{
  const target=event.target as HTMLElement;const sync=target.closest<HTMLElement>('[data-action="int:sync"],[data-action="int:new"]');const action=target.closest<HTMLElement>('[data-int-act]');
  if((!sync&&!action)||!target.closest('[data-page-id="integrations"]'))return;
  const id=action?.dataset.id||'';const supported=['email','whatsapp','ai'].includes(id);
  if(!sync&&!supported)return;
  event.preventDefault();event.stopImmediatePropagation();if(this.busy)return;void this.inspect(sync?.dataset.action==='int:new'?'new':id||'all');
 };
 private async inspect(kind:string){
  this.busy=true;document.body.classList.add('sop-api-busy');
  try{const status=await this.status();const labels:Record<string,string>={email:'Email',whatsapp:'WhatsApp',ai:'AI'};
   if(kind==='new'){this.note('Konfigurasi provider dilakukan aman di backend/.env; UI tidak menyimpan atau memalsukan kredensial.');return;}
   if(kind==='all'){this.note(`Status konfigurasi — Email: ${status.email?'tersedia':'belum'}, WhatsApp: ${status.whatsapp?'tersedia':'belum'}, AI: ${status.ai?'tersedia':'belum'}. ${status.provider_note}`);return;}
   this.note(`${labels[kind]} ${status[kind as keyof Pick<Status,'email'|'whatsapp'|'ai'>]?'terkonfigurasi':'belum dikonfigurasi'}. ${status.provider_note}`);
  }catch(error){const e=error as {response?:{data?:{message?:string}}};this.note('Tidak dapat membaca status provider: '+(e.response?.data?.message||String(error)));}
  finally{this.busy=false;document.body.classList.remove('sop-api-busy')}
 }
}
