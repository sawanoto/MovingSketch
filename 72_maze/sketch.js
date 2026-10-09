const SONGS = [
  {id:"twinkle",title:"きらきら星",english:"Twinkle, Twinkle, Little Star",notes:["C","C","G","G","A","A","G"]},
  {id:"frog",title:"かえるのうた",english:"The Frog Song",notes:["C","D","E","F","E","D","C"]},
  {id:"tulip",title:"チューリップ",english:"Tulips",notes:["C","D","E","C","D","E","G"]},
  {id:"mary",title:"メリーさんのひつじ",english:"Mary Had a Little Lamb",notes:["E","D","C","D","E","E","E"]},
  {id:"butterfly",title:"ちょうちょう",english:"Butterfly",notes:["G","E","E","F","D","D","C"]},
  {id:"buzz",title:"ぶんぶんぶん",english:"Buzz, Buzz, Buzz",notes:["G","F","E","D","E","F","D","C"]}
];
let selectedSong=SONGS[0],melody=selectedSong.notes;
const SCALE = ["C", "D", "E", "F", "G", "A", "B", "C5"];
const NOTE_DATA = {
  C:{name:"ド",midi:60,color:"#e87567"}, D:{name:"レ",midi:62,color:"#e6a24e"},
  E:{name:"ミ",midi:64,color:"#d5bd4b"}, F:{name:"ファ",midi:65,color:"#77b66e"},
  G:{name:"ソ",midi:67,color:"#55a5a8"}, A:{name:"ラ",midi:69,color:"#6f91c1"},
  B:{name:"シ",midi:71,color:"#9c7ac0"}, C5:{name:"ド",midi:72,color:"#e87567"}
};

let maze, player, marpan, particles=[], state="select", nextNote=0, muted=false, audio;
let held={up:false,down:false,left:false,right:false}, pointerTarget=null, observer;

function setup(){
  const host=document.querySelector("#sketch"), box=host.parentElement.getBoundingClientRect();
  const canvas=createCanvas(max(320,floor(box.width)),max(260,floor(box.height))); canvas.parent(host);
  pixelDensity(min(devicePixelRatio,2));
  marpan=new Marpan25D({maxSize:70,bodyColor:"#fffdf6",autoBlink:true});
  observer=new ResizeObserver(resizeStage); observer.observe(host.parentElement);
  bindUI();buildSongCards();buildGame();showSongSelect();
}

function resizeStage(){
  const box=document.querySelector("#stage").getBoundingClientRect();
  if(abs(width-box.width)>1||abs(height-box.height)>1){resizeCanvas(floor(box.width),floor(box.height));buildGame();}
}

