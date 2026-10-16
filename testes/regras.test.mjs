/* ═══════════════════════════════════════════════════════════════════
   Testes das regras de negócio do ROTA — sem navegador.
   Carrega o <script> de rota-app.html num contexto isolado; nada de DOM.
   É o que a revisão pedia no item 17: as funções que carregam risco
   regulatório (elegibilidade, farol, custo, ocupação, alocação) passam a
   ser verificáveis sem abrir o console.

   Etapa 2 da Portaria 11.165 (docs/PORTARIA-11165-INTEGRACAO.md §8): o
   console NÃO tem regra própria da norma. No navegador ele carrega
   regras/portaria-11165.mjs e regras/integracao-11165.mjs por import();
   aqui os dois módulos entram pelo contexto da VM (NORMA_11165), que é o
   mesmo objeto que o import() entrega.

   Rodar: node testes/regras.test.mjs
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as regras11165 from '../regras/portaria-11165.mjs';
import * as costura11165 from '../regras/integracao-11165.mjs';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(raiz,'..','rota-app.html'),'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const ctx = vm.createContext({console, performance, Date, Math, JSON,
  NORMA_11165: {regras: regras11165, costura: costura11165}});
vm.runInContext(script, ctx, {filename:'rota-app.html'});
const ROTA = ctx.ROTA;

let passou=0, falhou=0;
function ok(nome, cond, detalhe){
  if(cond){passou++; console.log('  ok   ·', nome)}
  else{falhou++; console.log('  FALHA·', nome, detalhe!==undefined?('→ '+JSON.stringify(detalhe)):'')}
}
function eq(nome,a,b){ ok(nome, JSON.stringify(a)===JSON.stringify(b), {obtido:a,esperado:b}) }
const copia = o => JSON.parse(JSON.stringify(o));

console.log('\n── carga pela fonte ──');
ok('script carrega fora do navegador', typeof ROTA==='object');
const est0 = ROTA.estado();
eq('coleções vazias antes de abrir', [est0.pacientes.length, est0.veiculos.length], [0,0]);
ROTA.abrirSeed();
const est = ROTA.estado();
eq('seed carregado', [est.pacientes.length, est.veiculos.length, est.abastecimentos.length], [10,3,4]);
ok('rótulos derivados na carga', est.pacientes[7].nec==='Maca — ambulância');
ok('autorização vem do seed', est.pacientes[0].aut.proc==='TFD-2026/0140');
ok('seed não é mutado pela sessão', ROTA.SEED.pacientes[0].trat===undefined && ROTA.SEED.pacientes[0].elegibilidade===undefined);
ok('a norma chega ao console pelos módulos (não por cópia)',
   ROTA.norma() && ROTA.norma().regras.elegibilidade11165===regras11165.elegibilidade11165
   && ROTA.norma().costura.preRemessaBPAI===costura11165.preRemessaBPAI);
ok('nenhum paciente do seed carrega chave de CPF', est.pacientes.every(p=>!Object.keys(p).some(k=>/cpf/i.test(k))));

/* ─── elegibilidade (RN-05) ────────────────────────────────────────────
   REESCRITA na etapa 2. Os testes antigos chamavam R.elegivelFederal(p),
   que decidia por DESTINOS[p.dest].km — a distância DA BASE AO DESTINO —
   com dois estados. A norma mede do MUNICÍPIO DE RESIDÊNCIA ao MUNICÍPIO
   SEDE DO SERVIÇO (11.165 arts. 15 e 16; 11.164 art. 23), exige ente
   diverso (Lei 12.732), hemodiálise na mesma UF, serviço habilitado e
   agendamento confirmado (11.165 art. 13 §3º), e tem TRÊS estados. Cada
   caso antigo foi reescrito para o que a norma diz, com o motivo ao lado. */
console.log('\n── elegibilidade (Port. 11.164 + 11.165, três estados) ──');
const R = ROTA.regras;
const D = est.destinos;
const P = id => ROTA.estado().pacientes.find(p=>p.id===id);
ok('a regra antiga (base → destino) saiu do console', R.elegivelFederal===undefined);

/* antes: "hemodiálise a 8 km NÃO é elegível" — certo pelo motivo errado.
   Os 8 km são da base à clínica. A paciente mora no mesmo município do
   serviço: é o ente diverso (RE-02) que a torna inelegível. */
