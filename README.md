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
└─ 1_ma-pan/
```

新作は `2_title/` のように直下へ追加し、`works.json` に登録します。

## ローカル表示

静的HTTPサーバーでこのフォルダを公開してください。`works.json` を読み込むため、`index.html` の直接起動ではなくHTTP経由を推奨します。
