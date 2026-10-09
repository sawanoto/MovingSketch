const BREAD_TYPES = ["burnt", "croissant", "melon", "toast", "pizza"];
const META = {
  burnt: { label: "こげマーパン", coin: 20, code: "B01" },
  croissant: { label: "クロワッサン", coin: 25, code: "B02" },
  melon: { label: "メロンパン", coin: 30, code: "B03" },
  toast: { label: "食パン", coin: 25, code: "B04" },
  pizza: { label: "ピザマーパン", coin: 35, code: "B05" }
};
const START_OPEN = new Set([6, 7, 11, 12, 16, 17]);
const CLEAR_RECORDS_KEY = "marupan-factory-clear-records-v1";

let serial = 0;
let audioContext = null;
let state = createInitialState();

function loadClearRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(CLEAR_RECORDS_KEY) || "[]");
    return Array.isArray(records) ? records.filter((record) => Number.isFinite(record.score)).slice(0, 10) : [];
  } catch {
    return [];
  }
}

function recordClearResult() {
  if (state.lastRecordId) return;
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    score: state.score,
    coins: state.coins,
    level: currentLevel(),
    date: new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }),
    clearedAt: Date.now()
  };
  const records = [...state.records, entry]
    .sort((a, b) => b.score - a.score || b.coins - a.coins || b.clearedAt - a.clearedAt)
    .slice(0, 10);
  state.records = records;
  state.lastRecordId = entry.id;
  try { localStorage.setItem(CLEAR_RECORDS_KEY, JSON.stringify(records)); } catch {}
}

function leaderboardMarkup() {
  if (!state.records.length) return `<p class="no-records">まだ記録がありません</p>`;
  return `<ol class="leaderboard">${state.records.map((record, index) => `<li class="${record.id === state.lastRecordId ? "latest" : ""}"><b>${index + 1}</b><span>${record.score.toLocaleString()} pt</span><small>${record.coins} coin</small><time>${record.date}</time></li>`).join("")}</ol>`;
}

function createInitialState() {
  return {
    board: createBoard(),
    hand: initialHand(),
    selected: null,
    score: 0,
    coins: 0,
    shipments: 0,
    order: "burnt",
    time: 60,
    sound: true,
    toast: "盤面のどこでも、周囲3×3で同じ種類を5個以上集めよう！",
    shipping: null,
    records: loadClearRecords(),
    lastRecordId: null,
    showHelp: true
  };
}

function createBoard() {
  return Array.from({ length: 25 }, (_, index) => {
    if (START_OPEN.has(index)) return { kind: "open", buns: [] };
    const max = index % 3 === 0 ? 1 : index % 3 === 1 ? 2 : 3;
    return { kind: "crate", hp: max, max };
  });
}

function currentLevel() {
  return 1 + Math.floor(state.shipments / 2);
}

function randomTray() {
  const count = 2 + Math.floor(Math.random() * 4);
  return {
    id: ++serial,
    buns: Array.from({ length: count }, () => BREAD_TYPES[Math.floor(Math.random() * BREAD_TYPES.length)])
  };
}

function makeHand() {
  return Array.from({ length: 3 }, () => randomTray());
}

function initialHand() {
  return [
    { id: ++serial, buns: ["burnt", "croissant"] },
    { id: ++serial, buns: ["melon", "melon", "toast"] },
    { id: ++serial, buns: ["pizza", "burnt", "croissant", "toast"] }
  ];
}

function neighbors(index) {
  const row = Math.floor(index / 5);
  const column = index % 5;
  return [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1]]
    .filter(([y, x]) => y >= 0 && y < 5 && x >= 0 && x < 5)
    .map(([y, x]) => y * 5 + x);
}

function cloneBoard(board) {
  return board.map((cell) => cell.kind === "open"
    ? { kind: "open", buns: [...cell.buns] }
    : { kind: "crate", hp: cell.hp, max: cell.max });
}

function bunMarkup(bread, small = false, reach = false, flight = null) {
  const style = flight ? ` style="--fly-x:${flight.x}px;--fly-y:${flight.y}px;--fly-delay:${flight.delay}ms"` : "";
  return `<span class="marupan ${bread}${small ? " small" : ""}${reach ? " reach" : ""}${flight ? " shipping-bun" : ""}"${style} title="${META[bread].label}${reach ? "（リーチ）" : ""}"><span class="bread-decor"></span><span class="bread-eyes"><i></i><i></i><i></i></span></span>`;
}

