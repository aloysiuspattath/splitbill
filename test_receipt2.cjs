const fs = require('fs');
const Tesseract = require('tesseract.js');

async function testOcr() {
  const imgPath = 'C:\\Users\\aloys\\.gemini\\antigravity\\brain\\8090a751-d2ea-47d0-8bdd-b820262383dd\\.user_uploaded\\media_1790258191004.jpg';
  
  const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => console.log(m)
  });
  const ret = await worker.recognize(imgPath);
  console.log('--- RAW TESSERACT TEXT ---');
  console.log(ret.data.text);
  await worker.terminate();
}
testOcr();
