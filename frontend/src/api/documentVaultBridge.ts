import {api} from './client';
import {showFormModal} from './modalHelper';

type DocumentRow={
 id:string;
 title:string;
 category:string;
 folder:string|null;
 version:number;
 status:string;
 is_verified?:boolean;
 rejection_reason?:string|null;
 updated_at:string
};
const actionSelectors='[data-action="doc:upload"],[data-doc-act="upload"],[data-action="cor:upload"]';
/** Keeps every original class, CSS rule and toolbar intact. Replaces dummy upload popup and adds real approval/verification. */
export class DocumentVaultBridge {
 private active=false;
 private rows:DocumentRow[]=[];
 private timer:number|undefined;
 private processing=false;
 async install(){this.active=true;await this.refresh();document.addEventListener('click',this.click,true);
  window.addEventListener('hashchange',this.schedule);}
 uninstall(){this.active=false;document.removeEventListener('click',this.click,true);
  window.removeEventListener('hashchange',this.schedule);if(this.timer)clearTimeout(this.timer);}
 private schedule=()=>{if(this.timer)clearTimeout(this.timer);this.timer=window.setTimeout(()=>{if(this.active)this.render()},130)};
 private click=(event:MouseEvent)=>{
  const target=event.target as HTMLElement;
  const docAct=target.closest<HTMLElement>('[data-doc-act]');
  if(docAct){
   const act=docAct.dataset.docAct;
   const file=docAct.closest<HTMLElement>('[data-sop-private-file]');
   const id=file?.dataset.sopPrivateFile;
   if(act==='submit-approval'&&id){
    event.preventDefault();event.stopImmediatePropagation();void this.submitApproval(id);return;
   }
   if(act==='approve'&&id){
    event.preventDefault();event.stopImmediatePropagation();void this.decide(id,'approved');return;
   }
   if(act==='reject'&&id){
    event.preventDefault();event.stopImmediatePropagation();
    void (async () => {
      const form = await showFormModal<{reason: string}>({
        title: 'Tolak Dokumen',
        icon: 'lucide:x-circle',
        iconColor: '#dc2626',
        submitText: 'Tolak Dokumen',
        fields: [
          {
            name: 'reason',
            label: 'Alasan Penolakan Dokumen',
            type: 'textarea',
            required: true,
            placeholder: 'Tuliskan alasan spesifik mengapa dokumen ini ditolak...',
          },
        ],
      });
      if (form) {
        await this.decide(id, 'rejected', form.reason.trim());
      }
    })();
    return;
   }
   if(act==='verify-hash'&&id){
    event.preventDefault();event.stopImmediatePropagation();void this.verify(id);return;
   }
  }
  const el=target.closest<HTMLElement>(actionSelectors);
  if(el&&el.closest('[data-page-id="documents"],[data-page-id="corporate"]')){
   event.preventDefault();event.stopImmediatePropagation();this.choose(el.closest('[data-page-id="corporate"]')?'corporate':undefined);return;
  }
  const file=target.closest<HTMLElement>('[data-sop-private-file]');
  if(file?.closest('[data-page-id="documents"]')){
   event.preventDefault();event.stopImmediatePropagation();void this.download(file.dataset.sopPrivateFile||'');return;
  }
  this.schedule();
 };
 private toast(message:string){const node=document.querySelector<HTMLElement>('[data-page-id="documents"] .toast,[data-page-id="corporate"] .toast');
  if(node){node.textContent=message;node.hidden=false;window.setTimeout(()=>node.hidden=true,4500)}
  else window.alert(message);
 }
 async refresh(){
  const {data}=await api.get('/api/v1/documents/files',{params:{per_page:100}});
  this.rows=(data.data||[]) as DocumentRow[];this.schedule();
 }
 private choose(category?:string){
  if(this.processing)return;
  const input=document.createElement('input');input.type='file';input.hidden=true;
  input.accept='.pdf,.jpg,.jpeg,.png,.csv,.txt,.doc,.docx,.xls,.xlsx';document.body.append(input);
  input.addEventListener('change',()=>{const file=input.files?.[0];input.remove();if(file)void this.upload(file,category)}, {once:true});input.click();
 }
 private async upload(file:File,forcedCategory?:string){
  this.processing=true;document.body.classList.add('sop-api-busy');
  try{
   const form=new FormData();form.append('file',file);form.append('title',file.name);
   const panel=document.querySelector<HTMLElement>('[data-page-id="documents"] [data-tabpanel]:not([hidden])');
   const category=forcedCategory||panel?.dataset.tabpanel||'all';form.append('category',category);
   const folder=panel?.querySelector<HTMLElement>('.fm-folder[aria-selected="true"]')?.dataset.folder;
   if(folder)form.append('folder',folder);
   await api.post('/api/v1/documents/files',form);
   await this.refresh();window.dispatchEvent(new Event('sop:documents-updated'));this.toast('Dokumen berhasil diunggah ke arsip aman.');
  }catch(error){console.error(error);this.toast('Upload gagal: file belum tersimpan. Periksa izin dan batas 10 MB.');}
  finally{this.processing=false;document.body.classList.remove('sop-api-busy')}
 }
 private async submitApproval(id:string){
  try{
   await api.post(`/api/v1/documents/files/${id}/submit-approval`);
   await this.refresh();this.toast('Dokumen berhasil diajukan untuk persetujuan.');
  }catch(e){console.error(e);this.toast('Gagal mengajukan persetujuan dokumen.');}
 }
 private async decide(id:string,decision:'approved'|'rejected',reason?:string){
  try{
   await api.post(`/api/v1/documents/files/${id}/decision`,{decision,reason});
   await this.refresh();this.toast(decision==='approved'?'Dokumen berhasil disetujui.':'Dokumen ditolak.');
  }catch(e){console.error(e);this.toast('Keputusan dokumen gagal diproses.');}
 }
 private async verify(id:string){
  const row=this.rows.find(r=>r.id===id);if(!row)return;
  try{
   const {data}=await api.get(`/api/v1/documents/files/${id}/versions/${row.version}/verify`);
   await this.refresh();
   if(data?.data?.is_verified){
    this.toast(`Integritas SHA-256 valid: ${data.data.computed_sha256?.substring(0,16)}...`);
   }else{
    this.toast('Peringatan: Hash file tidak sesuai atau berkas telah berubah!');
   }
  }catch(e){console.error(e);this.toast('Gagal memverifikasi checksum berkas.');}
 }
 private render(){
  if(location.hash!=='#/document-management')return;
  const page=document.querySelector<HTMLElement>('[data-page-id="documents"]');if(!page)return;
  for(const host of page.querySelectorAll<HTMLElement>('[data-fm-main]')){
   // Keep original folder selection; only the underlying document records are replaced.
   const panel=host.closest<HTMLElement>('[data-tabpanel]');
   const category=panel?.dataset.tabpanel||'all';
   const folder=panel?.querySelector<HTMLElement>('.fm-folder[aria-selected="true"]')?.dataset.folder;
   const entries=this.rows.filter(row=>(category==='all'||row.category===category)&&(!folder||row.folder===folder));
   const breadcrumb=host.querySelector<HTMLElement>('.fm-crumb')?.cloneNode(true) as HTMLElement|null;
   const content=document.createDocumentFragment();if(breadcrumb)content.append(breadcrumb);
   if(!entries.length){const empty=document.createElement('p');empty.className='fm-empty';empty.textContent='Belum ada dokumen yang diunggah.';content.append(empty)}
   for(const row of entries){
    const item=document.createElement('div');item.className='fm-file';item.dataset.sopPrivateFile=row.id;
    const icon=document.createElement('iconify-icon');icon.setAttribute('icon','lucide:file-text');icon.setAttribute('aria-hidden','true');item.append(icon);
    const name=document.createElement('span');name.className='fm-file__name';name.textContent=row.title;item.append(name);
    
    const chipClass=row.status==='approved'?'chip success':row.status==='pending_approval'?'chip warning':row.status==='rejected'?'chip danger':'chip info';
    const chip=document.createElement('span');chip.className=chipClass;chip.textContent=row.status;item.append(chip);

    if(row.is_verified){
     const vBadge=document.createElement('span');vBadge.className='chip success';vBadge.style.fontSize='10px';vBadge.textContent='SHA-256 Intact';item.append(vBadge);
    }

    const meta=document.createElement('span');meta.className='fm-file__meta';meta.textContent=`v${row.version} · ${new Date(row.updated_at).toLocaleDateString('id-ID')}`;item.append(meta);

    // Actions container
    const acts=document.createElement('div');acts.className='fm-file__actions';acts.style.display='inline-flex';acts.style.gap='4px';acts.style.marginLeft='auto';
    
    if(row.status==='draft'||row.status==='rejected'){
     const subBtn=document.createElement('button');subBtn.type='button';subBtn.dataset.docAct='submit-approval';subBtn.className='btn btn-xs btn-outline';subBtn.textContent='Ajukan';subBtn.title='Ajukan persetujuan';
     acts.append(subBtn);
    }else if(row.status==='pending_approval'){
     const appBtn=document.createElement('button');appBtn.type='button';appBtn.dataset.docAct='approve';appBtn.className='btn btn-xs btn-success';appBtn.textContent='Setujui';
     const rejBtn=document.createElement('button');rejBtn.type='button';rejBtn.dataset.docAct='reject';rejBtn.className='btn btn-xs btn-danger';rejBtn.textContent='Tolak';
     acts.append(appBtn,rejBtn);
    }

    const vBtn=document.createElement('button');vBtn.type='button';vBtn.dataset.docAct='verify-hash';vBtn.className='btn btn-xs btn-ghost';vBtn.textContent='Verifikasi';vBtn.title='Verifikasi integritas hash SHA-256';
    acts.append(vBtn);

    item.append(acts);
    content.append(item);
   }
   host.replaceChildren(content);
  }
 }
 private async download(id:string){
  const row=this.rows.find(item=>item.id===id);if(!row)return;
  try{
   const response=await api.get(`/api/v1/documents/files/${id}/versions/${row.version}/download`,{responseType:'blob'});
   const url=URL.createObjectURL(new Blob([response.data]));const a=document.createElement('a');a.href=url;a.download=row.title;
   document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),2000);
  }catch(error){console.error(error);this.toast('Unduh dokumen gagal. File tidak tersedia atau tidak diizinkan.')}
 }
}
