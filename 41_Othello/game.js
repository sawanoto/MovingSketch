(function (root) {
  "use strict";
  const EMPTY = 0, BLACK = 1, WHITE = 2, SIZE = 8;
  const DIRECTIONS = [
    [-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]
  ];

  function initialBoard() {
    const board = Array.from({length: SIZE}, () => Array(SIZE).fill(EMPTY));
    board[3][3] = WHITE; board[3][4] = BLACK;
    board[4][3] = BLACK; board[4][4] = WHITE;
    return board;
  }
  const inside = (r,c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  const opponent = p => p === BLACK ? WHITE : BLACK;

  function flipsForMove(board, row, col, player) {
    if (!inside(row,col) || board[row][col] !== EMPTY) return [];
    const groups = [];
    for (const [dr,dc] of DIRECTIONS) {
      const cells = []; let r = row + dr, c = col + dc;
      while (inside(r,c) && board[r][c] === opponent(player)) { cells.push([r,c]); r += dr; c += dc; }
      if (cells.length && inside(r,c) && board[r][c] === player) groups.push({direction:[dr,dc], cells});
    }
    return groups;
  }
  function legalMoves(board, player) {
    const result = [];
    for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
      const groups = flipsForMove(board,r,c,player);
      if (groups.length) result.push({row:r,col:c,groups,flipCount:groups.reduce((n,g)=>n+g.cells.length,0)});
    }
    return result;
  }
  function applyMove(board, move, player) {
    const next = board.map(row => row.slice()); next[move.row][move.col] = player;
    for (const group of move.groups) for (const [r,c] of group.cells) next[r][c] = player;
    return next;
  }
  function countPieces(board) {
    let black=0, white=0;
    for (const row of board) for (const v of row) { if(v===BLACK) black++; else if(v===WHITE) white++; }
    return {black,white};
  }
  const SOLFEGE = ["ド","レ","ミ","ファ","ソ","ラ","シ"];
  function melodyMidi(index) {
    const degrees=[0,2,4,5,7,9,11];
    return 60 + Math.floor(index/7)*12 + degrees[index%7];
  }
  function melodyName(index) { return SOLFEGE[index%7]; }
  function coordinateChord(row,col) { return [melodyMidi(row),melodyMidi(col)]; }
  function boardMusicEvents(board,winner) {
    const events=[];
    for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) {
      const color=board[r][c], next=c<SIZE-1?board[r][c+1]:EMPTY;
      const strong=color!==EMPTY&&(winner===EMPTY||color===winner);
      const corner=(r===0||r===7)&&(c===0||c===7), runEnds=color!==EMPTY&&next!==color;
      events.push({
        row:r,col:c,color,strong,
        midis:color===EMPTY?[]:(strong?coordinateChord(r,c):[melodyMidi(c)-12]),
        duration:corner?.36:runEnds?.29:strong?.22:.14,
        wait:c===7?170:(next===color?58:96)
      });
    }
    return events;
  }
  function chooseCpuMove(moves) {
    if (!moves.length) return null;
    const corners = moves.filter(m => (m.row===0||m.row===7) && (m.col===0||m.col===7));
    if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
    const scored = moves.map(m => ({m, score:m.flipCount + (m.row===0||m.row===7||m.col===0||m.col===7 ? 3 : 0) + Math.random()*2}));
    return scored.sort((a,b)=>b.score-a.score)[0].m;
  }

  const api = {EMPTY,BLACK,WHITE,SIZE,DIRECTIONS,initialBoard,flipsForMove,legalMoves,applyMove,countPieces,chooseCpuMove,melodyMidi,melodyName,coordinateChord,boardMusicEvents};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!root.document) return;

  class SoundEngine {
    constructor(){ this.ctx=null; this.master=null; this.enabled=true; this.active=new Set(); }
    ensure(){
      if(!this.enabled) return false;
      if(!this.ctx){ const AC=root.AudioContext||root.webkitAudioContext; if(!AC) return false; this.ctx=new AC(); this.master=this.ctx.createGain(); this.master.gain.value=.24; this.master.connect(this.ctx.destination); }
      if(this.ctx.state==="suspended") this.ctx.resume(); return true;
    }
    note(midi, pan=0, duration=.26, level=.48, when=0){
      if(!this.ensure()) return false; const t=this.ctx.currentTime+when, freq=440*Math.pow(2,(midi-69)/12);
      const gain=this.ctx.createGain(), panner=this.ctx.createStereoPanner(); panner.pan.value=Math.max(-1,Math.min(1,pan));
      gain.gain.setValueAtTime(.0001,t); gain.gain.exponentialRampToValueAtTime(level,t+.008); gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
      gain.connect(panner); panner.connect(this.master);
      [ [1,1], [2.01,.16], [3.99,.045] ].forEach(([ratio,amount],i)=>{ const osc=this.ctx.createOscillator(), partial=this.ctx.createGain(); osc.type=i===0?"triangle":"sine"; osc.frequency.value=freq*ratio; partial.gain.value=amount; osc.connect(partial); partial.connect(gain); this.active.add(osc); osc.onended=()=>this.active.delete(osc); osc.start(t); osc.stop(t+duration+.03); }); return true;
    }
    chord(midis,col,duration=.28,level=.36){
      const notes=[...new Set(midis)];
      if(notes.length===1) return this.note(notes[0],(col-3.5)/3.5,duration,level*1.45);
      let played=false; for(const midi of notes) played=this.note(midi,(col-3.5)/3.5,duration,level)||played; return played;
    }
    place(row,col){ return this.chord(coordinateChord(row,col),col,.34,.38); }
    flip(index, col, total, starts){
      const emphasis=index===total-1&&total>=3 ? .58 : .48;
      return this.chord([melodyMidi(starts[0]+index),melodyMidi(starts[1]+index)],col,.3,emphasis*.72);
    }
    boardChord(midis,col,duration,level){ return this.chord(midis,col,duration,level); }
    stopAll(){
      for(const osc of this.active){ try{osc.stop();}catch(_){} } this.active.clear();
    }
  }

  const boardEl=document.getElementById("board"), statusEl=document.getElementById("turnStatus"), hintEl=document.getElementById("hint");
  const blackCountEl=document.getElementById("blackCount"), whiteCountEl=document.getElementById("whiteCount"), thinkingEl=document.getElementById("thinking");
  const sound=new SoundEngine(); let board, player, busy, gameOver, token=0;
  let blackMarpan=null, whiteMarpan=null, marpanCanvas=null;
  const pieceMotion=new Map();
  const musicNotes=[]; let scanCell=null;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function render(legal=[]) {
    const legalMap=new Map(legal.map(m=>[`${m.row},${m.col}`,m])); boardEl.innerHTML="";
    for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) {
      const cell=document.createElement("button"); cell.type="button"; cell.className="cell"; cell.setAttribute("role","gridcell");
      cell.dataset.row=r; cell.dataset.col=c; const move=legalMap.get(`${r},${c}`);
      if(move && player===BLACK && !busy && !gameOver){ cell.classList.add("legal"); cell.setAttribute("aria-label",`${r+1}行${c+1}列に置く`); cell.addEventListener("click",()=>playMove(move,BLACK)); }
      else { cell.tabIndex=-1; cell.setAttribute("aria-label",board[r][c]===EMPTY?"空きマス":board[r][c]===BLACK?"黒マーパン":"白マーパン"); }
      boardEl.append(cell);
    }
    updateScore();
  }
  function updateScore(){ const n=countPieces(board); blackCountEl.textContent=n.black; whiteCountEl.textContent=n.white; }
  function setStatus(text,cpu=false){ statusEl.lastElementChild.textContent=text; statusEl.classList.toggle("cpu",cpu); }

  async function playMove(move, color){
    if(busy||gameOver) return; busy=true; sound.ensure(); const myToken=token;
    board[move.row][move.col]=color; pieceMotion.set(`${move.row},${move.col}`,{type:"place",start:performance.now(),duration:230,color}); render([]);
    if(sound.place(move.row,move.col)) emitMusicNote(move.row,move.col,color,"double");
    await wait(115); if(myToken!==token)return;
    const maxLen=Math.max(...move.groups.map(g=>g.cells.length)); let noteIndex=0;
    for(let distance=0;distance<maxLen;distance++){
      const wave=[];
      for(const group of move.groups) if(group.cells[distance]) wave.push({cell:group.cells[distance],direction:group.direction});
      for(const item of wave){
        const [r,c]=item.cell, oldColor=board[r][c];
        const currentNote=noteIndex++;
        pieceMotion.set(`${r},${c}`,{type:"flip",start:performance.now(),duration:220,from:oldColor,to:color});
        // くるっの中央で色・音・音符を同時に切り替える。
        await wait(110); if(myToken!==token)return; board[r][c]=color;
        if(sound.flip(currentNote,c,move.flipCount,[move.row,move.col])) emitMusicNote(r,c,color,"single");
        await wait(14); if(myToken!==token)return;
      }
      await wait(10); if(myToken!==token)return;
    }
    await wait(190); if(myToken!==token)return;
    if(move.flipCount>=5){ boardEl.classList.add("reward"); if(move.flipCount>=8){ const now=performance.now(); for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(board[r][c])pieceMotion.set(`${r},${c}`,{type:"hop",start:now+(r+c)*8,duration:430,color:board[r][c]}); } await wait(260); boardEl.classList.remove("reward"); }
    updateScore(); player=opponent(color); busy=false; await advanceTurn();
  }
  function cellAt(r,c){ return boardEl.children[r*SIZE+c]; }

  async function advanceTurn(){
    if(gameOver)return; let moves=legalMoves(board,player);
    if(!moves.length){
      const other=opponent(player), otherMoves=legalMoves(board,other);
      if(!otherMoves.length){ finishGame(); return; }
      setStatus(player===BLACK?"あなたはパス":"CPUはパス",player===WHITE); hintEl.textContent="置ける場所がないため自動でパスしました";
      await wait(900); player=other; moves=otherMoves;
    }
    if(player===BLACK){ setStatus("あなたの番"); hintEl.textContent="光っているマスに置けます"; render(moves); }
    else { setStatus("CPUの番",true); hintEl.textContent="白マーパンが考えています"; render([]); thinkingEl.hidden=false; busy=true; await wait(520+Math.random()*380); busy=false; thinkingEl.hidden=true; const move=chooseCpuMove(legalMoves(board,WHITE)); if(move) playMove(move,WHITE); }
  }
  async function finishGame(){
    gameOver=true; busy=true; render([]); const n=countPieces(board), myToken=token; let title="ひきわけ！", winner=EMPTY; if(n.black>n.white){title="あなたの勝ち！";winner=BLACK;} else if(n.white>n.black){title="CPUの勝ち";winner=WHITE;}
    setStatus("盤面を演奏中"); hintEl.textContent="左上から、勝者のマーパンを読んでいます";
    await wait(450); if(myToken!==token)return; await playBoardScore(winner,myToken); if(myToken!==token)return;
    busy=false; setStatus("ゲーム終了"); hintEl.textContent="最終盤面の演奏が終わりました"; document.getElementById("resultTitle").textContent=title;
    document.getElementById("resultScore").textContent=`くろ ${n.black} — しろ ${n.white}`; document.getElementById("resultDialog").showModal();
  }
  async function playBoardScore(winner,myToken){
    for(const event of boardMusicEvents(board,winner)){
      if(myToken!==token)return; const {row:r,col:c,color}=event; scanCell={r,c};
      if(color){
        pieceMotion.set(`${r},${c}`,{type:"hop",start:performance.now(),duration:event.strong?230:150,color,amount:event.strong?1:.38});
        const level=event.strong?.29:.13;
        if(sound.boardChord(event.midis,c,event.duration,level)) emitMusicNote(r,c,color,event.strong?"double":"single");
      }
      await wait(event.wait);
    }
    scanCell=null; await wait(260);
  }
  function emitMusicNote(r,c,color,kind="single"){
    musicNotes.push({r,c,color,kind,start:performance.now(),duration:620,drift:(((r*11+c*7)%9)-4)/22});
  }
  function restart(){
    token++; sound.stopAll(); pieceMotion.clear(); musicNotes.length=0; scanCell=null; board=initialBoard(); player=BLACK; busy=false; gameOver=false; thinkingEl.hidden=true; document.getElementById("resultDialog").close(); setStatus("あなたの番"); hintEl.textContent="光っているマスに置けます"; render(legalMoves(board,BLACK));
  }
  document.getElementById("restartButton").addEventListener("click",restart); document.getElementById("dialogRestart").addEventListener("click",restart);
  document.getElementById("soundButton").addEventListener("click",()=>{ sound.enabled=!sound.enabled; if(sound.enabled)sound.ensure(); else {sound.stopAll();musicNotes.length=0;} document.getElementById("soundLabel").textContent=sound.enabled?"ON":"OFF"; document.getElementById("soundIcon").textContent=sound.enabled?"♪":"―"; const b=document.getElementById("soundButton"); b.setAttribute("aria-pressed",String(sound.enabled)); b.setAttribute("aria-label",`サウンドを${sound.enabled?"オフ":"オン"}にする`); });

  function sizeMarpanCanvas(){
    if(!marpanCanvas)return; const side=Math.round(boardEl.getBoundingClientRect().width); resizeCanvas(side,side); marpanCanvas.position(0,0);
  }
  root.setup=function(){
    const side=Math.round(boardEl.getBoundingClientRect().width); marpanCanvas=createCanvas(side,side); marpanCanvas.parent(document.querySelector(".board-wrap")); marpanCanvas.elt.setAttribute("aria-hidden","true"); pixelDensity(Math.min(2,root.devicePixelRatio||1));
    blackMarpan=new Marpan25D({bodyColor:"#30312d",expression:"pupil",eyeScale:.78});
    whiteMarpan=new Marpan25D({bodyColor:"#f6f0e4",expression:"pupil",eyeScale:.78});
    blackMarpan.enableAutoBlink(2600,5200); whiteMarpan.enableAutoBlink(3000,5700);
  };
  root.draw=function(){
    clear(); if(!board||!blackMarpan)return; const border=parseFloat(getComputedStyle(boardEl).borderLeftWidth)||0, cell=(width-border*2)/SIZE, now=performance.now();
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
      let color=board[r][c]; if(!color)continue; let sx=1,sy=1,dy=0; const key=`${r},${c}`, motion=pieceMotion.get(key);
      if(motion){ const t=Math.max(0,Math.min(1,(now-motion.start)/motion.duration));
        if(motion.type==="flip"){ sx=Math.max(.045,Math.abs(Math.cos(t*Math.PI))); sy=1+Math.sin(t*Math.PI)*.08; color=t<.5?motion.from:motion.to; }
        else if(motion.type==="place"){ const eased=1-Math.pow(1-t,3); sx=sy=.45+eased*.55; dy=(1-eased)*-cell*.35; color=motion.color; }
        else if(motion.type==="hop"){ const amount=motion.amount??1; dy=-Math.sin(t*Math.PI)*cell*.2*amount; sx=1+Math.sin(t*Math.PI)*.05*amount; sy=1-Math.sin(t*Math.PI)*.03*amount; color=motion.color; }
        if(t>=1)pieceMotion.delete(key);
      }
      const actor=color===BLACK?blackMarpan:whiteMarpan, cx=border+(c+.5)*cell, cy=border+(r+.5)*cell+dy;
      actor.drawAt(cx,cy,{bodyWidth:cell*.82,bodyHeight:cell*.58,bodyColor:color===BLACK?"#30312d":"#f6f0e4",scaleX:sx,scaleY:sy,eyeScale:.78,lookX:cx,lookY:cy});
    }
    if(scanCell){
      noFill(); stroke("#ffe08a"); strokeWeight(Math.max(2,cell*.055)); rect(border+scanCell.c*cell+2,border+scanCell.r*cell+2,cell-4,cell-4,cell*.1);
    }
    textAlign(CENTER,CENTER); textStyle(BOLD);
    for(let i=musicNotes.length-1;i>=0;i--){
      const n=musicNotes[i],t=(now-n.start)/n.duration; if(t>=1){musicNotes.splice(i,1);continue;} if(t<0)continue;
      const cx=border+(n.c+.5+n.drift*Math.sin(t*Math.PI*2))*cell, cy=border+(n.r+.25-t*.52)*cell;
      const alpha=255*Math.pow(1-t,1.35),size=Math.max(12,cell*.28); textSize(size);
      stroke(n.color===BLACK?255:35,alpha*.78); strokeWeight(Math.max(2,size*.09)); fill(n.color===BLACK?35:255,alpha); text(n.kind==="double"?"♫":"♪",cx,cy);
    }
  };
  root.windowResized=sizeMarpanCanvas;
  restart();
})(typeof window!=="undefined"?window:globalThis);
