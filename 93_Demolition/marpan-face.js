// Render the canonical Marpan25D on a hidden p5 canvas for the cab.
let marpanFaceCanvas;
let marpanFace;
function setup() {
  const renderer = createCanvas(120, 104);
  marpanFaceCanvas = renderer.elt;
  renderer.hide();
  pixelDensity(1);
  marpanFace = new Marpan25D({ maxSize: 100, bodyColor: '#fff8eb', autoBlink: true });
}
function draw() {
  clear();
  marpanFace.drawAt(60, 52, { bodyWidth: 100, bodyHeight: 78, lookX: 28, lookY: 52, expression: 'pupil' });
}
