const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function harness() {
  class Element {
    constructor() { this.handlers = {}; this.dataset = {}; this.style = { setProperty() {} }; this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } }; }
    addEventListener(name, fn) { this.handlers[name] = fn; }
    setAttribute() {}
    removeAttribute(name) { if (name === 'data-count') delete this.dataset.count; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 40, height: 40 }; }
    querySelector() { return this; }
    querySelectorAll() { return []; }
    closest() { return this; }
  }
  const elements = new Map(), cells = Array.from({ length: 64 }, (_, index) => Object.assign(new Element(), { dataset: { index: String(index) } }));
  const measures = Array.from({ length: 12 }, () => new Element());
  const $ = selector => { if (!elements.has(selector)) elements.set(selector, new Element()); return elements.get(selector); };
  const timers = new Map(); let serial = 0, clock = 0;
  const window = new Element();
  const document = Object.assign(new Element(), { querySelector: $, querySelectorAll: s => s === '.cell' ? cells : measures, hidden: false });
  const context = vm.createContext({
    document,
    window, matchMedia: () => ({ matches: false }), performance: { now: () => clock },
    setTimeout: fn => { timers.set(++serial, fn); return serial; }, clearTimeout: id => timers.delete(id),
    MarpanSound: class { constructor() { this.context = null; } },
    Marpan25D: class { setBodyColor() {} }, console
  });
  for (const file of ['melody.js', 'engine.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  const run = code => vm.runInContext(code, context);
  run('soundOn = false; startGame()');
  const fire = (name, index, extras = {}) => $('#board').handlers[name]({ target: cells[index], button: 0, pointerType: 'touch', pointerId: 1, clientX: 0, clientY: 0, preventDefault() {}, ...extras });
  return { run, fire, window, document, timers, $, setClock: value => { clock = value; }, tick: () => { clock += 500; for (const fn of [...timers.values()]) fn(); } };
}

test('touch long press marks without also revealing; a second long press removes it', () => {
  const h = harness();
  h.fire('pointerdown', 0); h.tick(); h.window.handlers.pointerup(); h.fire('click', 0);
  assert.equal(h.run('model.cells[0].marked'), true);
  assert.equal(h.run('model.cells[0].opened'), false);
  h.fire('pointerdown', 0); h.tick(); h.window.handlers.pointerup(); h.fire('click', 0);
  assert.equal(h.run('model.cells[0].marked'), false);
  assert.equal(h.run('model.cells[0].opened'), false);
});
test('scrolling cancels long press and suppresses accidental opening', () => {
  const h = harness();
  h.fire('pointerdown', 0); h.fire('pointermove', 0, { clientY: 30 }); h.tick(); h.fire('click', 0);
  assert.equal(h.run('model.cells[0].marked || model.cells[0].opened'), false);
  assert.equal(h.timers.size, 0);
});
test('repeated mouse right clicks toggle marks, and keyboard opening works afterward', () => {
  const h = harness();
  for (let repeat = 0; repeat < 2; repeat++) {
    h.fire('pointerdown', 0, { pointerType: 'mouse', button: 2 }); h.fire('contextmenu', 0);
    assert.equal(h.run('model.cells[0].marked'), repeat === 0);
  }
  h.fire('keydown', 0, { key: 'Enter' }); h.fire('click', 0);
  assert.equal(h.run('model.cells[0].opened || model.phase === "chain"'), true);
});
test('restart clears playback and pending long presses', () => {
  const h = harness();
  h.fire('pointerdown', 0);
  h.run('transport = { full: true }; startGame()');
  assert.equal(h.run('transport'), null);
  assert.equal(h.timers.size, 0);
  assert.equal(h.run('model.phase'), 'playing');
});

test('first hit locks controls and bursts in the same tick as note one; 12 internal and 30 external notes follow', () => {
  const h = harness();
  h.run('var played = []; playNote = event => played.push({position:event.position,pitch:event.pitch,at:performance.now(),burst:actors[event.position].burstAt});');
  assert.equal(h.run('actors.filter(a=>a.visible).length'),30);
  h.run('reveal(model.mines[5])');
  assert.equal(h.run('transport.cursor'),1);
  assert.equal(h.run('played[0].pitch'),'C4');
  assert.equal(h.$('#again').hidden,true);
  assert.equal(h.run('buttons.every(b=>b.disabled)'),true);
  assert.equal(h.run('actors.slice(0,12).filter(a=>a.visible).length'),1);
  const safeBefore = h.run('model.safeOpened');
  h.run('reveal(model.cells.find(c=>!c.mine).index)');
  assert.equal(h.run('model.safeOpened'),safeBefore);
  for (let i=1;i<42;i++) {
    const time = h.run('model.chain['+i+'].at');
    h.setClock(time); h.run('tickTransport(performance.now())');
    assert.equal(h.run('played.length'),i+1);
    if(i===11) assert.equal(h.run('model.cells.filter(c=>c.sounded).length'),12);
  }
  assert.equal(h.run('played.every(e=>e.at===e.burst)'),true);
  assert.equal(h.run('actors.filter(a=>a.sounded).length'),42);
  assert.equal(h.$('#again').hidden,true);
  h.setClock(h.run('model.duration + 451')); h.run('tickTransport(performance.now())');
  assert.equal(h.run('model.phase'),'finished');
  assert.equal(h.$('#again').hidden,false);
});

test('clear reveals all twelve mines and stalled frames delay rather than drop notes', () => {
  const h=harness();
  h.run('model.cells.filter(c=>!c.mine).forEach(c=>reveal(c.index))');
  assert.equal(h.run('model.outcome'),'clear');
  assert.equal(h.run('actors.slice(0,12).every(a=>a.visible)'),true);
  h.setClock(10000); h.run('tickTransport(performance.now())');
  assert.equal(h.run('transport.cursor'),2);
  assert.equal(h.run('model.cells.filter(c=>c.sounded).length'),2);
  h.run('tickTransport(performance.now())');
  assert.equal(h.run('transport.cursor'),2);
});

test('backgrounding pauses the timeline and resumes the next note without finishing early', () => {
  const h=harness();
  h.run('reveal(model.mines[0])');
  h.setClock(100); h.document.hidden=true; h.document.handlers.visibilitychange();
  h.setClock(10000); h.run('tickTransport(performance.now())');
  assert.equal(h.run('transport.cursor'),1);
  h.document.hidden=false; h.document.handlers.visibilitychange();
  h.run('tickTransport(performance.now())');
  assert.equal(h.run('transport.cursor'),1);
  h.setClock(h.run('transport.start + model.chain[1].at'));
  h.run('tickTransport(performance.now())');
  assert.equal(h.run('transport.cursor'),2);
});

test('the twelve-to-thirteen handoff crosses the right board edge and all outer notes have distinct clockwise positions', () => {
  const h=harness();
  h.run('reveal(model.mines[0])');
  assert.equal(h.run('linkPoints(11)[1].x'),450);
  assert.equal(h.run('linkPoints(11).at(-1).x'),475);
  assert.equal(h.run('linkPoints(11).at(-1).y'),25);
  assert.equal(h.run('new Set(Array.from({length:30},(_,i)=>JSON.stringify(outerPoint(i)))).size'),30);
  assert.equal(h.run('outerPoint(1).x === outerPoint(0).x && outerPoint(1).y > outerPoint(0).y'),true);
  assert.equal(h.run('outerPoint(10).x < outerPoint(9).x && outerPoint(10).y === outerPoint(9).y'),true);
});
