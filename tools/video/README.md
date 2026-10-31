# LIFESketch #001 音声付き動画書き出し試作

対象: `sawanoto/MovingSketch` の `LifeSketch/001_doremi-pipes`。
調査・実装のベースは `origin/codex/lifesketch-cloud-start` (`eb44b09`)。
調査時の `main` には対象ディレクトリがありません。別リポジトリ
`sawanoto/LifeSketch` にある改訂版（長さ変更・ピアノ音源）とは異なります。
この実装は指定リポジトリ内の正弦波版をそのまま録画します。

## 調査結果

- リポジトリルートをHTTP配信し、`/LifeSketch/001_doremi-pipes/` を開く。
- p5.js / p5.sound はともに1.9.4。cdnjsへのネットワーク接続が必要。
- キャンバスのパイプ、音名ボタン、数字1〜8、タッチで `playNote(index)` を呼ぶ。
- 初回の操作でAudioContextを開始し、単一の `p5.Oscillator('sine')` に周波数と
  音量包絡を設定。最大音量0.23、約290msの発音・バウンド。8音の周波数は261.63〜523.25Hz。
- 初期状態は未発音で8本のパイプとマーパン。終了条件や物語上の結末はなく、任意に演奏を続ける作品。
- ページの最大幅1080px、キャンバス高はclamp(340px,50vw,500px)。モバイルでは360px。
  既存CSS、描画、音声、通常操作は変更していない。
- 乱数はマーパンの自動まばたきで使用。撮影シナリオ開始時にp5の乱数を固定し、まばたき予定をリセット。
- ブラウザの自動再生制限、実時間処理によるフレーム／音源スケジュールの揺れがある。
  動画生成では専用Chromiumプロセスにのみ自動再生許可フラグを渡す。

## 実行

Node.js 20以上、FFmpeg / ffprobe（libx264とAAC対応）、Chromiumが必要。
リポジトリルートから:

```sh
npm ci --prefix tools/video
# Playwrightのブラウザを利用する場合（初回のみ）
cd tools/video
npx playwright install --with-deps chromium
cd ../..
node tools/video/export.mjs
```

システムChromiumがある場合はインストールを省略して:

```sh
CHROMIUM_PATH=/usr/bin/chromium node tools/video/export.mjs
```

第1引数で出力先を指定できる。生成物はデフォルトで `video-output/`:

- `001_doremi-pipes.mp4` — 配布用
- `001_doremi-pipes.webm` — 音声・映像を同時収録した中間ファイル
- `report.json` — シナリオ、実際の操作時刻、ffprobe結果

ローカルHTTPサーバーとブラウザはスクリプトで起動・終了する。
公開サーバー、OSの画面録画・ループバック音声デバイスは不要。
音源・描画の準備ができない場合は失敗する。動画生成と投稿は別処理。

## 自動実演

`?demo` を付けるとキャンバス準備後に開始を試みる。
通常ブラウザで自動音声が禁止されている場合は、ページの余白をクリックして音声を許可する。
`?demo&capture` は収録スクリプト用で、録画開始を待ってからシナリオを実行する。
通常URLでは `demo.js` は何もせず終了する。

1. 1.2秒待機。
2. ド〜高いドを全8音、650ms間隔で演奏。
3. 全8音を逆順で演奏。
4. ド・ミ・ソ・高いド・ソ・ミ・ドで飛び音も比較。
5. 最後の290msの動きが終わってから3.2秒静止。

約19秒。これは終了条件のない作品の一回の演奏例であり、既存の展開や結末を追加・省略するものではない。
通常の `playNote` を呼ぶため、音色、バウンド、目線、まばたきを維持する。
同じ順序・間隔・乱数でほぼ同じ動画になるが、実時間のためバイト一致は保証しない。

## 録画と構成

- `browser.mjs`: localhost配信・Chromium起動
- `record.mjs`: canvas.captureStream(30) と **実際のp5マスター出力**を
  MediaStreamAudioDestinationNode経由で単一MediaRecorderに入力（VP9/Opus）。
  ブラウザの音声を後から再合成しない。
- `convert.mjs`: FFmpegでH.264 / AAC、yuv420p limited range、30fps、
  1080×1920、正方形ピクセル、faststartへ変換。
- `export.mjs`: 以上の組み合わせと記録。
- `LifeSketch/001_doremi-pipes/demo.js`: 作品固有シナリオ。

描画対象は作品のキャンバス全体（今回992×500）。切り抜きや縦方向の引き伸ばしは行わず、
1080px幅へ等比拡大して中央配置。上下は元キャンバス背景 `#faf9f5`。
HTMLのナビゲーション、タイトル、操作説明、ボタンは動画に含めない。
キャンバス内の文字やマーパンを作り直していない。