eq('hemodiálise no próprio município: inelegível por ente diverso (RE-02), não pelos 8 km da base',
   [P(1).elegibilidade.status, P(1).elegibilidade.regras_violadas.includes('RE-02')], ['inelegivel', true]);
/* novo: o caso que a regra antiga errava — a mesma clínica a 8 km da base,
   para quem mora em outro município a 62 km, É elegível. */
eq('hemodiálise vinda de outro município (62 km de demonstração) à mesma clínica de 8 km: elegível',
   [P(7).elegibilidade.status, D[P(7).dest].km], ['elegivel', 8]);
/* antes: "radioterapia a 252 km é elegível" — os 252 km eram da base.
   Agora é a distância de município a município, com serviço habilitado e
   agendamento confirmado; e o procedimento e a faixa saem do módulo. */
eq('radioterapia de Floriano a Teresina, habilitada e agendada: elegível, com procedimento e faixa',
   [P(3).elegibilidade.status, P(3).elegibilidade.procedimento, P(3).elegibilidade.faixa],
   ['elegivel', '08.03.01.015-0', 3]);
/* novo: agendamento sem resposta do serviço — dado ausente não é "não". */
eq('radioterapia com agendamento sem resposta do serviço: pendente (RE-07), nunca inelegível',
   [P(4).elegibilidade.status, P(4).elegibilidade.pendencias], ['pendente', ['RE-07']]);
/* antes: "quimioterapia a 252 km NÃO é elegível" e "consulta a 148 km NÃO
   é elegível" — o resultado não muda; agora o motivo é a modalidade (RE-01),
   não a distância. */
eq('quimioterapia: inelegível pela modalidade (RE-01)', [P(5).elegibilidade.status, P(5).elegibilidade.regras_violadas[0]], ['inelegivel','RE-01']);
eq('consulta especializada: inelegível pela modalidade (RE-01)', [P(6).elegibilidade.status, P(6).elegibilidade.regras_violadas[0]], ['inelegivel','RE-01']);
/* novo: residência a levantar fica pendente — lacuna não vira zero. */
eq('residência a levantar: pendente (RE-02, RE-03, RE-05), lacuna não vira zero',
   [P(2).elegibilidade.status, P(2).elegibilidade.pendencias], ['pendente', ['RE-02','RE-03','RE-05']]);

/* antes: "acima de 500 km NÃO é elegível" — o teste punha 600 km em
   DESTINOS (base → destino). Agora são 600 km de município a município. */
function abrirCom(mexer){
  const s = copia(ROTA.SEED); mexer(s);
  return new ROTA.FonteSeed(s).carregar();
}
{
  const d = abrirCom(s => { s.distancias.find(x=>x.destino==='9922003').km = 600 });
  const p = d.pacientes.find(x=>x.id===3);
  eq('600 km do município de residência ao do serviço: inelegível (RE-04)', [p.elegibilidade.status, p.elegibilidade.regras_violadas], ['inelegivel',['RE-04']]);
}
{
  const d = abrirCom(s => { s.destinos.teresina.km = 8 });
  eq('o km da base ao destino não decide mais nada: 8 km na rota, continua elegível',
     d.pacientes.find(x=>x.id===3).elegibilidade.status, 'elegivel');
}
{
  const d = abrirCom(s => { s.distancias = s.distancias.filter(x=>x.destino!=='9922003') });
  const p = d.pacientes.find(x=>x.id===3);
  eq('distância de município a município não levantada: pendente (RE-03), nunca 0 km',
     [p.elegibilidade.status, p.elegibilidade.pendencias], ['pendente',['RE-03']]);
}
{
  const d = abrirCom(s => { s.destinos.teresina.habilitacaoConferida = false });
  eq('serviço sem habilitação: inelegível (RE-06)', d.pacientes.find(x=>x.id===3).elegibilidade.regras_violadas, ['RE-06']);
}
ok('pendências e regras viram texto legível', /distância/.test(R.rotuloRegra('RE-03','pendente')) && /ente diverso/.test(R.rotuloRegra('RE-02','violada')));

