(() => {
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  const book = document.getElementById('book');
  const words = document.getElementById('words');
  const live = document.getElementById('live');
  const titles = ['マーパン　キラキラ', 'マーパン　キラキラキラ', 'マーパン　キラッキラッキラー', 'マーパン　キラリキラリキラリ'];
  // Stellar color follows approximate temperature: blue-white, white, yellow, orange, red.
  const palette = [[210,227,255], [246,249,255], [255,247,220], [255,216,175], [255,178,164]];
  const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77];
  // Constellation landmarks follow shared/marpan-25d.js: a low rounded body,
  // three eyes across its center, and no mouth. Only stars and lines are drawn.
  const points = [
    [.17,.51],[.18,.43],[.22,.36],[.29,.31],[.37,.28],[.45,.27],[.53,.28],[.61,.31],[.68,.36],[.72,.43],
    [.73,.51],[.70,.58],[.63,.63],[.54,.66],[.45,.67],[.36,.66],[.27,.63],[.20,.58],
    [.28,.43],[.31,.39],[.34,.43],[.31,.48],
    [.41,.43],[.44,.39],[.47,.43],[.44,.48],
    [.54,.43],[.57,.39],[.60,.43],[.57,.48]
  ];
  const paths = [
    [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,0],
    [18,19,20,21,18], [22,23,24,25,22], [26,27,28,29,26]
  ];
  let ambient = [];
  let width = 0, height = 0, dpr = 1;
  let page = 0, pageStart = performance.now(), audio = null, lastSound = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a=0, b=1) => Math.max(a, Math.min(b, x));
  const smooth = x => { x=clamp(x); return x*x*(3-2*x); };
  const mix = (a,b,t) => a+(b-a)*t;
  const color = (a,b,t) => a.map((v,i) => Math.round(mix(v,b[i],t)));
  const rgba = (c,a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function random(i) { let x = Math.sin(i*127.1+88.83)*43758.5453; return x-Math.floor(x); }
  function resize() {
    width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ambient = Array.from({length: Math.min(240, Math.round(width*height/3500))}, (_,i) => ({x:random(i+1),y:random(i+401),r:.45+random(i+801)*1.25,p:random(i+1201)*6.28}));
  }
  function position(p) {
    const size = Math.min(width*.88, height*.99, 770);
    return {x: width/2+(p[0]-.445)*size, y: height*.46+(p[1]-.47)*size};
  }
  function background(t) {
    const dawn = page===3 ? (reduced ? 1 : smooth(t/5000)) : 0;
    const stops = [[1,2,8],[8,14,31],[35,60,96],[103,158,194],[188,225,237]];
    const z=dawn*(stops.length-1), k=Math.min(stops.length-2,Math.floor(z));
    const top=color(stops[k],stops[k+1],z-k);
    const bottom=color(top,[238,236,220],dawn*.5);
    const gradient=ctx.createLinearGradient(0,0,0,height);
    gradient.addColorStop(0,rgba(top,1)); gradient.addColorStop(1,rgba(bottom,1));
    ctx.fillStyle=gradient; ctx.fillRect(0,0,width,height);
    return dawn;
  }
  function sparkle(i, now) {
    // Slow, irregular atmospheric scintillation rather than synchronized pulsing.
    const shift=i*13.731;
    const slow=Math.sin(now*.00073+shift)*.16;
    const medium=Math.sin(now*.00161+shift*1.7)*.105;
    const small=Math.sin(now*.00317+shift*2.3)*.045;
    const dip=Math.pow(Math.max(0,Math.sin(now*.00037+shift*3.1)),12)*.13;
    return clamp(.76+slow+medium+small-dip,.34,1);
  }
  function shootingStars(elapsed) {
    if (page!==1) return;
    const events=[
      {at:350,y:.12,dy:.09},
      {at:2350,y:.20,dy:.06},
      {at:4350,y:.08,dy:.11}
    ];
    events.forEach(e => {
      const t=(elapsed-e.at)/1700;
      if (t<0||t>1) return;
      const a=Math.min(1,Math.sin(Math.PI*t)*1.8);
      const x=(-.18+1.36*t)*width, y=(e.y+e.dy*t)*height;
      const tail=Math.min(width*.31,300);
      const angle=Math.atan2(e.dy*height,1.36*width);
      const gradient=ctx.createLinearGradient(x-Math.cos(angle)*tail,y-Math.sin(angle)*tail,x,y);
      gradient.addColorStop(0,rgba([225,239,255],0)); gradient.addColorStop(.6,rgba([210,231,255],a*.3)); gradient.addColorStop(1,rgba([255,255,255],a));
      ctx.strokeStyle=gradient; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath();
      ctx.moveTo(x-Math.cos(angle)*tail,y-Math.sin(angle)*tail); ctx.lineTo(x,y); ctx.stroke();
      ctx.strokeStyle=gradient; ctx.lineWidth=1.6; ctx.stroke();
      const halo=ctx.createRadialGradient(x,y,0,x,y,23);
      halo.addColorStop(0,rgba([255,255,255],a*.8)); halo.addColorStop(1,rgba([202,228,255],0));
      ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(x,y,23,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=rgba([255,255,255],a); ctx.beginPath(); ctx.arc(x,y,3.2,0,Math.PI*2); ctx.fill();
    });
  }
  function draw(now) {
    const elapsed=now-pageStart;
    const dawn=background(elapsed);
    const fade=page===3 ? 1-smooth((dawn-.08)/.82)*.975 : 1;
    const coloring=page>=2 ? smooth(elapsed/1100) : 0;
    ambient.forEach(s => {
      const a=(.20+.22*(.5+.5*Math.sin(now*.0005+s.p)))*(1-dawn*.99);
      ctx.fillStyle=rgba([235,243,255],a);
      ctx.beginPath(); ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2); ctx.fill();
    });
    paths.forEach((path,index) => {
      ctx.beginPath(); path.forEach((id,j) => { const p=position(points[id]); j ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y); });
      const tint=palette[index%palette.length];
      ctx.strokeStyle=rgba(color([179,207,236],tint,coloring*.18),.18*fade);
      ctx.lineWidth=.7; ctx.lineJoin='round'; ctx.stroke();
    });
    points.forEach((p,i) => {
      const pos=position(p);
      const shimmer=sparkle(i,now);
      const pulse=page>=2 ? .5+.5*Math.sin(now*.0024+i*1.83) : 0;
      const light=page>=2 ? clamp(.23+shimmer*.24+Math.pow(pulse,3)*.75,.2,1) : shimmer;
      const tint=color([248,250,255],palette[Math.floor(random(i+201)*palette.length)],coloring);
      const gleam=page>=2 ? Math.pow(pulse,7) : 0;
      const r=(i>=18 ? 2.85 : 2.35)*(1+gleam*.35)*Math.min(1.2,Math.max(.78,width/600));
      const spread=r*(page>=2 ? 10+gleam*4 : 7);
      const glow=ctx.createRadialGradient(pos.x,pos.y,0,pos.x,pos.y,spread);
      glow.addColorStop(0,rgba(tint,(.52+gleam*.34)*light*fade)); glow.addColorStop(.2,rgba(tint,(.18+gleam*.12)*light*fade)); glow.addColorStop(1,rgba(tint,0));
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(pos.x,pos.y,spread,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=rgba(tint,.95*light*fade);
      ctx.beginPath(); ctx.arc(pos.x,pos.y,r,0,Math.PI*2); ctx.fill();
      if (gleam>.15) {
        ctx.strokeStyle=rgba(tint,gleam*.45*fade); ctx.lineWidth=.7;
        ctx.beginPath(); ctx.moveTo(pos.x-r*3,pos.y); ctx.lineTo(pos.x+r*3,pos.y);
        ctx.moveTo(pos.x,pos.y-r*3); ctx.lineTo(pos.x,pos.y+r*3); ctx.stroke();
      }
    });
    shootingStars(elapsed);
    if (page===3) {
      const ink=color([247,245,236],[70,106,130],smooth((dawn-.28)/.6));
      words.style.color=rgba(ink,1);
      words.style.textShadow=`0 2px 22px rgba(11,24,49,${.7*(1-dawn)})`;
    }
    maybeSound(now,dawn);
    requestAnimationFrame(draw);
  }
  function maybeSound(now,dawn) {
    if (!audio || page<1 || reduced || (page===3 && dawn>.78)) return;
    const interval=page===1 ? 1450 : page===2 ? 1000 : 1200+dawn*7000;
    if (now-lastSound<interval) return;
    lastSound=now;
    const index=Math.floor(now/interval)%notes.length;
    const osc=audio.createOscillator(), gain=audio.createGain();
    const at=audio.currentTime, duration=.34;
    osc.type='sine'; osc.frequency.value=notes[index];
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.022*(1-dawn),at+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain).connect(audio.destination); osc.start(at); osc.stop(at+duration+.02);
  }
  function next() {
    if (!audio && (window.AudioContext || window.webkitAudioContext)) audio=new (window.AudioContext || window.webkitAudioContext)();
    if (audio?.state==='suspended') audio.resume();
    page=(page+1)%4; pageStart=performance.now(); lastSound=pageStart;
    words.textContent=titles[page];
    words.style.color='#f7f5ec'; words.style.textShadow='0 2px 22px rgba(11,24,49,.7)';
    live.textContent=`${page+1}ページ目。${titles[page]}${page===3?'。もう一度タップすると最初に戻ります。':''}`;
  }
  book.addEventListener('pointerup', next);
  book.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); next(); } });
  addEventListener('resize', resize); resize(); requestAnimationFrame(draw);
})();