function findReachBuns(board) {
  const marked = new Map();
  for (let center = 0; center < 25; center += 1) {
    const nearby = neighborhoodThrough(board, center);
    const counts = new Map();
    for (const cellIndex of nearby) {
      for (const bread of board[cellIndex].buns) counts.set(bread, (counts.get(bread) || 0) + 1);
    }
    for (const [bread, count] of counts) {
      if (count !== 4) continue;
      for (const cellIndex of nearby) {
        if (!board[cellIndex].buns.includes(bread)) continue;
        if (!marked.has(cellIndex)) marked.set(cellIndex, new Set());
        marked.get(cellIndex).add(bread);
      }
    }
  }
  return marked;
}

function breadBoxMarkup(cell) {
  return `<span class="bread-box"><i class="box-tape"></i><b>マー<br>パン</b><em>${Array.from({ length: cell.hp }, () => "<i></i>").join("")}</em></span>`;
}

function emptyCount() {
  return state.board.filter((cell) => cell.kind === "open" && !cell.buns.length).length;
}

function isGameOver() {
  return !state.shipping && !isGameClear() && state.hand.length > 0 && emptyCount() === 0;
}

function isGameClear() {
  return state.board.every((cell) => cell.kind !== "crate");
}

function render() {
  document.documentElement.lang = language;
  document.title = language === "en" ? "Marupan Factory" : "マーパンファクトリー";
  const app = document.querySelector("#app");
  const level = currentLevel();
  const empty = emptyCount();
  const reaches = findReachBuns(state.board);
  const boardMarkup = state.board.map((cell, index) => {
    const isOpen = cell.kind === "open";
    const droppable = isOpen && !cell.buns.length;
    const classes = ["cell", cell.kind, droppable ? "droppable" : "", cell.kind === "crate" ? `damage-${cell.max - cell.hp}` : ""].filter(Boolean).join(" ");
    const label = cell.kind === "crate"
      ? `マーパン配送箱、残り耐久${cell.hp}`
      : cell.buns.length ? `トレー パン${cell.buns.length}個` : "空きマス";
    const content = cell.kind === "crate"
      ? breadBoxMarkup(cell)
      : `<div class="bun-stack">${cell.buns.map((bread, bunIndex) => {
          const collecting = state.shipping?.phase === "collecting" && state.shipping.cells.get(bread)?.has(index);
          const flight = collecting ? {
            x: Math.round((.6 - index % 5) * 72),
            y: -Math.round(82 + Math.floor(index / 5) * 72),
            delay: bunIndex * 45
          } : null;
          return bunMarkup(bread, true, reaches.get(index)?.has(bread), flight);
        }).join("")}</div>`;
    return `<button class="${classes}" data-cell="${index}" aria-label="${label}">${content}</button>`;
  }).join("");

  const handMarkup = state.hand.map((tray, index) => `
    <button draggable="true" data-tray="${tray.id}" class="tray${state.selected === tray.id ? " selected" : ""}" aria-label="${index + 1}番目の手持ち、パン${tray.buns.length}個">
      ${tray.buns.map((bread) => bunMarkup(bread)).join("")}
    </button>`).join("");

  app.innerHTML = `<section class="game" aria-label="マーパン箱詰めゲーム">
    <header class="topbar"><div><span class="eyebrow">MARUPAN FACTORY</span><h1>マーパンファクトリー</h1></div><div class="head-actions"><button id="help-button" aria-label="遊び方">?</button><button id="sound-button" aria-label="サウンド設定">${state.sound ? "♪" : "×"}</button></div></header>
    <div class="stats"><span>LEVEL <b>${level}</b><small>次まで ${2 - state.shipments % 2}便</small></span><span>SCORE <b>${state.score}</b></span><span>COIN <b>${state.coins}</b></span></div>
    <aside class="order"><div class="customer">☺</div><div class="order-copy"><small>きょうの注文 · ${META[state.order].code}</small><strong>${bunMarkup(state.order, true)}${META[state.order].label}を 1箱</strong><div class="timer"><i style="width:${state.time / 60 * 100}%"></i></div></div><div class="reward">+50</div></aside>
    <div class="message" role="status">${state.toast}</div>
    <div class="shipping-stage${state.shipping ? ` active ${state.shipping.phase}` : ""}" aria-live="polite"><div class="shipping-box">マー<br>パン</div><div class="loading-marks">›››</div><div class="delivery-truck"><span>🚚</span></div><b>${state.shipping ? `${state.shipping.label}を${state.shipping.phase === "collecting" ? "箱詰め中！" : "出荷！"}` : "5個以上そろえると、ここから出荷！"}</b></div>
    <section class="board-wrap"><div class="board-head"><span>PACKING SHELF · 周囲3×3で5個以上</span><b>空き ${empty}マス</b></div><div class="board">${boardMarkup}</div></section>
    <section class="hand"><div class="hand-title"><span>NEXT TRAYS</span><small>選んでから空きマスをタップでもOK</small></div><div class="trays">${handMarkup}</div></section>
    ${isGameClear() && !state.shipping ? `<div class="modal"><div class="modal-card clear"><span class="stamp">ALL CLEAR!</span><h2>工場の箱を全部発送！</h2><p class="clear-result">今回のスコア <b>${state.score}</b> / コイン <b>${state.coins}</b></p><h3>ベスト10</h3>${leaderboardMarkup()}<button class="primary" id="reset-button">もう一度あそぶ</button></div></div>` : ""}
    ${isGameOver() ? `<div class="modal"><div class="modal-card"><span class="stamp">CLOSED</span><h2>本日の受付終了</h2><p>置ける棚がなくなりました。<br>スコア <b>${state.score}</b> / コイン <b>${state.coins}</b></p><button class="primary" id="reset-button">もう一度あそぶ</button></div></div>` : ""}
    ${state.showHelp ? `<div class="modal"><div class="modal-card help"><span class="tag">HOW TO PACK</span><h2>周囲3×3で5個以上！</h2><ol><li><b>手持ちトレー</b>を空き棚へ置く</li><li>盤面上のどの3×3範囲でも、同じ種類を<b>5個以上</b>集める</li><li>4個集まると外周が光ってリーチをお知らせ</li><li>5個以上で箱詰めされ、トラックで出荷</li><li>出荷で周囲の配送箱を壊し、<b>箱をすべて消すとクリア</b></li><li>2便出荷するとLEVELが上がる</li></ol><p class="warning">最後に置いたマスから離れた場所も、毎回まとめて判定します。</p><button class="primary" id="start-button">工房をひらく</button></div></div>` : ""}
  </section>`;

  app.innerHTML = localizedMarkup(app.innerHTML);
  document.querySelector(".head-actions").insertAdjacentHTML("afterbegin", languageButton());
  document.querySelectorAll(".modal-card").forEach((card) => card.insertAdjacentHTML("afterbegin", languageButton()));
  bindInteractions();
}