console.log('\n── programação e alocação ──');
R.gerarProgramacao();
const v = ROTA.estado().viagens;
ok('nenhuma viagem acima da lotação', v.every(x=>x.assentos<=x.lot), v.filter(x=>x.assentos>x.lot).map(x=>x.id));
/* o km da base ao destino continua decidindo o que é dele: a OPERAÇÃO */
ok('intermunicipal vai de micro-ônibus', v.filter(x=>D[x.dest].km>50 && x.veic.classe!=='ambulancia').every(x=>x.veic.classe==='micro'));
ok('local vai de van', v.filter(x=>D[x.dest].km<=50 && x.veic.classe!=='ambulancia').every(x=>x.veic.classe==='van'));
ok('maca vai em ambulância', v.filter(x=>x.pacientes.some(R.exigeAmbulancia)).every(x=>x.veic.classe==='ambulancia'));
ok('id derivado do conteúdo', /^[a-z]{3}-[a-z]+-ROTA-\d+/.test(v[0].id), v[0].id);
{
  const seg = v.filter(x=>x.dia==='seg');
  eq('elegíveis na viagem contam por paciente com status elegível (segunda: Maria José e Luzia)',
     seg.reduce((a,x)=>a+R.elegiveisNaViagem(x).length,0), 2);
}

console.log('\n── quebra por lotação ──');
const est2=ROTA.estado(); const antes=est2.pacientes.length;
for(let i=0;i<40;i++) est2.pacientes.push({id:900+i,nome:'T'+i,cns:'0',nasc:'-',mun:'F',ponto:'U',
  tratKey:'hemodialise',dest:'teresina',rec:['qui'],acomp:true,necKey:'nenhuma',trat:'H',nec:'—',aut:{proc:'X',val:'-'}});
R.gerarProgramacao();
const qui = ROTA.estado().viagens.filter(x=>x.dia==='qui'&&x.dest==='teresina');
ok('grupo grande é dividido', qui.length>1, qui.map(x=>x.assentos+'/'+x.lot));
ok('nenhum bloco estoura a lotação', qui.every(x=>x.assentos<=x.lot), qui.map(x=>x.assentos+'/'+x.lot));
ok('paciente sem elegibilidade avaliada não conta como elegível', qui.every(x=>R.elegiveisNaViagem(x).every(p=>p.id<900)));
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

/* ─── dias sem baixa ─────────────────────────────────────────────────
   REESCRITA na etapa 2. Antes esta seção se chamava "farol de suspensão
   (RN-08)" e testava diasSemRegistro(): dias desde a última baixa
   interna, numa janela de 90 dias. A norma conta COMPETÊNCIAS sem
   remessa BPA-I enviada ao SIA (11.165 art. 21 §2º); baixa interna sem
   remessa não comprova nada. A contagem de dias continua, só como
   informação OPERACIONAL, com outro nome — e a data é aritmética de
   calendário (nunca toISOString().slice(0,10), que troca o dia pelo fuso). */
console.log('\n── dias sem baixa (informação operacional, não é farol) ──');
function menosDias(iso, n){
  const [a,m,d] = iso.split('-').map(Number), t = new Date(Date.UTC(a,m-1,d-n)), p = x=>String(x).padStart(2,'0');
  return t.getUTCFullYear()+'-'+p(t.getUTCMonth()+1)+'-'+p(t.getUTCDate());
}
function semBaixaHa(dias){
  const l=ROTA.estado().lancamentos, alvo=menosDias(R.hojeISO(), dias);
  Object.keys(l).forEach(k=>{if(l[k].concluida)l[k].data=alvo});
  return R.diasSemBaixa().dias;
}
ok('o nome antigo saiu (não sugere farol)', R.diasSemRegistro===undefined);
eq('5 dias',  semBaixaHa(5),  5);
eq('45 dias', semBaixaHa(45), 45);
eq('75 dias', semBaixaHa(75), 75);
{
  const linha = ROTA.ui.linhaOperacional(R.diasSemBaixa());
  ok('o rótulo operacional não fala em suspensão nem em repasse', !/suspens|repasse|em dia|risco/i.test(linha), linha);
  ok('e diz que baixa não comprova produção', /não comprova/i.test(linha), linha);
}
const lanc=ROTA.estado().lancamentos; Object.keys(lanc).forEach(k=>delete lanc[k]);
eq('sem baixa nenhuma', R.diasSemBaixa().dias, null);
R.gerarProgramacao();

/* ─── farol de produção por competência (RN-08, art. 21 §2º) ───────── */
console.log('\n── farol de produção por competência ──');
let fp = null;
ROTA.Dados.ler('farolProducao', {hoje: R.hojeISO()}, r => { fp = r });
eq('competências fechadas desde o início do incentivo', fp.competencias.map(c=>c.competencia), ['2026-07','2026-08','2026-09']);
eq('setembro sem remessa informada: a conferir — sem informação não é zero',
   [fp.farol.estado, fp.farol.meses_sem_registro, fp.competencias[2].linhas_enviadas], ['a_conferir', null, null]);
