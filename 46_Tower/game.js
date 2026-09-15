(()=>{"use strict";
const {Engine,Bodies,Body,Composite,Events}=Matter,$=s=>document.querySelector(s);
const canvas=$("#game"),ctx=canvas.getContext("2d"),nextCanvas=$("#nextCanvas"),nctx=nextCanvas.getContext("2d");
const NOTES={"ド":[261.63,"#ef6a67"],"レ":[293.66,"#f29b52"],"ミ":[329.63,"#e5c64f"],"ファ":[349.23,"#63b875"],"ソ":[392,"#4da9c9"],"ラ":[440,"#6f86d6"],"シ":[493.88,"#9a72c7"],"高いド":[523.25,"#ed5ca8"]};
const SONGS={
 twinkle:{name:"きらきら星",notes:["ド","ド","ソ","ソ","ラ","ラ","ソ","ファ","ファ","ミ","ミ","レ","レ","ド"]},
 hands:{name:"むすんでひらいて",notes:["ミ","ミ","レ","ド","ド","レ","レ","ミ","レ","ド","ソ","ソ","ファ","ミ","ミ","レ","ド","レ","ミ","ド"]},
 mary:{name:"メリーさんのひつじ",notes:["ミ","レ","ド","レ","ミ","ミ","ミ","レ","レ","レ","ミ","ソ","ソ","ミ","レ","ド","レ","ミ","ミ","ミ","ミ","レ","レ","ミ","レ","ド"]},
 butterfly:{name:"ちょうちょう",notes:["ソ","ミ","ミ","ファ","レ","レ","ド","レ","ミ","ファ","ソ","ソ","ソ","ソ","ミ","ミ","ミ","ファ","レ","レ","レ","ド","ミ","ソ","ソ","ド","ド","ド"]},
 frog:{name:"かえるのうた",notes:["ド","レ","ミ","ファ","ミ","レ","ド","ミ","ファ","ソ","ラ","ソ","ファ","ミ","ド","ド","ド","ド","ド","ド","レ","レ","ミ","ミ","ファ","ファ","ミ","レ","ド"]},
 buzz:{name:"ぶんぶんぶん",notes:["ソ","ファ","ミ","レ","ミ","ファ","レ","ド","ミ","ファ","ソ","ミ","レ","ミ","ファ","レ","ミ","ファ","ソ","ミ","レ","ミ","ファ","レ","ソ","ファ","ミ","レ","ミ","ファ","レ","ド"]},
 tulip:{name:"チューリップ",notes:["ド","レ","ミ","ド","レ","ミ","ソ","ミ","レ","ド","レ","ミ","レ","ド","レ","ミ","ド","レ","ミ","ソ","ミ","レ","ド","レ","ミ","ド","ソ","ソ","ミ","ソ","ラ","ラ","ソ","ミ","ミ","レ","レ","ド"]},
 chestnut:{name:"大きな栗の木の下で",notes:["ド","ド","レ","ミ","ミ","ソ","ミ","ミ","レ","レ","ド","ミ","ミ","ファ","ソ","高いド","ラ","高いド","ソ","高いド","高いド","シ","ソ","ラ","ラ","ラ","ラ","ソ","ド","ド","レ","ミ","ミ","ソ","ミ","ミ","レ","レ","ド"]}
};
const SONG_ORDER=["twinkle","hands","mary","butterfly","frog","buzz","tulip","chestnut"],NOTE_ORDER=["ド","レ","ミ","ファ","ソ","ラ","シ","高いド"],SAVE_KEY="marpanTowerClearedSongs";
const TYPES=[
 {w:104,h:66,make:(x,y)=>Bodies.rectangle(x,y,104,66,{chamfer:{radius:25}})},
 {w:78,h:78,make:(x,y)=>Bodies.rectangle(x,y,78,78,{chamfer:{radius:12}})},
 {w:118,h:58,make:(x,y)=>Bodies.rectangle(x,y,118,58,{chamfer:{radius:18}})},
 {w:68,h:94,make:(x,y)=>Bodies.rectangle(x,y,68,94,{chamfer:{radius:22}})}
];
let engine,ground,walls=[],pieces=[],held,current=null,support=null,nextType,melodyKey="twinkle",melody=SONGS.twinkle,composeMode=false,composeNote="ド",state="menu",camera=0,cameraTarget=0,audio,contactAt=0,touchedTower=false,groundAt=new Map(),playToken=0,particles=[],cameraTour=false,clearedSongs=loadClearedSongs();

function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);if(engine)stage()}
function stage(){if(ground)[ground,...walls].forEach(b=>Composite.remove(engine.world,b));ground=Bodies.rectangle(innerWidth/2,innerHeight-89,Math.min(660,innerWidth*.78),32,{isStatic:true,label:"ground",friction:1});walls=[Bodies.rectangle(-40,innerHeight/2,60,innerHeight*5,{isStatic:true}),Bodies.rectangle(innerWidth+40,innerHeight/2,60,innerHeight*5,{isStatic:true})];Composite.add(engine.world,[ground,...walls])}
function start(){playToken++;engine=Engine.create();engine.gravity.y=3;engine.positionIterations=10;pieces=[];held=null;current=null;camera=0;cameraTarget=0;particles=[];cameraTour=false;groundAt.clear();state="aim";stage();Events.on(engine,"collisionStart",collide);Events.on(engine,"collisionEnd",separate);queue();$("#result").classList.remove("show")}
function queue(){if(!composeMode&&pieces.length>=melody.notes.length)return;const type=nextType||TYPES[Math.floor(Math.random()*TYPES.length)];const note=composeMode?composeNote:melody.notes[pieces.length];held=type.make(innerWidth/2,112-camera);Body.setStatic(held,true);held.label="marpan";held.friction=.82;held.frictionStatic=1;held.frictionAir=.018;held.restitution=.04;held.game={note,type,index:pieces.length,glow:0,settled:false,expression:"normal"};Composite.add(engine.world,held);nextType=TYPES[Math.floor(Math.random()*TYPES.length)];drawNext();state="aim"}
function drop(){if(state!=="aim"||!held)return;startAudio();current=held;held=null;support=null;Body.setStatic(current,false);Body.setVelocity(current,{x:0,y:.5});pieces.push(current);contactAt=0;touchedTower=false;state="drop"}
function move(x){if(!held||state!=="aim")return;Body.setPosition(held,{x:Math.max(55,Math.min(innerWidth-55,x)),y:held.position.y})}
function rotate(){if(held&&state==="aim")Body.rotate(held,Math.PI/12)}
function collide(event){for(const pair of event.pairs){const a=pair.bodyA,b=pair.bodyB;if(!current&&a.label!=="marpan"&&b.label!=="marpan")continue;const other=a===current?b:b===current?a:null;if(other){if(other===ground){if(current.game.index>0){gameOver("地面に落ちちゃった");return}contactAt||=performance.now()}else if(other.label==="marpan"){touchedTower=true;contactAt||=performance.now()}}
  for(const body of [a,b])if(body.label==="marpan"&&body.game?.settled&&body.game.index>0&&(a===ground||b===ground))groundAt.set(body,performance.now())}}
