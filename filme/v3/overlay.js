/* T vem de timeline.js: {cenas:[{id,a,b}], gerado:[[a,b],...], fim} */
const E=p=>1-Math.pow(1-Math.max(0,Math.min(1,p)),3);
const EO=p=>{p=Math.max(0,Math.min(1,p));return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2};
const cl=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));
const br=(v,d=0)=>v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const $=i=>document.getElementById(i);
const mk=(el,p)=>el.style.transform='translateY('+(104*(1-E(p)))+'%)';
const fd=(el,p)=>el.style.opacity=E(p);
const G=$('gr');for(let i=0;i<330;i++)G.appendChild(document.createElement('i'));const PT=[...G.children];
const C={};T.cenas.forEach(c=>C[c.id]=c);
const APP={p:['app_painel',54],g:['app_programacao',42],i:['app_impressos',42],f:['app_frota',42]};
function sc(t,id){const c=C[id];return [t-c.a,c.b-c.a];}
function seek(t){
 T.cenas.forEach(c=>$(c.id).classList.toggle('on',t>=c.a&&t<c.b));
 $('il').style.opacity=T.gerado.some(([a,b])=>t>=a&&t<b)?1:0;
 let r,D;
 [r,D]=sc(t,'s0'); mk($('a1'),cl(r,.5,1.2)); mk($('a2'),cl(r,.75,1.45)); fd($('a3'),cl(r,1.7,2.5));
  $('d1').classList.toggle('on',r>2.8);$('d2').classList.toggle('on',r>3.3);$('d3').classList.toggle('on',r>3.8);
 [r,D]=sc(t,'s1'); mk($('b1'),cl(r,.3,1)); fd($('b2'),cl(r,1.2,1.9));
 [r,D]=sc(t,'s2'); {const p=cl(r,.4,3.4); $('c1').textContent=br(Math.round(3300*E(p)));
  $('c3').textContent='R$ '+br(1.4*E(cl(r,1,4)),1)+' bi'; $('c2').style.transform='scaleX('+E(cl(r,.8,3.2))+')';
  const v=Math.round(330*E(cl(r,.4,3.6))); PT.forEach((e,i)=>{e.style.opacity=i<v?.92:0});}
 [r,D]=sc(t,'s3'); {const f='Mas não entregou\nquem opera.',p=cl(r,.9,2.6); $('e1').textContent=f.slice(0,Math.round(p*f.length));
  $('e2').style.opacity=(r<2.9&&Math.floor(r*1.25)%2===0)?1:0; fd($('e3'),cl(r,3.4,4.2));}
 [r,D]=sc(t,'s4'); $('f1').textContent='≈ '+Math.round(6*E(cl(r,.5,2.3))); fd($('f2'),cl(r,1.3,2.1)); fd($('f3'),cl(r,2.1,2.9));
 [r,D]=sc(t,'s5'); {const p=cl(r,.2,1.1),v=$('g0'); v.style.transform='translateY(-50%) translateX('+(-26*(1-E(p)))+'px)'; v.style.opacity=E(p);
  const b=$('g9'); b.style.top=(v.getBoundingClientRect().top+30)+'px';
  $('g1').textContent=Math.round(8*E(cl(r,.9,2.6))); fd($('g2'),cl(r,1.6,2.4)); fd($('g3'),cl(r,2.3,3.1)); fd($('g4'),cl(r,2.7,3.5));}
 [r,D]=sc(t,'s6'); navega(r,D);
 [r,D]=sc(t,'s7'); mk($('h1'),cl(r,.4,1.1)); mk($('h2'),cl(r,.62,1.32)); {const m=T.marcas.n07b-C.s7.a; fd($('h3'),cl(r,m-.1,m+.8));}
  $('k1').classList.toggle('on',r>1.9);$('k2').classList.toggle('on',r>2.2);$('k3').classList.toggle('on',r>2.5);
 [r,D]=sc(t,'s8'); fd($('z1'),cl(r,.5,1.6));
}
/* navegação no console: painel → programação → impressos → frota → painel e zoom */
function navega(r,D){
 const s=D/13;                                   /* escala o roteiro de 13 s à duração real */
 const P=[[0,2.4,'v0','p',null],[2.4,3.0,'v0','p','g'],[3.0,5.0,'v1','g',null],[5.0,5.6,'v1','g','i'],
          [5.6,8.2,'v2','i',null],[8.2,8.8,'v2','i','f'],[8.8,10.4,'v3','f',null],[10.4,11.0,'v3','f','p'],[11.0,13.0,'v0','p',null]]
          .map(x=>[x[0]*s,x[1]*s,x[2],x[3],x[4]]);
 const M={p:[110,168],g:[110,262],i:[110,401],f:[110,308]};
 let k=0; P.forEach((x,i)=>{if(r>=x[0])k=i}); const [a0,a1,id,vw,dest]=P[k]; const nx=P[k+1];
 ['v0','v1','v2','v3'].forEach(i=>$(i).style.opacity=i===id?1:0);
 if(nx&&nx[2]!==id&&r>nx[0]-.2){const q=cl(r,nx[0]-.2,nx[0]);$(id).style.opacity=1-q;$(nx[2]).style.opacity=q;}
 const ini=P.find(x=>x[2]===id)[0]; const [pasta,nq]=APP[vw];
 const f=Math.min(nq-1,Math.floor(cl(r,ini+.15,ini+1.75)*(nq-1))); const src=pasta+'/'+String(f).padStart(3,'0')+'.jpg';
 if($(id).dataset.s!==src){$(id).dataset.s=src;$(id).src=src;}
 if(nx&&nx[2]!==id){const [p2,n2]=APP[nx[3]];const s2=p2+'/000.jpg';if($(nx[2]).dataset.s!==s2){$(nx[2]).dataset.s=s2;$(nx[2]).src=s2;}}
 /* push contínuo de câmera na cena inteira: nenhum quadro parado entre cliques, e a escala não salta na troca de tela */
 const dz=1+.10*cl(r,0,11*s); const z=r>11*s?1.10+.36*EO(cl(r,11*s,13*s)):dz;
 ['v0','v1','v2','v3'].forEach(i=>$(i).style.transform='scale('+z+')');
 const OX=499.2,OY=842.4,tz=(p,q)=>[OX+(p-OX)*dz,OY+(q-OY)*dz];
 const cu=$('cu'),pu=$('pu'); let mv=null; P.forEach(x=>{if(x[4]&&r>=x[0]-.55&&r<=x[1]+.35)mv=x});
 if(mv){const tg=tz(...M[mv[4]]),q=EO(cl(r,mv[0]-.5,mv[1]-.12)); cu.style.opacity=1;
  cu.style.left=(960+(tg[0]-960)*q)+'px'; cu.style.top=(640+(tg[1]-640)*q)+'px';
  const pq=cl(r,mv[1]-.12,mv[1]+.3); if(pq>0&&pq<1){pu.style.opacity=1-pq;pu.style.left=tg[0]+'px';pu.style.top=tg[1]+'px';pu.style.width=pu.style.height=(22+72*pq)+'px'}else pu.style.opacity=0;
 } else {cu.style.opacity=0;pu.style.opacity=0}
 fd($('h0'),cl(r,.4,1.1));
 [['w1',4.4],['w2',3.7],['w3',3.0],['w4',2.3]].forEach(([i,f])=>{const q=cl(r,D-f,D-f+.6);const e=$(i);e.style.opacity=E(q);e.style.transform='translateX('+(22*(1-E(q)))+'px)'});
}
window.seek=seek; window.FIM=T.fim; seek(0);
