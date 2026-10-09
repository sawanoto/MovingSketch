# マーパン万華鏡

`index.html` をブラウザで開き、円周をドラッグまたは指でなぞって回します。初回操作で音が有効になります。p5.js と p5.sound は CDN から読み込みます。

色と音階は `27_MelodyFly4/sketch.js` の `noteColors` と `noteFrequencies` を踏襲しています。マーパンは `../shared/marpan-25d.js` の `Marpan25D` をそのまま使用します。物理演算は60度の基本領域にある実体だけで行い、6領域の鏡像は描画のみです。