// MUSIC -> fixed melody skeleton -> all remaining cells -> one connected rectangular maze.
function generateMaze(notes,w,h){
  const cols=22,rows=15,padX=max(24,w*.035),padY=max(22,h*.045);
  const cellW=(w-padX*2)/cols,cellH=(h-padY*2)/rows;
  const center=cell=>({x:padX+(cell.c+.5)*cellW,y:padY+(cell.r+.5)*cellH});
  const pitchRows={C:13,D:12,E:10,F:8,G:6,A:4,B:2,C5:1};
  const noteCols=notes.map((_,i)=>round(map(i,0,max(1,notes.length-1),1,cols-2)));
  const checkpoints=notes.map((note,i)=>({c:noteCols[i],r:pitchRows[note],note,index:i}));
  const startCell={c:0,r:pitchRows[notes[0]]},routeCells=[startCell],routeEdges=[];
  appendCellLine(routeCells,startCell,checkpoints[0],"horizontal");

  // First and immutable phase: build only from pitch relationships.
  for(let i=0;i<checkpoints.length-1;i++){
    const from=checkpoints[i],to=checkpoints[i+1],delta=SCALE.indexOf(to.note)-SCALE.indexOf(from.note);
    if(delta===0)appendCellLine(routeCells,from,to,"horizontal");
    else{
      const turn={c:min(to.c-1,from.c+1),r:from.r},rise={c:turn.c,r:to.r};
      appendCellLine(routeCells,from,turn,"horizontal");
      appendCellLine(routeCells,turn,rise,"vertical");
      appendCellLine(routeCells,rise,to,"horizontal");
    }
  }

  const edgeKeys=new Set(),visited=new Set(routeCells.map(cellKey));
  for(let i=1;i<routeCells.length;i++)addCellEdge(routeEdges,routeCells[i-1],routeCells[i],"true",edgeKeys,center);

  // Second phase: randomized Prim covers every unused cell without joining two visited areas.
  // That one-parent rule makes every excursion a dead end and prevents melody shortcuts.
  const fakeEdges=[],frontier=[],rng=seededRandom(notes.join("").split("").reduce((sum,ch)=>sum+ch.charCodeAt(0),1729));
  const pushFrontier=cell=>cellNeighbors(cell,cols,rows).forEach(next=>{if(!visited.has(cellKey(next)))frontier.push({from:cell,to:next});});
  routeCells.forEach(pushFrontier);
  while(frontier.length){
    const pick=rng()<.72?frontier.length-1:floor(rng()*frontier.length),edge=frontier.splice(pick,1)[0],key=cellKey(edge.to);
    if(visited.has(key))continue;
    visited.add(key);addCellEdge(fakeEdges,edge.from,edge.to,"fake",edgeKeys,center);pushFrontier(edge.to);
  }
  const points=checkpoints.map(p=>({...center(p),note:p.note,index:p.index}));
  return {notes,points,start:center(startCell),route:routeEdges,fake:fakeEdges,segments:[...routeEdges,...fakeEdges],edges:edgeKeys,cols,rows,padX,padY,cellW,cellH,top:padY,bottom:h-padY,dx:cellW};
}
function appendCellLine(path,from,to,axis){
  let c=path.at(-1).c,r=path.at(-1).r;
  if(axis==="horizontal")while(c!==to.c){c+=Math.sign(to.c-c);path.push({c,r});}
  else while(r!==to.r){r+=Math.sign(to.r-r);path.push({c,r});}
}
function cellKey(p){return `${p.c},${p.r}`;}
function edgeKey(a,b){return [cellKey(a),cellKey(b)].sort().join("|");}
function cellNeighbors(p,cols,rows){return [[1,0],[-1,0],[0,1],[0,-1]].map(([dc,dr])=>({c:p.c+dc,r:p.r+dr})).filter(n=>n.c>=0&&n.c<cols&&n.r>=0&&n.r<rows);}
function seededRandom(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function addCellEdge(list,a,b,type,keys,center){const key=edgeKey(a,b);if(keys.has(key))return;keys.add(key);addSegment(list,center(a),center(b),type);}
function addSegment(list,a,b,type,branch=-1){if(dist(a.x,a.y,b.x,b.y)>1)list.push({a:{x:a.x,y:a.y},b:{x:b.x,y:b.y},type,branch});}

function buildGame(){
  maze=generateMaze(melody,width,height);
  const wasPlaying=state==="playing"; player={x:maze.start.x,y:maze.start.y,vx:0,vy:0,r:constrain(min(width,height)*.025,11,17)};
  nextNote=0; particles=[]; if(wasPlaying)state="playing";
}

function draw(){
  background("#fcfaf4"); drawPaper(); drawMaze();
  if(state!=="select"){updatePlayer();drawPlayer();}
  updateParticles();
}

function drawPaper(){
  stroke(80,98,96,10);strokeWeight(1);
  for(let y=18;y<height;y+=28)line(0,y,width,y);
  noStroke();fill("#778384");textSize(10);textStyle(BOLD);textAlign(LEFT,TOP);text("LOW",12,height-23);text("HIGH",12,12);textStyle(NORMAL);
}

function drawMaze(){
  const corridor=corridorWidth(),left=maze.padX,top=maze.padY,right=width-maze.padX,bottom=height-maze.padY;
  noStroke();fill(state==="complete"?"#f8f3e9":"#eee5d5");rect(left,top,right-left,bottom-top);
  stroke(state==="complete"?color(116,111,102,65):color("#635f59"));strokeWeight(state==="complete"?1.35:2);strokeCap(SQUARE);
  const has=(a,b)=>maze.edges.has(edgeKey(a,b));
  for(let r=0;r<maze.rows;r++)for(let c=0;c<maze.cols;c++){
    const cell={c,r},x=left+c*maze.cellW,y=top+r*maze.cellH;
    if(r===0||!has(cell,{c,r:r-1}))line(x,y,x+maze.cellW,y);
    if(c===0||!has(cell,{c:c-1,r}))line(x,y,x,y+maze.cellH);
    if(c===maze.cols-1)line(x+maze.cellW,y,x+maze.cellW,y+maze.cellH);
    if(r===maze.rows-1)line(x,y+maze.cellH,x+maze.cellW,y+maze.cellH);
  }
  if(state==="complete"){
    stroke("#f2cc73");strokeWeight(corridor*.72);strokeCap(ROUND);maze.route.forEach(s=>line(s.a.x,s.a.y,s.b.x,s.b.y));
    stroke("#fff7d7");strokeWeight(corridor*.35);maze.route.forEach(s=>line(s.a.x,s.a.y,s.b.x,s.b.y));
  }
  noStroke();
  maze.points.forEach((p,i)=>{
    const revealed=state==="complete", active=i<nextNote;
    fill(revealed?NOTE_DATA[p.note].color:active?colorWithAlpha(NOTE_DATA[p.note].color,55):(state==="complete"?"#f8f3e9":"#eee5d5"));circle(p.x,p.y,corridor*.44);
    if(revealed){fill("#fff");textAlign(CENTER,CENTER);textStyle(BOLD);textSize(max(11,corridor*.25));text(NOTE_DATA[p.note].name,p.x,p.y+1);textStyle(NORMAL);}
  });
  fill("#53696b");circle(maze.start.x,maze.start.y,7);
}

function updatePlayer(){
  if(state!=="playing")return;
  let ix=(keyIsDown(RIGHT_ARROW)||keyIsDown(68)||held.right?1:0)-(keyIsDown(LEFT_ARROW)||keyIsDown(65)||held.left?1:0);
  let iy=(keyIsDown(DOWN_ARROW)||keyIsDown(83)||held.down?1:0)-(keyIsDown(UP_ARROW)||keyIsDown(87)||held.up?1:0);
  if(pointerTarget&&!ix&&!iy){const pdx=pointerTarget.x-player.x,pdy=pointerTarget.y-player.y,mag=sqrt(pdx*pdx+pdy*pdy);if(mag>7){ix=pdx/mag;iy=pdy/mag;}else pointerTarget=null;}
  if(ix&&iy){ix*=.707;iy*=.707;} const speed=constrain(min(width,height)*.008,2.7,4.8);
  player.vx=lerp(player.vx,ix*speed,.28);player.vy=lerp(player.vy,iy*speed,.28);
  if(!ix)player.vx*=.72;if(!iy)player.vy*=.72;
  tryMove(player.vx,0);tryMove(0,player.vy);
  checkNotes();
}
function corridorWidth(){return constrain(min(maze.cellW,maze.cellH)*.76,18,30);}
function tryMove(dx,dy){const nx=player.x+dx,ny=player.y+dy,limit=corridorWidth()*.5-player.r*.47;if(distanceToMaze(nx,ny)<=limit){player.x=nx;player.y=ny;}else{if(dx)player.vx=0;if(dy)player.vy=0;}}
function keyPressed(){
  if(state!=="playing")return;
  const step=constrain(min(width,height)*.013,5,8);
  if(keyCode===RIGHT_ARROW||key==="d"||key==="D")tryMove(step,0);
  if(keyCode===LEFT_ARROW||key==="a"||key==="A")tryMove(-step,0);
  if(keyCode===DOWN_ARROW||key==="s"||key==="S")tryMove(0,step);
  if(keyCode===UP_ARROW||key==="w"||key==="W")tryMove(0,-step);
  checkNotes();
}
function distanceToMaze(x,y){let best=Infinity;maze.segments.forEach(s=>best=min(best,pointSegmentDistance(x,y,s.a.x,s.a.y,s.b.x,s.b.y)));return best;}
function pointSegmentDistance(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,t=constrain(((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy||1),0,1);return dist(px,py,x1+t*dx,y1+t*dy);}

function checkNotes(){
  if(nextNote>=maze.points.length)return; const p=maze.points[nextNote];
  if(dist(player.x,player.y,p.x,p.y)<player.r+10){
    playNote(p.note); burst(p); nextNote++;
    document.querySelector("#hint").textContent=`${NOTE_DATA[p.note].name}　·　${nextNote} / ${melody.length}`;
    if(nextNote===maze.points.length)finishGame();
  }
}
function drawPlayer(){
  const moving=abs(player.vx)+abs(player.vy)>.3,bob=moving?sin(frameCount*.42)*1.8:sin(frameCount*.06)*.7;
  marpan.lookAt(player.x+player.vx*18,player.y+player.vy*18);
  marpan.drawAt(player.x,player.y+bob,{bodyWidth:player.r*2.25,bodyHeight:player.r*1.55,scaleX:1+abs(player.vx)*.012,scaleY:1-abs(player.vx)*.006});
}

function burst(p){for(let i=0;i<14;i++){const a=random(TWO_PI),s=random(.4,2.3);particles.push({x:p.x,y:p.y,vx:cos(a)*s,vy:sin(a)*s,life:1,color:NOTE_DATA[p.note].color});}}
function updateParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.96;p.vy*=.96;p.life-=.025;noStroke();fill(colorWithAlpha(p.color,p.life*210));circle(p.x,p.y,3+p.life*5);if(p.life<=0)particles.splice(i,1);}}
function colorWithAlpha(hex,a){const c=color(hex);c.setAlpha(a);return c;}