function separate(event){for(const pair of event.pairs){if(pair.bodyA===ground&&pair.bodyB.label==="marpan")groundAt.delete(pair.bodyB);if(pair.bodyB===ground&&pair.bodyA.label==="marpan")groundAt.delete(pair.bodyA)}}
function update(){if(!engine)return;Engine.update(engine,1000/60);pieces.forEach(p=>p.game.glow*=.91);particles.forEach(p=>{p.x+=p.vx||0;p.y+=p.vy??-1.1;p.vy=(p.vy??-1.1)+(p.gravity||0);p.rotation=(p.rotation||0)+(p.spin||0);p.life-=p.decay||.025});particles=particles.filter(p=>p.life>0);
 if(state==="drop"&&current){
  const groundTop=ground.bounds.min.y;
  if(current.game.index>0&&current.position.y>innerHeight+90){gameOver("地面に落ちちゃった");return}
  const settledBodies=pieces.filter(p=>p!==current&&p.game.settled);
  const touchingSupport=settledBodies.filter(p=>{const horizontal=Math.min(current.bounds.max.x,p.bounds.max.x)-Math.max(current.bounds.min.x,p.bounds.min.x);const gap=p.bounds.min.y-current.bounds.max.y;return horizontal>12&&gap>-14&&gap<12}).sort((a,b)=>a.bounds.min.y-b.bounds.min.y)[0];
  if(touchingSupport){touchedTower=true;support=touchingSupport;contactAt||=performance.now()}else if(current.game.index>0){touchedTower=false;support=null;contactAt=0}
  if(current.bounds.max.y>=groundTop-1){
   if(current.game.index>0){gameOver("地面に落ちちゃった");return}
   const overlap=current.bounds.max.y-groundTop;
   if(overlap>0)Body.translate(current,{x:0,y:-overlap-1});
   Body.setVelocity(current,{x:current.velocity.x*.25,y:0});
   contactAt||=performance.now();
  }
  if(current.speed>26)Body.setVelocity(current,{x:current.velocity.x*.8,y:Math.min(current.velocity.y,26)});
  if(contactAt){const age=performance.now()-contactAt;if(age>120){Body.setVelocity(current,{x:current.velocity.x*.86,y:current.velocity.y*.86});Body.setAngularVelocity(current,current.angularVelocity*.8)}if(age>480&&(current.game.index===0||touchedTower))settle()}
 }
 for(const [body,time] of groundAt)if(performance.now()-time>360){gameOver("塔がくずれちゃった");break}
 if(state!=="over"&&pieces.some(p=>p.game.index>0&&(p.position.x<-90||p.position.x>innerWidth+90)))gameOver("塔がくずれちゃった");
 if(!cameraTour&&pieces.length>5){const top=Math.min(...pieces.map(p=>Math.min(...p.vertices.map(v=>v.y))));cameraTarget=Math.max(0,innerHeight*.34-top)}camera+=(cameraTarget-camera)*(cameraTour?.075:.035)}
