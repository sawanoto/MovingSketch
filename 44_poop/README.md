# Ma-pan: Poop Pause

3つの黒目の位置だけで「すっとぼけながら力んでいる」表情を作る p5.js スケッチです。

- クリック、タップ、または Space でアニメーションを再生
- 共通 `Marpan25D` の `normal` / `poopingSides` / `pooping` プリセットを使用
- `setPupilOffset(index, pupilX, pupilY)` で各目を個別制御
- 左右の黒目が上を向くのと同時に、中央の黒目が下を向く一段階の視線移動
- 眉・口・頬・汗など、表情用の追加パーツは不使用
- タップを重ねると入力を予約し、休符のうんちが周囲へ蓄積
- 「キレイにする」ボタンですべて片付け

共通表情は `Marpan25D.EXPRESSION_PRESETS` に追加し、`setExpressionState(name)` で利用できます。
