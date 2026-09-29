const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const R=process.cwd(),W=+process.argv[2]||4,A0=+process.argv[3]||0,A1=+process.argv[4]||1e9;
const tp=f=>f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':f.endsWith('.jpg')?'image/jpeg':'text/html; charset=utf-8';
const srv=http.createServer((q,r)=>{const f=path.join(R,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404).end();return}r.writeHead(200,{'Content-Type':tp(f)});r.end(fs.readFileSync(f))});
/* toda face usada no filme, carregada antes do primeiro quadro. Sem isso o Chromium cai no DejaVu Sans, mais largo, e o texto estoura a tela */
const FACES=['700 40px Syne','800 40px Syne','300 20px "Plus Jakarta Sans"','400 20px "Plus Jakarta Sans"','500 20px "Plus Jakarta Sans"',
 '400 12px "JetBrains Mono"','500 12px "JetBrains Mono"','700 12px "JetBrains Mono"'];
(async()=>{await new Promise(r=>srv.listen(8300,r));fs.mkdirSync('ov',{recursive:true});const b=await chromium.launch();const t0=Date.now();
const one=async k=>{const pg=await b.newPage({viewport:{width:1920,height:1080}});const c=await pg.context().newCDPSession(pg);
 await pg.goto('http://127.0.0.1:8300/overlay.html',{waitUntil:'load'});
 const falta=await pg.evaluate(async F=>{await Promise.all(F.map(f=>document.fonts.load(f,'Mas não entregou quem opera. ÁÉÍÓÚãõçâêô 0123456789')));
  await document.fonts.ready;
  return F.filter(f=>{const w=parseInt(f);return ![...document.fonts].some(ff=>{const [lo,hi]=ff.weight.split(' ').map(Number);
   return ff.status==='loaded'&&f.includes(ff.family.replace(/["']/g,''))&&w>=lo&&w<=(hi||lo)})})},FACES);
 if(falta.length)throw new Error('fontes não carregadas: '+falta.join(', '));
 await c.send('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
 await pg.evaluate(async()=>{const L=[];for(const [p,n] of [['app_painel',54],['app_programacao',42],['app_impressos',42],['app_frota',42]])for(let i=0;i<n;i++){const im=new Image();im.src=p+'/'+String(i).padStart(3,'0')+'.jpg';L.push(im.decode().catch(()=>0))}await Promise.all(L)});
 /* conferência de margem: a frase mais longa do filme tem de caber com folga */
 if(k===0){const d=await pg.evaluate(()=>{seek(C.s3.b-.5);return Math.round(document.getElementById('e1').getBoundingClientRect().right)});
  console.log('frase do vão termina em x =',d);if(d>1920-96)throw new Error('frase do vão estoura a margem: x='+d);}
 const N=Math.min(A1,await pg.evaluate(()=>Math.round(30*window.FIM)));
 for(let i=A0+k;i<N;i+=W){const f=`ov/${String(i).padStart(5,'0')}.png`;if(fs.existsSync(f))continue;
  await pg.evaluate(async t=>{seek(t);await Promise.all([...document.images].filter(x=>x.src).map(x=>x.decode().catch(()=>0)))},i/30);
  const s=await c.send('Page.captureScreenshot',{format:'png',optimizeForSpeed:true});fs.writeFileSync(f+'.tmp',Buffer.from(s.data,'base64'));fs.renameSync(f+'.tmp',f);
  if(k==0&&i%150<W)console.log(i,Math.round((Date.now()-t0)/1000)+'s');}
 return N};
const r=await Promise.all([...Array(W).keys()].map(one));console.log('quadros',r[0]);await b.close();srv.close()})().catch(e=>{console.error(e.message);process.exit(1)});
