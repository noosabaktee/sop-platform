import {useEffect,useRef,useState} from 'react';
import {useAuth} from '../app/AuthContext';
import {api,csrf} from '../api/client';
import {GridBridge} from '../api/gridBridge';
import {ModuleStateBridge,type StateSnapshot,type ServerUser} from '../api/moduleStateBridge';
import {refreshNativeKpis} from '../api/kpiProjection';
import {handleNativeWorkspaceAction,refreshNativeWorkspace} from '../api/workspaceProjection';
import {QuotationBuilderBridge} from '../api/quotationBuilderBridge';
import {refreshSalesOperationalGrids} from '../api/salesOperationalProjection';
import {ApprovalWorkflowBridge} from '../api/approvalWorkflowBridge';
import {DocumentVaultBridge} from '../api/documentVaultBridge';
import {SecurityAuditBridge} from '../api/securityAuditBridge';
import {OperationalProjectionBridge} from '../api/operationalProjectionBridge';
import {InventoryTransferNativeBridge} from '../api/inventoryTransferNativeBridge';
import {CompletionBridge} from '../api/completionBridge';
import {ExternalNativeBridge} from '../api/externalNativeBridge';
import {CrmWorkflowBridge} from '../api/crmWorkflowBridge';
import {CorporateNativeBridge} from '../api/corporateNativeBridge';
import {ProjectTaskNativeBridge} from '../api/projectTaskNativeBridge';
import {PurchaseRequestNativeBridge} from '../api/purchaseRequestNativeBridge';
import {ManagementNativeBridge} from '../api/managementNativeBridge';
import {IntegrationStatusBridge} from '../api/integrationStatusBridge';
import {ProcurementReceiptNativeBridge} from '../api/procurementReceiptNativeBridge';
import {ProcurementReturnNativeBridge} from '../api/procurementReturnNativeBridge';
import {SalesNativeBridge} from '../api/salesNativeBridge';
import {StocktakeNativeBridge} from '../api/stocktakeNativeBridge';
import {AccountingNativeBridge} from '../api/accountingNativeBridge';
import {BankNativeBridge} from '../api/bankNativeBridge';
import {ProjectCostNativeBridge} from '../api/projectCostNativeBridge';
import {InventoryAdjustmentNativeBridge} from '../api/inventoryAdjustmentNativeBridge';
import {CrmOpportunityNativeBridge} from '../api/crmOpportunityNativeBridge';
import {CrmCustomerNativeBridge} from '../api/crmCustomerNativeBridge';
import {ProjectNativeBridge} from '../api/projectNativeBridge';
import {DocumentTemplateBridge} from '../api/documentTemplateBridge';

type Snapshot={route:string;panel_id:string;rows:{__id:string;[key:string]:unknown}[];version:number};
const originals=['/prototype-original.js','/prototype-extras.js'];
let installed=false;

function script(url:string):Promise<void>{return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=url;el.async=false;el.onload=()=>resolve();el.onerror=()=>reject(new Error('Gagal memuat '+url));document.body.appendChild(el)})}

/** The original design's complete DOM and handlers are retained 1:1, without
 * the modal-based generic grid injected by the earlier React conversion. */
