// A part stays in this.parts from the building to the ground. Its state changes,
// but drawing, hit testing and crushing always refer to the same object.
class Building {
  constructor() {
    this.parts = [];
    this.nextId = 0;
    this.danger = 0;
    this.phase = 'stable';
    this.phaseTime = 0;
    this.collapseFloor = 0;
    this.direction = 0;
    this.creakClock = 0;
    this.impact = false;
    this.complete = false;
    this.make();
    this.assess();
  }

  add(kind, floor, x, y, w, h, state = 'attached', angle = 0) {
    const hp = kind === 'wall' ? 1.5 : kind === 'column' ? 2.4 : 2.1;
    const p = {
      id: this.nextId++, kind, floor, x, y, w, h, angle, state,
      hp, maxHp: hp, material: kind === 'column' || kind === 'beam' ? 'steel' : 'concrete',
      mass: kind === 'wall' ? 1.1 : kind === 'column' ? .5 : kind === 'floor' ? 1.4 : .9,
      capacity: kind === 'column' ? [7.8, 5.9, 4.5, 2.8][floor] : 0,
      load: 0, damage: 0, supports: [], vx: 0, vy: 0, spin: 0, delay: 0,
      fallAge: 0, bend: 0
    };
    this.parts.push(p);
    return p;
  }

  make() {
    for (let f = 0; f < 4; f++) {
      const y = ground - (f + 1) * 104;
      this.add('floor', f, 306, y + 91, 392, 16);
      this.add('beam', f, 310, y + 3, 384, 12);
      for (const x of [314, 492, 674]) this.add('column', f, x, y + 12, 16, 79);
      for (let j = 0; j < 2; j++) this.add('wall', f, 332 + j * 180, y + 17, 159, 70);
    }
  }

  // Inverse rotate the crusher tip into the part's local rectangle.
  contains(p, x, y, margin = 10) {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const dx = x - cx, dy = y - cy;
    const c = Math.cos(p.angle), s = Math.sin(p.angle);
    const lx = dx * c + dy * s, ly = -dx * s + dy * c;
    return Math.abs(lx) <= p.w / 2 + margin && Math.abs(ly) <= p.h / 2 + margin;
  }

  hit(x, y) {
    // Detached parts draw on top of the standing structure and get first chance.
    return [...this.parts].reverse().find(p => p.state !== 'gone' && this.contains(p, x, y));
  }

  crushPoint(p) { return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; }

  damage(p, amount, effects, sound) {
    if (!p || p.state === 'gone' || this.phase === 'pause' || this.phase === 'warning') return;
    p.hp -= amount;
    p.damage = clamp(1 - p.hp / p.maxHp, 0, 1);
    p.bend = Math.min(.11, p.bend + .018);
    const at = this.crushPoint(p);
    effects.burst(at.x, at.y, p.material === 'steel' ? 2 : 3);
    if (p.material === 'steel') sound.creak();
    else sound.crack(.55);
    if (p.hp <= 0) {
      this.breakPart(p, effects, sound);
      if (p.state === 'gone') this.assess(p);
    } else if (p.state === 'attached') this.assess(p);
    this.complete = this.parts.every(part => part.state === 'gone');
  }