function bindInteractions() {
  document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", toggleLanguage));
  document.querySelector("#help-button")?.addEventListener("click", () => {
    state.showHelp = true;
    render();
  });
  document.querySelector("#sound-button")?.addEventListener("click", () => {
    state.sound = !state.sound;
    render();
  });
  document.querySelector("#start-button")?.addEventListener("click", () => {
    state.showHelp = false;
    render();
  });
  document.querySelector("#reset-button")?.addEventListener("click", resetGame);

  document.querySelectorAll("[data-tray]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selected = Number(button.dataset.tray);
      render();
    });
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("tray", button.dataset.tray);
    });
  });

  document.querySelectorAll("[data-cell]").forEach((button) => {
    const index = Number(button.dataset.cell);
    button.addEventListener("click", () => {
      if (state.selected !== null) placeTray(state.selected, index);
    });
    button.addEventListener("dragover", (event) => {
      const cell = state.board[index];
      if (cell.kind === "open" && !cell.buns.length) event.preventDefault();
    });
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      placeTray(Number(event.dataTransfer.getData("tray")), index);
    });
  });
}

function neighborhoodThrough(board, start) {
  const row = Math.floor(start / 5);
  const column = start % 5;
  const cells = [];
  for (let y = row - 1; y <= row + 1; y += 1) {
    for (let x = column - 1; x <= column + 1; x += 1) {
      if (y < 0 || y >= 5 || x < 0 || x >= 5) continue;
      const index = y * 5 + x;
      if (board[index].kind === "open" && board[index].buns.length) cells.push(index);
    }
  }
  return cells;
}

