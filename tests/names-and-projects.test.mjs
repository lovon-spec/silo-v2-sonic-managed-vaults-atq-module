import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const bytes=await readFile(new URL('../dist/main.mjs',import.meta.url),'utf8');
const deployment='QmQUcPAEpUQJL3AYK21hsgNnj6XmWepTXJXySHdFXMmp7p',hash='0x'+'ab'.repeat(32);
const address=n=>'0x'+n.toString(16).padStart(40,'0'),vault=(n,name)=>({id:address(n),name,decimals:18,asset:{id:address(999999)}});
async function run(rows){
 let calls=0;const context=vm.createContext({AbortController,Date,clearTimeout,setTimeout:(fn,ms)=>setTimeout(fn,ms===2000?0:ms),fetch:async(url,options)=>{
  assert.equal(url,'https://gateway.thegraph.com/api/deployments/id/'+deployment);assert.equal(options.headers.Authorization,'Bearer synthetic');calls++;
  const q=JSON.parse(options.body),meta={deployment,hasIndexingErrors:false,block:{number:100,hash}};
  if(q.query.includes('vaults(')){
   assert.equal(q.variables.block.hash,hash);const selected=rows.filter(r=>!q.variables.cursor||r.id>q.variables.cursor).slice(0,1000);
   return {ok:true,json:async()=>({data:{vaults:selected,_meta:meta}})};
  }return {ok:true,json:async()=>({data:{_meta:meta}})};
 }}),m=new vm.SourceTextModule(bytes,{context});await m.link(()=>{throw Error('Unexpected runtime dependency');});await m.evaluate();return {tags:await m.namespace.returnTags('146','synthetic'),calls};
}
test('five official product aliases name managers without any contract-address mapping',async()=>{
 const aliases=[['Yield Optimized Sonic','Goat'],['Yield Optimized USDC','Goat'],['Mithras','Travee'],['ABRC','YieldFi'],['Mainstreet Liquidity Vault','Braindead']];
 const {tags}=await run(aliases.map(([name],i)=>vault(i+1,name)));
 tags.forEach((t,i)=>{assert.match(t['Public Note'],/Protocol: Silo Finance\./);assert.ok(t['Public Note'].includes('Source vault name: '+aliases[i][0]+'.'));assert.ok(t['Public Note'].includes('Official product manager: '+aliases[i][1]+'.'));});
 const source=await readFile(new URL('../src/main.mts',import.meta.url),'utf8');assert.doesNotMatch(source,/0x[0-9a-fA-F]{40}/);
});
test('the complete source name retains every named project, not only recognized aliases',async()=>{
 const names=['Re7 S','Varlamore Mainstreet USDC','Apostro S','Greenhouse scUSD','PERQ-USDC','Stability Managed USDC','Relend Network rUSDC','Gami Capital scUSD','Evolve Onchain USDC','Shorewoods USDC','RedApple Finance USDC'];
 const {tags}=await run(names.map((n,i)=>vault(i+1,n)));tags.forEach((t,i)=>assert.ok(t['Public Note'].includes('Source vault name: '+names[i]+'.')));
});
test('duplicate official names are preserved while adding a source-address suffix',async()=>{
 const {tags}=await run([vault(1,'Apostro S'),vault(2,'Apostro S')]);assert.notEqual(tags[0]['Public Name Tag'],tags[1]['Public Name Tag']);
 for(const t of tags){assert.match(t['Public Name Tag'],/^Silo Vault Apostro S /);assert.ok(t['Public Name Tag'].length<=50);assert.match(t['Public Note'],/Source vault name: Apostro S\./);}
});
test('empty names use the contract class with a visibly abbreviated identity',async()=>{const {tags}=await run([vault(1,'')]);assert.match(tags[0]['Public Name Tag'],/^Silo Vault 0x.*\.\.\./);assert.match(tags[0]['Public Note'],/Source vault name: \(empty\)\./);});
test('long names use ellipsis but remain complete in Public Note',async()=>{const name='Varlamore '+'Growth '.repeat(15),{tags}=await run([vault(1,name)]);assert.ok(tags[0]['Public Name Tag'].length<=50);assert.ok(tags[0]['Public Name Tag'].endsWith('...'));assert.ok(tags[0]['Public Note'].includes(name.trim()));});
test('unsafe nonempty official identity throws instead of falling back or skipping the row',async()=>{for(const name of ['<b>Re7</b>','vault_name','Vault\nInjected'])await assert.rejects(run([vault(1,'Valid'),vault(2,name)]),/safely preserved/);});
test('pagination returns every dynamic row, including anonymous test vaults and repeated product names',async()=>{const rows=Array.from({length:2002},(_,i)=>vault(i+1,i%2?'Mithras':'Test'));const {tags,calls}=await run(rows);assert.equal(tags.length,rows.length);assert.equal(calls,5);assert.equal(new Set(tags.map(t=>t['Contract Address'])).size,rows.length);assert.equal(new Set(tags.map(t=>t['Public Name Tag'].toLowerCase())).size,rows.length);});
test('an address-abbreviation collision holds the complete result',async()=>{const ids=['0x'+'11'.repeat(4)+'22'.repeat(12)+'33'.repeat(4),'0x'+'11'.repeat(4)+'44'.repeat(12)+'33'.repeat(4)];await assert.rejects(run(ids.map((id,i)=>({...vault(i+1,'Apostro S'),id}))),/identities collide/);});
test('the same product at different dynamic addresses receives metadata without selecting an address',async()=>{const {tags}=await run([vault(7,'ABRC'),vault(900,'ABRC')]);assert.equal(tags.length,2);assert.ok(tags.every(t=>t['Public Note'].includes('YieldFi')));assert.equal(tags[0]['Contract Address'],'eip155:146:'+address(7));assert.equal(tags[1]['Contract Address'],'eip155:146:'+address(900));});
