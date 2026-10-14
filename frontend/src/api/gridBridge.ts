import {api} from './client';

type Row={__id:string;__new?:boolean;[key:string]:unknown};
type GridState={rows:Row[];staged?:Map<string,unknown>;selected?:Set<string>;seq?:number};
type Snapshot={route:string;panel_id:string;rows:Row[];version:number};
type MountedGrid={route:string;panel_id:string;state:GridState;render:()=>void};
const key=(route:string,id:string)=>`${route}|${id}`;
const committed=(state:GridState):Row[]=>state.rows.filter(r=>!r.__new).map(r=>structuredClone(r));
const same=(a:Row[],b:Row[])=>JSON.stringify(a)===JSON.stringify(b);

/** All data handling lives outside the frozen prototype UI.
 * The original JavaScript owns interaction and staging; PostgreSQL owns committed rows.
 * A debounced commit detector catches native save/delete, drag/drop, status, quick-create
 * and drawer actions across every mounted grid without touching CSS/DOM markup. */
export class GridBridge {
  private loaded=new Map<string,Snapshot>();
  private mounted=new Map<string,MountedGrid>();
  private queue:Promise<void>=Promise.resolve();
  private busyCount=0;
  private initializing:Promise<void>|null=null;
  private timer:number|undefined;
  private dirtyWhileSaving=false;
  private authenticated=false;
  private authoritative=new Set<string>();
  constructor(snapshots:Snapshot[]){this.loadToCache(snapshots)}
  private loadToCache(snapshots:Snapshot[]){for(const snapshot of snapshots)this.loaded.set(key(snapshot.route,snapshot.panel_id),{...snapshot,rows:structuredClone(snapshot.rows)})}
  private repairRedactedLeadFixture(route:string,panelId:string,state:GridState){
    if(route!=='/crm-sales'||panelId!=='leads'||state.rows.length<2)return;
    const fixture=state.rows.every(row=>/^leads-\d+$/.test(String(row.__id)));
    const emails=state.rows.map(row=>String(row.email||'').trim().toLowerCase());
    // The supplied frozen prototype has privacy-redacted sample addresses that
    // collapse to one value. Repair only that deterministic fixture; genuine
    // user duplicates must still be rejected by the native CRM validator.
    if(fixture&&emails.every(Boolean)&&new Set(emails).size===1){
      state.rows.forEach((row,index)=>{row.email=`lead-${index+1}@example.invalid`});
    }
  }
  attach(route:string,panel_id:string,state:GridState,render:()=>void){
    const saved=this.loaded.get(key(route,panel_id));
    if(saved && !this.authoritative.has(key(route,panel_id)))state.rows=structuredClone(saved.rows);
    this.repairRedactedLeadFixture(route,panel_id,state);
    const largestNewId=state.rows.reduce((max,row)=>Math.max(max,Number(String(row.__id).match(/-new-(\d+)$/)?.[1]||0)),0);
    state.seq=Math.max(state.seq||0,state.rows.length,largestNewId);
    this.mounted.set(key(route,panel_id),{route,panel_id,state,render});
    // Some native tabs build their grid lazily; seed those when first opened.
    if(this.authenticated&&!saved)void this.seedUninitialized().catch(console.error);
  }
  has(route:string,panelId:string){return this.mounted.has(key(route,panelId))}
  private busy(on:boolean){this.busyCount=Math.max(0,this.busyCount+(on?1:-1));document.body.classList.toggle('sop-api-busy',this.busyCount>0)}
  private message(msg:string,isError=false,modal=true){
    const root=document.querySelector<HTMLElement>('[data-prototype-page]:not([hidden])');
    const toast=root?.querySelector<HTMLElement>('.toast');
    if(toast){toast.hidden=false;toast.textContent=msg;if(isError)toast.setAttribute('role','alert');window.setTimeout(()=>toast.hidden=true,6000)}
    if(isError){console.error(msg);if(modal)window.alert(msg)}
  }
  loadSnapshots(snapshots:Snapshot[]){
    this.loadToCache(snapshots);
    for(const snapshot of snapshots){
      const grid=this.mounted.get(key(snapshot.route,snapshot.panel_id));
      if(grid && !this.authoritative.has(key(snapshot.route,snapshot.panel_id))){grid.state.rows=structuredClone(snapshot.rows);grid.state.staged?.clear();grid.state.selected?.clear();grid.state.seq=Math.max(grid.state.seq||0,grid.state.rows.length);grid.render()}
    }
  }
  applyWorkflowSnapshots(snapshots:Snapshot[]){
    this.loadToCache(snapshots);
    for(const snapshot of snapshots){
      const grid=this.mounted.get(key(snapshot.route,snapshot.panel_id));
      if(!grid)continue;
      grid.state.rows=structuredClone(snapshot.rows);
      grid.state.staged?.clear();grid.state.selected?.clear();
      grid.state.seq=Math.max(grid.state.seq||0,grid.state.rows.length);
      grid.render();
    }
  }
  /** Initialize native reference data in SQL once only, without overwriting any stored user changes. */
  async seedUninitialized(){
    if(this.initializing)return this.initializing;
    const task=(async()=>{
      this.busy(true);
      try{
        // Native panels are mounted lazily. Keep draining the missing set so a
        // panel mounted while another seed request is in flight is not skipped.
        while(true){
          const missing=[...this.mounted.values()].filter(x=>!this.loaded.has(key(x.route,x.panel_id)) && !this.authoritative.has(key(x.route,x.panel_id)));
          if(!missing.length)break;
          for(let i=0;i<missing.length;i+=25){
            const part=missing.slice(i,i+25);
            const response=await api.put('/api/v1/grid-snapshots',{seed_only:true,snapshots:part.map(x=>({route:x.route,panel_id:x.panel_id,rows:committed(x.state)}))});
            for(const item of response.data.data as {route:string;panel_id:string;version:number}[]){
              const k=key(item.route,item.panel_id);const grid=this.mounted.get(k);
              if(grid)this.loaded.set(k,{...item,rows:committed(grid.state)});
            }
          }
        }
        this.authenticated=true;
      }catch(error){
        const response=(error as {response?:{status?:number,data?:{message?:string,errors?:unknown}}}).response;
        const detail=response?.data?.message||`HTTP ${response?.status||'network'}`;
        // Background initialization must not block the whole page with a
        // browser alert. Keep the error visible as a toast and in DevTools.
        console.error('Grid initialization failed',response?.status,response?.data||error);
        this.message(`Sinkronisasi tabel belum berhasil (${detail}). Coba refresh halaman.`,true,false);
        throw error;
      }
      finally{this.busy(false)}
    })();
    this.initializing=task;
    try{await task}
    finally{if(this.initializing===task)this.initializing=null}
  }
  /** Native UI handles optimistic edit; the actual committed rows always get written to SQL. */
  scheduleSync(delay=90){
    if(this.timer!==undefined)window.clearTimeout(this.timer);
    this.timer=window.setTimeout(()=>{this.timer=undefined;void this.persistDirty().catch(console.error)},delay);
  }
  async persistRoute(route:string,panelId?:string){return this.persistDirty(route,panelId)}
  async persistDirty(route?:string,panelId?:string):Promise<void>{
    // Snapshot initialization must complete before a user change can be versioned.
    if(this.initializing){await this.initializing}
    if(!this.authenticated)return;
    const operation=async()=>{
      const dirty=[...this.mounted.values()].filter(g=>
        (!route||g.route===route)&&(!panelId||g.panel_id===panelId)&&!this.authoritative.has(key(g.route,g.panel_id))&&
        !same(committed(g.state),this.loaded.get(key(g.route,g.panel_id))?.rows||[]));
      if(!dirty.length)return;
      this.busy(true);
      try{
        for(let i=0;i<dirty.length;i+=25){
          const group=dirty.slice(i,i+25);
          const payloads=group.map(g=>({route:g.route,panel_id:g.panel_id,rows:committed(g.state),version:this.loaded.get(key(g.route,g.panel_id))?.version}));
          const {data:result}=await api.put('/api/v1/grid-snapshots',{snapshots:payloads});
          for(const version of result.data as {route:string;panel_id:string;version:number}[]){
            const submitted=payloads.find(p=>p.route===version.route&&p.panel_id===version.panel_id);
            if(submitted)this.loaded.set(key(version.route,version.panel_id),{...version,rows:submitted.rows});
          }
        }
        this.message('Perubahan telah disimpan ke PostgreSQL');
      }catch(error){
        console.error('Persistence error',error);
        this.message('Gagal menyimpan perubahan ke PostgreSQL. Perubahan belum dikonfirmasi; muat ulang data setelah koneksi tersedia.',true);
        throw error;
      }finally{this.busy(false)}
    };
    // Re-evaluate dirty grids inside the serialized operation so concurrent rapid edits
    // do not overwrite newer revisions with an old request.
    this.queue=this.queue.then(operation,operation);
    await this.queue;
    if([...this.mounted.values()].some(g=>!this.authoritative.has(key(g.route,g.panel_id)) && !same(committed(g.state),this.loaded.get(key(g.route,g.panel_id))?.rows||[]))){
      // Edits while a previous HTTP request was in flight.
      this.scheduleSync(100);
    }
  }
  async importCSV(route:string,panel_id:string,content:string){
    const grid=this.mounted.get(key(route,panel_id));if(!grid)throw new Error('Tabel belum terdaftar');
    if(this.authoritative.has(key(route,panel_id)))throw new Error('Transaksi hanya dapat diimpor melalui workflow terotorisasi, bukan langsung ke grid.');
    const csv=parseCsv(content);if(csv.length<2)throw new Error('CSV membutuhkan header dan minimal satu baris data');
    const [headers,...records]=csv;
    const existing=grid.state.rows[0]||{};
    const keys=Object.keys(existing).filter(k=>!k.startsWith('__'));
    if(!keys.length)throw new Error('Kolom tabel tidak ditemukan');
    const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
    const order=keys.map((k,i)=>{const matched=headers.findIndex(h=>normalize(h)===normalize(k));return matched<0?i:matched});
    const prefix=`${panel_id}-import-${crypto.randomUUID()}-`;
    const rows=records.filter(r=>r.some(v=>v.trim())).map((row,i)=>{
      const record:Row={__id:prefix+i};
      for(let j=0;j<keys.length;j++)record[keys[j]]=row[order[j]]??'';
      return record;
    });
    if(!rows.length)throw new Error('Tidak ditemukan baris yang dapat diimpor');
    const before=[...grid.state.rows];
    grid.state.rows=[...rows,...before];
    try{await this.persistDirty(route,panel_id);grid.render();this.message(`${rows.length} baris berhasil diimpor ke PostgreSQL`)}
    catch(e){grid.state.rows=before;grid.render();throw e}
  }
  /** Domain-backed panels are READ-ONLY projections of PostgreSQL.
   * Never persist these rows to grid_snapshots or retain stale demo fixtures. */
  mergeDomainRows(route:string,panelId:string,_prefix:string,rows:Row[]){
    const id=key(route,panelId);
    this.authoritative.add(id);
    const grid=this.mounted.get(id);
    if(!grid)return;
    if(same(grid.state.rows,rows))return;
    grid.state.rows=structuredClone(rows);
    grid.state.staged?.clear();
    grid.state.selected?.clear();
    grid.render();
    this.reconcileProjectedSelects();
  }
  isDomainReadOnly(route:string,panelId:string){return this.authoritative.has(key(route,panelId))}
  /** Native prototype status selects only contain demo statuses. When server
   * sends a new real status, preserve the exact original select styling and
   * add only its missing option value (no CSS or markup layout changes). */
  reconcileProjectedSelects(){
    for(const id of this.authoritative){
      const mounted=this.mounted.get(id);if(!mounted)continue;
      const page=document.querySelector<HTMLElement>(`[data-prototype-page][data-route="${mounted.route}"]`);
      const panel=page?.querySelector<HTMLElement>(`[data-bd-panel="${mounted.panel_id}"]`);
      if(!panel)continue;
      const staged=mounted.state.staged;
      for(const select of panel.querySelectorAll<HTMLSelectElement>('select[data-bd-key="status"][data-bd-id]')){
        const row=mounted.state.rows.find(r=>r.__id===select.dataset.bdId);
        if(!row)continue;
        const patch=staged?.get(row.__id) as {status?:unknown}|undefined;
        const status=String(patch?.status??row.status??'');
        if(status && ![...select.options].some(o=>o.value===status)){
          const option=document.createElement('option');option.value=status;option.textContent=status;
          select.append(option);
        }
        if(status)select.value=status;
      }
    }
  }

