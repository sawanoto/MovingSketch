const HOLD_MS=2200,MAX_BLOBS=16,DEBUG=new URLSearchParams(location.search).has("debug");
let blobs=[],particles=[],trail=[],fade=[],phase="idle",phaseAt=0,lastAngle=0,pointerId=null,totalCuts=0;
let marpan,soundOn=true,audio=null,mergePlayed=false,stage,canvasElement,hint,soundButton,debugPanel,baseW;

function setup(){stage=select("#stage").elt;const r=stage.getBoundingClientRect(),c=createCanvas(r.width,r.height);c.parent("canvasHost");canvasElement=c.elt;pixelDensity(min(devicePixelRatio||1,2));marpan=new Marpan25D({id:"marpan-cutter",expression:"pupil",autoBlink:true});marpan.enableAutoBlink(2300,4300);hint=select("#hint").elt;soundButton=select("#sound").elt;debugPanel=select("#debug").elt;soundButton.addEventListener("click",toggleSound);canvasElement.style.touchAction="none";resetMarpan()}
function makeBlob(x,y,w,seed=random(20)){return{x,y,fromX:x,fromY:y,tx:x,ty:y,w,seed,born:millis()}}
function resetMarpan(){baseW=min(width*.54,height*.62,390);blobs=[makeBlob(width/2,height/2,baseW,1.7)];phase="idle";particles=[]}
function draw(){background("#eeeae3");noStroke();for(let i=7;i;i--){fill(255,252,246,10);ellipse(width/2,height*.46,max(width,height)*i/3.4)}updateState();blobs.forEach(drawMarpan);drawParticles();drawTrail();drawDebug()}

function drawMarpan(b){const age=millis()-b.born,w=exp(-age/720)*sin(age*.036+b.seed);let sx=1+w*.1,sy=1-w*.07;if(phase==="fuse"){const t=constrain((millis()-phaseAt)/330,0,1);sx+=sin(t*PI)*.16;sy-=sin(t*PI)*.1}noStroke();fill(55,49,40,22);ellipse(b.x,b.y+b.w*.35,b.w*.58*sx,max(5,b.w*.045));marpan.drawAt(b.x,b.y+sin(millis()*.004+b.seed)*2,{bodyWidth:b.w,bodyHeight:b.w*.68,scaleX:sx,scaleY:sy,pulse:.025*sin(millis()*.004+b.seed),lookX:b.x,lookY:b.y,eyeScale:b.w<70?.82:1})}
function updateState(){const now=millis();if(phase==="split"){const t=constrain((now-phaseAt)/310,0,1),e=back(t);for(const b of blobs){b.x=lerp(b.fromX,b.tx,e);b.y=lerp(b.fromY,b.ty,e)}if(now-phaseAt>HOLD_MS)beginMerge()}else if(phase==="merge"){const t=constrain((now-phaseAt)/610,0,1),e=ease(t);blobs.forEach((b,i)=>{b.x=lerp(b.fromX,width/2,e)+sin(t*PI)*(1-t)*10*(i%2?1:-1);b.y=lerp(b.fromY,height/2,e)});if(t>.65&&!mergePlayed){mergePlayed=true;playChord()}if(t>=1){blobs=[makeBlob(width/2,height/2,baseW,1.7)];phase="fuse";phaseAt=now}}else if(phase==="fuse"&&now-phaseAt>330)phase="idle";particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.04;p.life-=.018});particles=particles.filter(p=>p.life>0)}
function beginMerge(){phase="merge";phaseAt=millis();mergePlayed=false;blobs.forEach(b=>{b.fromX=b.x;b.fromY=b.y})}

function point(e){const r=stage.getBoundingClientRect();return{x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height}}
function beginInput(e,id){pointerId=id;trail=[point(e)];fade=[]}
function moveInput(e,id){if(pointerId!==id)return;const p=point(e),q=trail[trail.length-1];if(!q||dist(p.x,p.y,q.x,q.y)>3)trail.push(p);if(trail.length>42)trail.shift()}
function endInput(e,id){if(pointerId!==id)return;trail.push(point(e));fade=trail.map(p=>({...p}));tryCut(trail);trail=[];pointerId=null}
function cancelInput(){trail=[];pointerId=null}
function mouseDown(e){if(e.target===soundButton||e.button!==0)return;e.preventDefault();beginInput(e,"mouse")}
function mouseMove(e){if(pointerId!=="mouse")return;e.preventDefault();moveInput(e,"mouse")}
function mouseUp(e){if(pointerId!=="mouse")return;e.preventDefault();endInput(e,"mouse")}
function touchDown(e){if(pointerId!==null||!e.changedTouches.length)return;e.preventDefault();const t=e.changedTouches[0];beginInput(t,t.identifier)}
function touchMove(e){if(pointerId===null)return;const t=[...e.changedTouches].find(v=>v.identifier===pointerId);if(!t)return;e.preventDefault();moveInput(t,t.identifier)}
function touchUp(e){if(pointerId===null)return;const t=[...e.changedTouches].find(v=>v.identifier===pointerId);if(!t)return;e.preventDefault();endInput(t,t.identifier)}

