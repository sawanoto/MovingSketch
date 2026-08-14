# MovingSketch

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
└─ 10_eye/
```

新作は `2_title/` のように直下へ追加し、`works.json` に登録します。
各作品は `shared/` の共通本体を読み込み、マーパンに何をさせるかだけを実装します。

## ローカル表示

静的HTTPサーバーでこのフォルダを公開してください。`works.json` を読み込むため、`index.html` の直接起動ではなくHTTP経由を推奨します。