eq('aplicável: a base está apta ao incentivo', [fp.aplicavel, fp.base_apta.estado], [true, 'apta']);
ok('dias sem baixa vêm à parte, como operacional', fp.operacional && 'dias_sem_baixa' in fp.operacional);
ok('o painel mostra "a conferir" e o mês a informar', /A conferir/.test(ROTA.ui.htmlFarol(fp)) && /set\/2026/.test(ROTA.ui.htmlFarol(fp)));
{
  let gravada = null;
  ROTA.Dados.salvarRemessa({competencia:'2026-09', linhas:0, enviadaEm:null, informadoPor:'faturamento da SMS (demonstração)'}, r=>{gravada=r});
  ROTA.Dados.ler('farolProducao', {hoje: R.hojeISO()}, r => { fp = r });
  eq('zero informado pelo faturamento conta: 1 mês sem registro = atenção', [gravada.linhas, fp.farol.estado, fp.farol.meses_sem_registro], [0,'atencao',1]);
  ROTA.Dados.salvarRemessa({competencia:'2026-09', linhas:40, enviadaEm:'2026-10-08', informadoPor:'faturamento da SMS (demonstração)'});
  ROTA.Dados.ler('farolProducao', {hoje: R.hojeISO()}, r => { fp = r });
  eq('remessa com linhas: em dia', fp.farol.estado, 'em_dia');
}
{
  const f = new ROTA.FonteSeed((s => (s.config.pactuacao.deliberacaoCib = null, s))(copia(ROTA.SEED)));
  f.carregar();
  const r = f.farolProducao({hoje: R.hojeISO()});
  eq('sem deliberação CIB a base não está apta: farol não aplicável', [r.aplicavel, r.base_apta.faltam], [false, ['deliberacao_cib']]);
  ok('e a tela diz "não aplicável"', /não aplicável/i.test(ROTA.ui.htmlFarol(r)));
}

/* ─── conformidade da base (RC-01…RC-04, RC-09) ────────────────────── */
console.log('\n── conformidade da base e prazos do veículo ──');
{
  let c = null; ROTA.Dados.ler('conformidade', {hoje: R.hojeISO()}, r => { c = r });
  const V = id => c.veiculos.find(x=>x.id===id);
  eq('micro-ônibus doado para radioterapia: incentivo elegível, CNES cumprido', [V('ROTA-02').incentivo.estado, V('ROTA-02').cnes.estado], ['elegivel','cumprido']);
  eq('van doada sem CNES: prazo de 60 dias do recebimento, em atenção', [V('ROTA-01').cnes.estado, V('ROTA-01').cnes.limite, V('ROTA-01').cnes.dias_restantes], ['atencao','2026-10-24',10]);
  eq('ambulância não entra no incentivo (art. 14 p.ú.)', V('ROTA-03').incentivo, {estado:'nao_elegivel', motivo:'classe'});
  eq('base apta', c.base_apta.estado, 'apta');
  ok('o veículo da carga traz o mesmo painel', ROTA.estado().veiculos.find(x=>x.id==='ROTA-01').portaria.cnes.estado==='atencao');
  let vg = null;
  ROTA.Dados.salvarVeiculoPortaria('ROTA-01', {cnesInscritoEm:'2026-10-13', cnesEstabelecimento:'9990001'}, r=>{vg=r});
  eq('registrar o CNES fecha o prazo, e a carga do console acompanha',
     [vg.portaria.cnes.estado, ROTA.estado().veiculos.find(x=>x.id==='ROTA-01').portaria.cnes.estado], ['cumprido','cumprido']);
  ROTA.Dados.salvarVeiculoPortaria('ROTA-01', {cnesInscritoEm:null, cnesEstabelecimento:null});
}
{
  let a = null;
  ROTA.Dados.salvarAgendamento({paciente:4, destino:'teresina', data:'2026-10-14', confirmado:true, etapa:'tratamento', protocolo:'AG-DEMO-0104'}, r=>{a=r});
  eq('confirmar o agendamento torna o paciente elegível na mesma sessão', [a.confirmado, P(4).elegibilidade.status], [true,'elegivel']);
  ROTA.Dados.salvarAgendamento({paciente:4, destino:'teresina', data:'2026-10-14', confirmado:null, etapa:'tratamento', protocolo:null});
  eq('e voltar a "sem resposta" devolve a pendência', P(4).elegibilidade.status, 'pendente');
}

