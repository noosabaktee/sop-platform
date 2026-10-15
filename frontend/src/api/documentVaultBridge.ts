import {api} from './client';

type DocumentRow={id:string;title:string;category:string;folder:string|null;version:number;status:string;updated_at:string};
const actionSelectors='[data-action="doc:upload"],[data-doc-act="upload"],[data-action="cor:upload"]';
/** Keeps every original class, CSS rule and toolbar intact. Replaces dummy upload popup. */
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
  const el=(event.target as HTMLElement).closest<HTMLElement>(actionSelectors);
  if(el&&el.closest('[data-page-id="documents"],[data-page-id="corporate"]')){
   event.preventDefault();event.stopImmediatePropagation();this.choose(el.closest('[data-page-id="corporate"]')?'corporate':undefined);return;
  }
  const file=(event.target as HTMLElement).closest<HTMLElement>('[data-sop-private-file]');
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
   await this.refresh();window.dispatchEvent(new Event('sop:documents-updated'));this.toast('Dokumen tersimpan di storage privat PostgreSQL-metadata.');
  }catch(error){console.error(error);this.toast('Upload gagal: file belum tersimpan. Periksa izin dan batas 10 MB.');}
  finally{this.processing=false;document.body.classList.remove('sop-api-busy')}
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
    const chip=document.createElement('span');chip.className='chip info';chip.textContent=row.status;item.append(chip);
    const meta=document.createElement('span');meta.className='fm-file__meta';meta.textContent=`v${row.version} · ${new Date(row.updated_at).toLocaleDateString('id-ID')}`;item.append(meta);
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