## 検証

生成後、リポジトリルートから:

```sh
CHROMIUM_PATH=/usr/bin/chromium node tools/video/check.mjs
# 数値検証はPython 3とnumpyが必要（必要なら専用venvにpip install numpy）
python tools/video/verify.py
```

`check.mjs`: 通常モードとの分離、ボタン、数字キー、モバイルのタッチとキャンバスタップ、
音声開始、ギャラリーリンク、自動実演開始、生成MP4のChromiumでの再生を確認。
`verify.py`: 全編映像・音声のデコード、形式・フレーム数・音の数・音程・発音時刻、
最初のパイプの動きとの同期、最後の無音を測定し `verification.json` を保存。

初回測定:
- 約19.067秒、572フレーム、23音。周波数誤差最大0.3Hz。
- 操作ログから音声立ち上がりまで最大110.5ms（元音源のスケジュールと包絡を含む）。
- 最初の視覚変化1.267秒、発音1.310秒、差43.3ms。約1.3フレーム。
- 全23音で時刻差の増大は見られず、最後の1秒は無音。クリッピングなし。
- FFmpegで全編をデコードし、Chromiumで再生を確認。元録画の最大フレーム間隔は36ms。
- 2回生成し、ともに19.067秒・572フレーム。操作時刻の差は最大1.9ms。
  2回目の初音同期差は53.3ms、操作から音声立ち上がりまで最大120.5ms。

同期は初音の映像変化と全音の音声時刻による数値確認。全音の映像を個別に測ったものではない。
実際のスピーカーによる聴取、スマートフォン実機、Instagram／Metricoolでの取り込みは未確認。
通常の音源スケジュールを維持するため、音声の強制的な前倒しは行わない。

## 保存と公開URL（未実施）

MP4・中間ファイル・node_modulesはgitignore対象。動画を通常のGit履歴に入れない。
ローカルのMP4を取得して渡せるが、Metricoolから取得するには外部HTTPS URLが必要。
所有者の確認後、公開リポジトリのGitHub ReleasesにMP4だけを添付する案:

```sh
# 以下は公開する操作。承認後のみ実行する。タグ名は運用時に確定する。
gh release create lifesketch-001-video-v1 \
  video-output/001_doremi-pipes.mp4 \
  --repo sawanoto/MovingSketch \
  --target codex/lifesketch-cloud-start \
  --title 'LIFESketch #001 ドレミパイプ — Instagram Video' --notes 'Doremi pipes full demo'
```

想定URL:
`https://github.com/sawanoto/MovingSketch/releases/download/lifesketch-001-video-v1/001_doremi-pipes.mp4`

公開後は認証なしGET・リダイレクト先までの到達性、Content-Type、実ファイルサイズを確認し、
Metricool側のURL取り込み対応を別途検証する。必要ならContent-Typeを指定できる公開オブジェクトストレージを利用する。
公開用スクリプトを追加した。GitHub CLIで認証された環境で次を実行する:

```sh
node tools/video/publish.mjs
```

このスクリプトは既存MP4のみを使用し、公開設定・形式・書き込み権限を確認する。
同名タグまたはReleaseが存在する場合は中止する。指定ブランチのリモートHEADを対象として
Releaseを作成し、動画をアセットに添付する。mainは変更しない。
APIへの接続に失敗した場合も公開処理を中止する。

2026-10-31の公開準備時点で、既存MP4のSHA-256は
`3e7b1cbdbb459af59c2f53a2c6f79d8a4fdd01e0b0376cfd52cbbb297f8e4f05`。
391,013バイト、19.066667秒。既存作品の描画と正弦波音声のみで、ブラウザUI、
個人情報、認証情報、外部画像・音源を動画に含めない。ffprobeのメタデータにも個人情報なし。
この環境ではGitHub CLIのAPI接続がForbiddenとなり、Release公開にはAPIへ接続できる
GitHub CLI環境が必要。公開済みかどうかは実際のReleaseページとアセットの取得で判断する。
Instagram／Metricoolの予約登録はこのスクリプトの対象外。

## 次の作品

作品ごとのシナリオと描画・音声の入口だけを追加し、ブラウザ・録画・変換を再利用する。
次作に物語の終了条件がある場合は、その終了イベントを待ち、固定尺で打ち切らない。
DOM全体が表現となる作品や別の音声エンジンは、canvas/p5用の収録入口の差し替えが必要。
現時点では全作品対応の共通フレームワークは作らない。