/* ─── pré-BPA-I da demonstração (mesmo código da costura da API) ───── */
console.log('\n── pré-BPA-I da competência (demonstração) ──');
{
  let rel = null, arq = null;
  ROTA.Dados.ler('preBpaI', '2026-10', r => { rel = r });
  ROTA.Dados.ler('preBpaICsv', '2026-10', r => { arq = r });
  const linhas = arq.csv.trim().split('\r\n');
  eq('cabeçalho é o da costura (o mesmo da API)', linhas[0], costura11165.COLUNAS_PRE_BPAI.join(';'));
  eq('uma linha: Maria José na segunda, CNES do estabelecimento do micro-ônibus', [rel.linhas, linhas.length-1], [1,1]);
  const c = linhas[1].split(';'), col = n => c[costura11165.COLUNAS_PRE_BPAI.indexOf(n)];
  eq('procedimento, CNES executante e data', [col('procedimento_sigtap'), col('cnes_estabelecimento_executante'), col('data_deslocamento')],
     ['08.03.01.015-0','9990001','2026-10-12']);
  eq('a coluna do CPF sai vazia (o faturamento do ente completa)', col(costura11165.CABECALHO_CPF), '');
  ok('sem nome de paciente no arquivo', !ROTA.estado().pacientes.some(p=>arq.csv.includes(p.nome)));
  ok('o que ficou de fora vem contado por motivo',
     ['cnes_executante_a_levantar','pendente:RE-07','RE-11:excedente','inelegivel:RE-01'].every(m=>rel.fora.motivos[m]>0), rel.fora.motivos);
  ok('nome do arquivo marca demonstração e competência', /demonstracao.*2026-10\.csv$/.test(arq.nome), arq.nome);
  ok('o motivo vira texto legível', /CNES/.test(R.rotuloMotivo('cnes_executante_a_levantar')) && /RE-07/.test(R.rotuloMotivo('pendente:RE-07')));
}

console.log('\n── custo do período (A4) ──');
const cfg=ROTA.estado().config;
const semana=R.datasDaSemana();
const custo=R.custoPeriodo(semana,1000);
const comb=ROTA.estado().abastecimentos.filter(a=>semana.includes(a.data)).reduce((s,a)=>s+a.valor,0);
ok('a semana tem abastecimento lançado', comb>0, comb);
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

/* ─── textos: 11.164 + 11.165, nunca 11.179; nada nominal no relatório ─ */
console.log('\n── textos e dados pessoais ──');
ok('nenhuma citação à 11.179 no console', !/11[.]?179/.test(html));
{
  const rel = ROTA.ui.paperRelatorio();
  ok('o relatório cita 11.164 e 11.165', /11\.164/.test(rel) && /11\.165/.test(rel));
  ok('o relatório continua sem dado nominal (nem nome, nem CNS)',
     !ROTA.estado().pacientes.some(p=>rel.includes(p.nome) || rel.includes(p.cns)));
}
{
  const ler = (n,a) => { let r=null; ROTA.Dados.ler(n,a,x=>{r=x}); return r };
  const hoje = R.hojeISO(), fp2 = ler('farolProducao',{hoje});
  const telas = [
    ROTA.ui.htmlPainel(fp2),
    ROTA.ui.htmlConformidade({conformidade: ler('conformidade',{hoje}), farol: fp2, distancias: ler('distancias')}),
    ROTA.ui.htmlFaturamento({competencia:'2026-10', relatorio: ler('preBpaI','2026-10'), remessas: ler('remessas'), farol: fp2}),
    ROTA.ui.htmlFichaPaciente(3, ler('agendamentos',{})),
    ROTA.ui.htmlFichaPaciente(2, ler('agendamentos',{}))].join('\n');
  ok('a ficha mostra a pendência legível', /a levantar/i.test(telas));
  ok('os alertas e painéis citam 11.165', /11\.165/.test(telas));
  ok('nenhum campo de CPF em tela', !/<(input|select|textarea)[^>]*cpf/i.test(telas) && !/<label[^>]*>[^<]*cpf/i.test(telas));
  ok('nenhuma ação inline nas telas novas', !/\son[a-z]+=/i.test(telas));
}

console.log('\n'+(falhou?'✗ '+falhou+' falha(s), ':'✓ ')+passou+' asserção(ões) passaram\n');
process.exit(falhou?1:0);
