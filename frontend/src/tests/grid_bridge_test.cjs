const fs=require('fs'), vm=require('vm'),assert=require('assert');
const path=require('node:path'),cp=require('node:child_process');
let ts;try{ts=require('typescript')}catch{ts=require(path.join(cp.execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'))}
const code=fs.readFileSync(path.join(__dirname,'../api/gridBridge.ts'),'utf8');
const result=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
if(result.diagnostics?.length){console.error(result.diagnostics);process.exit(1)}
const db=new Map();let calls=0,delayNext=false,releaseDelayed;
const api={
 put:async(path,data)=>{assert(path.includes('grid-snapshots'));calls++;
  if(delayNext){delayNext=false;await new Promise(resolve=>{releaseDelayed=resolve})}
  const out=[];
  for(const item of data.snapshots){const k=item.route+'|'+item.panel_id,old=db.get(k);
   if(old && !data.seed_only){if(item.version!==old.version)throw Error('409');db.set(k,{...structuredClone(item),version:old.version+1})}
   if(!old)db.set(k,{...structuredClone(item),version:1});
   const updated=db.get(k);out.push({route:item.route,panel_id:item.panel_id,version:updated.version});
  }return {data:{data:out}};
 }
};
const moduleExports={};
const ctx={exports:moduleExports,require:(n)=>n==='./client'?{api}:n==='./modalHelper'?{showLockedTransactionModal:()=>Promise.resolve()}:require(n),structuredClone,window:{setTimeout,clearTimeout},document:{body:{classList:{toggle:()=>{}}},querySelector:()=>null},crypto:globalThis.crypto,console};
vm.runInNewContext(result.outputText,ctx);
(async()=>{
const {GridBridge}=moduleExports;
const route='/crm-sales',panel_id='leads';
const state={rows:[{__id:'leads-1',name:'Initial'}],staged:new Map(),selected:new Set(),seq:1};
const first=new GridBridge([]);first.attach(route,panel_id,state,()=>{});
await first.seedUninitialized();assert.strictEqual(db.get(route+'|'+panel_id).rows[0].name,'Initial');
state.rows[0].name='Updated';await first.persistDirty();assert.strictEqual(db.get(route+'|'+panel_id).rows[0].name,'Updated');
await first.importCSV(route,panel_id,'name\n"CSV Name"');assert.strictEqual(db.get(route+'|'+panel_id).rows.length,2);
state.rows=state.rows.filter(r=>r.__id!=='leads-1');await first.persistDirty();assert.strictEqual(db.get(route+'|'+panel_id).rows.length,1);
const reload=new GridBridge([...db.values()]);const mounted={rows:[{__id:'fixture-1',name:'WRONG'}],staged:new Map(),selected:new Set(),seq:1};reload.attach(route,panel_id,mounted,()=>{});
assert.strictEqual(mounted.rows.length,1);assert.strictEqual(mounted.rows[0].name,'CSV Name');
// Warm start has no missing snapshots and may complete without an internal
// await. It must still clear the initialization handle and become writable.
await reload.seedUninitialized();assert.strictEqual(reload.isReady,true);
const redactedRows=[{__id:'leads-1',email:'same@example.test'},{__id:'leads-2',email:'same@example.test'}];
const repaired=new GridBridge([{route,panel_id,rows:redactedRows,version:1}]);
const repairedState={rows:[],staged:new Map(),selected:new Set()};repaired.attach(route,panel_id,repairedState,()=>{});
assert.strictEqual(new Set(repairedState.rows.map(row=>row.email)).size,2);
// A native panel can mount while a previous seed request is still in flight.
// The bridge must drain the new missing panel before initialization resolves.
const racing=new GridBridge([]);
racing.attach('/race','first',{rows:[{__id:'first-1',name:'A'}]},()=>{});
delayNext=true;
const seeding=racing.seedUninitialized();
await Promise.resolve();
racing.attach('/race','second',{rows:[{__id:'second-1',name:'B'}]},()=>{});
releaseDelayed();
await seeding;
assert.strictEqual(db.get('/race|first').rows[0].name,'A');
assert.strictEqual(db.get('/race|second').rows[0].name,'B');
console.log('PASS simulated bridge create/update/import/delete/reload/concurrent mount; API calls:',calls);
})().catch(e=>{console.error(e);process.exit(1)});
