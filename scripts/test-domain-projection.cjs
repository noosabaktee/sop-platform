/** No network/database required. Proves SQL domain projections cannot pollute grid snapshots. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const cp=require('node:child_process');
let ts;try{ts=require('typescript')}catch{
 const root=cp.execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim();ts=require(path.join(root,'typescript'));
}
const source=fs.readFileSync(path.join(__dirname,'../frontend/src/api/gridBridge.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
let writes=0;const api={put:async()=>{writes++;return {data:{data:[]}}}};
const testModule={exports:{}};
vm.runInNewContext(compiled.outputText,{exports:testModule.exports,require:()=>({api}),structuredClone,
 window:{setTimeout,clearTimeout},document:{body:{classList:{toggle(){}}},querySelector(){return null}},
 crypto:globalThis.crypto,console,HTMLInputElement:class {}}, {filename:'gridBridge.js'});
(async()=>{
 const {GridBridge}=testModule.exports;
 const grid=new GridBridge([{route:'/inventory',panel_id:'stock',version:1,rows:[{__id:'old-demo',sku:'FAKE'}]}]);
 let renders=0;
 const state={rows:[{__id:'fixture',sku:'FAKE'}],staged:new Map(),selected:new Set()};
 grid.attach('/inventory','stock',state,()=>{renders++});
 assert.equal(state.rows[0].sku,'FAKE');
 grid.mergeDomainRows('/inventory','stock','db-',[{__id:'db-product-1',sku:'REAL'}]);
 assert.equal(grid.isDomainReadOnly('/inventory','stock'),true);
 assert.equal(state.rows.length,1);
 assert.equal(state.rows[0].sku,'REAL');
 assert.equal(renders,1);
 await grid.seedUninitialized();
 state.rows[0].sku='FORGED';
 await grid.persistDirty();
 assert.equal(writes,0,'Domain projection must never POST forged stock data');
 grid.loadSnapshots([{route:'/inventory',panel_id:'stock',version:2,rows:[{__id:'old-demo',sku:'FAKE AGAIN'}]}]);
 assert.equal(state.rows[0].sku,'FORGED','Legacy snapshot cannot overwrite authoritative domain rows');
 await assert.rejects(()=>grid.importCSV('/inventory','stock','sku\nFAKE'),/terotorisasi/);
 console.log('PASS: authoritative SQL projections do not write to grid snapshots, import blocked, legacy snapshots ignored');
})().catch(e=>{console.error(e);process.exitCode=1});
