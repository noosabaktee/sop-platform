import {api} from './client';

type Approval={id:string;subject_id:string;subject_type:string;status:string;number:string|null;
 amount:string|null;requester:string|null;decided_at:string|null};
const rupiah=(value:string|null)=>value==null?'—':'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(Number(value));
/** Preserves approved native markup, binds decisions to real company-scoped transactions. */
export class ApprovalWorkflowBridge {
 private active=false;
 private busy=false;
 private approvals:Approval[]=[];
 private readonly templates=new Map<HTMLElement,HTMLElement>();
 constructor(private readonly canApprove:boolean){}
 async install(){
  this.active=true;
  document.addEventListener('click',this.onClick,true);
  window.addEventListener('hashchange',this.onRoute);
  window.addEventListener('sop:workflow-updated',this.onRoute);
  await this.refresh();
 }
 uninstall(){
  this.active=false;
  document.removeEventListener('click',this.onClick,true);
  window.removeEventListener('hashchange',this.onRoute);
  window.removeEventListener('sop:workflow-updated',this.onRoute);
 }
 private readonly onRoute=()=>{if(this.active)void this.refresh().catch(error=>this.message('Refresh approval gagal: '+String(error)))};
 private message(text:string){
  const root=document.querySelector<HTMLElement>('[data-page-id="workflow"]');
  const toast=root?.querySelector<HTMLElement>('.toast');
  if(toast){toast.textContent=text;toast.hidden=false;window.setTimeout(()=>toast.hidden=true,5000)}
  else console.info(text);
 }
 private readonly onClick=(event:MouseEvent)=>{
  if(!this.active)return;
  const el=(event.target as HTMLElement).closest<HTMLElement>('[data-wf-act],[data-action="wf:bulk"]');
  if(!el||!el.closest('[data-page-id="workflow"]'))return;
  // Never allow the original demo handler to mutate a fake local approval queue.
  event.preventDefault();event.stopImmediatePropagation();
  if(this.busy)return;
  if(!this.canApprove){this.message('Akun ini tidak memiliki izin approval.');return;}
  if(el.dataset.action==='wf:bulk'){
   if(!this.approvals.some(a=>a.status==='pending'&&['quotation','purchase_request'].includes(a.subject_type))){
    this.message('Tidak ada approval transaksi yang menunggu.');return;
   }
   if(window.confirm('Setujui semua transaksi yang memenuhi izin approval? Permintaan yang tidak valid akan dilaporkan.'))
    void this.bulkApprove();
   return;
  }
  const parent=el.closest<HTMLElement>('[data-appr^="db-approval-"]');
  if(!parent){this.message('Approval sedang dimuat dari PostgreSQL.');return;}
  const id=el.dataset.id;
  if(!id)return;
  const kind=parent.dataset.sopSubjectType||'quotation';
  const action=el.dataset.wfAct;
  if(action==='steps'){
   this.message('Alur '+(parent.querySelector('.appr__t')?.textContent||'quotation')+': menunggu keputusan approver.');return;
  }
  if(action==='revise'){
   const comment=window.prompt('Catatan revisi untuk pengaju:');
   if(comment===null)return;
   if(!comment.trim()){this.message('Catatan revisi wajib diisi.');return;}
   if(kind==='purchase_request'){this.message('Untuk PR, gunakan Setujui atau Tolak dengan alasan.');return;}
   void this.decide(id,'revision_requested',el as HTMLButtonElement,comment.trim(),kind);
   return;
  }
  if(action==='approve'||action==='reject'){
   const decision=action==='approve'?'approved':'rejected';
   const comment=decision==='rejected'?window.prompt('Alasan penolakan:'):'';
   if(comment===null)return;
   if(decision==='rejected'&&!comment?.trim()){this.message('Alasan penolakan wajib diisi.');return;}
   void this.decide(id,decision,el as HTMLButtonElement,comment||'',kind);
  }
 };
 private async requestDecision(id:string,decision:string,comment='',kind='quotation'){
  if(kind==='purchase_request'){
   await api.post(`/api/v1/workflows/purchase-requests/${id}/decision`,{decision,reason:comment});
  }else await api.post(`/api/v1/workflows/quotations/${id}/decision`,{decision,comment});
 }
 private async decide(id:string,decision:string,button:HTMLButtonElement,comment='',kind='quotation'){
  this.busy=true;button.disabled=true;document.body.classList.add('sop-api-busy');
  try{
   await this.requestDecision(id,decision,comment,kind);
   await this.refresh();
   window.dispatchEvent(new Event('sop:workflow-updated'));
   this.message('Keputusan '+decision+' tersimpan di PostgreSQL.');
  }catch(error){
   const e=error as {response?:{data?:{message?:string}}};
   this.message('Approval gagal: '+(e.response?.data?.message||String(error)));
  }finally{button.disabled=false;this.busy=false;document.body.classList.remove('sop-api-busy')}
 }
 private async bulkApprove(){
  this.busy=true;document.body.classList.add('sop-api-busy');
  let success=0;let errors=0;
  try{
   for(const item of this.approvals.filter(a=>a.status==='pending'&&['quotation','purchase_request'].includes(a.subject_type))){
    try{await this.requestDecision(item.subject_id,'approved','',item.subject_type);success++}catch{errors++}
   }
   await this.refresh();window.dispatchEvent(new Event('sop:workflow-updated'));
   this.message(`Approval massal: ${success} berhasil, ${errors} gagal (izin/status).`);
  }catch(error){this.message('Bulk approval gagal: '+String(error))}
  finally{this.busy=false;document.body.classList.remove('sop-api-busy')}
 }
 private emptyState(){
  const div=document.createElement('div');div.className='list-plain';
  div.innerHTML='<div class="list-item"><iconify-icon noobserver icon="lucide:inbox" aria-hidden="true"></iconify-icon><div class="list-body"><p class="list-title">Tidak ada approval</p><p class="list-meta">Semua sudah diproses.</p></div></div>';
  return div;
 }
 async refresh(){
  if(!this.active)return;
  const {data}=await api.get('/api/v1/workflows/transaction-approvals');
  this.approvals=(data.data as Approval[]);
  const pending=this.approvals.filter(a=>a.status==='pending'&&['quotation','purchase_request'].includes(a.subject_type)&&a.number);
  const root=document.querySelector<HTMLElement>('[data-page-id="workflow"]');if(!root)return;
  for(const section of root.querySelectorAll<HTMLElement>('[data-tabpanel="myapproval"],[data-tabpanel="pending"]')){
   const existing=section.querySelector<HTMLElement>('[data-appr]');
   if(existing&&!this.templates.has(section))this.templates.set(section,existing.cloneNode(true) as HTMLElement);
   const template=this.templates.get(section);
   const host=section.querySelector<HTMLElement>('[data-db-approvals]')||existing?.parentElement;
   if(!host||!template)continue;
   host.dataset.dbApprovals='1';
   host.replaceChildren(...(pending.length?pending.map(item=>{
    const node=template.cloneNode(true) as HTMLElement;
    node.dataset.appr='db-approval-'+item.id;
    node.dataset.sopSubjectType=item.subject_type;
    const title=node.querySelector<HTMLElement>('.appr__t');if(title)title.textContent=(item.number||'Transaksi')+' · '+(item.subject_type==='purchase_request'?'Purchase Request':'Quotation');
    const meta=node.querySelector<HTMLElement>('.appr__m');if(meta)meta.textContent='Pengaju '+(item.requester||'—');
    const facts=node.querySelectorAll<HTMLElement>('.appr__fact .v');
    if(facts[0])facts[0].textContent=rupiah(item.amount);
    if(facts[1])facts[1].textContent=item.subject_type==='purchase_request'?'Approval pembelian':'Approval quotation';
    if(facts[2])facts[2].textContent='Menunggu';
    node.querySelectorAll<HTMLElement>('[data-wf-act]').forEach(btn=>{btn.dataset.id=item.subject_id;
     if(!this.canApprove&&(btn.dataset.wfAct==='approve'||btn.dataset.wfAct==='reject'||btn.dataset.wfAct==='revise'))(btn as HTMLButtonElement).disabled=true;
    });
    return node;
   }):[this.emptyState()]));
   const count=section.querySelector<HTMLElement>('.section-card__heading .chip');if(count)count.textContent=pending.length+' menunggu';
  }
  // Preserve existing KPI card classes and dimensions while replacing fake counts.
  for(const value of root.querySelectorAll<HTMLElement>('.kpi-row .kpi:nth-child(1) .kpi__value'))value.textContent=String(pending.length);
  const weekly=this.approvals.filter(a=>a.status==='approved'&&a.decided_at&&
   new Date(a.decided_at).getTime()>=Date.now()-7*86400000).length;
  for(const value of root.querySelectorAll<HTMLElement>('.kpi-row .kpi:nth-child(2) .kpi__value'))value.textContent=String(weekly);
  for(const value of root.querySelectorAll<HTMLElement>('.kpi-row .kpi:nth-child(3) .kpi__value'))value.textContent='—';
  for(const label of root.querySelectorAll<HTMLElement>('.kpi-row .kpi:nth-child(3) .kpi__comparison'))label.textContent='SLA belum dikonfigurasi';
 }
}
