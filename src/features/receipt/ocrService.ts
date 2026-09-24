/**
 * SplitBill - Free & Private Bill Splitter
 * Copyright (c) 2026 Aloysius Pattath
 * Licensed under the GPLv3 License
 */
import { CurrencyCode } from '../../types';
import { ParsedReceiptData, parseReceiptText } from './ReceiptParser';
import { autoRotateAndDetect } from './yoloService';

export interface OcrProgress {
  status: string;
  progress: number; // 0 to 100
}

/**
 * Preprocesses a receipt image via HTML5 Canvas with adaptive illumination
 * normalization and shadow compensation. This removes camera shadows (e.g. hands/phone)
 * and produces high-contrast, uniformly lit text for maximum OCR accuracy.
 */
export async function preprocessImage(imageFile: File | Blob, aiRotation?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(url);
        return;
      }

      // If AI detected a rotation, use it. Otherwise fallback to width/height heuristic
      const isRotated90 = aiRotation === 90 || aiRotation === 270;
      const needsFallbackRotation = aiRotation === undefined && img.width > img.height;
      const isLandscape = isRotated90 || needsFallbackRotation;
      
      let targetWidth = isLandscape ? img.height : img.width;
      let targetHeight = isLandscape ? img.width : img.height;

      // Keep optimal resolution for receipt fonts while keeping memory low on mobile
      const maxDim = 1400;
      if (targetWidth > maxDim || targetHeight > maxDim) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
          targetWidth = maxDim;
        } else {
          targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
          targetHeight = maxDim;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      if (aiRotation !== undefined && aiRotation !== 0) {
        ctx.translate(targetWidth / 2, targetHeight / 2);
        ctx.rotate((aiRotation * Math.PI) / 180);
        
        // If 90 or 270, w/h are swapped
        if (aiRotation === 90 || aiRotation === 270) {
           ctx.drawImage(img, -targetHeight / 2, -targetWidth / 2, targetHeight, targetWidth);
        } else {
           ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
      } else if (needsFallbackRotation) {
        ctx.translate(targetWidth / 2, targetHeight / 2);
        ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise
        ctx.drawImage(img, -targetHeight / 2, -targetWidth / 2, targetHeight, targetWidth);
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
      } else {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }

      const width = targetWidth;
      const height = targetHeight;
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      // 1. Convert to 8-bit Grayscale array
      const gray = new Uint8Array(width * height);
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        gray[p] = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      }

      // 2. Adaptive Illumination Normalization (Shadow Removal)
      // Estimate local background paper intensity across blocks
      const blockSize = 32;
      const gridW = Math.ceil(width / blockSize);
      const gridH = Math.ceil(height / blockSize);
      const bgMap = new Float32Array(gridW * gridH);

      for (let gy = 0; gy < gridH; gy++) {
        const yStart = gy * blockSize;
        const yEnd = Math.min(height, yStart + blockSize);
        for (let gx = 0; gx < gridW; gx++) {
          const xStart = gx * blockSize;
          const xEnd = Math.min(width, xStart + blockSize);

          // Find high percentile brightness in block (representative of paper background)
          let maxVal = 0;
          let sum = 0;
          let count = 0;
          for (let y = yStart; y < yEnd; y += 2) {
            const rowOffset = y * width;
            for (let x = xStart; x < xEnd; x += 2) {
              const val = gray[rowOffset + x];
              if (val > maxVal) maxVal = val;
              sum += val;
              count++;
            }
          }
          const avg = count > 0 ? sum / count : 128;
          // Background estimate blends peak paper color with block average
          bgMap[gy * gridW + gx] = Math.max(60, 0.7 * maxVal + 0.3 * avg);
        }
      }

      // 3. Normalize each pixel against its local background
      for (let y = 0; y < height; y++) {
        const gy = Math.min(gridH - 1, Math.floor(y / blockSize));
        const rowOffset = y * width;
        const bgRowOffset = gy * gridW;

        for (let x = 0; x < width; x++) {
          const gx = Math.min(gridW - 1, Math.floor(x / blockSize));
          const localBg = bgMap[bgRowOffset + gx];

          const p = rowOffset + x;
          const pixelVal = gray[p];

          // Divide by background to eliminate shadows
          let norm = (pixelVal / localBg) * 235;

          // Gentle contrast curve to make text crisp
          if (norm < 160) {
            norm = Math.max(0, norm * 0.75); // Darken text
          } else {
            norm = Math.min(255, norm * 1.1); // Brighten paper
          }

          const outVal = Math.round(Math.min(255, Math.max(0, norm)));
          const dIdx = p * 4;
          d[dIdx] = outVal;
          d[dIdx + 1] = outVal;
          d[dIdx + 2] = outVal;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load receipt image for processing.'));
    };

    img.src = url;
  });
}

