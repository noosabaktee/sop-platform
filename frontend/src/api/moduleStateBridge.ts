import {api} from './client';

export type StateSnapshot={route:string;section:string;payload:Record<string,unknown>;version:number};
export type ServerUser={id:string;name:string;email:string;role:string;is_active:boolean;department_name?:string|null};
type UiUser={id:string;name:string;email:string;role:string;dept:string;status:string};
const ROLE_LABEL:Record<string,string>={super_admin:'Admin',admin:'Admin',manager:'Admin',sales:'Sales',finance:'Finance',procurement:'Procurement',warehouse:'Warehouse',project_manager:'Project Manager',user:'Viewer',viewer:'Viewer'};
const ROLE_SLUG:Record<string,string>={Admin:'admin',Sales:'sales',Finance:'finance',Procurement:'procurement',Warehouse:'warehouse','Project Manager':'project_manager',Viewer:'viewer'};
const userView=(u:ServerUser):UiUser=>({id:u.id,name:u.name,email:u.email,role:ROLE_LABEL[u.role]||u.role,dept:u.department_name||'',status:u.is_active?'Aktif':'Nonaktif'});
const asUsers=(v:unknown):UiUser[]=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&typeof x.email==='string'):[];
type Mounted={route:string;section:string;read:()=>Record<string,unknown>};
const id=(r:string,s:string)=>`${r}|${s}`;
const copy=<T,>(obj:T):T=>JSON.parse(JSON.stringify(obj)) as T;
const encode=(obj:unknown)=>JSON.stringify(obj);

/** Transparent persistence for native, non-grid page state.
 * No element is added, replaced or styled by this bridge. */
