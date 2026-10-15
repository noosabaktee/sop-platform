import {api} from './client';

type Meeting={id:string;kind:'general'|'rups_annual'|'rups_extraordinary'|'board';title:string;starts_at:string;location:string|null;status:'draft'|'scheduled'|'held'|'closed';total_shares:number;present_shares:number;minutes:string|null};
type Resolution={id:string;meeting_id:string;title:string;description:string|null;for_votes:number;against_votes:number;abstain_votes:number;status:'approved'|'rejected'};
type CorporateDocument={id:string;title:string;version:number;status:string;updated_at:string;category:string};
const date=(value:string)=>new Date(value).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const label=(value:string)=>value.replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase());

/** Connects the frozen Corporate page's native agenda affordances to the
 * authoritative meeting/resolution APIs without changing its CSS or source DOM. */
export class CorporateNativeBridge {
 private active=false;private meetings:Meeting[]=[];private resolutions:Resolution[]=[];private documents:CorporateDocument[]=[];private scheduled?:number;
 install(){this.active=true;document.addEventListener('click',this.click,true);window.addEventListener('hashchange',this.route);window.addEventListener('sop:documents-updated',this.documentsUpdated);return this.refresh();}
 uninstall(){this.active=false;document.removeEventListener('click',this.click,true);window.removeEventListener('hashchange',this.route);window.removeEventListener('sop:documents-updated',this.documentsUpdated);if(this.scheduled)window.clearTimeout(this.scheduled)}
 private route=()=>{if(location.hash==='#/corporate')void this.refresh().catch(console.error)};
 private documentsUpdated=()=>{if(location.hash==='#/corporate')void this.refresh().catch(console.error)};
 private toast(message:string){const node=document.querySelector<HTMLElement>('[data-page-id="corporate"] .toast');if(node){node.textContent=message;node.hidden=false;window.setTimeout(()=>node.hidden=true,5000)}else window.alert(message)}
 private page(){return document.querySelector<HTMLElement>('[data-page-id="corporate"]')}
 private async refresh(){
  const [meetingsResponse,documentsResponse]=await Promise.all([api.get('/api/v1/corporate/meetings'),api.get('/api/v1/documents/files',{params:{category:'corporate',per_page:100}})]);
  this.meetings=meetingsResponse.data.data as Meeting[];this.documents=(documentsResponse.data.data||[]) as CorporateDocument[];
  const details=await Promise.all(this.meetings.map(async meeting=>{const response=await api.get(`/api/v1/corporate/meetings/${meeting.id}`);return response.data.data.resolutions as Resolution[]}));
  this.resolutions=details.flat();this.scheduleRender();
 }
 private scheduleRender(){if(this.scheduled)window.clearTimeout(this.scheduled);this.scheduled=window.setTimeout(()=>{this.scheduled=undefined;this.render()},35)}
 private meetingList(container:HTMLElement,items:Meeting[]){
  container.replaceChildren();if(!items.length){const empty=document.createElement('p');empty.className='list-meta';empty.textContent='Belum ada agenda korporat tersimpan.';container.append(empty);return}
  items.forEach(item=>{const row=document.createElement('div');row.className='list-item';row.dataset.corporateMeeting=item.id;
   row.innerHTML=`<iconify-icon noobserver icon="${item.kind.startsWith('rups')?'lucide:gavel':'lucide:users-round'}" aria-hidden="true"></iconify-icon><div class="list-body"><p class="list-title"></p><p class="list-meta"></p></div><span class="chip"></span>`;
   (row.querySelector('.list-title') as HTMLElement).textContent=item.title;(row.querySelector('.list-meta') as HTMLElement).textContent=`${date(item.starts_at)}${item.location?` · ${item.location}`:''}`;
   const chip=row.querySelector<HTMLElement>('.chip');if(chip){chip.textContent=label(item.status);chip.className=`chip ${item.status==='closed'?'done':item.status==='held'?'progress':'info'}`};container.append(row)})
 }
 private render(){
  if(!this.active||location.hash!=='#/corporate')return;const page=this.page();if(!page)return;
  const panel=(id:string)=>page.querySelector<HTMLElement>(`[data-tabpanel="${id}"]`);
  const all=[...this.meetings].sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
  this.meetingList(panel('calendar')?.querySelector<HTMLElement>('.list-plain')||document.createElement('div'),all.filter(item=>item.status!=='closed').slice(0,3));
  this.meetingList(panel('board')?.querySelector<HTMLElement>('.list-plain')||document.createElement('div'),all.filter(item=>item.kind==='board'));
  this.meetingList(panel('management')?.querySelector<HTMLElement>('.list-plain')||document.createElement('div'),all.filter(item=>item.kind==='general'));
  this.meetingList(panel('rups')?.querySelector<HTMLElement>('.list-plain')||document.createElement('div'),all.filter(item=>item.kind.startsWith('rups')));
  const resolutionList=panel('resolutions')?.querySelector<HTMLElement>('.list-plain');if(resolutionList){resolutionList.replaceChildren();if(!this.resolutions.length){const empty=document.createElement('p');empty.className='list-meta';empty.textContent='Belum ada resolusi tercatat.';resolutionList.append(empty)}else this.resolutions.forEach(item=>{const meeting=this.meetings.find(value=>value.id===item.meeting_id);const row=document.createElement('div');row.className='list-item';row.dataset.corporateMeeting=item.meeting_id;row.innerHTML='<iconify-icon noobserver icon="lucide:file-check-2" aria-hidden="true"></iconify-icon><div class="list-body"><p class="list-title"></p><p class="list-meta"></p></div><span class="chip"></span>';(row.querySelector('.list-title') as HTMLElement).textContent=`${item.title} · ${meeting?.title||'Rapat'}`;(row.querySelector('.list-meta') as HTMLElement).textContent=`Setuju ${item.for_votes} · Tidak setuju ${item.against_votes}`;const chip=row.querySelector<HTMLElement>('.chip');if(chip){chip.textContent=label(item.status);chip.className=`chip ${item.status==='approved'?'done':'risk'}`};resolutionList.append(row)})}
  const documentBody=panel('documents')?.querySelector<HTMLElement>('.section-card__body');if(documentBody){documentBody.replaceChildren();if(!this.documents.length){const empty=document.createElement('p');empty.className='list-meta';empty.textContent='Belum ada dokumen corporate tersimpan.';documentBody.append(empty)}else this.documents.forEach(item=>{const row=document.createElement('div');row.className='doc-row';row.dataset.corporateDocument=item.id;row.innerHTML='<span class="doc-ico"><iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon></span><span class="doc-info"><b></b><span></span></span><span class="doc-actions"><button type="button" class="btn-ghost">Unduh</button></span>';(row.querySelector('b') as HTMLElement).textContent=item.title;(row.querySelector('.doc-info span') as HTMLElement).textContent=`v${item.version} · ${item.status}`;documentBody.append(row)})}
  page.querySelectorAll<HTMLElement>('.kpi').forEach(card=>{const name=card.querySelector('.kpi__title')?.textContent?.toLowerCase()||'';let value:number|undefined;if(name.includes('agenda'))value=this.meetings.length;else if(name.includes('resolusi'))value=this.resolutions.length;else if(name.includes('action'))value=this.meetings.filter(item=>item.status!=='closed').length;if(value!==undefined){const node=card.querySelector<HTMLElement>('.kpi__value');if(node)node.textContent=String(value)}});
 }
 private click=(event:MouseEvent)=>{
  const target=event.target as HTMLElement,create=target.closest<HTMLElement>('[data-action="cor:new"]');
  if(create?.closest('[data-page-id="corporate"]')){event.preventDefault();event.stopImmediatePropagation();void this.create();return}
  const document=target.closest<HTMLElement>('[data-corporate-document]');if(document?.closest('[data-page-id="corporate"]')){event.preventDefault();event.stopImmediatePropagation();void this.download(document.dataset.corporateDocument||'');return}
  const row=target.closest<HTMLElement>('[data-corporate-meeting]');if(row?.closest('[data-page-id="corporate"]')){event.preventDefault();event.stopImmediatePropagation();void this.manage(row.dataset.corporateMeeting||'')}
 };
 private async download(id:string){const record=this.documents.find(item=>item.id===id);if(!record)return;try{const response=await api.get(`/api/v1/documents/files/${id}/versions/${record.version}/download`,{responseType:'blob'});const url=URL.createObjectURL(new Blob([response.data]));const anchor=document.createElement('a');anchor.href=url;anchor.download=record.title;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}catch(error){this.toast('Dokumen tidak dapat diunduh: '+this.message(error))}}
 private async create(){
  const title=window.prompt('Judul agenda/rapat:');if(!title?.trim())return;
  const kindInput=window.prompt('Jenis: general, board, rups_annual, atau rups_extraordinary','general');const kind=['general','board','rups_annual','rups_extraordinary'].includes(kindInput||'')?kindInput:'general';
  const startsAt=window.prompt('Waktu mulai (YYYY-MM-DD HH:MM)',new Date(Date.now()+86400000).toISOString().slice(0,16).replace('T',' '));if(!startsAt)return;
  const location=window.prompt('Lokasi (opsional):')||undefined;const total=kind?.startsWith('rups')?Number(window.prompt('Total saham','0')||0):0;const present=kind?.startsWith('rups')?Number(window.prompt('Saham hadir','0')||0):0;
  document.body.classList.add('sop-api-busy');try{await api.post('/api/v1/corporate/meetings',{title:title.trim(),kind,starts_at:startsAt,location,total_shares:total,present_shares:present});await this.refresh();this.toast('Agenda tersimpan di PostgreSQL. Klik agenda untuk menjadwalkan atau melanjutkan rapat.')}catch(error){this.toast('Agenda gagal disimpan: '+this.message(error))}finally{document.body.classList.remove('sop-api-busy')}
 }
 private async manage(id:string){
  const meeting=this.meetings.find(item=>item.id===id);if(!meeting)return;
  const action=window.prompt(`Aksi ${meeting.title}: status, minutes, resolution, close`,'status')?.trim().toLowerCase();if(!action)return;
  document.body.classList.add('sop-api-busy');try{
   if(action==='status'){const next=window.prompt('Status berikutnya: scheduled atau held',meeting.status==='draft'?'scheduled':'held');if(!next)return;await api.patch(`/api/v1/corporate/meetings/${id}`,{status:next});}
   else if(action==='minutes'){const minutes=window.prompt('Minutes of Meeting:',meeting.minutes||'');if(minutes===null)return;await api.patch(`/api/v1/corporate/meetings/${id}`,{minutes});}
   else if(action==='resolution'){const title=window.prompt('Judul resolusi:');if(!title)return;const yes=Number(window.prompt('Suara setuju:','0')||0),no=Number(window.prompt('Suara tidak setuju:','0')||0),abstain=Number(window.prompt('Abstain:','0')||0);await api.post(`/api/v1/corporate/meetings/${id}/resolutions`,{title,for_votes:yes,against_votes:no,abstain_votes:abstain});}
   else if(action==='close')await api.post(`/api/v1/corporate/meetings/${id}/close`);else{this.toast('Aksi tidak dikenal. Gunakan status, minutes, resolution, atau close.');return}
   await this.refresh();this.toast('Workflow rapat telah tersimpan di PostgreSQL.');
  }catch(error){this.toast('Workflow rapat gagal: '+this.message(error))}finally{document.body.classList.remove('sop-api-busy')}
 }
 private message(error:unknown){const response=(error as {response?:{data?:{message?:string;errors?:Record<string,string[]>}}}).response;return Object.values(response?.data?.errors||{})[0]?.[0]||response?.data?.message||'periksa data dan izin Anda';}
}