  getPendingRows(route:string,panelId:string){
    const grid=this.mounted.get(key(route,panelId));
    if(!grid)return {rows:[] as Row[],selected:[] as string[],staged:[] as string[]};
    return {rows:grid.state.rows.map(row=>({...row,...(grid.state.staged?.get(row.__id)||{} as object)})),
      selected:[...(grid.state.selected||[])],staged:[...(grid.state.staged?.keys()||[])]};
  }

  /** Capture before native demo handlers; their destructive edits must never
   * give an illusion that journal, stock or approved transactions were changed. */
  protectDomainEdit(event:Event):boolean{
    const el=event.target as HTMLElement;
    const page=el.closest<HTMLElement>('[data-prototype-page]');
    const route=page?.dataset.route||'';
    let panel=el.closest<HTMLElement>('[data-bd-panel]')?.dataset.bdPanel||
      el.closest<HTMLElement>('[data-tabpanel]')?.dataset.tabpanel||'';
    if(!panel)panel=page?.querySelector<HTMLElement>('[data-tabpanel]:not([hidden])')?.dataset.tabpanel||'';
    if(!this.isDomainReadOnly(route,panel))return false;
    const isTransfer=route==='/inventory' && panel==='transfer';
    const rowId=(el.closest<HTMLElement>('[data-bd-id]')?.dataset.bdId)||'';
    const newTransferRow=isTransfer && (rowId.includes('-new-')||rowId.includes('-import-'));
    const transferStatus=isTransfer && el.matches('[data-bd-key="status"]');
    if(event.type==='focusin' && el instanceof HTMLInputElement && el.matches('.bd-cell')){
      if(!newTransferRow && !transferStatus)el.readOnly=true;
      return false;
    }
    if(isTransfer){
      const mutation=el.closest<HTMLElement>('[data-bd-act],[data-action="inv:create"]');
      if(mutation){
        const action=mutation.dataset.bdAct||mutation.dataset.action||'';
        if(['commit','delete','delrow'].includes(action))return false; // intercepted by transfer adapter
        if(action==='add'||action==='inv:create'||action==='discard')return false;
      }
      if(newTransferRow || transferStatus)return false;
    }

    const nativeMutation=el.closest<HTMLElement>('.bd-cell,[data-bd-act="add"],[data-bd-act="commit"],[data-bd-act="delete"],[data-bd-act="delrow"],[data-bd-act="assign"],[data-bd-act="discard"],[data-bd-act="import"],[data-action$=":create"]');
    if(!nativeMutation)return false;
    event.preventDefault();event.stopImmediatePropagation();
    if(event.type==='change' || event.type==='input'){this.mounted.get(key(route,panel))?.render();}
    if(event.type==='click')this.message('Data transaksi ini hanya dapat diubah melalui workflow Laravel yang terotorisasi.');
    return true;
  }
  get mountedCount(){return this.mounted.size}
  get isReady(){return this.authenticated&&this.initializing===null}
}

/** RFC-4180 CSV: quoted commas/newlines, escaped quotes, CRLF and UTF-8 BOM. */
export function parseCsv(value:string):string[][]{
  const text=value.replace(/^\uFEFF/,'');let current='';let row:string[]=[];const rows:string[][]=[];let quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){current+='"';i++}else quoted=!quoted}
    else if(c===','&&!quoted){row.push(current);current=''}
    else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(current);if(row.some(Boolean))rows.push(row);row=[];current=''}
    else current+=c;
  }
  if(quoted)throw new Error('CSV memiliki tanda kutip yang belum ditutup');
  if(row.length||current){row.push(current);if(row.some(Boolean))rows.push(row)}
  return rows;
}
