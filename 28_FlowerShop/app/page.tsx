"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BreadType = "burnt" | "croissant" | "melon" | "toast" | "pizza";
type Cell = { kind: "open"; buns: BreadType[] } | { kind: "crate"; hp: number; max: number };
type Tray = { id: number; buns: BreadType[] };

const META: Record<BreadType, { label: string; coin: number; code: string }> = {
  burnt:{label:"こげマーパン",coin:20,code:"B01"},
  croissant:{label:"クロワッサン",coin:25,code:"B02"},
  melon:{label:"メロンパン",coin:30,code:"B03"},
  toast:{label:"食パン",coin:25,code:"B04"},
  pizza:{label:"ピザマーパン",coin:35,code:"B05"},
};
const BREAD_TYPES = Object.keys(META) as BreadType[];
const START_OPEN = new Set([6,7,11,12,16,17]);
let serial = 0;

function createBoard(): Cell[] {
  return Array.from({length:25},(_,i) => {
    if(START_OPEN.has(i)) return {kind:"open",buns:[]};
    const max=i%3===0?1:i%3===1?2:3;
    return {kind:"crate",hp:max,max};
  });
}
function randomTray():Tray{
  const count=1+Math.floor(Math.random()*5);
  return {id:++serial,buns:Array.from({length:count},()=>BREAD_TYPES[Math.floor(Math.random()*BREAD_TYPES.length)])};
}
function makeHand(){return Array.from({length:3},()=>randomTray());}
function initialHand():Tray[]{return [
  {id:++serial,buns:["burnt","croissant"]},
  {id:++serial,buns:["melon","melon","toast"]},
  {id:++serial,buns:["pizza","burnt","croissant","toast"]},
];}
function neighbors(i:number){const r=Math.floor(i/5),c=i%5;return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([y,x])=>y>=0&&y<5&&x>=0&&x<5).map(([y,x])=>y*5+x);}
function Marupan({bread,small=false}:{bread:BreadType;small?:boolean}){return <span className={`marupan ${bread} ${small?"small":""}`} title={META[bread].label}><span className="bread-decor"/><span className="bread-eyes"><i/><i/><i/></span></span>;}

