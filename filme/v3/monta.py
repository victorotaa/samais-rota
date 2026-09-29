import json,subprocess as sp,os
P=json.load(open('plano.json')); DUR=json.load(open('dur.json'))
def run(a): sp.run(a,check=True,stdout=sp.DEVNULL,stderr=sp.PIPE)
GR="eq=brightness=-0.06:saturation=0.84:contrast=1.04,vignette=angle=PI/4.6"
os.makedirs('seg',exist_ok=True); lst=[]
for i,p in enumerate(P['planos']):
    o=f'seg/{i:02d}.mp4'; d=p['d']; src=p['src']; tp=p['tipo']
    base=['ffmpeg','-y','-v','error']; enc=['-an','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p','-r','30',o]
    if tp=='v':
        cd=DUR[src]['d']; ss=max(0,(cd-d)/2) if cd>=d else 0; st=(f'setpts=PTS*{d/cd:.4f},' if cd<d else '')
        run(base+['-ss',f'{ss:.3f}','-i',f'clip/{src}.mp4','-t',f'{d:.3f}','-vf',
            f'{st}scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,{GR}']+enc)
    elif tp in('foto','estatica'):
        z="1+0.08*on/%d"%int(d*30) if tp=='foto' else "1.03"
        run(base+['-loop','1','-framerate','30','-i','img/frota.jpg','-t',f'{d:.3f}','-vf',
            f"scale=2400:-2,zoompan=z='{z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,{GR}"]+enc)
    else:
        run(base+['-f','lavfi','-i',f'color=c=0x0A0A0A:s=1920x1080:r=30','-t',f'{d:.3f}']+enc)
    lst.append(f"file '{o}'")
open('seg/l.txt','w').write('\n'.join(lst))
run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i','seg/l.txt','-c','copy','bed.mp4'])
run(['ffmpeg','-y','-v','error','-i','bed.mp4','-framerate','30','-i','ov/%05d.png','-filter_complex','[0][1]overlay=format=auto:shortest=1',
     '-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-r','30','comp.mp4'])
# ---- áudio: voz nas marcas + efeitos sintetizados ----
M=P['marcas']; C={c['id']:c for c in P['cenas']}; F=P['fim']
def sfx(n,f): run(['ffmpeg','-y','-v','error','-f','lavfi','-i',f,'-ac','2','-ar','48000',f'{n}.wav'])
sfx('cama',f'sine=frequency=52:duration={F},volume=0.14,tremolo=f=0.12:d=0.35,highpass=f=28,lowpass=f=220')
sfx('drone','sine=frequency=44:duration=7,afade=t=in:st=0:d=3.4,afade=t=out:st=5.2:d=1.8,volume=0.32')
sfx('clique','anoisesrc=d=0.09:c=pink:a=0.5,highpass=f=1700,lowpass=f=7000,afade=t=out:st=0.012:d=0.078,volume=0.42')
sfx('whoosh','anoisesrc=d=0.75:c=brown:a=0.6,highpass=f=180,lowpass=f=2600,afade=t=in:st=0:d=0.42,afade=t=out:st=0.44:d=0.31,volume=0.36')
sfx('impacto','sine=frequency=58:duration=1.5,afade=t=out:st=0.06:d=1.4,volume=0.62')
ins=[];fl=[];lab=[]
def add(f,at,v=1.0):
    k=len(ins)//2; ins.extend(['-i',f]); ms=int(at*1000); fl.append(f'[{k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={v},adelay={ms}|{ms}[a{k}]'); lab.append(f'[a{k}]')
s3=M['n03a']; ins.extend(['-i','cama.wav']); fl.append(f"[0:a]volume=enable='between(t,{s3-0.55:.2f},{s3:.2f})':volume=0[a0]"); lab.append('[a0]')
add('drone.wav',0)
for k,t in M.items(): add(f'narr/{k}.mp3',t,1.0)
add('impacto.wav',s3); add('whoosh.wav',C['s4']['a']); add('whoosh.wav',C['s7']['a'])
for p in P['planos'][1:]: add('clique.wav',p['a'])
s6=C['s6']; sc=(s6['b']-s6['a'])/13
for x in (3.0,5.6,8.8,11.0): add('clique.wav',s6['a']+x*sc-0.05,0.8)
n=len(lab)
fl.append(''.join(lab)+f'amix=inputs={n}:duration=longest:dropout_transition=0,volume={n*0.55:.2f},loudnorm=I=-16:TP=-1.5:LRA=9,afade=t=out:st={F-1.4:.2f}:d=1.4,atrim=0:{F}[mix]')
run(['ffmpeg','-y','-v','error']+ins+['-filter_complex',';'.join(fl),'-map','[mix]','-c:a','aac','-b:a','192k','-ar','48000','audio.m4a'])
run(['ffmpeg','-y','-v','error','-i','comp.mp4','-i','audio.m4a','-map','0:v','-map','1:a','-c:v','copy','-c:a','copy','-shortest','-movflags','+faststart','rota-filme.mp4'])
print(sp.run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,channels','-of','compact','rota-filme.mp4'],capture_output=True,text=True).stdout)
bd=sp.run(['ffmpeg','-v','info','-i','rota-filme.mp4','-vf','blackdetect=d=0.4:pix_th=0.06','-an','-f','null','-'],capture_output=True,text=True).stderr
print('\n'.join(l for l in bd.splitlines() if 'black_start' in l) or 'sem trechos pretos inesperados')
