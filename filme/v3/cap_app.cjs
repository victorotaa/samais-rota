const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1.2});
await pg.goto('https://samais-rota.vercel.app/rota-app.html',{waitUntil:'load'});await pg.waitForTimeout(600);
await pg.click('#lg-enter');await pg.waitForTimeout(1000);
await pg.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
for(const [v,N] of [['painel',54],['programacao',42],['impressos',42],['frota',42]]){
 const d='app_'+v;fs.mkdirSync(d,{recursive:true});const a=await pg.$(`[data-view="${v}"]`);if(a){await a.click();await pg.waitForTimeout(700)}
 await pg.evaluate(v=>{const r=document.querySelector('#v-'+v)||document;const $$=s=>[...r.querySelectorAll(s)];
  window.__A={ar:$$('[data-len]').map(e=>({e,l:+e.getAttribute('data-len'),f:+e.getAttribute('data-frac')})),ln:$$('.line-draw').map(e=>({e,l:e.getTotalLength()})),
  ba:$$('.bar[data-h]').map(e=>({e,h:+e.getAttribute('data-h')})),wi:$$('.fill[data-w],.seg-a[data-w],.seg-b[data-w]').map(e=>({e,w:+e.getAttribute('data-w')})),
  nu:$$('.cv').map(e=>({e,to:+e.getAttribute('data-to'),d:+e.getAttribute('data-dec')||0,p:e.getAttribute('data-pre')||''})),tr:$$('tbody tr, .row')}},v);
 for(let i=0;i<N;i++){const p=Math.min(i/42,1);await pg.evaluate(p=>{const e=1-Math.pow(1-p,3),A=window.__A;
  A.ar.forEach(o=>o.e.style.strokeDashoffset=o.l*(1-o.f*e));A.ln.forEach(o=>{o.e.style.strokeDasharray=o.l;o.e.style.strokeDashoffset=o.l*(1-e)});
  A.ba.forEach(o=>o.e.style.height=(o.h*e)+'%');A.wi.forEach(o=>o.e.style.width=(o.w*e)+'%');
  A.nu.forEach(o=>o.e.textContent=o.p+(o.to*e).toLocaleString('pt-BR',{minimumFractionDigits:o.d,maximumFractionDigits:o.d}));
  A.tr.forEach((t,k)=>{const q=Math.max(0,Math.min(1,(p*1.4-k*.07)/.34)),g=1-Math.pow(1-q,3);t.style.opacity=g;t.style.transform='translateY('+(14*(1-g))+'px)'})},p);
  await pg.screenshot({path:`${d}/${String(i).padStart(3,'0')}.jpg`,type:'jpeg',quality:88});}
 console.log('app',v,N);}
await b.close()})();
