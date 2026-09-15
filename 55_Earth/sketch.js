(() => {
  "use strict";

  const canvas = document.querySelector("#earth");
  const ctx = canvas.getContext("2d");
  const range = document.querySelector("#reality");
  const amplifyButton = document.querySelector("#amplify");
  const scaleOutput = document.querySelector("#scale");
  const multipliers = [1, 10, 100];
  let ampIndex = 0, ideal = 1, targetIdeal = 1, rotation = 0, last = performance.now();
  let w = 0, h = 0, dpr = 1, stars = [], debris = [];
  const earthTexture = new Image();
  let textureReady = false;
  earthTexture.addEventListener("load", () => { textureReady = true; });
  earthTexture.src = "earth-texture.png";

  const continents = [
    [[-166,67],[-140,70],[-125,55],[-105,50],[-94,31],[-82,25],[-97,16],[-117,24],[-125,39],[-148,57]],
    [[-81,12],[-69,8],[-50,-3],[-36,-12],[-48,-28],[-57,-40],[-69,-54],[-76,-34]],
    [[-17,36],[2,37],[17,31],[33,30],[43,12],[51,-14],[34,-34],[17,-35],[6,-22],[-5,4]],
    [[-10,36],[7,48],[27,60],[53,67],[81,73],[118,61],[147,52],[160,40],[134,22],[106,7],[79,9],[60,24],[40,33],[28,41],[12,42]],
    [[112,-11],[132,-12],[153,-27],[146,-42],[121,-35]],
    [[-52,60],[-34,69],[-42,81],[-64,78]],
    [[43,-13],[50,-16],[49,-25],[44,-24]]
  ];

  function resize() {
    w = innerWidth; h = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const seed = (i) => { const x = Math.sin(i * 91.717) * 43758.5453; return x - Math.floor(x); };
    stars = Array.from({length: Math.min(190, Math.floor(w * h / 6500))}, (_, i) => ({x: seed(i) * w, y: seed(i + 317) * h, r: .25 + seed(i + 811) * 1.05, a: .18 + seed(i + 99) * .58}));
    debris = Array.from({length: 24}, (_, i) => ({a: seed(i + 41) * Math.PI * 2, orbit: 1.17 + seed(i + 72) * .42, tilt: -.6 + seed(i + 4) * 1.2, speed: (.035 + seed(i + 201) * .075) * (i % 2 ? 1 : -1), size: .8 + seed(i + 612) * 2.1, kind: i < 5 ? "sat" : i < 9 ? "rocket" : "dot"}));
  }

  function radiusAt(a, r, reality, mult) {
    const oblate = -.00335 * reality * mult * Math.cos(2 * a);
    const geoid = reality * mult * (.00022 * Math.sin(3 * a + rotation * .7) + .00013 * Math.sin(7 * a - 1.4));
    const terrain = reality * mult * .000045 * (Math.sin(19 * a + .8) + .45 * Math.sin(31 * a));
    return r * Math.max(.76, 1 + oblate + geoid + terrain);
  }

  function globePath(cx, cy, r, reality, mult) {
    const p = new Path2D(), steps = 180;
    for (let i = 0; i <= steps; i++) {
      const a = i / steps * Math.PI * 2, rr = radiusAt(a, r, reality, mult);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath(); return p;
  }

  function project(lon, lat, cx, cy, rx, ry) {
    const L = lon * Math.PI / 180 + rotation, P = lat * Math.PI / 180;
    const z = Math.cos(P) * Math.cos(L);
    return {x: cx + rx * Math.cos(P) * Math.sin(L), y: cy - ry * Math.sin(P), z};
  }

  function drawPolygon(points, cx, cy, rx, ry) {
    let segment = [];
    const flush = () => {
      if (segment.length > 2) { ctx.beginPath(); ctx.moveTo(segment[0].x, segment[0].y); segment.slice(1).forEach(p => ctx.lineTo(p.x,p.y)); ctx.closePath(); ctx.fill(); }
      segment = [];
    };
    points.concat([points[0]]).forEach(([lon,lat]) => { const p = project(lon,lat,cx,cy,rx,ry); if (p.z > -.04) segment.push(p); else flush(); });
    flush();
  }

  function drawDebris(cx, cy, r, reality, time) {
    ctx.save(); ctx.globalAlpha = Math.pow(reality, 1.45) * .72;
    debris.slice().sort((a,b) => Math.sin(a.a + time*a.speed) - Math.sin(b.a + time*b.speed)).forEach((d, i) => {
      const a = d.a + time * d.speed, x = cx + Math.cos(a) * r * d.orbit, y = cy + Math.sin(a) * r * d.orbit * (.28 + Math.abs(d.tilt) * .22) + Math.sin(a) * d.tilt * r * .12;
      const s = d.size * Math.max(.72, r / 270); ctx.save(); ctx.translate(x,y); ctx.rotate(a + Math.PI/2);
      ctx.fillStyle = i % 4 === 0 ? "#b7cadd" : "#788a99";
      if (d.kind === "sat") { ctx.fillRect(-s*1.8,-s*.55,s*3.6,s*1.1); ctx.fillStyle="#52769b"; ctx.fillRect(-s*4,-s*.28,s*1.9,s*.56); ctx.fillRect(s*2.1,-s*.28,s*1.9,s*.56); }
      else if (d.kind === "rocket") ctx.fillRect(-s*1.8,-s*.45,s*3.6,s*.9);
      else { ctx.beginPath(); ctx.arc(0,0,s*.55,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    }); ctx.restore();
  }

  function drawTextureSphere(cx, cy, rx, ry) {
    if (!textureReady) return;
    const strips = Math.max(150, Math.round(rx * .72));
    const turn = ((rotation / (Math.PI * 2)) % 1 + 1) % 1;
    for (let i = 0; i < strips; i++) {
      const x0 = -1 + i * 2 / strips, x1 = -1 + (i + 1) * 2 / strips;
      const mid = (x0 + x1) * .5, lon = Math.asin(mid) / (Math.PI * 2);
      let u = ((.5 + lon - turn) % 1 + 1) % 1;
      const sx = Math.floor(u * earthTexture.width), sw = Math.max(1, Math.ceil(earthTexture.width / strips * 1.8));
      const dx = cx + x0 * rx - .5, dw = (x1 - x0) * rx + 1.25;
      const chord = Math.sqrt(Math.max(0, 1 - mid * mid));
      const dy = cy - ry * chord, dh = ry * chord * 2;
      if (sx + sw <= earthTexture.width) ctx.drawImage(earthTexture, sx, 0, sw, earthTexture.height, dx, dy, dw, dh);
      else {
        const first = earthTexture.width - sx, ratio = first / sw;
        ctx.drawImage(earthTexture, sx, 0, first, earthTexture.height, dx, dy, dw * ratio, dh);
        ctx.drawImage(earthTexture, 0, 0, sw - first, earthTexture.height, dx + dw * ratio, dy, dw * (1-ratio), dh);
      }
    }
  }

  function drawEyes(cx, cy, r, rx, ry, look, time) {
    // Matches shared/marpan-25d.js: three eyes at longitudes ±0.44,
    // 1.08 height ratio, 38% pupils, and the same restrained black outline.
    const blinkPhase = time % 6100, blink = blinkPhase > 5900 ? Math.max(.055, Math.abs((blinkPhase-6000)/100)) : 1;
    [-.44, 0, .44].forEach((longitude) => {
      const depth = Math.cos(longitude), ex = cx + Math.sin(longitude) * rx * .94;
      const ey = cy - ry * .045, eyeW = r * .383 * (.76 + depth * .24) * depth, eyeH = r * .383 * 1.08 * (.76 + depth * .24) * blink;
      const pupilX = look * eyeW * .2;
      ctx.save(); ctx.translate(ex,ey);
      ctx.shadowColor="rgba(0,0,0,.28)"; ctx.shadowBlur=r*.018;
      ctx.fillStyle="rgba(255,255,255,.97)"; ctx.strokeStyle="#121212"; ctx.lineWidth=Math.max(2,eyeW*.045);
      ctx.beginPath(); ctx.ellipse(0,0,eyeW*.5,eyeH*.5,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
      if (blink > .18) { ctx.fillStyle="#121212"; ctx.beginPath(); ctx.ellipse(pupilX,0,eyeW*.19,eyeW*.19,0,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    });
  }

  function drawScene(time) {
    ctx.clearRect(0,0,w,h);
    const bg = ctx.createRadialGradient(w*.5,h*.42,0,w*.5,h*.48,Math.max(w,h)*.76); bg.addColorStop(0,"#0a1727"); bg.addColorStop(.48,"#040b17"); bg.addColorStop(1,"#01040a"); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
    stars.forEach((s,i) => { ctx.globalAlpha=s.a*(.82+.18*Math.sin(time*.00035+i)); ctx.fillStyle="#d9e8f4"; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }); ctx.globalAlpha=1;

    const compact = h < 620, r = Math.min(w*.33, h*(compact?.335:.355), 330), cx=w/2, cy=h*(compact?.43:.44);
    const reality = 1-ideal, mult=multipliers[ampIndex], equator = Math.min(1.24, 1 + .00335*reality*mult), polar = Math.max(.76, 1 - .00335*reality*mult);
    drawDebris(cx,cy,r,reality,time*.001);
    const path=globePath(cx,cy,r,reality,mult);
    ctx.save(); ctx.shadowColor="rgba(76,165,230,.38)"; ctx.shadowBlur=r*.09; ctx.fillStyle="#0e659d"; ctx.fill(path); ctx.restore();
    ctx.save(); ctx.clip(path);
    const ocean=ctx.createRadialGradient(cx-r*.28,cy-r*.36,r*.05,cx,cy,r*1.2); ocean.addColorStop(0,"#43a8d2"); ocean.addColorStop(.52,"#126d9f"); ocean.addColorStop(1,"#052c52"); ctx.fillStyle=ocean; ctx.fillRect(cx-r*1.3,cy-r*1.3,r*2.6,r*2.6);
    drawTextureSphere(cx,cy,r*equator,r*polar);
    const daylight=ctx.createRadialGradient(cx-r*.33,cy-r*.34,r*.04,cx-r*.05,cy,r*1.17); daylight.addColorStop(0,"rgba(152,220,255,.18)"); daylight.addColorStop(.53,"rgba(0,0,0,0)"); daylight.addColorStop(.82,"rgba(0,5,16,.19)"); daylight.addColorStop(1,"rgba(0,2,10,.88)"); ctx.fillStyle=daylight; ctx.fillRect(cx-r*1.3,cy-r*1.3,r*2.6,r*2.6);
    const gloss=ctx.createRadialGradient(cx-r*.42,cy-r*.42,0,cx-r*.42,cy-r*.42,r*.72); gloss.addColorStop(0,"rgba(210,242,255,.2)"); gloss.addColorStop(.42,"rgba(150,215,255,.055)"); gloss.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=gloss; ctx.fillRect(cx-r,cy-r,r*2,r*2);
    ctx.restore();
    ctx.strokeStyle="rgba(143,214,255,.5)"; ctx.lineWidth=Math.max(1.2,r*.008); ctx.stroke(path);
    drawEyes(cx,cy,r,r*equator,r*polar,(ideal-.5)*2,time);
  }

  function frame(now) {
    const dt=Math.min(.05,(now-last)/1000); last=now; ideal += (targetIdeal-ideal)*Math.min(1,dt*11);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) rotation += dt*.055;
    drawScene(now); requestAnimationFrame(frame);
  }

  range.addEventListener("input", () => { targetIdeal=Number(range.value); });
  amplifyButton.addEventListener("click", () => { ampIndex=(ampIndex+1)%multipliers.length; scaleOutput.value=ampIndex===0?"実寸":`×${multipliers[ampIndex]}`; });
  addEventListener("resize",resize); resize(); requestAnimationFrame(frame);
})();