// Use p5's own input lifecycle so rendering and interaction share one canvas.
function p5Point(){return{x:mouseX,y:mouseY}}
function mousePressed(){pointerId="p5-mouse";trail=[p5Point()];fade=[];return false}
function mouseDragged(){if(pointerId!=="p5-mouse")return false;const p=p5Point(),q=trail[trail.length-1];if(!q||dist(p.x,p.y,q.x,q.y)>3)trail.push(p);if(trail.length>42)trail.shift();return false}
function mouseReleased(){if(pointerId!=="p5-mouse")return false;trail.push(p5Point());fade=trail.map(p=>({...p}));tryCut(trail);trail=[];pointerId=null;return false}
function touchStarted(){pointerId="p5-touch";trail=[p5Point()];fade=[];return false}
function touchMoved(){if(pointerId!=="p5-touch")return false;const p=p5Point(),q=trail[trail.length-1];if(!q||dist(p.x,p.y,q.x,q.y)>3)trail.push(p);if(trail.length>42)trail.shift();return false}
function touchEnded(){if(pointerId!=="p5-touch")return false;trail.push(p5Point());fade=trail.map(p=>({...p}));tryCut(trail);trail=[];pointerId=null;return false}
function tryCut(ps){if(ps.length<2||phase==="merge"||blobs.length>=MAX_BLOBS)return;const a=ps[0],z=ps[ps.length-1];if(dist(a.x,a.y,z.x,z.y)<28)return;const hits=[];for(let b=0;b<blobs.length;b++){for(let i=1;i<ps.length;i++)if(segmentHit(ps[i-1],ps[i],blobs[b])){hits.push(b);break}}if(!hits.length)return;hint.classList.add("used");lastAngle=atan2(z.y-a.y,z.x-a.x);splitBlobs(hits.slice(0,MAX_BLOBS-blobs.length),lastAngle)}
function segmentHit(a,z,b){const rx=b.w*.5,ry=b.w*.34,dx=z.x-a.x,dy=z.y-a.y,ax=a.x-b.x,ay=a.y-b.y,A=dx*dx/(rx*rx)+dy*dy/(ry*ry),B=2*(ax*dx/(rx*rx)+ay*dy/(ry*ry)),C=ax*ax/(rx*rx)+ay*ay/(ry*ry)-1;if(C<=0)return true;const d=B*B-4*A*C;if(d<0||!A)return false;const s=sqrt(d),t1=(-B-s)/(2*A),t2=(-B+s)/(2*A);return(t1>=0&&t1<=1)||(t2>=0&&t2<=1)}
function splitBlobs(indices,a){if(!indices.length)return;const hitSet=new Set(indices),nx=-sin(a),ny=cos(a);blobs.forEach((b,i)=>{if(!hitSet.has(i)){b.fromX=b.x;b.fromY=b.y;b.tx=b.x;b.ty=b.y}});for(const i of [...indices].sort((a,b)=>b-a)){const p=blobs[i],w=p.w*(blobs.length===1?.7:.72),g=max(10,w*.58),A=makeBlob(p.x,p.y,w,p.seed+.8),B=makeBlob(p.x,p.y,w,p.seed+2.2);A.tx=p.x+nx*g;A.ty=p.y+ny*g;B.tx=p.x-nx*g;B.ty=p.y-ny*g;blobs.splice(i,1,A,B);burst(p.x,p.y,indices.length>1)}totalCuts+=indices.length;phase="split";phaseAt=millis();tone(indices.length>1?392:blobs.length>2?329.63:261.63,.12,indices.length>1?.065:.05)}
function burst(x,y,special){for(let i=0;i<(special?12:7);i++){const a=random(TWO_PI),v=random(1.3,3.2);particles.push({x,y,vx:cos(a)*v,vy:sin(a)*v-.4,life:1,note:special&&i%4===0})}}

function drawParticles(){textAlign(CENTER,CENTER);noStroke();for(const p of particles){fill(p.note?color(130,115,198,255*p.life):color(255,255,255,255*p.life));if(p.note){textSize(20);text("♪",p.x,p.y)}else circle(p.x,p.y,6)}}
function drawTrail(){if(trail.length>1)renderTrail(trail,230);if(fade.length>1){renderTrail(fade,150);fade.shift()}}
function renderTrail(ps,a){noFill();stroke(255,a);strokeWeight(3);strokeCap(ROUND);strokeJoin(ROUND);drawingContext.shadowColor="rgba(137,120,220,.7)";drawingContext.shadowBlur=12;beginShape();ps.forEach(p=>vertex(p.x,p.y));endShape();drawingContext.shadowBlur=0}
function drawDebug(){if(!DEBUG)return;debugPanel.hidden=false;debugPanel.innerHTML=`個体数: ${blobs.length}<br>状態: ${phase}<br>成功回数: ${totalCuts}<br>角度: ${round(degrees(lastAngle))}°<br>ダブル受付: ${phase==="split"?max(0,round(HOLD_MS-(millis()-phaseAt))):0} ms`}

function toggleSound(){soundOn=!soundOn;soundButton.textContent=soundOn?"♪ ON":"♪ OFF";soundButton.setAttribute("aria-pressed",soundOn);if(soundOn)tone(392,.08,.025)}
function ensureAudio(){if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume()}
function tone(freq,dur,vol,delay=0){if(!soundOn)return;ensureAudio();const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+dur+.02)}
function playChord(){tone(261.63,.2,.025);tone(329.63,.22,.018,.02);tone(392,.24,.015,.035)}
function back(t){return 1+2.25*pow(t-1,3)+1.25*pow(t-1,2)}function ease(t){return t<.5?4*t*t*t:1-pow(-2*t+2,3)/2}
function windowResized(){const r=stage.getBoundingClientRect();resizeCanvas(r.width,r.height);if(phase==="idle")resetMarpan()}
