const FISH_LANG_KEY = "fish-marpan-language";
let fishLanguage = localStorage.getItem(FISH_LANG_KEY) === "en" ? "en" : "ja";

const FISH_COPY = {
  ja: {
    pageTitle: "魚マーパンの水槽", title: "魚マーパンの水槽", points: "おんぷ",
    changeWater: "水替え", careHint: "苔は水槽をこすって、休符はタップしてお掃除",
    feedTitle: "音をあげる", feedHelp: "鍵盤を弾くと、音符が水の中へ泳いでいきます。",
    shopTitle: "水槽のおみせ", spendable: "使えるおんぷ", tankAria: "魚マーパンの水槽",
    pianoAria: "音符の鍵盤", closeAria: "閉じる", switchAria: "Switch to English",
    notes: ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ", "ド"], conditioner: n => `カルキ抜き ×${n}`,
    quality: ["きれい", "少しにごっている", "にごっている", "水替えしてあげよう"],
    tooMany: "音符がたくさん泳いでいます", noConditioner: "カルキ抜きなしの軽い水替えです",
    cleaned: "休符をきれいにしました +3 ♪", purchased: name => `${name}を水槽に迎えました`, owned: "購入済み",
    items: {
      plantA: ["アヌビアス", "丈夫な小さな水草"], plantB: ["ゆれる水草", "背の高い水草"],
      sandLight: ["明るい砂", "水槽がやわらかい印象に"], sandBlack: ["黒い砂", "魚マーパンが映える"],
      light2: ["水面ライト", "光が明るくきらめく"], filter2: ["静音フィルター", "水の汚れをゆっくり抑える"],
      conditioner: ["カルキ抜き", "水替えにひとつ使用"], tank2: ["中型水槽", "泳げる範囲が広がる"]
    }
  },
  en: {
    pageTitle: "Fish Ma-pan Aquarium", title: "Fish Ma-pan Aquarium", points: "notes",
    changeWater: "CHANGE WATER", careHint: "Scrub algae from the tank and tap rests to clean them up.",
    feedTitle: "Feed a Sound", feedHelp: "Play a key and a musical note will swim into the water.",
    shopTitle: "Aquarium Shop", spendable: "Notes available", tankAria: "Fish Ma-pan aquarium",
    pianoAria: "Musical-note keyboard", closeAria: "Close", switchAria: "日本語に切り替え",
    notes: ["C", "D", "E", "F", "G", "A", "B", "C"], conditioner: n => `Conditioner ×${n}`,
    quality: ["Clean", "Slightly cloudy", "Cloudy", "Time for a water change"],
    tooMany: "There are already lots of notes swimming.", noConditioner: "A small water change without conditioner.",
    cleaned: "Cleaned up a rest +3 ♪", purchased: name => `${name} joined the aquarium!`, owned: "Owned",
    items: {
      plantA: ["Anubias", "A small, hardy aquatic plant"], plantB: ["Swaying Plant", "A tall aquatic plant"],
      sandLight: ["Light Sand", "Gives the tank a softer look"], sandBlack: ["Black Sand", "Makes Fish Ma-pan stand out"],
      light2: ["Surface Light", "Brighter, shimmering light"], filter2: ["Quiet Filter", "Gently reduces water pollution"],
      conditioner: ["Water Conditioner", "Use one for each water change"], tank2: ["Medium Tank", "More room to swim"]
    }
  }
};

function fishText(key) { return FISH_COPY[fishLanguage][key]; }

function applyFishLanguage() {
  const copy = FISH_COPY[fishLanguage];
  document.documentElement.lang = fishLanguage;
  document.title = copy.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = copy[el.dataset.i18n]; });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", copy[el.dataset.i18nAria]); });
  const toggle = document.querySelector("#lang-toggle");
  toggle.textContent = fishLanguage === "ja" ? "EN" : "JA";
  toggle.setAttribute("aria-label", copy.switchAria);
  toggle.setAttribute("aria-pressed", String(fishLanguage === "en"));
  document.querySelectorAll("#piano .key").forEach((key, i) => { key.textContent = copy.notes[i]; });
  if (typeof state !== "undefined" && state) { renderShop(); syncUI(); }
}

