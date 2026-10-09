// The body and all three eyes come from the series' shared Marpan25D renderer.
let batMarpan;
function setup() {
  const layer = createCanvas(windowWidth, windowHeight);
  layer.parent('marpan-layer');
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  batMarpan = new Marpan25D({bodyColor:'#20242d', autoBlink:true});
}
function draw() {
  clear();
  const size=Math.max(48,Math.min(86,Math.min(width,height)*.105));
  const x=width*.5, y=height*.51+Math.sin(millis()*.0015)*3;
  batMarpan.setPosition(x,y);
  batMarpan.draw({bodyWidth:size*1.18,bodyHeight:size*1.23,lookX:x,lookY:y,eyeScale:1.05});
}
function windowResized(){resizeCanvas(windowWidth,windowHeight)}