function ensureAudio(){if(!audio){const Ctx=window.AudioContext||window.webkitAudioContext;audio=new Ctx();}if(audio.state==="suspended")audio.resume();}
function playNote(note,delay=0,duration=.42){if(muted)return;ensureAudio();const at=audio.currentTime+delay,frequency=440*Math.pow(2,(NOTE_DATA[note].midi-69)/12);const gain=audio.createGain();gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.16,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);gain.connect(audio.destination);[1,2.01].forEach((ratio,i)=>{const osc=audio.createOscillator(),g=audio.createGain();osc.type="sine";osc.frequency.value=frequency*ratio;g.gain.value=i?.13:1;osc.connect(g);g.connect(gain);osc.start(at);osc.stop(at+duration+.03);});}
function replayMelody(){melody.forEach((note,i)=>{playNote(note,i*.43,.36);setTimeout(()=>burst(maze.points[i]),i*430);});}

function finishGame(){state="complete";saveClear(selectedSong.id);document.querySelector("#hint").textContent="歩いた道が、旋律になりました";document.querySelector("#complete p").textContent=`この道は「${selectedSong.title}」でした。`;document.querySelector("#complete-melody").textContent=melody.map(n=>NOTE_DATA[n].name).join("　");setTimeout(()=>{document.querySelector("#complete").hidden=false;replayMelody();},700);}
function resetGame(){state="playing";document.querySelector("#complete").hidden=true;buildGame();document.querySelector("#hint").textContent="音が続く道を探して、右へ";}

