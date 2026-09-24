const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const Tesseract = require('tesseract.js');

async function testOcr() {
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  }
  
  // Convert to buffer to pass to tesseract
  const buffer = canvas.toBuffer('image/png');
  
  console.log('Running Tesseract...');
  Tesseract.recognize(buffer, 'eng')
    .then(({ data: { text } }) => {
      console.log('--- EXTRACTED TEXT ---');
      console.log(text);
      console.log('----------------------');
    })
    .catch(err => console.error(err));
}

testOcr();
