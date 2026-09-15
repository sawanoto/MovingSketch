// ShapeMarpan inherits the canonical character definition. The silhouette is the
// only variable; eye proportions and the original body curve follow Marpan25D.
class ShapeMarpan extends Marpan25D {
  static originalPath() {
    return "M80 21.6C123.2 21.6 160 48.8 156.8 97.76C153.6 126.05 120 130.4 80 130.4C40 130.4 6.4 126.05 3.2 97.76C0 48.8 38.4 21.6 80 21.6Z";
  }

  static eyeMarkup(shape) {
    // Marpan25D.drawEyes: spacing sin(0.44) * bodyW * .47,
    // eye width bodyW * .135 * 1.42 and eye height eyeW * 1.08.
    const narrow = shape.height > shape.width * 1.25;
    const spacing = narrow ? 23 : 32;
    const y = shape.shapeType.toLowerCase().includes("triangle") ? 88 : 77;
    const eyeW = narrow ? 21 : 24;
    const eyeH = eyeW * 1.08;
    return [-spacing, 0, spacing].map((dx, index) =>
      `<g class="eye" transform="translate(${80 + dx} ${y})">
        <g class="eye-blink" data-shape-eye="${shape.shapeType}">
          <ellipse rx="${eyeW / 2}" ry="${eyeH / 2}" fill="#fff" stroke="#121212" stroke-width="2.2"/>
          <circle cx="0" cy="0" r="${eyeW * .19}" fill="#121212"/>
        </g>
      </g>`
    ).join("");
  }
}

const SHAPES = [
  ["manju","饅頭型","原型",160,108,5,1,"共通マーパンの基本形。比較のものさし。",ShapeMarpan.originalPath()],
  ["circle","正円","丸系",128,128,1,5,"どの向きでも転がりやすい。","M80 8C121 8 148 35 148 76C148 117 121 144 80 144C39 144 12 117 12 76C12 35 39 8 80 8Z"],
  ["wideEllipse","横長楕円","丸系",170,102,3,3,"揺れながら転がる、低い丸形。","M8 76C8 40 37 21 80 21C123 21 152 40 152 76C152 112 123 131 80 131C37 131 8 112 8 76Z"],
  ["tallEllipse","縦長楕円","丸系",104,158,1,5,"高さは出るが、ゆらゆら倒れやすい。","M80 5C113 5 133 34 133 76C133 118 113 147 80 147C47 147 27 118 27 76C27 34 47 5 80 5Z"],
  ["triangle","正三角形","三角系",150,130,4,4,"底面は安定するが上に積みにくい。","M77 10Q80 8 83 10L151 130Q155 141 143 143L17 143Q5 141 9 130Z"],
  ["tallTriangle","縦長三角形","三角系",116,158,3,5,"鋭い高さが出る、塔の先端向き。","M77 4Q80 1 83 4L137 137Q142 148 129 149L31 149Q18 148 23 137Z"],
  ["wideTriangle","横長三角形","三角系",178,100,5,4,"広い底面で安定。上面は狭い。","M77 31Q80 28 84 30L154 126Q161 140 145 142L15 142Q-1 140 6 126Z"],
  ["square","正方形","四角系",132,132,5,1,"非常に安定し、積み重ねやすい。","M22 10L138 10Q150 10 150 22L150 130Q150 142 138 142L22 142Q10 142 10 130L10 22Q10 10 22 10Z"],
  ["wideRectangle","横長長方形","四角系",180,94,5,1,"橋や土台に使いやすい。","M13 31Q13 20 25 20L135 20Q147 20 147 31L147 121Q147 132 135 132L25 132Q13 132 13 121Z"],
  ["tallRectangle","縦長長方形","四角系",92,164,2,4,"高さを稼げるが倒れやすい。","M43 5L117 5Q128 5 128 17L128 135Q128 147 117 147L43 147Q32 147 32 135L32 17Q32 5 43 5Z"],
  ["trapezoid","台形","四角系",160,112,4,3,"向きによって安定性が変わる。","M42 20Q45 13 54 13L106 13Q115 13 118 20L151 130Q154 141 141 142L19 142Q6 141 9 130Z"],
  ["parallelogram","平行四辺形","四角系",170,108,3,4,"ずれた輪郭が連鎖的な傾きを作る。","M43 20Q46 13 55 13L146 13Q158 13 153 25L117 132Q114 141 104 141L14 141Q2 141 7 129Z"],
  ["diamond","ひし形","四角系",132,154,1,5,"接地点が狭く、非常に積みにくい。","M74 7Q80 1 86 7L151 70Q157 76 151 82L86 145Q80 151 74 145L9 82Q3 76 9 70Z"],
  ["pentagon","五角形","多角形",144,140,4,3,"家のような頂点と安定した底面。","M75 8Q80 5 85 8L148 55Q153 59 151 67L127 139Q125 145 117 145L43 145Q35 145 33 139L9 67Q7 59 12 55Z"],
  ["hexagon","六角形","多角形",154,132,4,2,"平らな面が多く、意外と安定する。","M43 10L117 10Q123 10 127 16L153 68Q156 76 153 84L127 136Q123 142 117 142L43 142Q37 142 33 136L7 84Q4 76 7 68L33 16Q37 10 43 10Z"],
  ["octagon","八角形","多角形",144,140,3,3,"丸さと平面を両立した万能型。","M49 7L111 7Q117 7 121 11L149 39Q153 43 153 49L153 103Q153 109 149 113L121 141Q117 145 111 145L49 145Q43 145 39 141L11 113Q7 109 7 103L7 49Q7 43 11 39L39 11Q43 7 49 7Z"]
].map(([shapeType,name,category,width,height,stability,stackDifficulty,feature,path])=>({shapeType,name,category,width,height,rotation:0,stability,stackDifficulty,feature,path}))
  .sort((a,b)=>a.stackDifficulty-b.stackDifficulty||b.stability-a.stability);