export default function Home(){
  const [board,setBoard]=useState<Cell[]>(createBoard);
  const [hand,setHand]=useState<Tray[]>(initialHand);
  const [selected,setSelected]=useState<number|null>(null);
  const [score,setScore]=useState(0),[coins,setCoins]=useState(0);
  const [order,setOrder]=useState<BreadType>("burnt"),[time,setTime]=useState(60);
  const [sound,setSound]=useState(true),[toast,setToast]=useState("同じ種類を6個ちょうどつなげよう！");
  const [showHelp,setShowHelp]=useState(true);
  const level=1+Math.floor(score/500);
  const empty=useMemo(()=>board.filter(c=>c.kind==="open"&&!c.buns.length).length,[board]);
  const gameOver=hand.length>0&&empty===0;

  const ping=useCallback((freq=440)=>{if(!sound||typeof window==="undefined")return;const A=window.AudioContext||(window as unknown as{webkitAudioContext:typeof AudioContext}).webkitAudioContext;if(!A)return;const ctx=new A(),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.05,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.12);},[sound]);
  const newOrder=useCallback(()=>{setOrder(BREAD_TYPES[Math.floor(Math.random()*BREAD_TYPES.length)]);setTime(60);},[]);

  useEffect(()=>{const id=window.setInterval(()=>setTime(t=>{if(t<=1){setToast("注文は時間切れ。また次のお客さまへ！");newOrder();return 60;}return t-1;}),1000);return()=>clearInterval(id);},[newOrder]);

  const place=useCallback((trayId:number,idx:number)=>{
    if(gameOver)return;const tray=hand.find(t=>t.id===trayId),target=board[idx];
    if(!tray||target.kind!=="open"||target.buns.length){setToast("そこには置けません");ping(150);return;}
    const next:Cell[]=board.map((c,i)=>i===idx?{kind:"open",buns:[...tray.buns]}:c.kind==="open"?{kind:"open",buns:[...c.buns]}:{kind:"crate",hp:c.hp,max:c.max});
    setScore(s=>s+10);setSelected(null);ping(380);
    const comp:number[]=[],seen=new Set<number>(),q=[idx];
    while(q.length){const i=q.shift()!;if(seen.has(i))continue;seen.add(i);const c=next[i];if(c.kind!=="open"||!c.buns.length)continue;comp.push(i);neighbors(i).forEach(n=>{const nc=next[n];if(nc.kind==="open"&&nc.buns.length&&!seen.has(n))q.push(n);});}
    const counts=new Map<BreadType,number>();comp.forEach(i=>{const c=next[i];if(c.kind==="open")c.buns.forEach(b=>counts.set(b,(counts.get(b)||0)+1));});
    const shipped=[...counts].filter(([,n])=>n===6).map(([c])=>c);
    if(shipped.length){shipped.forEach(color=>{
      comp.forEach(i=>{const c=next[i];if(c.kind==="open")c.buns=c.buns.filter(b=>b!==color);});
      new Set(comp.flatMap(neighbors)).forEach(i=>{const c=next[i];if(c.kind==="crate")next[i]=c.hp<=1?{kind:"open",buns:[]}:{kind:"crate",hp:c.hp-1,max:c.max};});
      setScore(s=>s+100);setCoins(c=>c+META[color].coin);ping(720);
      if(color===order){setCoins(c=>c+50);setToast(`${META[color].label}便、注文達成！ +50 COIN`);newOrder();}
      else setToast(`${META[color].label}を出荷！ +${META[color].coin} COIN`);
    });}else{const over=[...counts].find(([,n])=>n>6);setToast(over?`${META[over[0]].label}が${over[1]}個。6個ちょうどに分けよう`:"配置完了。次の箱を考えよう");}
    setBoard(next);setHand(hand.map(t=>t.id===trayId?randomTray():t));
  },[board,gameOver,hand,newOrder,order,ping]);

  const reset=()=>{setBoard(createBoard());setHand(makeHand());setSelected(null);setScore(0);setCoins(0);setOrder("burnt");setTime(60);setToast("新しい便を始めよう！");};
  return <main className="game-shell"><section className="game" aria-label="マーパン箱詰めゲーム">
    <header className="topbar"><div><span className="eyebrow">MARUPAN FACTORY</span><h1>マーパンファクトリー</h1></div><div className="head-actions"><button onClick={()=>setShowHelp(true)} aria-label="遊び方">?</button><button onClick={()=>setSound(v=>!v)} aria-label="サウンド設定">{sound?"♪":"×"}</button></div></header>
    <div className="stats"><span>LEVEL <b>{level}</b></span><span>SCORE <b>{score}</b></span><span>COIN <b>{coins}</b></span></div>
    <aside className="order"><div className="customer">☺</div><div className="order-copy"><small>きょうの注文 · {META[order].code}</small><strong><Marupan bread={order} small/>{META[order].label}を 1箱</strong><div className="timer"><i style={{width:`${time/60*100}%`}}/></div></div><div className="reward">+50</div></aside>
    <div className="message" role="status">{toast}</div>
    <section className="board-wrap"><div className="board-head"><span>PACKING SHELF</span><b>空き {empty}マス</b></div><div className="board">{board.map((cell,i)=><button key={i} className={`cell ${cell.kind} ${cell.kind==="crate"?`damage-${cell.max-cell.hp}`:""} ${cell.kind==="open"&&!cell.buns.length?"droppable":""}`} onClick={()=>selected!==null&&place(selected,i)} onDragOver={e=>{if(cell.kind==="open"&&!cell.buns.length)e.preventDefault();}} onDrop={e=>{e.preventDefault();place(Number(e.dataTransfer.getData("tray")),i);}} aria-label={cell.kind==="crate"?`マーパン配送箱、残り耐久${cell.hp}`:cell.buns.length?`トレー パン${cell.buns.length}個`:"空きマス"}>{cell.kind==="crate"?<span className="bread-box"><i className="box-tape"/><b>マー<br/>パン</b><em>{Array.from({length:cell.hp},(_,j)=><i key={j}/>)}</em></span>:<div className="bun-stack">{cell.buns.map((c,j)=><Marupan key={j} bread={c} small/>)}</div>}</button>)}</div></section>
    <section className="hand"><div className="hand-title"><span>NEXT TRAYS</span><small>選んでから空きマスをタップでもOK</small></div><div className="trays">{hand.map((tray,i)=><button draggable onDragStart={e=>e.dataTransfer.setData("tray",String(tray.id))} onClick={()=>setSelected(tray.id)} className={`tray ${selected===tray.id?"selected":""}`} key={tray.id} aria-label={`${i+1}番目の手持ち、パン${tray.buns.length}個`}>{tray.buns.map((c,j)=><Marupan key={j} bread={c}/>)}</button>)}</div></section>
    {gameOver&&<div className="modal"><div className="modal-card"><span className="stamp">CLOSED</span><h2>本日の受付終了</h2><p>置ける棚がなくなりました。<br/>スコア <b>{score}</b> / コイン <b>{coins}</b></p><button className="primary" onClick={reset}>もう一度あそぶ</button></div></div>}
    {showHelp&&<div className="modal"><div className="modal-card help"><span className="tag">HOW TO PACK</span><h2>同じパンを6個で出荷！</h2><ol><li><b>手持ち箱</b>を空き棚へ置く</li><li>隣り合う同じ種類を<b>6個ちょうど</b>にする</li><li>出荷すると箱が壊れ、棚が広がる</li></ol><p className="warning">7個以上つなぐと出荷できないので注意。</p><button className="primary" onClick={()=>setShowHelp(false)}>工房をひらく</button></div></div>}
  </section></main>;
}
