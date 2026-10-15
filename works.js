// Gitで管理している作品一覧。新しい作品はこの配列に1項目追加します。
// thumbnail がまだない場合も作品は掲載され、カードには準備中表示が出ます。
window.MOVING_SKETCH_WORKS = [
  {number:1,title:"Ma-pan: Do Re Mi",thumbnail:"./1_ma-pan/thumbnail.webp",url:"./1_ma-pan/",tags:["p5.js","Sound"],description:"3つの目がド・レ・ミの音と色に合わせて動きます。"},
  {number:2,title:"Ma-pan: Move",thumbnail:"./2_move/thumbnail.webp",url:"./2_move/",tags:["p5.js","Interactive"],description:"マウスを見つめながら小さなマーパンが追いかけます。"},
  {number:3,title:"Ma-pan: Design",thumbnail:"./3_design/thumbnail.webp",url:"./3_design/",tags:["p5.js","Character"],description:"マーパンの新しい表情を試すデザインスケッチ。"},
  {number:4,title:"Ma-pan: Color",thumbnail:"./4_Color/thumbnail.webp",url:"./4_Color/",tags:["p5.js","Color"],description:"カラーパレットから色を選び、マーパンの体を染めます。"},
  {number:5,title:"Ma-pan: Eye Size",thumbnail:"./5_eyesize/thumbnail.webp",url:"./5_eyesize/",tags:["p5.js","Character"],description:"3つの目の大きさを変えて表情を比べます。"},
  {number:6,title:"Ma-pan: Body Size",thumbnail:"./6_bodysize/thumbnail.webp",url:"./6_bodysize/",tags:["p5.js","Character"],description:"体の大きさと表情を見比べるスケッチ。"},
  {number:7,title:"Ma-pan: Golden Ratio",thumbnail:"./7_goldenratio/thumbnail.webp",url:"./7_goldenratio/",tags:["p5.js","Design"],description:"体と目を黄金比で設計した形を観察します。"},
  {number:8,title:"Ma-pan: Mouth",thumbnail:"./8_mouth/thumbnail.webp",url:"./8_mouth/",tags:["p5.js","Character"],description:"目や鼻、口の位置から生まれる表情を観察します。"},
  {number:9,title:"Ma-pan: Wink",thumbnail:"./9_wink/thumbnail.webp",url:"./9_wink/",tags:["p5.js","Character"],description:"左右の目を使ってウインクする表情スケッチ。"},
  {number:10,title:"Ma-pan: Eye",thumbnail:"./10_eye/thumbnail.webp",url:"./10_eye/",tags:["p5.js","Character"],description:"さまざまな目の表情を見比べます。"},
  {number:11,title:"Ma-pan: Rotate",thumbnail:"./11_rotate/thumbnail.webp",url:"./11_rotate/",tags:["p5.js","Motion"],description:"マーパンが左右へ回転するモーションスケッチ。"},
  {number:12,title:"Ma-pan: Screen Saver",thumbnail:"./12_screensaver/thumbnail.webp",url:"./12_screensaver/",tags:["p5.js","Motion"],description:"マーパンが画面の中を跳ね回るスクリーンセーバー。"},
  {number:13,title:"Ma-pan: Split",thumbnail:"./13_split/thumbnail.webp",url:"./13_split/",tags:["p5.js","Motion"],description:"分裂と合体を繰り返すマーパンのスケッチ。"},
  {number:14,title:"Ma-pan: Signal",thumbnail:"./14_signal/thumbnail.webp",url:"./14_signal/",tags:["p5.js","Interactive"],description:"目を信号に見立てて色を切り替えます。"},
  {number:15,title:"Ma-pan: Race Signal",thumbnail:"./15_racesignal/thumbnail.webp",url:"./15_racesignal/",tags:["p5.js","Sound"],description:"3・2・1・GOの音声に合わせて目が点灯します。"},
  {number:16,title:"Ma-pan: Star Struck",thumbnail:"./16_StarStruck/thumbnail.webp",url:"./16_StarStruck/",tags:["p5.js","Interactive"],description:"触れると目がダイヤ形に輝くリアクション作品。"},
  {number:17,title:"Ma-pan: Black Pen",thumbnail:"./17_blackpen/thumbnail.webp",url:"./17_blackpen/",tags:["p5.js","Drawing"],description:"黒いペンでマーパンを自由に描くスケッチ。"},
  {number:18,title:"Ma-pan: Coloring",thumbnail:"./18_coloring/thumbnail.webp",url:"./18_coloring/",tags:["p5.js","Drawing"],description:"色を選んでマーパンを塗る作品。"},
  {number:19,title:"Ma-pan: Bird",thumbnail:"./19_Bird/thumbnail.webp",url:"./19_Bird/",tags:["p5.js","Interactive"],description:"鳥に触れるとマーパンの目が変化します。"},
  {number:20,title:"Ma-pan: Stretch",thumbnail:"./20_Stretch/thumbnail.webp",url:"./20_Stretch/",tags:["p5.js","Motion"],description:"体が伸び縮みするモーションスケッチ。"},
  {number:21,title:"Ma-pan: Compress",thumbnail:"./21_compress/thumbnail.webp",url:"./21_compress/",tags:["p5.js","Motion"],description:"体をへこませながら進むマーパン。"},
  {number:22,title:"Ma-pan: Rolling",thumbnail:"./22_rolling/thumbnail.webp",url:"./22_rolling/",tags:["p5.js","Motion"],description:"2体のマーパンが回転しながら進みます。"},
  {number:23,title:"Ma-pan: Melody Flight",thumbnail:"./23_FlappyBird/thumbnail.webp",url:"./23_FlappyBird/",tags:["p5.js","Game","Sound"],description:"音の壁をくぐるメロディーフライト。"},
  {number:24,title:"Ma-pan: Tulip Flight",thumbnail:"./24_FlappyBird2/thumbnail.webp",url:"./24_FlappyBird2/",tags:["JavaScript","Game","Sound"],description:"チューリップのメロディーに合わせて飛びます。"},
  {number:25,title:"Ma-pan: Frog Song Flight",thumbnail:"./25_FlappyBird3/thumbnail.webp",url:"./25_FlappyBird3/",tags:["JavaScript","Game","Sound"],description:"かえるのうたに合わせたフライトゲーム。"},
  {number:26,title:"Ma-pan: Melody Fly",thumbnail:"./26_MelodyFly/thumbnail.webp",url:"./26_MelodyFly/",tags:["JavaScript","Game","Sound"],description:"メロディーを選んで遊べるフライトゲーム。"},
  {number:27,title:"Ma-pan: Melody Fly 4",thumbnail:"./27_MelodyFly4/thumbnail.webp",url:"./27_MelodyFly4/",tags:["p5.js","Game","Sound"],description:"8つの童謡からステージを選んで遊べます。"},
  {number:29,title:"Ma-pan: Facial",thumbnail:"./29_facial/F08_surprised.png",url:"./29_facial/",tags:["p5.js","Character"],description:"さまざまな表情を見比べる2.5Dカタログ。"},
  {number:30,title:"Ma-pan: Bread",thumbnail:"./30_Bread/thumbnail.webp",url:"./30_Bread/",tags:["p5.js","Character"],description:"パンの種類や焼き上がりで姿が変わるキャラクター図鑑。"},
  {number:31,title:"Ma-pan: Hill Climb",thumbnail:"./31_hilclimb/itch-cover.png",url:"./31_hilclimb/",tags:["p5.js","Game"],description:"でこぼこ道を進むヒルクライムゲーム。"},
  {number:32,title:"Ma-pan: Family",thumbnail:"./32_Family/Family.png",url:"./32_Family/",tags:["p5.js","Character"],description:"表情や体格の違うマーパン一家のカタログ。"},
  {number:33,title:"Ma-pan: Beat Clicker",thumbnail:"./33_CookieClicker/itch-cover-630x500.png",url:"./33_CookieClicker/",tags:["p5.js","Game","Sound"],description:"マーパンを叩いて演奏会場を育てるクリックゲーム。"},
  {number:34,title:"Eating Notes",thumbnail:"./34_Eatingnotes/itch-cover.png",url:"./34_Eatingnotes/",tags:["p5.js","Game","Sound"],description:"音符を食べながら育つリズムゲーム。"},
  {number:35,title:"Fish",thumbnail:"./35_Fish/スクリーンショット 2026-08-27 045457.png",url:"./35_Fish/",tags:["p5.js","Interactive"],description:"水の中を泳ぐ魚たちのスケッチ。"},
  {number:36,title:"Shadow",thumbnail:"./36_shadow/thumbnail.webp",url:"./36_shadow/",tags:["p5.js","Interactive"],description:"影の動きと表情を楽しむインタラクティブ作品。"},
  {number:37,title:"Ice Crash",thumbnail:"./37_IceCrash/IceCrash-cover-630x500.png",url:"./37_IceCrash/",tags:["p5.js","Game"],description:"氷の世界を舞台にしたアクションゲーム。"},
  {number:39,title:"Lava Lamp",thumbnail:"./39_lavalamp/thumbnail.webp",url:"./39_lavalamp/",tags:["p5.js","Generative"],description:"ゆっくり形を変える光を眺めるスケッチ。"},
  {number:40,title:"Story Generator",thumbnail:"./40_StoryGen/thumbnail.webp",url:"./40_StoryGen/",tags:["p5.js","Story"],description:"画面の中から物語が生まれるジェネレーター。"},
  {number:41,title:"Othello",thumbnail:"./41_Othello/thumbnail.webp",url:"./41_Othello/",tags:["JavaScript","Game"],description:"ブラウザで遊べるオセロゲーム。"}
  ,{number:46,title:"Ma-pan: Tower",thumbnail:"./46_Tower/thumbnail.webp",url:"./46_Tower/",date:"2026-09-05",tags:["JavaScript","Game","Sound","Physics"],description:"マーパンを積み、塔を下から上へ演奏する物理音楽ゲーム。"}
  ,  {number:28,title:"マーパンファクトリー",thumbnail:"./28_FlowerShop/thumbnail.webp",url:"./28_FlowerShop/",tags:["Interactive"],description:"マーパンファクトリーで遊ぶインタラクティブ作品。"}
  ,  {number:42,title:"マーパン・ミュージックスロット",thumbnail:"./42_Slot/thumbnail.webp",url:"./42_Slot/",tags:["Interactive"],description:"三つの目をタイミングよく止めて、音符を集めるマーパンの音楽スロット。"}
  ,  {number:43,title:"マーパンカッター",thumbnail:"./43_Cutter/thumbnail.webp",url:"./43_Cutter/",tags:["Interactive"],description:"線を引くと、マーパンがぷるんと分裂してむにゅっと戻るインタラクティブ作品。"}
  ,  {number:44,title:"Ma-pan: Poop Pause",thumbnail:"./44_poop/thumbnail.webp",url:"./44_poop/",tags:["Interactive"],description:"3つの黒目だけで、すっとぼけながら集中するマーパンの排泄表情を描くインタラクティブ作品。"}
  ,  {number:45,title:"Ma-pan Shape Lab・マーパン形状研究室",thumbnail:"./45_Shape/thumbnail.webp",url:"./45_Shape/",tags:["Interactive"],description:"マーパンの形を比べるデザイン研究室。"}
  ,  {number:47,title:"Ma-pan: Sound Vehicle Lab",thumbnail:"./47_vehicle/thumbnail.webp",url:"./47_vehicle/",tags:["Interactive"],description:"音の世界を移動するマーパン専用の乗り物デザイン研究"}
  ,  {number:48,title:"Ma-pan Vehicle 2",thumbnail:"./48_vehicle2/thumbnail.webp",url:"./48_vehicle2/",tags:["Interactive"],description:"参考画像の形を忠実に再現したマーパンビークル"}
  ,  {number:49,title:"マーパン・ミュージックインベーダー",thumbnail:"./49_Invader/thumbnail.webp",url:"./49_Invader/",tags:["Interactive"],description:"敵を倒した音がメロディーになるマーパンの音楽シューティングゲーム"}
  ,  {number:50,title:"マーパンマインスイーパー",thumbnail:"./50_MineSweeper/thumbnail.webp",url:"./50_MineSweeper/",tags:["Interactive"],description:"地雷の連鎖からきらきら星が生まれ、盤面を囲むマーパンへ音楽があふれ出すマインスイーパー。"}
  ,  {number:51,title:"Ma-pan: Gramophone",thumbnail:"./51_gramophone/thumbnail.webp",url:"./51_gramophone/",tags:["Interactive"],description:"蓄音機をテーマにしたマーパンのインタラクティブ作品。"}
  ,  {number:52,title:"Ma-pan: Faucet",thumbnail:"./52_faucet/thumbnail.webp",url:"./52_faucet/",tags:["Interactive"],description:"蛇口をテーマにしたマーパンのインタラクティブ作品。"}
  ,  {number:53,title:"Ma-pan: Head",thumbnail:"./53_Ma-panHead/thumbnail.webp",url:"./53_Ma-panHead/",tags:["Interactive"],description:"マーパンの頭をテーマにしたインタラクティブ作品。"}
  ,  {number:54,title:"マーパン砂時計",thumbnail:"./54_hourglass/thumbnail.webp",url:"./54_hourglass/",tags:["Interactive"],description:"小さなマーパンが時を奏でる、インタラクティブな砂時計"}
  ,  {number:55,title:"EARTH MA-PAN — FROZEN SOUND",thumbnail:"./55_Earth/thumbnail.webp",url:"./55_Earth/",tags:["Interactive"],description:"地球から飛び出した音が、宇宙で凍って残るインタラクティブ作品"}
  ,  {number:56,title:"マーパンを次のレーンへ",thumbnail:"./56_conveyor/thumbnail.webp",url:"./56_conveyor/",tags:["Interactive"],description:"二本のベルトコンベアの隙間を、マーパンを手で載せ替えて埋め続けるインタラクティブ作品。"}
  ,  {number:57,title:"布巾係 — マーパンワールド",thumbnail:"./57_towel/thumbnail.webp",url:"./57_towel/",tags:["Interactive"],description:"小さな台所で、終わらない布巾の循環を管理するマーパンワールドの作品"}
  ,  {number:58,title:"ORDER! — Ma-pan",thumbnail:"./58_Order/thumbnail.webp",url:"./58_Order/",tags:["Interactive"],description:"静まった議場に、ひそひそ話が再び広がっていくマーパンのインタラクティブ作品"}
  ,  {number:59,title:"HAMMEREDOWN — Ma-pan",thumbnail:"./59_hammeredown/thumbnail.webp",url:"./59_hammeredown/",tags:["Interactive"],description:"流れてくる三つ目のマーパン杭を、高さに関係なくひたすら打つインタラクティブ作品。"}
  ,  {number:60,title:"BABY MA-PAN",thumbnail:"./60_Baby/thumbnail.webp",url:"./60_Baby/",tags:["Interactive"],description:"見つめると笑い、よそ見すると少しずつ寂しくなる、赤ちゃんマーパンとの小さな時間。"}
  ,  {number:61,title:"Ma-pan: Cram",thumbnail:"./61_cram/thumbnail.webp",url:"./61_cram/",tags:["Interactive"],description:"まだ入る。柔らかなマーパンを、いっぱいの棚へ何度でも押し込む作品。"}
  ,  {number:62,title:"MA-PAN CHAIN",thumbnail:"./62_blockchain/thumbnail.webp",url:"./62_blockchain/",tags:["Interactive"],description:"マーパンをつないで、記録の連鎖を体で感じるインタラクティブ作品"}
  ,  {number:63,title:"MA-PAN BRIDGE",thumbnail:"./63_bridge/thumbnail.webp",url:"./63_bridge/",tags:["Interactive"],description:"マーパンを載せて、橋の構造による力の伝わり方を体験するインタラクティブ作品"}
  ,  {number:64,title:"MA-PAN COFFEE MILL",thumbnail:"./64_CoffeeMill/thumbnail.webp",url:"./64_CoffeeMill/",tags:["Interactive"],description:"手回しコーヒーミルを回す動きが、そのまま音楽になるマーパン作品。"}
  ,  {number:65,title:"UNIVERSE MA-PAN",thumbnail:"./65_universe/thumbnail.webp",url:"./65_universe/",tags:["Interactive"],description:"太陽系の6つの惑星そのものが三つ目のマーパンになった、触れて眺める宇宙作品。"}
  ,  {number:66,title:"MA-PAN FLIGHT LAB",thumbnail:"./66_flight/thumbnail.webp",url:"./66_flight/",tags:["Interactive"],description:"翼・迎角・風・マーパンの重さを試す、揚力のインタラクティブ実験作品"}
  ,  {number:67,title:"MA-PAN SHIP LAB",thumbnail:"./67_ship/thumbnail.webp",url:"./67_ship/",tags:["Interactive"],description:"マーパンを船へ積み、船体の形・浮力・積載量・重量配分を体験するインタラクティブ作品"}
  ,  {number:68,title:"文字は、ひとつになる。 / Letters Become One",thumbnail:"./68_calligraphy/thumbnail.webp",url:"./68_calligraphy/",tags:["Interactive"],description:"日本語の文字がつながり、ひとつの生きた紋様になるインタラクティブなカリグラフィー作品。 Interactive Japanese calligraphy."}
  ,  {number:69,title:"珈琲屋 アイスコーヒー",thumbnail:"./69_icedcofee/thumbnail.webp",url:"./69_icedcofee/",tags:["Interactive"],description:"3つの産地の豆をブレンドして一杯のアイスコーヒーをつくる、珈琲屋のインタラクティブ作品。"}
  ,  {number:70,title:"Ma-pan Proportions Study",thumbnail:"./70_proportions/thumbnail.webp",url:"./70_proportions/",tags:["Interactive"],description:"漫画で使える1頭身・2頭身・3頭身マーパンの身体構造とポーズを比較するデザイン検討ページ"}
  ,  {number:71,title:"MA-PAN DAM LAB",thumbnail:"./71_Dam/thumbnail.webp",url:"./71_Dam/",tags:["Interactive"],description:"マーパンを沈めて、4種類のダムが水圧を受け止める仕組みを体験するインタラクティブ作品"}
  ,  {number:72,title:"MA-PAN MELODY MAZE",thumbnail:"./72_maze/thumbnail.webp",url:"./72_maze/",tags:["Interactive"],description:"歩いた道が旋律になる、マーパンの音楽迷路。"}
  ,  {number:73,title:"MA-PAN 73 — EITHER",thumbnail:"./73_either/thumbnail.webp",url:"./73_either/",tags:["Interactive"],description:"100体の視線を受けながら、最後の一票を選ぶマーパンのインタラクティブ作品"}
  ,  {number:74,title:"MA-PAN 74 — BLUE or RED",thumbnail:"./74_minority/thumbnail.webp",url:"./74_minority/",tags:["Interactive"],description:"BLUE GROUPとRED GROUPによる静かな多数決を描く、マーパンのインタラクティブ作品。"}
  ,  {number:75,title:"MA-PAN GLASS",thumbnail:"./75_Glass/thumbnail.webp",url:"./75_Glass/",tags:["Interactive"],description:"注ぎ続けることで満ち、やがて溢れるマーパングラスのインタラクティブ作品"}
  ,  {number:76,title:"MA-PAN 76 — LAUGH",thumbnail:"./76_laugh/thumbnail.webp",url:"./76_laugh/",tags:["Interactive"],description:"同じ小さな出来事が、それぞれ異なる感情の高さに積み重なるインタラクティブ作品"}
  ,  {number:77,title:"MA-PAN 77 · BONSAI",thumbnail:"./77_bonsai/thumbnail.webp",url:"./77_bonsai/",tags:["Interactive"],description:"伸び続ける松を、切ることだけで育てる盆栽。"}
  ,  {number:78,title:"MA-PAN 78 · RIVER",thumbnail:"./78_river/thumbnail.webp",url:"./78_river/",tags:["Interactive"],description:"マーパンと川の流れを眺めるインタラクティブ作品。"}
  ,  {number:79,title:"MA-PAN 79 · STRESS",thumbnail:"./79_Stress/thumbnail.webp",url:"./79_Stress/",tags:["Interactive"],description:"マーパンのストレスをテーマにしたインタラクティブ作品。"}
  ,  {number:80,title:"MA-PAN 80 — BUILDING",thumbnail:"./80_building/thumbnail.webp",url:"./80_building/",tags:["Interactive"],description:"マーパンを載せ、建築構造を流れる力と崩れ方を観察するインタラクティブ作品"}
  ,  {number:81,title:"MAR-PAN CATCHER — おんがくでうごくUFOキャッチャー",thumbnail:"./81_CraneGame/thumbnail.webp",url:"./81_CraneGame/",tags:["Interactive"],description:"音楽で動くマーパンのUFOキャッチャー。"}
  ,  {number:82,title:"マーパン編み図メーカー",thumbnail:"./82_KnittingPattern/thumbnail.webp",url:"./82_KnittingPattern/",tags:["Interactive"],description:"1マス1目。段数と目数を音階に変えて、描いた模様を編み図とメロディーにするマーパン編み図メーカー。"}
  ,  {number:83,title:"雪花 — Snow Crystal No.83",thumbnail:"./83_snowflake/thumbnail.webp",url:"./83_snowflake/",tags:["Interactive"],description:"音を鳴らしながら、中心から静かに育つ雪の結晶を観察するインタラクティブ作品。"}
  ,  {number:84,title:"マーパン コロコロ",thumbnail:"./84_rolrol/thumbnail.webp",url:"./84_rolrol/",tags:["Interactive"],description:"タップするとマーパンの言葉が動きになる、4ページの小さなデジタル絵本。"}
  ,  {number:85,title:"マーパンモビール",thumbnail:"./85_mobile/thumbnail.webp",url:"./85_mobile/",tags:["Interactive"],description:"星・月・雲になった三つ目のマーパンが、静かに揺れるベビーモビール。"}
  ,  {number:86,title:"Jack-o'-Marpan — Trick or Note",thumbnail:"./86_JackOMarpan/thumbnail.webp",url:"./86_JackOMarpan/",tags:["Interactive"],description:"音符のお菓子を食べたジャック・オ・マーパンが、8つの音をメロディーにして返すインタラクティブ作品。"}
  ,  {number:87,title:"BAT MARPAN — ECHO",thumbnail:"./87_bat/thumbnail.webp",url:"./87_bat/",tags:["Interactive"],description:"音で世界を見る、コウモリマーパンのエコーロケーション体験。"}
  ,  {number:88,title:"マーパン キラキラ",thumbnail:"./88_TwinkleTwinkle/thumbnail.webp",url:"./88_TwinkleTwinkle/",tags:["Interactive"],description:"星座のマーパンと夜明けを眺める、4ページの小さな絵本。"}
  ,  {number:89,title:"Ma-pan: Yolk Porn",thumbnail:"./89_YolkPorn/thumbnail.webp",url:"./89_YolkPorn/",tags:["Interactive"],description:"卵黄のマーパンを押す。ぷるぷる、プツッ、とろり。"}
  ,  {number:90,title:"Ma-pan: Food Porn",thumbnail:"./90_Foodporn/thumbnail.webp",url:"./90_Foodporn/",tags:["Interactive"],description:"割れる、滴る、伸びる、あふれる。4つの食品の動きを触って確かめるマーパンの視覚実験。"}
  ,  {number:91,title:"Ma-pan: Potato Chips",thumbnail:"./91_PotatoChips/thumbnail.webp",url:"./91_PotatoChips/",tags:["Interactive"],description:"袋を開けて、ポテトチップスを食べる音に触れるマーパン作品。"}
  ,  {number:92,title:"まあぱん ぐるぐる",thumbnail:"./92_CircleCircle/thumbnail.webp",url:"./92_CircleCircle/",tags:["Interactive"],description:"マーパンがぐるぐる動くインタラクティブ作品。"}
  ,  {number:93,title:"マーパン解体工事",thumbnail:"./93_Demolition/thumbnail.webp",url:"./93_Demolition/",tags:["Interactive"],description:"マーパンの解体工事を体験するインタラクティブ作品。"}
  ,  {number:94,title:"マーパン万華鏡 | Marpan Kaleidoscope",thumbnail:"./94_kaleidoscope/thumbnail.webp",url:"./94_kaleidoscope/",tags:["Interactive"],description:"色ガラスの衝突が音になる、マーパンの万華鏡。"}
  ,  {number:95,title:"マーパン無限ズーム",thumbnail:"./95_zoomouto/thumbnail.webp",url:"./95_zoomouto/",tags:["Interactive"],description:"マーパンの世界をどこまでもズームアウトする作品。"}
  ,  {number:96,title:"太鼓マーパン",thumbnail:"./96_drum/thumbnail.webp",url:"./96_drum/",tags:["Interactive"],description:"腰浜神明神社のお祭りを思いながら、三つ目の太鼓マーパンを自由に叩こう。"}
  ,  {number:97,title:"射的マーパン | Shooting Gallery Marpan",thumbnail:"./97_ShootingGallery/thumbnail.webp",url:"./97_ShootingGallery/",tags:["Interactive"],description:"三つ目のマーパンを狙う縁日の射的。下段のドレミを撃って演奏しよう。"}
  ,  {number:98,title:"まあぱん いないいないばあ",thumbnail:"./98_Peekaboo/thumbnail.webp",url:"./98_Peekaboo/",tags:["Interactive"],description:"いないいないばあを楽しむマーパンのインタラクティブ絵本。"}
  ,  {number:99,title:"マーパン はみがき",thumbnail:"./99_ToothBrushing/thumbnail.webp",url:"./99_ToothBrushing/",tags:["Interactive"],description:"マーパンの歯を指で磨く、4ページのインタラクティブ絵本。"}
  ,  {number:100,title:"マーパン カラフル色絵本",thumbnail:"./100_Color/preview.png",url:"./100_Color/",tags:["Interactive"],description:"色を選んで楽しむマーパンの絵本。"}
  ,  {number:101,title:"ハリネズミマーパン | Hedgehog Marpan",thumbnail:"./101_hedgehog/thumbnail.webp",url:"./101_hedgehog/",tags:["Interactive"],description:"ハリネズミになったマーパンと触れ合う作品。"}
];
