/** Mocked frontend event-to-API contract. PostgreSQL test is a separate Laravel test. */
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const cp=require('node:child_process');const vm=require('node:vm');
let ts;try{ts=require('typescript')}catch{ts=require(path.join(cp.execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'))}
const file=path.join(__dirname,'../frontend/src/api/inventoryTransferNativeBridge.ts');
const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
const calls=[];const alerts=[];
const api={post:async(url,payload)=>{calls.push({url,payload});return {data:{data:{id:'result'}}}}};
const moduleExports={};
vm.runInNewContext(compiled.outputText,{exports:moduleExports,require:()=>({api}),crypto:globalThis.crypto,
 console,window:{setTimeout,alert:(text)=>alerts.push(text)},document:{body:{classList:{add(){},remove(){}}},querySelector:()=>null}},
 {filename:'nativeTransfer.js'});
const {InventoryTransferNativeBridge}=moduleExports;
let pending={rows:[{__id:'transfer-new-7',__new:true,item:'Router',from:'Gudang A',to:'Gudang B',qty:'2.5000'}],selected:[],staged:['transfer-new-7']};
const grid={getPendingRows:()=>pending};let reload=0;
const operational={inventory:async()=>{reload++}};
const bridge=new InventoryTransferNativeBridge(grid,operational);
bridge.options={products:[{id:'p1',name:'Router',sku:'ROUTER-1'}],warehouses:[{id:'w1',name:'Gudang A'},{id:'w2',name:'Gudang B'}]};
const button={setAttribute(){},removeAttribute(){}};
(async()=>{
 await bridge.execute('save',button);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'/api/v1/operational/inventory/transfers');
 assert.equal(calls[0].payload.from_warehouse_id,'w1');
 assert.equal(calls[0].payload.to_warehouse_id,'w2');
 assert.equal(calls[0].payload.quantity,'2.5000');
 const idem=calls[0].payload.idempotency_key;
 await bridge.execute('save',button);
 assert.notEqual(calls[1].payload.idempotency_key,idem,'After a confirmed create, a reused native row ID must receive a NEW idempotency key');
 pending={rows:[{__id:'db-01example',status:'In transit'}],selected:[],staged:['db-01example']};
 await bridge.execute('save',button);
 assert.equal(calls[2].url,'/api/v1/operational/inventory/transfers/01example/ship');
 pending={rows:[{__id:'db-01example',status:'Received'}],selected:[],staged:['db-01example']};
 await bridge.execute('save',button);
 assert.equal(calls[3].url,'/api/v1/operational/inventory/transfers/01example/receive');
 pending={rows:[{__id:'db-01example',status:'Draft'}],selected:['db-01example'],staged:[]};
 await bridge.execute('cancel',button);
 assert.equal(calls[4].url,'/api/v1/operational/inventory/transfers/01example/cancel');
 assert.equal(reload,5);
 console.log('PASS: original transfer grid -> create, idempotent retry, ship, receive, cancel API');
})().catch(error=>{console.error(error);process.exitCode=1});
