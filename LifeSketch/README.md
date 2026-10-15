# LifeSketch

昨日の出来事や気になったことから、調べ、試し、作品にして広げていくシリーズです。

## 作品を追加する

1. `001_doremi-pipes/` と同じように、このフォルダーの下に作品フォルダーを作る。
2. マーパンはリポジトリ共通の `../../shared/marpan-25d.js` を読み込む。共通部品を作品内にコピーしない。
3. 音を使う作品は p5.js と p5.sound のバージョンをそろえ、最初のクリック・タップで `userStartAudio()` を呼ぶ。
4. `works.js` に作品を登録し、PCとスマートフォンの幅で操作と音を確認する。

## Codex Cloud でのプレビュー

このリポジトリのルートで `python3 -m http.server 8000 --bind 0.0.0.0` を起動し、ポート8000のプレビューで `/LifeSketch/` と作品ページを開きます。追加のインストールや秘密情報は不要です。CDNの p5.js が読み込めるネットワーク接続は必要です。

変更は作業ブランチとPRで確認します。GitHub Pages は `main` のルートから公開されるため、PRの作成だけでは公開URLは更新されません。

## マージ前にPC・スマートフォンで遊ぶ

PRプレビューは別サイトの [MovingSketch Preview](https://sawanoto.github.io/MovingSketch-preview/) に配信されます。PR番号が `N` のとき、URLは `https://sawanoto.github.io/MovingSketch-preview/pr-N/` です。

PR #4の作品: https://sawanoto.github.io/MovingSketch-preview/pr-4/LifeSketch/001_doremi-pipes/

同じURLをスマートフォンでも開き、パイプや音名をタップして音と操作を確認してください。PCでは数字キー1〜8でも鳴らせます。最初の操作で音声が始まります。

PRを更新すると、専用リポジトリのGitHub Actionsが約5分間隔で変更を検出して配信します。混雑時は遅延することがあります。急ぐ場合は [Refresh PR previews](https://github.com/sawanoto/MovingSketch-preview/actions/workflows/previews.yml) の「Run workflow」で更新できます。一覧ページのコミット表示か、各PR直下の `preview-info.json` で反映済みのコミットを確認できます。PRを閉じると次の更新でプレビューが削除されます。

管理方法と方式の比較: https://github.com/sawanoto/MovingSketch-preview