/**
 * Runs client-side local OCR using Tesseract.js.
 * Dynamically imported so initial app bundle remains tiny and fast.
 */
export async function recognizeReceipt(
  imageSource: File | Blob | string,
  currency: CurrencyCode = 'INR',
  onProgress?: (progress: OcrProgress) => void
): Promise<ParsedReceiptData> {
  onProgress?.({ status: 'Loading OCR engine...', progress: 10 });

  // Lazy-load Tesseract.js dynamically
  const Tesseract = await import('tesseract.js');

  onProgress?.({ status: 'Scanning receipt geometry...', progress: 20 });
  let yoloBox: [number, number, number, number] | undefined;
  let yoloRotation: number | undefined;

  try {
    const originalImg = new Image();
    originalImg.src = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
    await new Promise(res => originalImg.onload = res);
    
    // Test all 4 rotations to find the Total box
    const yoloResult = await autoRotateAndDetect(originalImg);
    if (yoloResult) {
      yoloBox = yoloResult.box;
      yoloRotation = yoloResult.rotation;
    }
  } catch (e) {
    console.warn('YOLO AI failed, falling back to pure Tesseract OCR.', e);
  }

  onProgress?.({ status: 'Preprocessing receipt image...', progress: 30 });

  let processedImage: string;
  if (typeof imageSource === 'string') {
    processedImage = imageSource;
  } else {
    try {
      processedImage = await preprocessImage(imageSource, yoloRotation);
    } catch {
      processedImage = URL.createObjectURL(imageSource);
    }
  }

  onProgress?.({ status: 'Recognizing text...', progress: 40 });

  const isBrowser = typeof window !== 'undefined' && window.location;
  const origin = isBrowser ? window.location.origin : '';
  const basePath = `${origin}/tesseract`;

  let worker: any = null;

  try {
    // 1. Attempt loading from same-origin /tesseract/ static assets (fast, offline-ready, no CORS/ISP blocks)
    worker = await Tesseract.createWorker('eng', 1, {
      workerPath: `${basePath}/worker.min.js`,
      corePath: `${basePath}/tesseract-core-simd-lstm.wasm.js`,
      langPath: basePath,
      gzip: true,
      logger: m => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(40 + (m.progress || 0) * 55);
          onProgress?.({ status: 'Reading receipt items...', progress: Math.min(95, pct) });
        }
      },
    });
  } catch (localErr) {
    console.warn('Local OCR assets failed to load, falling back to CDN worker:', localErr);
    try {
      // 2. Fallback to jsDelivr CDN
      worker = await Tesseract.createWorker('eng', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.1.1/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.1.1',
        langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int',
        gzip: true,
        logger: m => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(40 + (m.progress || 0) * 55);
            onProgress?.({ status: 'Reading receipt items...', progress: Math.min(95, pct) });
          }
        },
      });
    } catch (cdnErr) {
      console.error('All OCR worker initialization attempts failed:', cdnErr);
      throw new Error('Could not load OCR engine. Please check your connection or enter items manually.');
    }
  }

  try {
    // 2. Run Tesseract to get all the text
    const ret = await worker.recognize(processedImage);
    const rawText = ret.data.text;
    const lines = ret.data.lines;

    onProgress?.({ status: 'Structuring items...', progress: 98 });
    await worker.terminate();

    // 3. Mathematical Overlay inside the parser!
    const parsed = parseReceiptText(rawText, currency, lines, yoloBox);
    onProgress?.({ status: 'Done!', progress: 100 });

    return parsed;
  } catch (err: any) {
    console.error('Tesseract OCR recognition error:', err);
    try {
      await worker.terminate();
    } catch {}
    throw new Error('OCR recognition failed. You can still enter or edit items manually.');
  }
}

