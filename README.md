# MovingSketch

## Gallery

ルートの `index.html` が MovingSketch Gallery です。SoundSketch Gallery の配色、余白、検索、カードグリッド、レスポンシブ設計を引き継ぎ、作品は実行せず静止サムネイルとして表示します。

作品を追加するときは `works.js` の `MOVING_SKETCH_WORKS` に次の項目を1件追加してください。

```js
{
  number: 42,
  title: "作品名",
  thumbnail: "./42_example/thumbnail.webp",
  url: "./42_example/",
  date: "2026-09-02",
  tags: ["JavaScript", "Game"],
  description: "作品の短い説明。"
}
```

`url` はp5.jsに限らず、ブラウザで開ける任意の相対URL・絶対URLを指定できます。サムネイルは16:10前後の `thumbnail.webp` または `thumbnail.png` を推奨します。

キャラクターの動きと音を組み合わせた、小さなインタラクティブ作品のシリーズです。

SoundSketch / SoundSketchGallery とは別のシリーズ、別のGitリポジトリとして管理します。

## 構成

```text
MovingSketch/
├─ index.html
├─ gallery.js
├─ style.css
├─ works.json
├─ shared/
│  ├─ marpan.js
│  └─ marpan-sound.js
├─ 1_ma-pan/
├─ 2_move/
├─ 3_design/
├─ 4_Color/
├─ 5_eyesize/
├─ 6_bodysize/
├─ 7_goldenratio/
├─ 8_mouth/
├─ 9_wink/
├─ 10_eye/
├─ 11_rotate/
├─ 12_screensaver/
├─ ...
├─ 27_MelodyFly4/
└─ 29_facial/
```

新作は `2_title/` のように直下へ追加し、`works.json` に登録します。
各作品は `shared/` の共通本体を読み込み、マーパンに何をさせるかだけを実装します。

## ローカル表示

静的HTTPサーバーでこのフォルダを公開してください。`works.json` を読み込むため、`index.html` の直接起動ではなくHTTP経由を推奨します。