  breakPart(p, effects, sound) {
    const stateBefore = p.state;
    p.state = 'gone';
    const at = this.crushPoint(p);
    effects.burst(at.x, at.y, p.material === 'steel' ? 9 : 16, true);
    sound.crack(p.material === 'steel' ? 1.6 : 1);
    const long = Math.max(p.w, p.h);
    if (long <= 48) return;
    const count = long > 250 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const horizontal = p.w >= p.h;
      const w = horizontal ? p.w / count : p.w;
      const h = horizontal ? p.h : p.h / count;
      const ox = horizontal ? (i + .5) * w - p.w / 2 : 0;
      const oy = horizontal ? 0 : (i + .5) * h - p.h / 2;
      const c = Math.cos(p.angle), s = Math.sin(p.angle);
      const centerX = at.x + ox * c - oy * s;
      const centerY = at.y + ox * s + oy * c;
      const piece = this.add(p.kind, p.floor, centerX - w / 2, centerY - h / 2, w, h, 'falling', p.angle + rand(-.12, .12));
      piece.hp = piece.maxHp = Math.max(.75, p.maxHp * .62);
      piece.vx = p.vx + rand(-85, 85);
      piece.vy = p.vy - rand(45, 110);
      piece.spin = rand(-1.4, 1.4);
      piece.delay = 0;
      piece.fallAge = 0;
    }
    if (stateBefore === 'attached') this.assess(p);
  }

  assess(trigger = null) {
    let peak = 0, critical = null;
    for (let f = 3; f >= 0; f--) {
      const overhead = this.parts.filter(p => p.state === 'attached' && p.floor >= f && p.kind !== 'column');
      const mass = overhead.reduce((n, p) => n + p.mass, 0);
      const cols = this.parts.filter(p => p.state === 'attached' && p.floor === f && p.kind === 'column');
      const share = cols.length ? mass / cols.length : 0;
      for (const p of cols) {
        p.supports = overhead.map(q => q.id);
        const outside = p.x < 400 || p.x > 600;
        p.load = share * (cols.length === 2 && cols.some(q => q.x === 492) && outside ? 1.25 : 1);
        p.damage = clamp(1 - p.hp / p.maxHp, 0, 1);
        const ratio = p.load / (p.capacity * (1 - .42 * p.damage));
        peak = Math.max(peak, ratio);
        if (ratio > 1.08 && (!critical || f < critical.floor)) critical = p;
      }
      if (!cols.length && mass > 1.5) {
        critical = { floor: f, x: trigger?.x ?? 500 };
        peak = Math.max(peak, 2);
      }
    }
    this.danger = peak;
    if (critical && this.phase === 'stable') {
      this.phase = 'pause';
      this.phaseTime = 0;
      this.collapseFloor = critical.floor;
      const x = trigger?.kind === 'column' ? trigger.x : critical.x;
      this.direction = x < 410 ? -1 : x > 600 ? 1 :
        (this.parts.filter(p => p.state === 'attached' && p.floor === critical.floor && p.kind === 'column')
          .reduce((n, p) => n + p.x, 0) > 500 ? -1 : 1);
    }
  }

  update(dt, effects, sound) {
    this.creakClock -= dt;
    if (this.phase === 'stable' && this.danger > .63) {
      if (this.creakClock <= 0) { sound.creak(); this.creakClock = this.danger > .85 ? .85 : 2.2; }
      if (Math.random() < dt * 5) effects.burst(rand(320, 690), rand(200, 520), 1);
    } else if (this.phase === 'pause') {
      this.phaseTime += dt;
      if (this.phaseTime > .38) { this.phase = 'warning'; this.phaseTime = 0; sound.creak(); }
    } else if (this.phase === 'warning') {
      this.phaseTime += dt;
      if (this.creakClock <= 0) { sound.creak(); this.creakClock = .65; }
      if (Math.random() < dt * 12) effects.burst(rand(320, 690), rand(180, 520), 2);
      if (this.phaseTime > 1.45) {
        const overloaded = this.parts.filter(p => p.state === 'attached' && p.kind === 'column' && p.floor === this.collapseFloor)
          .sort((a, b) => b.load / b.capacity - a.load / a.capacity)[0];
        if (overloaded) { overloaded.hp = .25; overloaded.damage = .9; effects.burst(overloaded.x, overloaded.y + 40, 18, true); sound.crack(1.6); }
        this.startCollapse(effects, sound);
      }
    } else if (this.phase === 'falling') {
      this.phaseTime += dt;
      if (this.phaseTime > 3.5) { this.phase = 'stable'; this.phaseTime = 0; this.assess(); }
    }

    for (const p of this.parts) {
      if (p.state !== 'falling') continue;
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.fallAge += dt;
      p.vy += 750 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle = clamp(p.angle + p.spin * dt, -1.2, 1.2);
      const c = Math.abs(Math.cos(p.angle)), s = Math.abs(Math.sin(p.angle));
      const extentY = (p.w * s + p.h * c) / 2;
      const bottom = p.y + p.h / 2 + extentY;
      const support = this.parts.filter(q => q.state === 'attached' && q.floor < p.floor && (q.kind === 'floor' || q.kind === 'beam') &&
        p.x + p.w > q.x && p.x < q.x + q.w && p.y < q.y && bottom >= q.y).sort((a, b) => a.y - b.y)[0];
      const landingY = support?.y ?? ground;
      if (p.vy > 0 && bottom >= landingY) {
        p.y += landingY - bottom;
        p.vy *= -.13;
        p.vx *= .72;
        p.spin *= .42;
        if (p.fallAge > .42) p.state = 'fallen';
      }
      p.x = clamp(p.x, 70, 1080);
      if (!this.impact && this.direction > 0 && this.phase === 'falling' && p.x + p.w > 843 && p.y + p.h > 405 && p.y < 558) this.impact = true;
    }
  }

  startCollapse(effects, sound) {
    this.phase = 'falling';
    this.phaseTime = 0;
    let i = 0;
    for (const p of this.parts.filter(p => p.state === 'attached' && p.floor >= this.collapseFloor)) {
      p.state = 'falling';
      p.vx = this.direction * rand(105, 210) + (p.x - 500) * .12;
      p.vy = rand(-50, 30);
      p.spin = this.direction * rand(.8, 2.2);
      p.delay = i++ * .035;
      p.fallAge = 0;
      effects.burst(p.x + p.w / 2, p.y + p.h / 2, 3, true);
    }
    sound.crack(2);
  }

  drawPart(p) {
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate(p.angle + p.bend);
    const x = -p.w / 2, y = -p.h / 2;
    ctx.fillStyle = p.kind === 'wall' ? '#f4e6cc' : p.kind === 'column' ? '#a7a9a2' : '#c1c1b5';
    ctx.strokeStyle = '#555f59'; ctx.lineWidth = 3;
    ctx.fillRect(x, y, p.w, p.h); ctx.strokeRect(x, y, p.w, p.h);
    if (p.kind === 'wall' && p.w > 90 && p.h > 55) {
      ctx.fillStyle = '#94bbbf'; ctx.fillRect(x + p.w * .3, y + 10, p.w * .34, p.h * .6);
      ctx.strokeRect(x + p.w * .3, y + 10, p.w * .34, p.h * .6);
    }
    if (p.hp < p.maxHp || p.kind === 'column' && p.load > p.capacity * .97 || this.phase === 'warning' && p.floor === this.collapseFloor) {
      ctx.strokeStyle = '#5f5d59'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + p.w * .43, y); ctx.lineTo(x + p.w * .5, y + p.h * .4);
      ctx.lineTo(x + p.w * .38, y + p.h * .7); ctx.lineTo(x + p.w * .58, y + p.h); ctx.stroke();
    }
    ctx.restore();
  }

  draw() {
    const tilt = this.phase === 'warning' ? this.direction * Math.min(this.phaseTime * 3.4, 5) :
      this.phase === 'stable' && this.danger > .63 ? Math.sin(time * 3) * this.danger * .4 : 0;
    ctx.save(); ctx.translate(500, ground); ctx.rotate(tilt * Math.PI / 180); ctx.translate(-500, -ground);
    for (const p of this.parts) if (p.state === 'attached') this.drawPart(p);
    ctx.restore();
    for (const p of this.parts) if (p.state === 'falling' && p.delay <= 0 || p.state === 'fallen') this.drawPart(p);
  }
}
