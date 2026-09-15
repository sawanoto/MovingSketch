const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../melody.js');
require('../engine.js');
function random(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
test('full song is 42 notes / 48 beats and underground section is exactly its first twelve notes', () => {
  assert.equal(MineSong.melody.length, 42);
  assert.equal(MineSong.melody.reduce((sum, event) => sum + event.beats, 0), 48);
  assert.deepEqual(MineSong.melody.slice(0,12).map(event => event.pitch), ['C4','C4','G4','G4','A4','A4','G4','F4','F4','E4','E4','D4']);
  assert.equal(MineSong.melody[12].pitch, 'D4');
  assert.equal(MineSong.melody[13].pitch, 'C4');
});
test('100 boards contain twelve distinct hidden mines and correct eight-neighbor counts', () => {
  for (let seed = 0; seed < 100; seed++) {
    const board = new MusicMineBoard(MineSong, random(seed));
    assert.equal(new Set(board.mines).size,12);
    assert.equal(board.cells.filter(c => c.opened).length,0);
    for (const cell of board.cells) {
      const count = board.mines.filter(i => i !== cell.index && Math.abs(i % 8 - cell.index % 8) <= 1 && Math.abs(Math.floor(i/8)-Math.floor(cell.index/8)) <= 1).length;
      assert.equal(cell.count,count);
    }
  }
});
test('every possible hit starts C4 at that cell, visits all twelve once, then all thirty outside in order', () => {
  for (let seed = 0; seed < 20; seed++) {
    const layout = new MusicMineBoard(MineSong,random(seed));
    for (const trigger of layout.mines) {
      const board = new MusicMineBoard(MineSong,random(seed));
      assert.equal(board.open(trigger),'mine');
      assert.equal(board.phase,'chain');
      assert.equal(board.chain[0].cell,trigger);
      assert.equal(board.chain[0].pitch,'C4');
      assert.equal(new Set(board.chain.slice(0,12).map(e=>e.cell)).size,12);
      assert.deepEqual(board.chain.slice(0,12).map(e=>e.cell).sort((a,b)=>a-b),board.mines);
      assert.deepEqual(board.chain.slice(12).map(e=>e.outer),Array.from({length:30},(_,i)=>i));
      assert.ok(board.chain.slice(12).every(e=>e.cell===null));
      assert.deepEqual(board.chain.map(e=>e.pitch),MineSong.melody.map(e=>e.pitch));
      assert.ok(Math.abs(board.chain[12].at - 13 * 60000 / MineSong.bpm) < 0.00001);
      assert.equal(board.open(board.cells.find(c=>!c.mine).index),null);
      assert.equal(board.mark(board.mines[1]),false);
      board.finish();
      assert.equal(board.phase,'finished');
      assert.equal(board.open(0),null);
    }
  }
});
test('flooding reveals only safe cells and all safe cells trigger a successful performance', () => {
  for (let seed=0; seed<50; seed++) {
    const board=new MusicMineBoard(MineSong,random(seed));
    const zero=board.cells.find(c=>!c.mine && !c.count);
    if(zero) { board.open(zero.index); assert.ok(board.safeOpened>1); }
    assert.ok(board.mines.every(index=>!board.cells[index].opened));
    board.cells.filter(c=>!c.mine).forEach(c=>board.open(c.index));
    assert.equal(board.safeOpened,52);
    assert.equal(board.phase,'chain');
    assert.equal(board.outcome,'clear');
    assert.equal(board.chain.length,42);
    assert.equal(board.chain[0].cell,board.mines[0]);
  }
});
test('marks are candidates only and block opening until removed', () => {
  const board=new MusicMineBoard(MineSong,random(7)), mine=board.mines[0];
  board.mark(mine); assert.equal(board.open(mine),null); assert.equal(board.phase,'playing');
  board.mark(mine); assert.equal(board.open(mine),'mine');
});

