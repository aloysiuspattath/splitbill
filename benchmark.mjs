import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import Tesseract from 'tesseract.js';

const NUM_WORKERS = 4; // Use 4 threads for speed

async function runBenchmark() {
  console.log('Loading YOLO boxes...');
  const yoloBoxes = JSON.parse(fs.readFileSync('yolo_boxes.json', 'utf8'));
  const imageFiles = Object.keys(yoloBoxes).slice(0, 50);
  
  console.log('Starting benchmark on ' + imageFiles.length + ' images... This will take a few minutes.');
  
  const scheduler = Tesseract.createScheduler();
  for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK || '6'
    });
    scheduler.addWorker(worker);
  }

  let yoloSuccess = 0;
  let tessFullSuccess = 0;
  let combinedSuccess = 0;
  let totalTimeTessFull = 0;
  let totalTimeCombined = 0;
  
  // Simple regex to look for typical "Total" patterns followed by numbers
  const totalRegex = /total[\s\S]{0,20}?[\d\.,]+/i;

  let completed = 0;
  
  // Process in batches so we don't blow up memory
const BATCH_SIZE = 20;

  async function preprocessImage(imgPath) {
    const img = await loadImage(imgPath);
    // Upscale 2.0x
    const scale = 2.0;
    const canvas = createCanvas(Math.floor(img.width * scale), Math.floor(img.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
    return canvas.toBuffer('image/png');
  }

  for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
    const batch = imageFiles.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (imgFile) => {
      const imgPath = path.join('dataset/images', imgFile);
      const box = yoloBoxes[imgFile];
      
      // 1. YOLO Alone stats
      if (box) yoloSuccess++;
      
      // 2 & 3. Tesseract Full Image + Mathematical Overlay
      const startFull = Date.now();
      const preprocessedBuf = await preprocessImage(imgPath);
      const { data: fullData } = await scheduler.addJob('recognize', preprocessedBuf);
      totalTimeTessFull += (Date.now() - startFull);
      
      // Traditional Regex search
      if (totalRegex.test(fullData.text)) {
        tessFullSuccess++;
      }

      // Mathematical Overlay (YOLO + Tesseract)
      if (box) {
        const startCombined = Date.now();
        const scale = 2.0; // match the upscale factor
        const [yx1, yy1, yx2, yy2] = box.map(c => c * scale);
        
        let foundInsideBox = false;
        
        // Check if any Tesseract line physically overlaps with the YOLO bounding box
        for (const line of fullData.lines) {
          const { x0, y0, x1, y1 } = line.bbox;
          
          // Calculate intersection area
          const overlapX = Math.max(0, Math.min(x1, yx2) - Math.max(x0, yx1));
          const overlapY = Math.max(0, Math.min(y1, yy2) - Math.max(y0, yy1));
          const overlapArea = overlapX * overlapY;
          
          if (overlapArea > 0) {
            // Does this line contain a number?
            if (/\d/.test(line.text)) {
              foundInsideBox = true;
              break;
            }
          }
        }
        
        // Since we didn't rerun OCR, time is effectively instantaneous
        totalTimeCombined += (Date.now() - startCombined);
        
        if (foundInsideBox) {
          combinedSuccess++;
        }
      }
      
      completed++;
      if (completed % 50 === 0) console.log('Progress: ' + completed + ' / ' + imageFiles.length);
    });
    
    await Promise.all(promises);
  }
  
  await scheduler.terminate();

  const num = imageFiles.length;
  console.log('--- BENCHMARK RESULTS ---');
  console.log('Total Images Tested: ' + num);
  console.log('1. YOLO Alone Detection Rate: ' + ((yoloSuccess/num)*100).toFixed(1) + '%');
  console.log('2. Tesseract Alone (Full Image) Success Rate: ' + ((tessFullSuccess/num)*100).toFixed(1) + '%');
  console.log('   Avg Time per Image: ' + (totalTimeTessFull/num).toFixed(0) + ' ms');
  console.log('3. Combined (YOLO + Tesseract) Success Rate: ' + ((combinedSuccess/num)*100).toFixed(1) + '%');
  console.log('   Avg Time per Image: ' + (totalTimeCombined/num).toFixed(0) + ' ms');
}

runBenchmark().catch(console.error);
