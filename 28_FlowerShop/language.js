// Translate presentation only; the board, messages and shipment timers stay intact.
const LANGUAGE_KEY = "marupan-factory-language-v1";
let language = "ja";
try { language = localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "ja"; } catch {}

const ENGLISH_TEXT = [
  ["盤面のどこでも、周囲3×3で同じ種類を5個以上集めよう！", "Collect 5+ of the same bread in any 3×3 area!"],
  ["まだ記録がありません", "No records yet"],
  ["マーパンファクトリー", "Marupan Factory"],
  ["マーパン箱詰めゲーム", "Marupan packing game"],
  ["サウンド設定", "Sound settings"],
  ["遊び方", "How to play"],
  ["きょうの注文", "Today's order"],
  ["5個以上そろえると、ここから出荷！", "Match 5+ to ship from here!"],
  ["周囲3×3で5個以上！", "Match 5+ in a 3×3 area!"],
  ["周囲3×3で5個以上", "Match 5+ in 3×3"],
  ["選んでから空きマスをタップでもOK", "Select a tray, then tap an empty space"],
  ["工場の箱を全部発送！", "All crates cleared!"],
  ["今回のスコア", "Your score"],
  ["ベスト10", "Top 10"],
  ["もう一度あそぶ", "Play again"],
  ["本日の受付終了", "Closed for today"],
  ["置ける棚がなくなりました。", "There are no empty spaces left."],
  ["<b>手持ちトレー</b>を空き棚へ置く", "Place a <b>tray</b> on an empty shelf space"],
  ["盤面上のどの3×3範囲でも、同じ種類を<b>5個以上</b>集める", "Collect <b>5 or more</b> of the same bread in any 3×3 area"],
  ["4個集まると外周が光ってリーチをお知らせ", "When you have 4, glowing outlines show you are close"],
  ["5個以上で箱詰めされ、トラックで出荷", "Match 5 or more to pack and ship them by truck"],
  ["出荷で周囲の配送箱を壊し、<b>箱をすべて消すとクリア</b>", "Ship bread to break nearby crates. <b>Clear every crate to win!</b>"],
  ["2便出荷するとLEVELが上がる", "Level up after every 2 shipments"],
  ["最後に置いたマスから離れた場所も、毎回まとめて判定します。", "Every move checks all 3×3 areas, even those far from your last placement."],
  ["工房をひらく", "Open the bakery"],
  ["そこには置けません", "You cannot place a tray there"],
  ["配置完了。盤面全体の3×3範囲を確認しよう", "Tray placed. Check all 3×3 areas!"],
  ["新しい便を始めよう！", "Let's start a new batch!"],
  ["注文は時間切れ。また次のお客さまへ！", "Order timed out. On to the next customer!"],
  ["（リーチ）", " (one more to go)"],
  ["マー<br>パン", "MARU<br>PAN"],
  ["スコア", "Score"], ["コイン", "Coins"]
];

function localizedMarkup(markup) {
  if (language !== "en") return markup;
  for (const [ja, en] of ENGLISH_TEXT) markup = markup.replaceAll(ja, en);
  markup = markup
    .replace(/マーパン配送箱、残り耐久(\d+)/g, "Shipping crate, $1 durability remaining")
    .replace(/トレー パン(\d+)個/g, "Tray with $1 breads")
    .replace(/(\d+)番目の手持ち、パン(\d+)個/g, "Tray $1, $2 breads")
    .replace(/次まで (\d+)便/g, "$1 shipments to next level")
    .replace(/空き (\d+)マス/g, "$1 empty spaces")
    .replaceAll("空きマス", "Empty space");
  // Bread names are fixed game data, including combined shipment names.
  const names = { burnt: "Burnt Marupan", croissant: "Croissant", melon: "Melon Bread", toast: "White Bread", pizza: "Pizza Marupan" };
  const breadPattern = Object.values(META).map((bread) => bread.label).join("|");
  const group = `((?:${breadPattern})(?:・(?:${breadPattern}))*)`;
  const messages = [
    ["がそろった！ 箱へ集めています", "Matched $1! Packing them now"],
    ["が4個でリーチ！ あと1個以上", "4 $1 matched! Add at least 1 more"],
    ["便、注文達成！", "$1 order complete!"],
    ["を箱詰め中！", "Packing $1!"],
    ["を出荷！", "$1 shipped!"],
    ["を 1箱", "1 box of $1"]
  ];
  for (const [ja, en] of messages) markup = markup.replace(new RegExp(group + ja, "g"), en);
  for (const [bread, en] of Object.entries(names)) markup = markup.replaceAll(META[bread].label, en);
  return markup.replaceAll("・", " / ");
}

function languageButton() {
  return `<button type="button" class="language-button" data-language lang="${language === "ja" ? "en" : "ja"}" aria-label="${language === "ja" ? "Switch to English" : "日本語に切り替え"}">${language === "ja" ? "English" : "日本語"}</button>`;
}

function toggleLanguage() {
  language = language === "ja" ? "en" : "ja";
  try { localStorage.setItem(LANGUAGE_KEY, language); } catch {}
  render();
}
