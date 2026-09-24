const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function test() {
  const img = await loadImage('C:\\Users\\aloys\\.gemini\\antigravity\\brain\\8090a751-d2ea-47d0-8bdd-b820262383dd\\.user_uploaded\\media_1790226903532.png');
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  
  const isLandscape = img.width > img.height;
  let targetWidth = isLandscape ? img.height : img.width;
  let targetHeight = isLandscape ? img.width : img.height;

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  if (isLandscape) {
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -targetHeight / 2, -targetWidth / 2, targetHeight, targetWidth);
  } else {
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  }
  
  const out = fs.createWriteStream('test_rotated.png');
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('Done'));
}
test();
