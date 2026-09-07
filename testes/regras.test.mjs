/* ═══════════════════════════════════════════════════════════════════
   Testes das regras de negócio do ROTA — sem navegador.
   Carrega o <script> de rota-app.html num contexto isolado; nada de DOM.
   É o que a revisão pedia no item 17: as funções que carregam risco
   regulatório (elegibilidade, farol, custo, ocupação, alocação) passam a
   ser verificáveis sem abrir o console.

   Rodar: node testes/regras.test.mjs
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(raiz,'..','rota-app.html'),'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const ctx = vm.createContext({console, performance, Date, Math, JSON});
vm.runInContext(script, ctx, {filename:'rota-app.html'});
const ROTA = ctx.ROTA;

let passou=0, falhou=0;
function ok(nome, cond, detalhe){
  if(cond){passou++; console.log('  ok   ·', nome)}
  else{falhou++; console.log('  FALHA·', nome, detalhe!==undefined?('→ '+JSON.stringify(detalhe)):'')}
}
function eq(nome,a,b){ ok(nome, JSON.stringify(a)===JSON.stringify(b), {obtido:a,esperado:b}) }

console.log('\n── carga pela fonte ──');
ok('script carrega fora do navegador', typeof ROTA==='object');
const est0 = ROTA.estado();
eq('coleções vazias antes de abrir', [est0.pacientes.length, est0.veiculos.length], [0,0]);
ROTA.abrirSeed();
const est = ROTA.estado();
eq('seed carregado', [est.pacientes.length, est.veiculos.length, est.abastecimentos.length], [10,3,4]);
ok('rótulos derivados na carga', est.pacientes[7].nec==='Maca — ambulância');
ok('autorização vem do seed', est.pacientes[0].aut.proc==='TFD-2026/0140');
ok('seed não é mutado pela sessão', ROTA.SEED.pacientes[0].trat===undefined);

console.log('\n── elegibilidade federal (Port. 11.164/11.179) ──');
const R = ROTA.regras;
const D = est.destinos;
ok('hemodiálise a 8 km NÃO é elegível', !R.elegivelFederal({tratKey:'hemodialise',dest:'dialise'}));
ok('radioterapia a 252 km é elegível',   R.elegivelFederal({tratKey:'radioterapia',dest:'teresina'}));
ok('quimioterapia a 252 km NÃO é elegível', !R.elegivelFederal({tratKey:'quimioterapia',dest:'teresina'}));
ok('consulta a 148 km NÃO é elegível',   !R.elegivelFederal({tratKey:'consulta',dest:'picos'}));
D.__longe={nome:'Fora do teto',km:600,tipo:'x'};
ok('acima de 500 km NÃO é elegível',     !R.elegivelFederal({tratKey:'hemodialise',dest:'__longe'}));
delete D.__longe;

console.log('\n── programação e alocação ──');
R.gerarProgramacao();
const v = ROTA.estado().viagens;
ok('nenhuma viagem acima da lotação', v.every(x=>x.assentos<=x.lot), v.filter(x=>x.assentos>x.lot).map(x=>x.id));
ok('intermunicipal vai de micro-ônibus', v.filter(x=>D[x.dest].km>50 && x.veic.classe!=='ambulancia').every(x=>x.veic.classe==='micro'));
ok('local vai de van', v.filter(x=>D[x.dest].km<=50 && x.veic.classe!=='ambulancia').every(x=>x.veic.classe==='van'));
ok('maca vai em ambulância', v.filter(x=>x.pacientes.some(R.exigeAmbulancia)).every(x=>x.veic.classe==='ambulancia'));
ok('id derivado do conteúdo', /^[a-z]{3}-[a-z]+-ROTA-\d+/.test(v[0].id), v[0].id);

console.log('\n── quebra por lotação ──');
const est2=ROTA.estado(); const antes=est2.pacientes.length;
for(let i=0;i<40;i++) est2.pacientes.push({id:900+i,nome:'T'+i,cns:'0',nasc:'-',mun:'F',ponto:'U',
  tratKey:'hemodialise',dest:'teresina',rec:['qui'],acomp:true,necKey:'nenhuma',trat:'H',nec:'—',aut:{proc:'X',val:'-'}});
R.gerarProgramacao();
const qui = ROTA.estado().viagens.filter(x=>x.dia==='qui'&&x.dest==='teresina');
ok('grupo grande é dividido', qui.length>1, qui.map(x=>x.assentos+'/'+x.lot));
ok('nenhum bloco estoura a lotação', qui.every(x=>x.assentos<=x.lot), qui.map(x=>x.assentos+'/'+x.lot));
est2.pacientes.length=antes; R.gerarProgramacao();

console.log('\n── IDs estáveis (M6) ──');
const idsAntes = ROTA.estado().viagens.map(x=>x.id).join(',');
ROTA.estado().pacientes.unshift({id:999,nome:'Novo da Segunda',cns:'0',nasc:'-',mun:'F',ponto:'U',
  tratKey:'fisioterapia',dest:'dialise',rec:['seg'],acomp:false,necKey:'nenhuma',trat:'F',nec:'—',aut:{proc:'X',val:'-'}});
R.gerarProgramacao();
const idsDepois = ROTA.estado().viagens.map(x=>x.id);
ok('inserir paciente preserva os IDs', idsAntes.split(',').every(id=>idsDepois.includes(id)));
ok('nenhum lançamento fica órfão', Object.keys(ROTA.estado().lancamentos).every(k=>idsDepois.includes(k)));
ROTA.estado().pacientes.shift(); R.gerarProgramacao();

console.log('\n── farol de suspensão (RN-08) ──');
function farolCom(dias){
  const l=ROTA.estado().lancamentos;
  const alvo=new Date('2026-07-08T00:00:00'); alvo.setDate(alvo.getDate()-dias);
  const iso=alvo.toISOString().slice(0,10);
  Object.keys(l).forEach(k=>{if(l[k].concluida)l[k].data=iso});
  return R.diasSemRegistro().dias;
}
eq('5 dias',  farolCom(5),  5);
eq('45 dias', farolCom(45), 45);
eq('75 dias', farolCom(75), 75);
const lanc=ROTA.estado().lancamentos; Object.keys(lanc).forEach(k=>delete lanc[k]);
eq('sem registro nenhum', R.diasSemRegistro().dias, null);
R.gerarProgramacao();

console.log('\n── custo do período (A4) ──');
const cfg=ROTA.estado().config;
const custo=R.custoPeriodo(['2026-07-06','2026-07-08'],1000);
const comb=ROTA.estado().abastecimentos.filter(a=>['2026-07-06','2026-07-08'].includes(a.data)).reduce((s,a)=>s+a.valor,0);
ok('custo = combustível do período + km × custo/km', Math.abs(custo-(comb+1000*cfg.custoKmVariavel))<0.001, {custo,comb});
const fora=R.custoPeriodo(['2026-01-01'],0);
eq('período sem abastecimento não soma nada', fora, 0);

console.log('\n── ocupação programada × realizada (A5) ──');
const vs=ROTA.estado().viagens;
const prog=R.ocupProgramada(vs), real=R.ocupRealizada(vs);
ok('programada e realizada são diferentes', prog!==real, {prog,real});
ok('ambas entre 0 e 100', prog>=0&&prog<=100&&real>=0&&real<=100, {prog,real});

console.log('\n── escape (M1) ──');
eq('escapa < > & aspas', R.esc('<a href="x">\'&'), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
eq('null vira vazio', R.esc(null), '');

console.log('\n'+(falhou?'✗ '+falhou+' falha(s), ':'✓ ')+passou+' asserção(ões) passaram\n');
process.exit(falhou?1:0);