const COLORS=["#ffffff","#fff0bd","#f5bdca","#efad67","#edda62","#a9d48e","#9dd7e5","#c4b3e2","#292929"],state={color:COLORS[0],background:"cream",outline:false,showNames:true,sameSize:false,mode:"catalog"};
const catalog=document.querySelector("#catalogView"),stackStage=document.querySelector("#stackStage"),dialog=document.querySelector("#shapeDialog");
function svg(s,context="card"){let scale=1;if(!state.sameSize&&context!=="dialog")scale=Math.min(s.width/160,s.height/130);if(context==="stack")scale=state.sameSize?1:Math.min(s.width/170,s.height/160);const origin=context==="stack"?144:76;return`<svg class="marpan-svg" viewBox="0 0 160 152" role="img" aria-label="${s.name}のマーパン"><g transform="translate(80 ${origin}) scale(${scale}) translate(-80 -${origin})"><path class="body-shape" d="${s.path}" fill="${state.color}" stroke="#121212" stroke-width="3" stroke-linejoin="round"/>${ShapeMarpan.eyeMarkup(s)}</g></svg>`}
function renderCatalog(){catalog.innerHTML=SHAPES.map((s,i)=>`<button class="shape-card${state.outline?' outline':''}" data-index="${i}"><span class="card-top"><span>難易度 ${s.stackDifficulty}/5</span><span>${s.shapeType}</span></span><span class="shape-stage bg-${state.background}">${svg(s)}</span><span class="category">${s.category}</span><h2 class="${state.showNames?'':'is-hidden'}">${s.name}</h2><p class="feature">${s.feature}</p><span class="meter"><span>STACK DIFFICULTY</span><span class="meter-track"><span class="meter-fill" style="--score:${s.stackDifficulty}"></span></span><span>${s.stackDifficulty}/5</span></span></button>`).join("");catalog.querySelectorAll(".shape-card").forEach(c=>c.onclick=()=>openShape(SHAPES[c.dataset.index],+c.dataset.index))}
function renderStack(){stackStage.querySelectorAll(".stack-item").forEach(e=>e.remove());SHAPES.forEach(s=>{const e=document.createElement("div");e.className=`stack-item${state.outline?' outline':''}`;e.innerHTML=`${svg(s,"stack")}<span>${state.showNames?s.name:""}</span>`;stackStage.append(e)});stackStage.className=`stack-stage bg-${state.background}`}
function openShape(s,i){document.querySelector("#dialogContent").innerHTML=`<div class="dialog-grid"><div class="dialog-visual bg-${state.background} ${state.outline?'outline':''}">${svg(s,"dialog")}</div><div class="dialog-info"><span class="number">SHAPE ${String(i+1).padStart(2,"0")} / ${s.category}</span><h2>${s.name}</h2><p class="lead">${s.feature}</p><dl class="data-list"><div><dt>SHAPE TYPE</dt><dd>${s.shapeType}</dd></div><div><dt>SIZE</dt><dd>${s.width} × ${s.height}</dd></div><div><dt>ROTATION</dt><dd>${s.rotation}°</dd></div><div><dt>STABILITY</dt><dd>${s.stability} / 5</dd></div><div><dt>STACK DIFFICULTY</dt><dd>${s.stackDifficulty} / 5</dd></div><div><dt>CATEGORY</dt><dd>${s.category}</dd></div></dl></div></div>`;dialog.showModal()}
function render(){renderCatalog();renderStack()}

// Marpan25Dの標準値と同じ、2.2〜4.2秒間隔・190msの自動瞬き。
const nextBlink=new Map(SHAPES.map(s=>[s.shapeType,performance.now()+2200+Math.random()*2000]));
setInterval(()=>{const now=performance.now();SHAPES.forEach(s=>{if(now<(nextBlink.get(s.shapeType)||0))return;document.querySelectorAll(`[data-shape-eye="${s.shapeType}"]`).forEach(eye=>{eye.classList.remove("is-blinking");void eye.getBoundingClientRect();eye.classList.add("is-blinking")});nextBlink.set(s.shapeType,now+2200+Math.random()*2000)})},100);

const swatches=document.querySelector("#colorSwatches");COLORS.forEach((color,i)=>{const b=document.createElement("button");b.className=`swatch${i?'':' is-active'}`;b.style.setProperty("--swatch",color);b.ariaLabel=`マーパンの色 ${i+1}`;b.onclick=()=>{state.color=color;swatches.querySelectorAll("button").forEach(x=>x.classList.toggle("is-active",x===b));render()};swatches.append(b)});
document.querySelectorAll(".bg-chip").forEach(b=>b.onclick=()=>{state.background=b.dataset.bg;document.querySelectorAll(".bg-chip").forEach(x=>x.classList.toggle("is-active",x===b));render()});document.querySelector("#outlineToggle").onchange=e=>{state.outline=e.target.checked;render()};document.querySelector("#nameToggle").onchange=e=>{state.showNames=e.target.checked;render()};document.querySelector("#sizeToggle").onchange=e=>{state.sameSize=e.target.checked;render()};document.querySelectorAll(".mode-button").forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;document.querySelectorAll(".mode-button").forEach(x=>x.classList.toggle("is-active",x===b));catalog.hidden=state.mode!=="catalog";document.querySelector("#stackView").hidden=state.mode!=="stack";document.querySelector("#modeDescription").textContent=state.mode==="catalog"?"積みやすい形から、積み上げ難易度順に並んでいます。":"同じ基準線上で、左から難易度順に比較しています。"});document.querySelector("#closeDialog").onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close()};render();
