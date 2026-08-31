const assert = require("node:assert/strict");
const g = require("./game.js");

const start = g.initialBoard();
assert.deepEqual(g.countPieces(start), {black:2,white:2});
assert.equal(g.legalMoves(start,g.BLACK).length,4,"初期盤面の黒の合法手は4つ");
assert.equal(g.legalMoves(start,g.WHITE).length,4,"初期盤面の白の合法手は4つ");

const move = g.legalMoves(start,g.BLACK).find(m=>m.row===2&&m.col===3);
assert.ok(move); assert.equal(move.flipCount,1);
const after = g.applyMove(start,move,g.BLACK);
assert.deepEqual(g.countPieces(after),{black:4,white:1});
assert.equal(start[3][3],g.WHITE,"applyMoveは元盤面を変更しない");

const multi = Array.from({length:8},()=>Array(8).fill(g.EMPTY));
multi[3][1]=g.BLACK; multi[3][2]=g.WHITE; multi[1][3]=g.BLACK; multi[2][3]=g.WHITE;
multi[1][1]=g.BLACK; multi[2][2]=g.WHITE;
const groups=g.flipsForMove(multi,3,3,g.BLACK);
assert.equal(groups.length,3,"横・縦・斜めの3方向を同時に判定");
assert.equal(groups.reduce((n,x)=>n+x.cells.length,0),3);

const noMoves=Array.from({length:8},()=>Array(8).fill(g.BLACK)); noMoves[7][7]=g.EMPTY;
assert.equal(g.legalMoves(noMoves,g.WHITE).length,0,"合法手なしを検出");
assert.equal(g.legalMoves(noMoves,g.BLACK).length,0,"両者合法手なしで終局可能");
assert.deepEqual(Array.from({length:8},(_,i)=>g.melodyMidi(i)),[60,62,64,65,67,69,71,72],"1〜8体はドレミファソラシド");
assert.deepEqual(Array.from({length:8},(_,i)=>g.melodyName(i)),["ド","レ","ミ","ファ","ソ","ラ","シ","ド"]);
assert.deepEqual(g.coordinateChord(0,0),[60,60],"左上はド＋ド");
assert.deepEqual(g.coordinateChord(0,2),[60,64],"1行3列はド＋ミ");
assert.deepEqual(g.coordinateChord(1,4),[62,67],"2行5列はレ＋ソ");
assert.deepEqual(g.coordinateChord(7,7),[72,72],"右下は高いド＋高いド");
const finalA=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r+c)%3?g.BLACK:g.WHITE));
const finalB=finalA.map(row=>row.slice()); finalB[0][0]=g.BLACK;
assert.deepEqual(g.boardMusicEvents(finalA,g.BLACK),g.boardMusicEvents(finalA,g.BLACK),"同じ盤面は同じ音列とリズム");
assert.notDeepEqual(g.boardMusicEvents(finalA,g.BLACK),g.boardMusicEvents(finalB,g.BLACK),"異なる盤面は異なる曲");
console.log("Othello logic tests: OK");