function placeTray(trayId, index) {
  if (isGameOver() || isGameClear() || state.shipping) return;
  const tray = state.hand.find((item) => item.id === trayId);
  const target = state.board[index];
  if (!tray || target.kind !== "open" || target.buns.length) {
    state.toast = "そこには置けません";
    ping(150);
    render();
    return;
  }

  const board = cloneBoard(state.board);
  board[index] = { kind: "open", buns: [...tray.buns] };
  state.score += 10;
  state.selected = null;
  ping(380);

  const shippingCells = new Map();
  let reachBread = null;
  for (let center = 0; center < 25; center += 1) {
    const nearby = neighborhoodThrough(board, center);
    const counts = new Map();
    for (const cellIndex of nearby) {
      for (const bread of board[cellIndex].buns) counts.set(bread, (counts.get(bread) || 0) + 1);
    }
    for (const [bread, count] of counts) {
      if (count === 4 && reachBread === null) reachBread = bread;
      if (count < 5) continue;
      if (!shippingCells.has(bread)) shippingCells.set(bread, new Set());
      for (const cellIndex of nearby) {
        if (board[cellIndex].buns.includes(bread)) shippingCells.get(bread).add(cellIndex);
      }
    }
  }

  const shipped = [...shippingCells.keys()];
  if (shipped.length) {
    const label = shipped.map((bread) => META[bread].label).join("・");
    state.board = board;
    state.hand = state.hand.map((item) => item.id === trayId ? randomTray() : item);
    state.shipping = { label, phase: "collecting", cells: shippingCells };
    state.toast = `${label}がそろった！ 箱へ集めています`;
    ping(620);
    render();
    window.setTimeout(() => finishShipment(shippingCells, shipped, label), 1050);
    return;
  } else {
    state.toast = reachBread
      ? `${META[reachBread].label}が4個でリーチ！ あと1個以上`
      : "配置完了。盤面全体の3×3範囲を確認しよう";
  }

  state.board = board;
  state.hand = state.hand.map((item) => item.id === trayId ? randomTray() : item);
  render();
}

function finishShipment(shippingCells, shipped, label) {
  const board = cloneBoard(state.board);
  for (const color of shipped) {
    const shippedCells = shippingCells.get(color);
    for (const cellIndex of shippedCells) {
      const cell = board[cellIndex];
      if (cell.kind === "open") cell.buns = cell.buns.filter((bun) => bun !== color);
    }
    const adjacent = new Set([...shippedCells].flatMap(neighbors));
    for (const cellIndex of adjacent) {
      const cell = board[cellIndex];
      if (cell.kind === "crate") {
        board[cellIndex] = cell.hp <= 1
          ? { kind: "open", buns: [] }
          : { kind: "crate", hp: cell.hp - 1, max: cell.max };
      }
    }
    state.score += 100;
    state.coins += META[color].coin;
    state.shipments += 1;
    ping(720);
    if (color === state.order) {
      state.coins += 50;
      state.toast = `${META[color].label}便、注文達成！ +50 COIN`;
      newOrder();
    } else {
      state.toast = `${META[color].label}を出荷！ +${META[color].coin} COIN`;
    }
  }
  state.board = board;
  state.shipping = { label, phase: "dispatch", cells: new Map() };
  render();
  window.setTimeout(() => {
    state.shipping = null;
    if (isGameClear()) recordClearResult();
    render();
  }, 1800);
}

function newOrder() {
  state.order = BREAD_TYPES[Math.floor(Math.random() * BREAD_TYPES.length)];
  state.time = 60;
}

function resetGame() {
  state = {
    board: createBoard(),
    hand: makeHand(),
    selected: null,
    score: 0,
    coins: 0,
    shipments: 0,
    order: "burnt",
    time: 60,
    sound: state.sound,
    toast: "新しい便を始めよう！",
    shipping: null,
    records: loadClearRecords(),
    lastRecordId: null,
    showHelp: false
  };
  render();
}

function ping(frequency = 440) {
  if (!state.sound) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ??= new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.05, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

window.setInterval(() => {
  if (isGameOver() || isGameClear()) return;
  state.time -= 1;
  if (state.time <= 0) {
    state.toast = "注文は時間切れ。また次のお客さまへ！";
    newOrder();
    render();
    return;
  }
  const timer = document.querySelector(".timer i");
  if (timer) timer.style.width = `${state.time / 60 * 100}%`;
}, 1000);

render();
