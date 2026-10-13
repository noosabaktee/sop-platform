const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('node:path'),cp=require('node:child_process');
let ts;try{ts=require('typescript')}catch{ts=require(path.join(cp.execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'))}
const src=fs.readFileSync(path.join(__dirname,'../api/moduleStateBridge.ts'),'utf8');
const compiled=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
assert.equal(compiled.diagnostics.length,0);
let storage=new Map(),writes=0;
const api={put:async(path,body)=>{
 assert.equal(path,'/api/v1/module-states'); writes++;
 const result=[];
 for(const data of body.states){
  const key=data.route+'|'+data.section,prev=storage.get(key);
  if(!body.seed_only&&prev){assert.equal(data.version,prev.version);storage.set(key,{...data,version:prev.version+1})}
  else if(!prev)storage.set(key,{...data,version:1});
  const updated=storage.get(key);result.push({route:data.route,section:data.section,version:updated.version});
 }
 return {data:{data:result}};
}};
const moduleExports={};
vm.runInNewContext(compiled.outputText,{exports:moduleExports,require:(key)=>key==='./client'?{api}:require(key),document:{body:{classList:{add(){},remove(){}}}},window:{setTimeout},clearTimeout,setTimeout,alert:()=>{},console,JSON});
(async()=>{
 const {ModuleStateBridge}=moduleExports;
 const data={USERS:[{id:'u1',name:'Original'}],ROLES:[]};
 const bridge=new ModuleStateBridge([],true);
 bridge.register('/settings','page',()=>data,v=>Object.assign(data,v));
 await bridge.seedMissing();
 assert.equal(storage.get('/settings|page').payload.USERS[0].name,'Original');
 data.USERS[0].name='Updated';await bridge.persist();
 assert.equal(storage.get('/settings|page').payload.USERS[0].name,'Updated');
 data.USERS.push({id:'u2',name:'New'});await bridge.persist();
 assert.equal(storage.get('/settings|page').payload.USERS.length,2);
 data.USERS.splice(0,1);await bridge.persist();
 assert.equal(storage.get('/settings|page').payload.USERS.length,1);
 const saved=[...storage.values()];
 const reloaded={USERS:[{id:'wrong',name:'Wrong'}],ROLES:[]};
 const next=new ModuleStateBridge(saved,true);
 next.register('/settings','page',()=>reloaded,v=>Object.assign(reloaded,v));
 assert.equal(reloaded.USERS.length,1);
 assert.equal(reloaded.USERS[0].name,'New');
 console.log('PASS module backend adapter create/update/delete/reload. PUT calls:',writes);
})().catch(e=>{console.error(e);process.exit(1)})
