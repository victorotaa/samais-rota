const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const R=process.cwd(),W=+process.argv[2]||4;
const tp=f=>f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':f.endsWith('.jpg')?'image/jpeg':'text/html; charset=utf-8';
const srv=http.createServer((q,r)=>{const f=path.join(R,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404).end();return}r.writeHead(200,{'Content-Type':tp(f)});r.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(8300,r));fs.mkdirSync('ov',{recursive:true});const b=await chromium.launch();
const one=async k=>{const pg=await b.newPage({viewport:{width:1920,height:1080}});const c=await pg.context().newCDPSession(pg);
 await pg.goto('http://127.0.0.1:8300/overlay.html',{waitUntil:'load'});await pg.evaluate(()=>document.fonts.ready);
 await c.send('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
 await pg.evaluate(async()=>{const L=[];for(const [p,n] of [['app_painel',54],['app_programacao',42],['app_impressos',42],['app_frota',42]])for(let i=0;i<n;i++){const im=new Image();im.src=p+'/'+String(i).padStart(3,'0')+'.jpg';L.push(im.decode().catch(()=>0))}await Promise.all(L)});
 const N=await pg.evaluate(()=>Math.round(30*window.FIM));
 for(let i=k;i<N;i+=W){await pg.evaluate(async t=>{seek(t);await Promise.all([...document.images].filter(x=>x.src).map(x=>x.decode().catch(()=>0)))},i/30);
  const s=await c.send('Page.captureScreenshot',{format:'png',optimizeForSpeed:true});fs.writeFileSync(`ov/${String(i).padStart(5,'0')}.png`,Buffer.from(s.data,'base64'));}
 return N};
const r=await Promise.all([...Array(W).keys()].map(one));console.log('quadros',r[0]);await b.close();srv.close()})();