const originalWireUI = wireUI;
wireUI = function () {
  originalWireUI();
  document.querySelector("#lang-toggle").onclick = () => {
    fishLanguage = fishLanguage === "ja" ? "en" : "ja";
    localStorage.setItem(FISH_LANG_KEY, fishLanguage);
    applyFishLanguage();
  };
  applyFishLanguage();
};

makePiano = function () {
  const el = document.querySelector("#piano");
  FISH_COPY[fishLanguage].notes.forEach((note, i) => {
    const button = document.createElement("button");
    button.className = "key";
    button.style.setProperty("--key", COLORS[i]);
    button.textContent = note;
    button.onclick = () => feed(i, button);
    el.append(button);
  });
};

renderShop = function () {
  const copy = FISH_COPY[fishLanguage];
  const grid = document.querySelector("#shop-grid");
  grid.innerHTML = "";
  SHOP.forEach(item => {
    const owned = state.owned.includes(item.id);
    const disabled = (owned && item.type !== "plant" && item.type !== "item") || state.points < item.cost;
    const [name, description] = copy.items[item.id];
    const button = document.createElement("button");
    button.className = "shop-item";
    button.disabled = disabled;
    button.innerHTML = `<b>${name}</b><small>${owned && item.type !== "plant" && item.type !== "item" ? copy.owned : description}</small><span>${item.cost} ♪</span>`;
    button.onclick = () => buy(item);
    grid.append(button);
  });
  document.querySelector("#shop-points").textContent = state.points;
};

buy = function (item) {
  if (state.points < item.cost) return;
  state.points -= item.cost;
  if (item.type === "plant") state.plants.push(item.id);
  else if (item.type === "item") state.conditioner++;
  else {
    state.owned.push(item.id);
    if (item.type === "sand") state.sand = item.id;
    if (item.type === "light") state.light = 2;
    if (item.type === "filter") state.filter = 2;
    if (item.type === "tank") state.tank = 2;
  }
  toast(FISH_COPY[fishLanguage].purchased(FISH_COPY[fishLanguage].items[item.id][0]));
  renderShop(); syncUI(); saveGame();
};

changeWater = function () {
  if (waterAnimation) return;
  const safe = state.conditioner > 0 ? 40 : 18;
  if (state.conditioner > 0) state.conditioner--;
  else toast(fishText("noConditioner"));
  waterAnimation = { t: 0, safe };
  state.algae = Math.max(0, state.algae - 10);
  playTone(392, .4, .08); syncUI();
};

const originalFeed = feed;
feed = function (i, button) {
  if (foods.length > 5) { toast(fishText("tooMany")); return; }
  originalFeed(i, button);
};

syncUI = function () {
  const copy = FISH_COPY[fishLanguage];
  document.querySelector("#points").textContent = state.points;
  document.querySelector("#shop-points").textContent = state.points;
  document.querySelector("#conditioner-count").textContent = copy.conditioner(state.conditioner);
  document.querySelector("#quality-bar").style.width = `${state.quality}%`;
  document.querySelector("#quality-bar").style.background = state.quality > 65 ? "#62b8a6" : state.quality > 35 ? "#d7ad5d" : "#d77d6b";
  const qualityIndex = state.quality > 80 ? 0 : state.quality > 55 ? 1 : state.quality > 30 ? 2 : 3;
  document.querySelector("#quality-label").textContent = copy.quality[qualityIndex];
  updateAudio();
};

const originalToast = toast;
toast = function (message) {
  if (typeof message === "string" && message.includes("+3")) message = fishText("cleaned");
  originalToast(message);
};

applyFishLanguage();
