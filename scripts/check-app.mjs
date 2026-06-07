import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL=process.argv[2]||'http://localhost:8772/index.html';
const PORT=9355, sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dir=mkdtempSync(join(tmpdir(),'ck-'));
const chrome=spawn(CHROME,['--headless=new','--disable-gpu',`--remote-debugging-port=${PORT}`,`--user-data-dir=${dir}`,'--no-first-run'],{stdio:'ignore'});
let t;for(let i=0;i<50;i++){try{t=await(await fetch(`http://localhost:${PORT}/json/new?about:blank`,{method:'PUT'})).json();break;}catch{await sleep(200);}}
const ws=new WebSocket(t.webSocketDebuggerUrl);const pend=new Map();let id=0;
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id).r(m.result);pend.delete(m.id);}};
await new Promise(r=>ws.onopen=r);
const cdp=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,{r});ws.send(JSON.stringify({id:i,method,params}));});
await cdp('Runtime.enable');await cdp('Page.enable');
await cdp('Page.navigate',{url:URL});await sleep(1500);
const ev=async x=>(await cdp('Runtime.evaluate',{expression:x,returnByValue:true})).result.value;
let fail=0; const ck=(l,ok,got)=>{console.log(`  ${ok?'✅':'❌'} ${l}: ${got}`);if(!ok)fail++;};

ck('Startnivå 0,0', (await ev(`document.getElementById('nowLevel').textContent`)).includes('0,0'), await ev(`document.getElementById('nowLevel').textContent`));
ck('Kurvan ritad (2 paths)', await ev(`document.querySelectorAll('#curve path').length`)===2, (await ev(`document.querySelectorAll('#curve path').length`))+' paths');
// lägg till en bryggkaffe
await ev(`document.querySelector('.src[data-k=brygg]').click()`); await sleep(400);
ck('Kopp tillagd på tidslinjen', await ev(`document.querySelectorAll('.tl .cup').length`)===1, (await ev(`document.querySelectorAll('.tl .cup').length`))+' cup');
const lvl=await ev(`document.getElementById('nowLevel').textContent`);
ck('Nivå uppdaterad (ej 0,0)', !lvl.includes('0,0'), lvl.trim());
ck('Vald-rad visas (dra-tips)', await ev(`!document.getElementById('selbar').classList.contains('hidden')`), await ev(`document.getElementById('selbar').textContent.slice(0,30)`));
ck('Sömnrisk beräknad', await ev(`document.querySelector('#sleep .t2').textContent.includes('mg/L')`), await ev(`document.querySelector('#sleep .t2').textContent.slice(0,42)`));
// öppna inställningar
await ev(`document.getElementById('gear').click()`); await sleep(400);
ck('Inställningar öppnas', await ev(`document.getElementById('sheet').classList.contains('on')`), 'sheet on='+await ev(`document.getElementById('sheet').classList.contains('on')`));
ck('Halveringstid-text', await ev(`document.getElementById('thalfNote').textContent.includes('halveringstid')`), await ev(`document.getElementById('thalfNote').textContent`));
// koffeinkänslighet → längre halveringstid
await ev(`document.querySelector('#pSens button[data-v=sensitive]').click()`); await sleep(250);
ck('Känslig → ~7,2 h', await ev(`document.getElementById('thalfNote').textContent.includes('7,2')`), await ev(`document.getElementById('thalfNote').textContent`));
// persistens: ladda om och kontrollera att intaget finns kvar
await ev(`document.getElementById('save').click()`); await sleep(300);
await cdp('Page.navigate',{url:URL}); await sleep(1500);
ck('Intag kvar efter omladdning (localStorage)', await ev(`document.querySelectorAll('.tl .cup').length`)===1, (await ev(`document.querySelectorAll('.tl .cup').length`))+' cup');

console.log(fail?`\n❌ ${fail} fel`:`\n🎉 Allt fungerar`);
ws.close();chrome.kill();process.exit(fail?1:0);
