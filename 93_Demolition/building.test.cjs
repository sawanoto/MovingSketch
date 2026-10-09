const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const world = { ground: 568, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), rand: (a, b) => (a + b) / 2, time: 0, ctx: {}, Math };
vm.createContext(world);
vm.runInContext(fs.readFileSync(__dirname + '/building.js', 'utf8') + ';this.Building=Building', world);
const fx = { burst() {} }, sound = { crack() {}, creak() {} };
const advance = (b, seconds) => { for (let i = 0; i < seconds * 60; i++) b.update(1 / 60, fx, sound); };

const intact = new world.Building();
assert.equal(intact.phase, 'stable');
assert.equal(intact.parts.filter(p => p.state === 'attached').length, 28);

for (const [x, direction, impact] of [[314, -1, false], [674, 1, true]]) {
  const b = new world.Building();
  const col = b.parts.find(p => p.kind === 'column' && p.floor === 0 && p.x === x);
  col.state = 'gone'; b.assess(col); advance(b, 6);
  assert.equal(b.direction, direction);
  assert.equal(b.impact, impact);
  assert.equal(b.phase, 'stable');
  const fallen = b.parts.find(p => p.state === 'fallen' && p.kind === 'beam');
  assert.ok(fallen, 'a fallen beam remains in the target array');
  const cx = fallen.x + fallen.w / 2, cy = fallen.y + fallen.h / 2;
  assert.ok(b.hit(cx, cy), 'fallen beam is hit at its visible center');
  const oldCount = b.parts.filter(p => p.state !== 'gone').length;
  b.damage(fallen, fallen.hp + 1, fx, sound);
  assert.equal(fallen.state, 'gone');
  assert.ok(b.parts.filter(p => p.state !== 'gone').length > oldCount, 'long beam splits into crushable pieces');
}

const rotated = new world.Building();
const beam = rotated.parts.find(p => p.kind === 'beam' && p.floor === 0);
beam.state = 'fallen'; beam.x = 400; beam.y = 400; beam.angle = Math.PI / 4;
const alongX = (beam.w / 2 - 18) * Math.cos(beam.angle);
const alongY = (beam.w / 2 - 18) * Math.sin(beam.angle);
assert.equal(rotated.hit(beam.x + beam.w / 2 + alongX, beam.y + beam.h / 2 + alongY), beam);

const topDown = new world.Building();
for (let floor = 3; floor >= 0; floor--) {
  for (const p of topDown.parts.filter(p => p.floor === floor && p.kind !== 'column')) { p.state = 'gone'; topDown.assess(p); }
  for (const p of topDown.parts.filter(p => p.floor === floor && p.kind === 'column')) { p.state = 'gone'; topDown.assess(p); }
}
assert.equal(topDown.phase, 'stable');
const completion = new world.Building();
for (let floor = 3; floor >= 0; floor--) {
  for (const kind of ['wall', 'floor', 'beam', 'column']) {
    for (const p of [...completion.parts].filter(p => p.floor === floor && p.kind === kind && p.state === 'attached')) {
      completion.damage(p, p.hp + 1, fx, sound);
    }
  }
}
for (let i = 0; i < completion.parts.length; i++) {
  const p = completion.parts[i];
  if (p.state !== 'gone') completion.damage(p, p.hp + 1, fx, sound);
}
assert.equal(completion.complete, true);
console.log('building state, rotated hit testing, crushable fallen beams, directional collapse, and safe order: OK');