export function ExactPrototype(){
  const {user,loading,login,verifyTwoFactor,logout}=useAuth();
  const host=useRef<HTMLDivElement>(null);
  const [html,setHtml]=useState('');
  const [status,setStatus]=useState('Memuat tampilan prototype...');
  const [bridge,setBridge]=useState<GridBridge|null>(null);
  const [modules,setModules]=useState<ModuleStateBridge|null>(null);
  const started=useRef(false);
  const auth=useRef({user,login,verifyTwoFactor,logout});
  const signedIn=useRef(false);
  auth.current={user,login,verifyTwoFactor,logout};
  useEffect(()=>{
    if(loading||started.current)return;
    started.current=true;
    let cancelled=false;
    void Promise.all([
      fetch('/original-body.html').then(async r=>{if(!r.ok)throw Error('Original HTML tidak ditemukan');return r.text()}),
      user?api.get('/api/v1/grid-snapshots').then(r=>r.data.data as Snapshot[]):Promise.resolve([] as Snapshot[]),
      user?api.get('/api/v1/module-states').then(r=>r.data.data as StateSnapshot[]):Promise.resolve([] as StateSnapshot[]),
      user && ['super_admin','admin'].includes(user.role)?api.get('/api/v1/admin/users').then(r=>r.data.data as ServerUser[]):Promise.resolve([] as ServerUser[])
    ]).then(([body,snapshots,states,users])=>{if(cancelled)return;setBridge(new GridBridge(snapshots));const moduleBridge=new ModuleStateBridge(states,Boolean(user && ['super_admin','admin'].includes(user.role)));if(user && ['super_admin','admin'].includes(user.role))moduleBridge.preloadUsers(users);setModules(moduleBridge);setHtml(body)}).catch(e=>setStatus('Tidak dapat memuat aplikasi: '+String(e)));
    return()=>{cancelled=true};
  },[loading]);

  useEffect(()=>{
    if(!html||!bridge||!modules||!host.current||installed)return;
    installed=true;
    (window as unknown as {SOPBridge:GridBridge,SOPModules:ModuleStateBridge}).SOPBridge=bridge;
    (window as unknown as {SOPModules:ModuleStateBridge}).SOPModules=modules;
    if(!location.hash){location.hash=auth.current.user?'#/overview':'#/login'}
    let cancelled=false;
    const quotation=new QuotationBuilderBridge(bridge);
    const operational=new OperationalProjectionBridge(bridge);
    const projectTasks=new ProjectTaskNativeBridge(operational);
    const projects=new ProjectNativeBridge(operational);
    const purchaseRequests=new PurchaseRequestNativeBridge(operational);
    const receipts=new ProcurementReceiptNativeBridge(operational);
    const returns=new ProcurementReturnNativeBridge(operational);
    const sales=new SalesNativeBridge(bridge);
    const stocktakes=new StocktakeNativeBridge(operational);
    const accounting=new AccountingNativeBridge(operational);
    const banks=new BankNativeBridge(()=>completion.refresh());
    const projectCosts=new ProjectCostNativeBridge(()=>completion.refresh());
    const adjustments=new InventoryAdjustmentNativeBridge(operational);
    const opportunities=new CrmOpportunityNativeBridge(bridge);
    const crmCustomers=new CrmCustomerNativeBridge(bridge);
    const transfers=new InventoryTransferNativeBridge(bridge,operational);
    const completion=new CompletionBridge(bridge);
    const management=new ManagementNativeBridge();
    const integrations=new IntegrationStatusBridge();
    const external=new ExternalNativeBridge();
    const crmWorkflow=new CrmWorkflowBridge(bridge);
    const corporate=new CorporateNativeBridge();
    const docs=new DocumentVaultBridge();
    const audit=new SecurityAuditBridge();
    const templates=new DocumentTemplateBridge();
    const approvals=new ApprovalWorkflowBridge(Boolean(auth.current.user && ['super_admin','admin','manager'].includes(auth.current.user.role)));
    const guard=()=>{
      const route=location.hash.slice(1);
      if(!auth.current.user && !signedIn.current && route!=='/login'){location.hash='#/login'}
      else if((auth.current.user||signedIn.current)&&route==='/login'){location.hash='#/overview'}
    };
    window.addEventListener('hashchange',guard);
    const onWorkspaceRoute=()=>{if(location.hash==='#/my-workspace'&&auth.current.user)void refreshNativeWorkspace().catch(console.error);if(['#/overview','#/dashboard'].includes(location.hash)&&auth.current.user)void refreshNativeKpis().catch(console.error)};
    const onDomainUpdated=()=>{if(auth.current.user){void refreshNativeKpis().catch(console.error);void refreshNativeWorkspace().catch(console.error);}};
    window.addEventListener('hashchange',onWorkspaceRoute);
    window.addEventListener('sop:domain-updated',onDomainUpdated);
    guard();
    // Intercept the simulated prototype login before the original demo handler runs.
    const onSubmit=(event:Event)=>{
      const form=(event.target as HTMLElement).closest<HTMLFormElement>('[data-form="login"],[data-form="forgot"],[data-form="2fa"]');
      if(!form)return;
      event.preventDefault();event.stopImmediatePropagation();
      const button=form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if(form.dataset.form==='2fa'){
        const code=[...form.querySelectorAll<HTMLInputElement>('[data-otp] input')].map(input=>input.value).join('');
        const error=form.querySelector<HTMLElement>('[data-err="otp"]');if(error)error.textContent='';
        if(!/^\d{6}$/.test(code)){if(error)error.textContent='Masukkan 6 digit kode';return}
        if(button)button.disabled=true;setStatus('Memverifikasi authenticator...');
        void auth.current.verifyTwoFactor(code).then(()=>{signedIn.current=true;location.hash='#/overview';window.location.reload()})
          .catch(()=>{setStatus('');if(error)error.textContent='Kode authenticator tidak valid.'}).finally(()=>{if(button)button.disabled=false});return;
      }
      if(form.dataset.form==='forgot'){
        const email=form.querySelector<HTMLInputElement>('#femail')?.value.trim()||'';
        const error=form.querySelector<HTMLElement>('[data-err="femail"]');
        if(error)error.textContent='';
        if(!/^\S+@\S+\.\S+$/.test(email)){if(error)error.textContent='Masukkan email yang valid';return}
        if(button)button.disabled=true;setStatus('Mengirim tautan reset...');
        void csrf().then(()=>api.post('/api/forgot-password',{email})).then(()=>{
          const root=form.closest<HTMLElement>('[data-page-id="login"]');
          root?.querySelectorAll<HTMLElement>('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!=='done');
          const tabs=root?.querySelector<HTMLElement>('[data-login-tabs]');if(tabs)tabs.style.display='none';
          const title=root?.querySelector<HTMLElement>('[data-done-title]');if(title)title.textContent='Tautan reset dikirim';
          const sub=root?.querySelector<HTMLElement>('[data-done-sub]');if(sub)sub.textContent=`Jika ${email} terdaftar, periksa inbox untuk tautan yang berlaku 30 menit.`;
        }).catch(()=>{if(error)error.textContent='Tautan belum dapat dikirim. Periksa koneksi atau konfigurasi email.'})
          .finally(()=>{setStatus('');if(button)button.disabled=false});
        return;
      }
      const email=form.querySelector<HTMLInputElement>('#email')?.value.trim()||'';
      const password=form.querySelector<HTMLInputElement>('#password')?.value||'';
      if(button)button.disabled=true;
      setStatus('Mengautentikasi akun...');
      void auth.current.login(email,password).then(requiresTwoFactor=>{if(requiresTwoFactor){setStatus('');
        const root=form.closest<HTMLElement>('[data-page-id="login"]');root?.querySelectorAll<HTMLElement>('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!=='2fa');
        root?.querySelector<HTMLInputElement>('[data-panel="2fa"] input')?.focus();return}
        signedIn.current=true;location.hash='#/overview';window.location.reload()})
        .catch((error:unknown)=>{setStatus('');const e=error as {response?:{status?:number,data?:{message?:string}},message?:string};const code=e.response?.status;const message=code===419?'Sesi telah kedaluwarsa, silakan muat ulang halaman.':code===422?'Email atau password salah.':code===423?'Akun terkunci sementara. Tunggu 15 menit atau reset password.':code===401?'Akses ditolak, cek email/password Anda.':code===429?'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.':code===undefined?'Tidak dapat terhubung ke server. Pastikan layanan backend aktif.':`Login gagal (${code}). Silakan hubungi administrator.`;const el=form.querySelector<HTMLElement>('[data-err="password"]');if(el)el.textContent=message;console.error('Login HTTP status:',code||'network error')})
        .finally(()=>{if(button)button.disabled=false});
    };
    const onLogout=(event:MouseEvent)=>{
      const target=event.target as HTMLElement;
      if(!target.closest('[data-profile="logout"]'))return;
      event.preventDefault();event.stopImmediatePropagation();
      void Promise.all([bridge.persistDirty(),modules.persist()]).then(()=>auth.current.logout()).then(()=>{signedIn.current=false;location.hash='#/login';window.location.reload()})
        .catch(()=>window.alert('Logout di server gagal. Periksa koneksi backend lalu coba lagi.'));
    };
    // Keep the original toolbar UI and all native interaction handlers.
    // Replace demo-only import dialogs with a real CSV import for registered grids.
    const onImport=(event:MouseEvent)=>{
      const el=(event.target as HTMLElement).closest<HTMLElement>('[data-crm-act="import"],[data-bd-act="import"],[data-qt-act="import"],[data-mtx-act="import"],[data-action="md:import"]');
      if(!el)return;
      const page=el.closest<HTMLElement>('[data-prototype-page]');
      const route=page?.dataset.route||'';
      const panel=el.closest<HTMLElement>('[data-crm-panel],[data-bd-panel],[data-qt-panel],[data-mtx-panel],[data-tabpanel]');
      const activeTab=page?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      const panelId=panel?.dataset.crmPanel||panel?.dataset.bdPanel||panel?.dataset.qtPanel||panel?.dataset.mtxPanel||panel?.dataset.bdPanel||panel?.dataset.tabpanel||activeTab?.dataset.tab||'';
      if(!bridge.has(route,panelId))return;
      event.preventDefault();event.stopImmediatePropagation();
      const file=document.createElement('input');file.type='file';file.accept='.csv,text/csv';file.hidden=true;
      document.body.appendChild(file);
      file.addEventListener('change',()=>{
        const selected=file.files?.[0];if(!selected){file.remove();return}
        void selected.text().then(text=>bridge.importCSV(route,panelId,text)).catch(e=>console.error('Import CSV gagal',e)).finally(()=>file.remove());
      },{once:true});
      file.click();
    };
    // Replace the prototype's export-information dialog with an actual CSV download.
    // The existing button, layout, typography and table markup are unchanged.
    const onExport=(event:MouseEvent)=>{
      const btn=(event.target as HTMLElement).closest<HTMLElement>('[data-action="doc:export"],[data-action="mt:export"],[data-action="cor:export"],[data-action="sec:export"]');
      if(!btn)return;
      const page=btn.closest<HTMLElement>('[data-prototype-page]');if(!page)return;
      const selected=page.querySelector<HTMLElement>('[data-tabpanel]:not([hidden])');
      const visible=selected||page;
      const table=visible.querySelector<HTMLTableElement>('table');
      let values=table?[...table.querySelectorAll<HTMLTableRowElement>('tr')].map(tr=>
        [...tr.querySelectorAll<HTMLElement>('th,td')].map(x=>x.innerText.trim())):[];
      if(!values.length)values=[...visible.querySelectorAll<HTMLElement>('.list-item,.keyrow,.row')].map(el=>
        [el.innerText.replace(/\s+/g,' ').trim()]).filter(x=>x[0]);
      if(!values.length){window.alert('Tidak ada data untuk diekspor pada tab ini.');event.preventDefault();event.stopImmediatePropagation();return}
      const escapeCsv=(value:string)=>'"'+value.replace(/"/g,'""')+'"';
      const csv='\uFEFF'+values.map(line=>line.map(escapeCsv).join(',')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
      const anchor=document.createElement('a');anchor.href=url;
      anchor.download=(page.dataset.route||'sop').replace(/^\//,'').replaceAll('/','-')+'-'+(selected?.dataset.tabpanel||'data')+'.csv';
      document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      event.preventDefault();event.stopImmediatePropagation();
    };
    // All 11 integrated modules use different data-action names. Compare committed
    // states after the original handler runs instead of hard-coding only CRM actions.
    const onNativeAction=()=>{bridge.scheduleSync();modules.scheduleSync();window.setTimeout(()=>bridge.reconcileProjectedSelects(),0);};
    const onDomainProtection=(event:Event)=>{bridge.protectDomainEdit(event);};
    const onRefresh=(event:MouseEvent)=>{
      const el=(event.target as HTMLElement).closest<HTMLElement>('[data-action="kravio:refresh"],[data-action="dash:refresh"]');
      if(!el)return;
      window.setTimeout(()=>{
        void api.get('/api/v1/grid-snapshots').then(r=>bridge.loadSnapshots(r.data.data as Snapshot[])).catch(console.error);
      },0);
    };
    const onDashboardTab=(event:Event)=>{
      const btn=(event.target as HTMLElement).closest<HTMLElement>('[data-action="dash:tab"],[data-action="dash:refresh"],[data-action="dash:reset"],[data-action="dash:filter"],[data-action="kravio-range:change"],[data-action="kravio:refresh"],[data-page-id="management"] [role="tab"]');
      if(btn && auth.current.user)window.setTimeout(()=>void refreshNativeKpis().catch(console.error),40);
    };
    const onWorkspaceAction=(event:Event)=>{void handleNativeWorkspaceAction(event).catch(error=>{console.error(error);window.alert('Perubahan workspace gagal disimpan ke server.')})};
    document.addEventListener('click',onDomainProtection,true);
    document.addEventListener('input',onDomainProtection,true);
    document.addEventListener('focusin',onDomainProtection,true);
    document.addEventListener('change',onDomainProtection,true);
    document.addEventListener('click',onDashboardTab,true);
    document.addEventListener('change',onDashboardTab,true);
    document.addEventListener('click',onWorkspaceAction,true);
    document.addEventListener('change',onWorkspaceAction,true);
    document.addEventListener('submit',onSubmit,true);
    document.addEventListener('click',onLogout,true);
    document.addEventListener('click',onImport,true);
    document.addEventListener('click',onExport,true);
    document.addEventListener('click',onNativeAction,true);
    document.addEventListener('change',onNativeAction,true);
    document.addEventListener('drop',onNativeAction,true);
    document.addEventListener('keyup',onNativeAction,true);
    document.addEventListener('submit',onNativeAction,true);
    document.addEventListener('click',onRefresh,true);
    (async()=>{
      try{
        setStatus('Mengaktifkan interaksi asli prototype...');
        for(const url of originals)await script(url);
        if(cancelled)return;
        if(auth.current.user){
          transfers.install();stocktakes.install();adjustments.install();accounting.install();banks.install();projectCosts.install();opportunities.install();crmCustomers.install();external.install();crmWorkflow.install();projects.install();projectTasks.install();purchaseRequests.install();receipts.install();returns.install();sales.install();
          // Resolve real SQL-backed panels before allowing native fixture snapshots
          // to seed, otherwise a slow API can momentarily expose demo transactions.
          const preparations:Promise<unknown>[]=[quotation.install(),approvals.install(),docs.install(),templates.install(),
          refreshSalesOperationalGrids(bridge),operational.refresh(),completion.install(),corporate.install()];
          if(['super_admin','admin','manager','auditor'].includes(auth.current.user.role))preparations.push(audit.install());
          const results=await Promise.allSettled(preparations);
          results.forEach(item=>{if(item.status==='rejected')console.error('Inisialisasi domain gagal:',item.reason)});
        }
        setStatus('Menghubungkan data ke server...');
        if(auth.current.user){await bridge.seedUninitialized();await modules.seedMissing();management.install();integrations.install();}
        if(auth.current.user){void refreshNativeKpis().catch(console.error);void refreshNativeWorkspace().catch(console.error);}
        setStatus('');
      }catch(e){setStatus('Gagal memuat fungsi prototype: '+String(e));console.error(e)}
    })();
    return()=>{cancelled=true;templates.uninstall();integrations.uninstall();management.uninstall();document.removeEventListener('click',onDomainProtection,true);document.removeEventListener('input',onDomainProtection,true);document.removeEventListener('focusin',onDomainProtection,true);document.removeEventListener('change',onDomainProtection,true);transfers.uninstall();stocktakes.uninstall();adjustments.uninstall();accounting.uninstall();banks.uninstall();projectCosts.uninstall();opportunities.uninstall();external.uninstall();crmWorkflow.uninstall();projects.uninstall();projectTasks.uninstall();purchaseRequests.uninstall();receipts.uninstall();returns.uninstall();sales.uninstall();corporate.uninstall();completion.uninstall();quotation.uninstall();approvals.uninstall();docs.uninstall();audit.uninstall();window.removeEventListener('hashchange',guard);window.removeEventListener('hashchange',onWorkspaceRoute);window.removeEventListener('sop:domain-updated',onDomainUpdated);document.removeEventListener('click',onDashboardTab,true);document.removeEventListener('change',onDashboardTab,true);document.removeEventListener('click',onWorkspaceAction,true);document.removeEventListener('change',onWorkspaceAction,true);document.removeEventListener('submit',onSubmit,true);document.removeEventListener('click',onLogout,true);document.removeEventListener('click',onImport,true);document.removeEventListener('click',onExport,true);document.removeEventListener('click',onNativeAction,true);document.removeEventListener('change',onNativeAction,true);document.removeEventListener('drop',onNativeAction,true);document.removeEventListener('keyup',onNativeAction,true);document.removeEventListener('submit',onNativeAction,true);document.removeEventListener('click',onRefresh,true)};
  },[html,bridge,modules]);

  // Initial GridSnapshot data already loaded in the first Promise.all. Re-fetching
  // here races with native grid hydration and can erase edits from the user.
  if(loading)return <div className="sop-boot-status"><div className="sop-load-bar"/>Memuat sesi...</div>;
  return <><div ref={host} dangerouslySetInnerHTML={{__html:html}}/>{status&&<div className="sop-boot-status" role="status"><div className="sop-load-bar"/>{status}</div>}<div className="sop-api-progress" role="progressbar" aria-label="Menyimpan perubahan ke database"><div/></div></>;
}
