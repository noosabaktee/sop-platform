import {api} from './client';

/** Only intercept original controls that otherwise show fictional success. CSS/HTML unchanged. */
export class ExternalNativeBridge {
 private pending=false;
 install(){document.addEventListener('click',this.onClick,true);document.addEventListener('keydown',this.onKey,true)}
 uninstall(){document.removeEventListener('click',this.onClick,true);document.removeEventListener('keydown',this.onKey,true)}
 private note(message:string){
  const page=document.querySelector<HTMLElement>('[data-prototype-page]:not([hidden])');
  const toast=page?.querySelector<HTMLElement>('.toast');
  if(toast){toast.textContent=message;toast.hidden=false;window.setTimeout(()=>{toast.hidden=true},7000)}
  else window.alert(message);
 }
 private errorMessage(err:unknown):string{
  const e=err as {response?:{status?:number;data?:{message?:string;errors?:Record<string,string[]>}}};
  if(e.response?.status===503)return 'Provider belum dikonfigurasi. Periksa backend/.env.';
  if(e.response?.status===403)return 'Akun tidak berwenang untuk mengirim.';
  if(e.response?.status===419)return 'Sesi kedaluwarsa, refresh dan coba lagi.';
  return Object.values(e.response?.data?.errors||{})[0]?.[0]||e.response?.data?.message||'Koneksi provider/backend gagal.';
 }
 private readonly onKey=(event:KeyboardEvent)=>{
  if(event.key==='Enter'&&event.target instanceof HTMLInputElement&&event.target.matches('[data-chat-input]')&&event.target.closest('[data-page-id="ai-assistant"]')){
   event.preventDefault();event.stopImmediatePropagation();const input=event.target;const question=input.value.trim();
   if(question)void this.askAI(input,question);
  }
 };
 private readonly onClick=(event:MouseEvent)=>{
  const el=(event.target as HTMLElement).closest<HTMLElement>('[data-mail-act="send"],[data-action="mail:sync"], [data-wa-act="send"], [data-action="wa:sync"], [data-ai-act="send"], [data-prompt]');
  if(!el)return;
  const page=el.closest<HTMLElement>('[data-prototype-page]');if(!page)return;
  if(!['/email-communication','/whatsapp-integration','/ai-assistant'].includes(page.dataset.route||''))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(el.matches('[data-action="mail:sync"], [data-action="wa:sync"]')){
   this.note('Sinkronisasi inbox provider belum aktif. Tidak ada pesan eksternal yang diambil.');return;
  }
  if(el.matches('[data-wa-act="send"]')){void this.sendWhatsApp(el);return;}
  if(el.matches('[data-mail-act="send"]')){void this.sendEmail(el);return}
  const input=el.closest<HTMLElement>('.chatbox')?.querySelector<HTMLInputElement>('[data-chat-input]')||
    page.querySelector<HTMLElement>('[data-tabpanel]:not([hidden])')?.querySelector<HTMLInputElement>('[data-chat-input]');
  const question=el.hasAttribute('data-prompt')?el.dataset.prompt?.trim()||'':input?.value.trim()||'';
  if(input && question)void this.askAI(input,question);
 };
 private async sendEmail(button:HTMLElement){
  if(this.pending)return;
  const compose=button.closest<HTMLElement>('.compose');
  if(!compose){this.note('Email editor tidak ditemukan.');return}
  const field=(name:string)=>compose.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`)?.value.trim()||'';
  const recipient=field('Kepada'),subject=field('Subject');
  const content=compose.querySelector<HTMLTextAreaElement>('textarea[aria-label="Pesan"]')?.value||'';
  if(!recipient||!content.trim()){this.note('Isi penerima dan pesan.');return}
  this.pending=true;button.setAttribute('aria-busy','true');document.body.classList.add('sop-api-busy');
  try{
   const res=await api.post('/api/v1/communications/send',{
    channel:'email',recipient,subject,content,idempotency_key:crypto.randomUUID()});
   this.note(res.data.data.status==='sent'?'Email diterima transport SMTP. Delivery akhir bergantung pada provider.':'Status pengiriman: '+res.data.data.status);
  }catch(err){this.note('Email tidak terkirim: '+this.errorMessage(err))}
  finally{this.pending=false;button.removeAttribute('aria-busy');document.body.classList.remove('sop-api-busy')}
 }
 private async sendWhatsApp(button:HTMLElement){
  if(this.pending)return;
  const chat=button.closest<HTMLElement>('.chat');const input=chat?.querySelector<HTMLInputElement>('[data-wa-reply]');const content=input?.value.trim()||'';
  if(!content){this.note('Tulis pesan WhatsApp terlebih dahulu.');return;}
  const recipient=window.prompt('Nomor WhatsApp tujuan (format internasional, misalnya +628123456789):');if(recipient===null)return;
  if(!/^\+[1-9][0-9]{7,14}$/.test(recipient.trim())){this.note('Nomor WhatsApp harus format internasional, misalnya +628123456789.');return;}
  if(!window.confirm(`Kirim WhatsApp ke ${recipient.trim()}? Pastikan penerima telah opt-in.`))return;
  this.pending=true;button.setAttribute('aria-busy','true');document.body.classList.add('sop-api-busy');
  try{
   const response=await api.post('/api/v1/communications/send',{channel:'whatsapp',recipient:recipient.trim(),content,idempotency_key:crypto.randomUUID()});
   if(input)input.value='';this.note(response.data.data.status==='sent'?'WhatsApp diterima WhatsApp Cloud API. Delivery akhir mengikuti provider.':'Status WhatsApp: '+response.data.data.status);
  }catch(err){this.note('WhatsApp tidak terkirim: '+this.errorMessage(err))}
  finally{this.pending=false;button.removeAttribute('aria-busy');document.body.classList.remove('sop-api-busy')}
 }
 private append(body:HTMLElement,role:'user'|'ai',text:string){
  const outer=document.createElement('div');outer.className='msg '+role;
  const inner=document.createElement('div');inner.className='b';inner.textContent=text;
  outer.append(inner);body.append(outer);body.scrollTop=body.scrollHeight;
 }
 private async askAI(input:HTMLInputElement,question:string){
  if(this.pending)return;
  const container=input.closest<HTMLElement>('.chatbox');const body=container?.querySelector<HTMLElement>('[data-chat-body]');
  if(!body)return;
  this.pending=true;input.disabled=true;document.body.classList.add('sop-api-busy');
  this.append(body,'user',question);input.value='';
  try{
   const response=await api.post('/api/v1/ai/chat',{question});
   this.append(body,'ai',String(response.data.data.answer||'Tidak ada jawaban dari provider.'));
  }catch(err){this.append(body,'ai','AI belum tersedia: '+this.errorMessage(err));}
  finally{this.pending=false;input.disabled=false;document.body.classList.remove('sop-api-busy')}
 }
}
