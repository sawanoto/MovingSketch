(() => {
  'use strict';
  const canvas = document.getElementById('scene'), g = canvas.getContext('2d');
  const phaseLabel = document.getElementById('phase'), guide = document.getElementById('guide');
  const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const rand = (a,b) => a+Math.random()*(b-a);
  let view={s:1,x:0,y:0,d:1}, audio, master, boost=false, resetTime=0, last=performance.now();
  const state={phase:'sealed',tear:0,inventory:[],motes:[],soundStep:0,openStart:0,bite:null,eaten:0,queuedClicks:0,nextSeed:23};
  function newInventory(){return [
    {x:343,y:207,r:47,sx:1,sy:.9,rot:-.3,curve:.6,seed:2},
    {x:429,y:212,r:43,sx:.92,sy:1,rot:.45,curve:.35,seed:5},
    {x:385,y:222,r:52,sx:1.05,sy:.9,rot:.16,curve:.8,seed:7},
    {x:458,y:235,r:41,sx:.9,sy:.83,rot:-.55,curve:.3,seed:11},
    {x:322,y:253,r:42,sx:.85,sy:1.04,rot:.4,curve:.7,seed:13},
    {x:410,y:253,r:48,sx:1,sy:.89,rot:-.1,curve:.5,seed:17},
    {x:370,y:273,r:39,sx:.85,sy:.87,rot:.5,curve:.25,seed:19}
  ]}
  state.inventory=newInventory();
  function refillChip(){
    const slots=[{x:343,y:207},{x:429,y:212},{x:385,y:222},{x:458,y:235},{x:322,y:253},{x:410,y:253},{x:370,y:273}];
    const slot=slots[state.eaten%slots.length],seed=state.nextSeed++;
    state.inventory.unshift({x:slot.x+rand(-7,7),y:slot.y+rand(-4,5),r:rand(39,52),sx:rand(.86,1.07),sy:rand(.84,1.03),rot:rand(-.58,.58),curve:rand(.22,.82),seed});
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);const s=Math.min(r.width/800,r.height/600);view={s,x:(r.width-800*s)/2,y:(r.height-600*s)/2,d};}
  addEventListener('resize',resize);resize();
  function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left-view.x)/view.s,y:(e.clientY-r.top-view.y)/view.s}}
  function initAudio(){if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;audio=new A();master=audio.createGain();master.gain.value=.37;master.connect(audio.destination)}if(audio.state==='suspended')audio.resume()}
  // Each transient is fresh broadband noise. Separate filtered layers make foil, snap, and crumbs distinct.
  function noiseBurst({dur=.08,level=.3,hp=800,lp=11000,pan=0,attack=.002,shape=1}){
    if(!audio)return;const n=Math.max(64,Math.ceil(audio.sampleRate*dur)),buffer=audio.createBuffer(1,n,audio.sampleRate),a=buffer.getChannelData(0);
    let prev=0;for(let i=0;i<n;i++){const white=Math.random()*2-1;prev=.56*prev+.44*white;a[i]=(white*.75+prev*.25)*(1+.2*Math.sin(i*.071*shape))}
    const src=audio.createBufferSource(),hi=audio.createBiquadFilter(),lo=audio.createBiquadFilter(),env=audio.createGain(),p=audio.createStereoPanner(),t=audio.currentTime;
    src.buffer=buffer;src.playbackRate.value=rand(.91,1.11);hi.type='highpass';hi.frequency.value=hp*(boost?1.35:1);lo.type='lowpass';lo.frequency.value=lp;lo.Q.value=boost?.7:.25;
    p.pan.value=clamp(pan+rand(-.13,.13),-1,1);env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(Math.max(.001,level*rand(.85,1.12)),t+attack);env.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(hi).connect(lo).connect(env).connect(p).connect(master);src.start(t);src.stop(t+dur+.01)
  }
  function foil(amount=.4,pan=0){noiseBurst({dur:rand(.035,.085),level:.15+amount*.18,hp:boost?1700:700,lp:boost?14000:7900,pan,shape:2});if(amount>.6)noiseBurst({dur:.035,level:.09,hp:2600,lp:14000,pan})}
  function crack(kind,size=1,speed=.5,curve=.5,pan=0){const pitch=(1.17-size*.22)*(1+curve*.08),strong=clamp(.4+speed*.6);if(kind==='crack'){
      noiseBurst({dur:.042+size*.025,level:(.44+size*.16)*strong,hp:1250*pitch,lp:boost?15000:9500,pan});
      noiseBurst({dur:.09,level:.16*size,hp:330*pitch,lp:2600,pan});
    }else{const count=kind==='crunch'?3:5;for(let i=0;i<count;i++)setTimeout(()=>noiseBurst({dur:rand(.023,.053),level:(kind==='crumble'?.13:.2)*strong*(1-i/count*.45),hp:(kind==='crumble'?1800:1250)*pitch,lp:boost?15500:10000,pan:pan+rand(-.2,.2)}),i*(kind==='crumble'?27:37));if(kind==='crunch')noiseBurst({dur:.07,level:.19*strong,hp:440*pitch,lp:3900,pan})}}
  // Canonical Marpan25D pupil style: three white outlined eyes with centered black pupils.
  function eye(x,y,s=1){g.save();g.translate(x,y);for(let i=-1;i<=1;i++){const side=Math.abs(i),w=(side?21:23)*s,h=w*1.08;g.beginPath();g.ellipse(i*27*s,0,w/2,h/2,0,0,Math.PI*2);g.fillStyle='#fff';g.fill();g.lineWidth=Math.max(2,w*.045);g.strokeStyle='#121212';g.stroke();g.beginPath();g.arc(i*27*s,0,w*.19,0,Math.PI*2);g.fillStyle='#121212';g.fill()}g.restore()}
  function chipPath(r,seed){g.beginPath();for(let i=0;i<=40;i++){const a=i/40*Math.PI*2,ir=r*(1+.065*Math.sin(a*3+seed)+.045*Math.cos(a*7+seed*1.7));const x=Math.cos(a)*ir,y=Math.sin(a)*ir*(1+.055*Math.sin(a*2+seed));if(i===0)g.moveTo(x,y);else g.lineTo(x,y)}g.closePath()}
  function drawChip(c,x,y,scale=1,pressed=0){g.save();g.translate(x,y);g.rotate(c.rot||0);g.scale((c.sx||1)*scale*(1+pressed*.045),(c.sy||1)*scale*(1-pressed*.15));
    g.shadowColor='rgba(84,54,15,.27)';g.shadowBlur=15*scale;g.shadowOffsetY=9*scale;chipPath(c.r,c.seed);const fill=g.createRadialGradient(-c.r*.32,-c.r*.42,c.r*.08,0,0,c.r*1.18);fill.addColorStop(0,'#fff0ad');fill.addColorStop(.48,'#f5d56f');fill.addColorStop(.83,'#dcaa49');fill.addColorStop(1,'#a86b2a');g.fillStyle=fill;g.fill();g.shadowColor='transparent';g.lineWidth=2;g.strokeStyle='#bb863c';g.stroke();
    g.save();chipPath(c.r*.96,c.seed);g.clip();for(let i=0;i<15;i++){const a=i*2.4+c.seed,v=c.r*(.2+.72*((i*7%13)/13));g.beginPath();g.ellipse(Math.cos(a)*v,Math.sin(a)*v*.83,1+((i*3+c.seed)%5)*.5,1+((i*7+c.seed)%4)*.37,a,0,Math.PI*2);g.fillStyle=i%3?'rgba(165,93,25,.22)':'rgba(255,250,188,.6)';g.fill()}g.strokeStyle='rgba(255,248,186,.62)';g.lineWidth=3;g.beginPath();g.moveTo(-c.r*.72,c.r*.24);g.quadraticCurveTo(0,-c.r*(.12+c.curve*.24),c.r*.68,-c.r*.17);g.stroke();g.restore();g.restore()}
  function bagBody(){const open=state.tear>=.999,t=state.tear,spread=open?24:Math.max(0,t-.2)*18;
    g.save();g.shadowColor='rgba(86,61,32,.22)';g.shadowBlur=25;g.shadowOffsetY=18;g.beginPath();g.moveTo(254-spread,154);g.quadraticCurveTo(245,265,258,480);g.quadraticCurveTo(400,512,542,480);g.quadraticCurveTo(555,265,546+spread,154);g.closePath();const f=g.createLinearGradient(254,0,546,0);f.addColorStop(0,'#ad4027');f.addColorStop(.16,'#eb7241');f.addColorStop(.47,'#df572e');f.addColorStop(.78,'#c94b2b');f.addColorStop(1,'#8c2e22');g.fillStyle=f;g.fill();g.restore();
    g.save();g.beginPath();g.moveTo(262,173);g.lineTo(538,173);g.lineTo(536,477);g.quadraticCurveTo(400,498,264,477);g.closePath();g.clip();g.fillStyle='rgba(255,211,119,.1)';for(let i=0;i<8;i++){g.beginPath();g.moveTo(260+i*41,180);g.bezierCurveTo(274+i*38,240,250+i*49,380,277+i*38,470);g.lineWidth=i%2?2:5;g.strokeStyle=i%2?'rgba(255,224,161,.22)':'rgba(84,26,16,.13)';g.stroke()}g.restore();
    g.fillStyle='#f8df9b';g.font='700 14px Arial';g.letterSpacing='4px';g.textAlign='center';g.fillText('GOLDEN CRISP',400,352);g.font='700 39px Arial';g.letterSpacing='-2px';g.fillText('POTATO',400,397);g.fillText('CHIPS',400,435);eye(400,286,1.05);
    g.beginPath();g.moveTo(269,457);g.quadraticCurveTo(400,475,531,457);g.strokeStyle='rgba(255,200,134,.34)';g.lineWidth=3;g.stroke();
  }
  function bagTop(){const t=state.tear,p=0,open=t>=.999;if(t>0){g.beginPath();g.moveTo(267,169);for(let i=0;i<=18;i++){const x=267+i*14.8,y=168+(i%3===0?5:i%2===0?-3:2)*t;g.lineTo(x,y)}g.lineTo(533,184);g.quadraticCurveTo(400,213+20*t,267,184);g.closePath();g.fillStyle='#39241e';g.fill()}
    if(t>.05){g.save();g.beginPath();g.moveTo(277,167);g.quadraticCurveTo(400,179+34*t,523,167);g.lineTo(523,167+121*t);g.lineTo(277,167+121*t);g.closePath();g.clip();state.inventory.forEach(c=>drawChip(c,c.x,c.y,.78));g.restore()}
    if(!open){const progress=clamp((t-.04)/.96),edge=progress*266,stretch=Math.min(p*.2,25);g.save();g.beginPath();g.moveTo(254-stretch,154);g.lineTo(546+stretch,154);g.lineTo(539+stretch,184);for(let x=539;x>254+edge;x-=15)g.lineTo(x,179+(Math.floor(x/15)%2?2:-2));g.lineTo(254+edge,180);g.lineTo(254-stretch,184);g.closePath();const f=g.createLinearGradient(254,151,546,184);f.addColorStop(0,'#f6945b');f.addColorStop(.5,'#e46b3f');f.addColorStop(1,'#ac3928');g.fillStyle=f;g.fill();g.strokeStyle='#a93f29';g.lineWidth=2;g.stroke();g.restore();g.fillStyle='rgba(255,233,174,.65)';g.fillRect(265,163,270*(1-progress),2)}else{
      g.fillStyle='#e67948';g.beginPath();g.moveTo(255,151);g.quadraticCurveTo(298,162,341,169);g.lineTo(312,187);g.quadraticCurveTo(279,178,249,164);g.fill();g.beginPath();g.moveTo(545,151);g.quadraticCurveTo(502,162,459,169);g.lineTo(488,187);g.quadraticCurveTo(521,178,551,164);g.fill()}
  }
  function draw(){g.setTransform(view.d,0,0,view.d,0,0);g.clearRect(0,0,canvas.width/view.d,canvas.height/view.d);g.setTransform(view.d*view.s,0,0,view.d*view.s,view.d*view.x,view.d*view.y);
    g.beginPath();g.ellipse(400,524,170,20,0,0,Math.PI*2);g.fillStyle='rgba(90,67,35,.1)';g.fill();bagBody();bagTop();
    if(state.bite){g.save();g.globalAlpha=clamp(state.bite.life/.36);drawChip(state.bite.chip,400,195-(.36-state.bite.life)*65,.8+(.36-state.bite.life)*.5);g.restore()}
    if(state.eaten){const crumbLevel=Math.min(state.eaten,8),crumbCount=Math.min(state.eaten*9,72);g.save();g.beginPath();g.moveTo(345,481);g.quadraticCurveTo(400,477-crumbLevel*1.4,455,481);g.quadraticCurveTo(400,488,345,481);g.fillStyle='#d8a450';g.fill();for(let i=0;i<crumbCount;i++){const x=350+(i*79%101),y=478+(i*37%8);g.fillStyle=i%3?'#f2cf74':'#b47835';g.fillRect(x,y,2+i%3,1+i%2)}g.restore()}for(const m of state.motes){g.save();g.globalAlpha=clamp(m.life);g.translate(m.x,m.y);g.rotate(m.rot);g.fillStyle=m.dark?'#bb8136':'#f5d279';g.fillRect(-m.r/2,-m.r/2,m.r,m.r*.55);g.restore()}
  }
  function dust(x,y,n){for(let i=0;i<n;i++)state.motes.push({x,y,r:rand(2,6),vx:rand(-90,90),vy:rand(-115,-30),rot:rand(0,6),vr:rand(-4,4),life:rand(.7,1.3),dark:i%3===0})}
  function updateText(){const p=state.phase;phaseLabel.textContent=p==='sealed'||p==='opening'?'01 / OPEN THE BAG':'02 / INFINITE CHIPS';guide.innerHTML=p==='sealed'?'袋をクリックして開ける <span>↓</span>':p==='opening'?'バリバリ…… <span>↓</span>':'クリックするたび、チップスが出てくる <span>∞</span>';guide.style.opacity=1}
  function eat(){const chip=state.inventory.pop();if(!chip)return;state.eaten++;state.bite={chip,life:.36};const size=chip.r/50,pan=(chip.x-400)/170;crack('crack',size,.9,chip.curve,pan);setTimeout(()=>crack('crunch',size,.75,chip.curve,pan),65);setTimeout(()=>crack('crumble',size,.65,chip.curve,pan),155);dust(chip.x,210,Math.min(6+state.eaten,14));refillChip();updateText()}
  canvas.addEventListener('pointerdown',e=>{if(resetTime)return;const p=point(e);if(p.x<245||p.x>555||p.y<145||p.y>505)return;initAudio();if(state.phase==='sealed'){state.phase='opening';state.openStart=performance.now();state.tear=.01;foil(.7);updateText()}else if(state.phase==='opening'){state.queuedClicks=Math.min(7,state.queuedClicks+1)}else if(state.phase==='opened')eat()});
  function startReset(){if(state.phase==='sealed'||resetTime)return;resetTime=performance.now()}
  document.getElementById('reset').addEventListener('click',startReset);
  for(const id of ['normal','boost'])document.getElementById(id).addEventListener('click',()=>{boost=id==='boost';for(const key of ['normal','boost']){const b=document.getElementById(key),on=key===id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))}});
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(state.phase==='opening'&&!resetTime){state.tear=clamp((now-state.openStart)/690);const steps=Math.floor(state.tear*13);while(state.soundStep<steps){state.soundStep++;foil(.25+state.soundStep/13*.5,(state.soundStep/13-.5)*.7)}if(state.tear>=1){state.phase='opened';updateText();const queued=state.queuedClicks;state.queuedClicks=0;for(let i=0;i<queued;i++)setTimeout(()=>{if(state.phase==='opened')eat()},i*230)}}
    if(resetTime){const t=clamp((now-resetTime)/800);if(t<.45){state.bite=null;state.motes.length=0;state.eaten=Math.round(lerp(state.eaten,0,dt*8))}else{state.eaten=0;state.tear=1-(t-.45)/.55}if(t>=1){state.phase='sealed';state.tear=0;state.soundStep=0;state.queuedClicks=0;state.inventory=newInventory();state.eaten=0;resetTime=0;updateText()}}
    if(state.bite){state.bite.life-=dt;if(state.bite.life<=0)state.bite=null}
    for(const m of state.motes){m.vy+=240*dt;m.x+=m.vx*dt;m.y+=m.vy*dt;m.rot+=m.vr*dt;m.life-=dt;if(m.y>494){m.y=494;m.vy=0;m.vx*=.8}}state.motes=state.motes.filter(m=>m.life>0);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