export class ModuleStateBridge{
 private cache=new Map<string,StateSnapshot>();
 private mounted=new Map<string,Mounted>();
 private active=false;
 private readonly privilegedRoutes=new Set(['/settings','/integrations','/security-audit']);
 private timer:number|undefined;
 private realUsersLoaded=false;
 private roleById=new Map<string,string>();
 private queue:Promise<void>=Promise.resolve();
 constructor(items:StateSnapshot[],private readonly canManage:boolean){this.loadCache(items)}
 /** Overlay legacy UI-user fixtures with real Laravel users, before prototype handlers mount. */
 preloadUsers(users:ServerUser[]){
  if(!this.canManage)return;
  const k=id('/settings','page');const previous=this.cache.get(k);
  users.forEach(u=>this.roleById.set(u.id,u.role));
  this.cache.set(k,{route:'/settings',section:'page',version:previous?.version||0,
   payload:{...(previous?.payload||{}),USERS:users.map(userView)}});
  this.realUsersLoaded=true;
 }
 private async syncUsersToDatabase(draft:Record<string,unknown>):Promise<void>{
  if(!this.realUsersLoaded)return;
  const k=id('/settings','page');const before=asUsers(this.cache.get(k)?.payload.USERS);
  const current=asUsers(draft.USERS);
  const oldById=new Map(before.map(x=>[x.id,x]));
  const currentIds=new Set(current.map(x=>x.id));
  const validId=/^[0-9A-HJKMNP-TV-Z]{26}$/i;
  // Reject role elevations via unknown free-form labels.
  for(const item of current){if(!ROLE_SLUG[item.role] && !before.some(u=>u.id===item.id&&u.role===item.role))throw new Error(`Role ${item.role} tidak tersedia untuk akun login`)}
  for(const prev of before){
   if(validId.test(prev.id)&&!currentIds.has(prev.id))await api.delete(`/api/v1/admin/users/${prev.id}`);
  }
  for(const item of current){
   const oldRole=oldById.get(item.id)?.role;
   const role=oldRole===item.role && this.roleById.has(item.id)?this.roleById.get(item.id)!:(ROLE_SLUG[item.role]||'viewer');
   const changes={name:item.name,email:item.email,role,department_name:item.dept,is_active:item.status==='Aktif'};
   const prev=oldById.get(item.id);
   if(prev){
    if(JSON.stringify({...prev,id:''})!==JSON.stringify({...item,id:''})&&validId.test(item.id)){
     const {data}=await api.patch(`/api/v1/admin/users/${item.id}`,changes);
     item.status=data.data.is_active?'Aktif':'Nonaktif';this.roleById.set(item.id,data.data.role);
    }
   }else{
    const {data}=await api.post('/api/v1/admin/users',changes);
    item.id=data.data.id;item.status='Nonaktif';this.roleById.set(item.id,data.data.role);
   }
  }
  // Reflect generated server IDs in the original in-memory array without modifying its DOM or CSS.
  const native=this.mounted.get(k)?.read().USERS;
  if(Array.isArray(native))native.splice(0,native.length,...current.map(x=>({...x})));
  draft.USERS=current;
 }
 private loadCache(items:StateSnapshot[]){items.forEach(x=>this.cache.set(id(x.route,x.section),{...x,payload:copy(x.payload)}))}
 register(route:string,section:string,read:()=>Record<string,unknown>,hydrate:(data:Record<string,unknown>)=>void){
  if(!this.canManage && this.privilegedRoutes.has(route))return;
  const saved=this.cache.get(id(route,section));
  if(saved)hydrate(copy(saved.payload));
  this.mounted.set(id(route,section),{route,section,read});
  if(this.active&&!saved)void this.seedMissing();
 }
 async seedMissing(){
  if(!this.active)this.active=true;
  const missing=[...this.mounted.values()].filter(x=>!this.cache.has(id(x.route,x.section)) || this.cache.get(id(x.route,x.section))?.version===0);
  for(let i=0;i<missing.length;i+=20){
   const states=missing.slice(i,i+20).map(x=>({route:x.route,section:x.section,payload:copy(x.read())}));
   const {data}=await api.put('/api/v1/module-states',{seed_only:true,states});
   for(const x of data.data as {route:string;section:string;version:number}[]){
    const s=states.find(s=>s.route===x.route&&s.section===x.section);
    if(s)this.cache.set(id(x.route,x.section),{...x,payload:s.payload});
   }
  }
 }
 scheduleSync(delay=180){if(this.timer!==undefined)clearTimeout(this.timer);
  this.timer=window.setTimeout(()=>{this.timer=undefined;void this.persist().catch(console.error)},delay);
 }
 async persist(){
  const operation=async()=>{
   if(!this.active)return;
   const changed=[...this.mounted.values()].filter(s=>encode(s.read())!==encode(this.cache.get(id(s.route,s.section))?.payload));
   if(!changed.length)return;
   document.body.classList.add('sop-api-busy');
   try{
    for(let i=0;i<changed.length;i+=20){
     const states=changed.slice(i,i+20).map(s=>({route:s.route,section:s.section,payload:copy(s.read()),version:this.cache.get(id(s.route,s.section))?.version}));
     for(const state of states){if(state.route==='/settings'&&state.section==='page')await this.syncUsersToDatabase(state.payload)}
     const result=await api.put('/api/v1/module-states',{states});
     for(const item of result.data.data as {route:string;section:string;version:number}[]){
      const posted=states.find(s=>s.route===item.route&&s.section===item.section);
      if(posted)this.cache.set(id(item.route,item.section),{...item,payload:posted.payload});
     }
    }
   }catch(error){
    console.error('Gagal menyimpan module state:',error);
    window.alert('Gagal menyimpan data halaman. Perubahan belum tersimpan; periksa koneksi dan refresh halaman.');
    throw error;
   }finally{document.body.classList.remove('sop-api-busy')}
   if([...this.mounted.values()].some(s=>encode(s.read())!==encode(this.cache.get(id(s.route,s.section))?.payload)))this.scheduleSync(100);
  };
  this.queue=this.queue.then(operation,operation);await this.queue;
 }
 get size(){return this.mounted.size}
 get isReady(){return this.active}
}
