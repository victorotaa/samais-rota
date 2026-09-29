import json
D=json.load(open('dur.json')); d=lambda k:D[k]['d']
# cena: (id, falas, pre, gap, pos, minimo, planos)   plano = (fonte, tipo, gerado)
CENAS=[
 ('s0',['n00'],1.0,0,.9,0,[('aereo_noite','v',1),('onibus_A','v',1)]),
 ('s1',['n01'],.5,0,.7,0,[('frota','foto',0),('onibus_B','v',1)]),
 ('s2',['n02'],.4,0,.6,0,[('praca_igreja','v',1),('rua_arborizada','v',1)]),
 ('s3',['n03a','n03b'],.9,.7,.6,0,[('frota','estatica',0)]),
 ('s4',['n04'],.5,0,.9,0,[('reg_mesa','v',1),('reg_alerta','v',1)]),
 ('s5',['n05'],.5,0,.9,0,[('saida_base','v',1),('estrada','v',1)]),
 ('s6',['n06a','n06b'],.6,.5,1.3,13.0,[('app','app',0)]),
 ('s7',['n07a','n07b','n07c'],.5,.7,.9,0,[('recebidos','v',1),('maos','v',1),('reencontro','v',1)]),
 ('s8',[],0,0,0,4.5,[('preto','preto',0)]),
]
t=0; cenas=[]; marcas={}; planos=[]; gerado=[]
for cid,falas,pre,gap,pos,mn,pl in CENAS:
    a=t; x=a+pre
    for i,f in enumerate(falas):
        marcas[f]=round(x,3); x+=d(f)+(gap if i<len(falas)-1 else 0)
    b=max(x+pos, a+mn); b=round(b,3)
    cenas.append({'id':cid,'a':round(a,3),'b':b})
    # divide a cena entre os planos; a foto da s1 fica com 40%
    n=len(pl); dur=b-a
    pesos=[.4,.6] if cid=='s1' else [1/n]*n
    ca=a
    for (src,tp,g),w in zip(pl,pesos):
        dd=round(dur*w,3); planos.append({'src':src,'tipo':tp,'a':round(ca,3),'d':dd})
        if g: gerado.append([round(ca,3),round(ca+dd,3)])
        ca+=dd
    t=b
T={'cenas':cenas,'marcas':marcas,'gerado':gerado,'fim':round(t,3)}
open('timeline.js','w').write('window.T='+json.dumps(T)+';')
json.dump({'planos':planos,'marcas':marcas,'cenas':cenas,'fim':T['fim']},open('plano.json','w'),indent=1)
for c in cenas: print(f"{c['id']}  {c['a']:6.2f} → {c['b']:6.2f}   ({c['b']-c['a']:5.2f}s)")
print('duração total:',T['fim'],'s')
for p in planos: print(f"   {p['src']:14s} {p['tipo']:8s} @{p['a']:6.2f}  {p['d']:5.2f}s")