function bindUI(){
  document.querySelector("#reset").onclick=()=>state==="select"?showSongSelect():resetGame();document.querySelector("#again").onclick=resetGame;document.querySelector("#songs").onclick=showSongSelect;document.querySelector("#choose-song").onclick=showSongSelect;
  document.querySelector("#sound").onclick=e=>{muted=!muted;e.currentTarget.textContent=muted?"×":"♪";e.currentTarget.setAttribute("aria-pressed",String(!muted));if(!muted)ensureAudio();};
  document.querySelectorAll("[data-dir]").forEach(button=>{const dir=button.dataset.dir,on=e=>{e.preventDefault();held[dir]=true;ensureAudio();},off=e=>{e.preventDefault();held[dir]=false;};button.addEventListener("pointerdown",on);button.addEventListener("pointerup",off);button.addEventListener("pointercancel",off);button.addEventListener("pointerleave",off);});
  window.addEventListener("blur",()=>Object.keys(held).forEach(k=>held[k]=false));
}
function buildSongCards(){
  const grid=document.querySelector("#song-grid"),cleared=loadClears();grid.innerHTML="";
  SONGS.forEach((song,index)=>{const button=document.createElement("button");button.type="button";button.className="song-card";button.innerHTML=`<span class="number">STAGE ${String(index+1).padStart(2,"0")}</span><span class="title">${song.title}</span><span class="english">${song.english}</span><span class="preview"></span>${cleared[song.id]?'<span class="cleared">★</span>':''}`;drawPreview(button.querySelector(".preview"),song.notes);button.onclick=()=>selectSong(song);grid.append(button);});
}
function drawPreview(host,notes){const coords=notes.map((note,i)=>({x:notes.length===1?50:3+i/(notes.length-1)*94,y:29-SCALE.indexOf(note)/7*25,note})),lines=coords.slice(1).map((p,i)=>`<line x1="${coords[i].x}" y1="${coords[i].y}" x2="${p.x}" y2="${p.y}" stroke="${NOTE_DATA[p.note].color}"/>`).join(""),dots=coords.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${NOTE_DATA[p.note].color}"/>`).join("");host.innerHTML=`<svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">${lines}${dots}</svg>`;}
function selectSong(song){ensureAudio();selectedSong=song;melody=song.notes;document.querySelector("#song-label").textContent=`${song.title} / ${song.english}`;document.querySelector("#stage-select").hidden=true;document.querySelector("#complete").hidden=true;state="playing";buildGame();document.querySelector("#hint").textContent="音が続く道を探して、右へ";}
function showSongSelect(){state="select";pointerTarget=null;document.querySelector("#stage-select").hidden=false;document.querySelector("#complete").hidden=true;document.querySelector("#hint").textContent="曲を選んで、音の迷路へ";buildSongCards();}
function loadClears(){try{return JSON.parse(localStorage.getItem("melodyMazeClears")||"{}");}catch(error){return {};}}
function saveClear(id){const clears=loadClears();clears[id]=true;try{localStorage.setItem("melodyMazeClears",JSON.stringify(clears));}catch(error){}}
function mousePressed(){if(state==="playing"&&mouseX>=0&&mouseX<=width&&mouseY>=0&&mouseY<=height){pointerTarget={x:mouseX,y:mouseY};ensureAudio();return false;}}

if(typeof module!=="undefined")module.exports={generateMaze,pointSegmentDistance,SONGS,SCALE};