function settle(){if(state!=="drop")return;if(current.game.index>0&&!support)return;if(support){const overlap=current.bounds.max.y-support.bounds.min.y+1;if(overlap>0)Body.translate(current,{x:0,y:-overlap})}Body.setVelocity(current,{x:0,y:0});Body.setAngularVelocity(current,0);current.game.settled=true;current.game.glow=1;Body.setStatic(current,true);playNote(current.game.note,.5);sparkle(current);current=null;support=null;if(!composeMode&&pieces.length===melody.notes.length)beginCompletion();else queue()}
function gameOver(copy){if(["over","playing","complete"].includes(state))return;state="over";if(held){Composite.remove(engine.world,held);held=null}playToken++;setTimeout(()=>showResult("GAME OVER",copy),500)}
function showResult(title,copy){$("#resultTitle").textContent=title;$("#resultCopy").textContent=copy;$("#result").classList.add("show")}
function order(){return [...pieces].filter(p=>p.game.settled).sort((a,b)=>b.position.y-a.position.y)}
function loadClearedSongs(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||"{}")||{}}catch(e){return{}}}
function isSongUnlocked(index){return index===0||Boolean(clearedSongs[SONG_ORDER[index-1]])}
function isComposerUnlocked(){return SONG_ORDER.every(key=>Boolean(clearedSongs[key]))}
function chooseMode(key){composeMode=key==="compose";melodyKey=key;if(!composeMode)melody=SONGS[key];renderSongMenu()}
function renderSongMenu(){const list=$("#songList"),songs=SONG_ORDER.map((key,index)=>{const song=SONGS[key],unlocked=isSongUnlocked(index),selected=!composeMode&&key===melodyKey;return `<button class="song${selected?" is-selected":""}${unlocked?"":" is-locked"}" data-song="${key}" type="button" ${unlocked?"":"disabled"}><b>${unlocked?song.name:"？？？"}</b><span>${unlocked?`${song.notes.length}音`:"🔒 LOCKED"}</span></button>`}),composerUnlocked=isComposerUnlocked();songs.push(`<button class="song compose-song${composeMode?" is-selected":""}${composerUnlocked?"":" is-locked"}" data-song="compose" type="button" ${composerUnlocked?"":"disabled"}><b>${composerUnlocked?"楽曲制作モード":"？？？"}</b><span>${composerUnlocked?"好きな音を積もう":"🔒 8曲クリアで解放"}</span></button>`);list.innerHTML=songs.join("");list.querySelectorAll(".song:not(:disabled)").forEach(button=>button.onclick=()=>chooseMode(button.dataset.song))}
function clearCurrentSong(){const index=SONG_ORDER.indexOf(melodyKey),nextKey=SONG_ORDER[index+1],wasNextUnlocked=nextKey?isSongUnlocked(index+1):true,wasComposerUnlocked=isComposerUnlocked();clearedSongs[melodyKey]=true;try{localStorage.setItem(SAVE_KEY,JSON.stringify(clearedSongs))}catch(e){}renderSongMenu();if(!wasComposerUnlocked&&isComposerUnlocked())return "楽曲制作モード";return nextKey&&!wasNextUnlocked?SONGS[nextKey].name:""}
function renderNotePicker(){const picker=$("#notePicker");picker.innerHTML=NOTE_ORDER.map(note=>`<button type="button" data-note="${note}" class="${note===composeNote?"is-selected":""}" style="--note-color:${NOTES[note][1]}" aria-label="${note}" title="${note}">${note==="高いド"?"↑ド":note}</button>`).join("");picker.querySelectorAll("button").forEach(button=>button.onclick=e=>{e.stopPropagation();composeNote=button.dataset.note;if(held&&state==="aim")held.game.note=composeNote;renderNotePicker();drawNext()})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function beginCompletion(){state="completeWait";cameraTour=true;cameraTarget=0;pieces.forEach(p=>p.game.expression="surprise");const id=++playToken;for(let i=0;i<90&&Math.abs(camera)>2;i++){if(id!==playToken)return;await wait(16)}if(id!==playToken)return;await wait(350);playTower(true,id)}
async function playTower(finish=false,existingId=0){const list=order();if(!list.length||state==="playing")return;const before=state,id=existingId||++playToken;cameraTour=true;state="playing";if(finish)list.forEach(p=>p.game.expression="surprise");for(const p of list){if(id!==playToken)return;cameraTarget=Math.max(0,innerHeight*.48-p.position.y);p.game.expression="smile";p.game.glow=1;playNote(p.game.note,.48);sparkle(p);await wait(460);if(p!==list.at(-1))p.game.expression=finish?"surprise":"normal"}if(finish){state="complete";list.forEach(p=>{p.game.glow=1;p.game.expression="smile"});party(list.at(-1));const unlocked=clearCurrentSong();await wait(550);showResult("完成！",unlocked?`${unlocked}がアンロックされました！`:`${melody.name}を積みました`)}else{list.forEach(p=>p.game.expression="normal");state=before;cameraTour=false}}
function startAudio(){if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume()}
function playNote(name,d=.45){startAudio();const now=audio.currentTime,g=audio.createGain();g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.13,now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+d);g.connect(audio.destination);[[1,1],[2,.12]].forEach(([r,l])=>{const o=audio.createOscillator(),v=audio.createGain();o.type="sine";o.frequency.value=NOTES[name][0]*r;v.gain.value=l;o.connect(v);v.connect(g);o.start(now);o.stop(now+d+.03)})}
function sparkle(p){for(let i=0;i<9;i++)particles.push({x:p.position.x+(Math.random()-.5)*30,y:p.position.y+(Math.random()-.5)*20,color:NOTES[p.game.note][1],life:1,vx:(Math.random()-.5)*1.4,vy:-.7-Math.random()*.8,gravity:.015,decay:.025,shape:"note"})}
function party(p){const colors=Object.values(NOTES).map(n=>n[1]);for(let i=0;i<130;i++)particles.push({x:p.position.x+(Math.random()-.5)*80,y:p.position.y+(Math.random()-.5)*24,color:colors[i%colors.length],life:1,vx:(Math.random()-.5)*8,vy:-3-Math.random()*7,gravity:.16,decay:.009,size:5+Math.random()*8,spin:(Math.random()-.5)*.35,rotation:Math.random()*7,shape:i%4?"confetti":"note"})}
function eyes(c,w,h,expression="normal"){[-1,0,1].forEach(i=>{const x=i*Math.min(22,w*.21),y=-h*.06;if(expression==="smile"){c.strokeStyle="#102027";c.lineWidth=3;c.lineCap="round";c.beginPath();c.moveTo(x-6,y+2);c.quadraticCurveTo(x,y-6,x+6,y+2);c.stroke();return}c.fillStyle="#fff";c.strokeStyle="#102027";c.lineWidth=2;c.beginPath();c.ellipse(x,y,expression==="surprise"?9:8,expression==="surprise"?11:9.5,0,0,7);c.fill();c.stroke();c.fillStyle="#102027";c.beginPath();c.arc(x+(expression==="surprise"?0:1.2),y+1,expression==="surprise"?2.1:2.8,0,7);c.fill()})}
function body(p,c=ctx){c.save();const color=NOTES[p.game.note][1];c.beginPath();c.moveTo(p.vertices[0].x,p.vertices[0].y);for(let i=1;i<p.vertices.length;i++)c.lineTo(p.vertices[i].x,p.vertices[i].y);c.closePath();if(p.game.glow>.05){c.shadowColor=color;c.shadowBlur=38*p.game.glow}c.fillStyle=color;c.strokeStyle="#102027";c.lineWidth=3;c.lineJoin="round";c.fill();c.stroke();c.shadowBlur=0;c.translate(p.position.x,p.position.y);c.rotate(p.angle);eyes(c,p.game.type.w,p.game.type.h,p.game.expression);c.restore()}
function drawNext(){nctx.clearRect(0,0,84,68);if(!nextType)return;const note=composeMode?composeNote:(melody.notes[(pieces?.length||0)+1]||melody.notes.at(-1)),w=nextType.w*.48,h=nextType.h*.48;nctx.save();nctx.translate(42,34);nctx.beginPath();nctx.roundRect(-w/2,-h/2,w,h,Math.min(13,w*.2));nctx.fillStyle=NOTES[note][1];nctx.strokeStyle="#102027";nctx.lineWidth=2;nctx.fill();nctx.stroke();eyes(nctx,w,h);nctx.restore()}
function render(){canvas.dataset.state=state;canvas.dataset.pieces=String(pieces.length);canvas.dataset.held=String(!!held);ctx.clearRect(0,0,innerWidth,innerHeight);const g=ctx.createLinearGradient(0,0,0,innerHeight);g.addColorStop(0,"#82c5e4");g.addColorStop(.72,"#e7f1df");g.addColorStop(1,"#fff0b2");ctx.fillStyle=g;ctx.fillRect(0,0,innerWidth,innerHeight);ctx.save();ctx.translate(0,camera);ctx.fillStyle="#f1ca63";ctx.fillRect(0,innerHeight-105,innerWidth,130);ctx.strokeStyle="#17364b";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,innerHeight-105);ctx.lineTo(innerWidth,innerHeight-105);ctx.stroke();pieces.forEach(p=>body(p));if(held)body(held);particles.forEach(p=>{ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;if(p.shape==="confetti"){ctx.translate(p.x,p.y);ctx.rotate(p.rotation||0);ctx.fillRect(-(p.size||7)/2,-3,p.size||7,6)}else{ctx.font="18px serif";ctx.fillText("♪",p.x,p.y)}ctx.restore()});ctx.globalAlpha=1;ctx.restore()}
function loop(){update();render();requestAnimationFrame(loop)}
let touchAiming=false;
canvas.addEventListener("pointerdown",e=>{if(state!=="aim")return;move(e.clientX);if(e.pointerType==="mouse"){drop();return}touchAiming=true});
canvas.addEventListener("pointermove",e=>{if(state!=="aim")return;if(e.pointerType==="mouse"||touchAiming)move(e.clientX)});
addEventListener("pointerup",()=>{if(touchAiming)drop();touchAiming=false});
addEventListener("pointercancel",()=>{touchAiming=false});
$("#rotateButton").onclick=e=>{e.stopPropagation();rotate()};$("#playButton").onclick=()=>playTower(false);$("#retryButton").onclick=()=>start();$("#menuButton").onclick=()=>{$("#result").classList.remove("show");$("#startScreen").classList.remove("hidden");$("#notePicker").classList.remove("show");renderSongMenu();state="menu"};
$("#startButton").onclick=()=>{startAudio();$("#startScreen").classList.add("hidden");$("#notePicker").classList.toggle("show",composeMode);start()};
addEventListener("keydown",e=>{if(e.key==="ArrowLeft"&&held)move(held.position.x-18);if(e.key==="ArrowRight"&&held)move(held.position.x+18);if(e.key==="ArrowUp")rotate();if(e.code==="Space"){e.preventDefault();drop()}});
renderSongMenu();renderNotePicker();resize();requestAnimationFrame(loop);addEventListener("resize",resize);
})();
