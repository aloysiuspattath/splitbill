import { CurrencyCode } from '../../types';
import { ParsedReceiptData, parseReceiptText } from './ReceiptParser';

export interface OcrProgress {
  status: string;
  progress: number; // 0 to 100
}

/**
 * Preprocesses an image via HTML5 Canvas (grayscale + contrast enhancement)
 * to maximize OCR text recognition accuracy.
 */
export async function preprocessImage(imageFile: File | Blob): Promise<string> {
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

      // Max dimension capping to ensure fast processing
      const maxDim = 1800;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      // Grayscale & simple contrast stretch
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // High contrast boost
        const contrast = 1.3;
        const adjusted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
        d[i] = adjusted;
        d[i + 1] = adjusted;
        d[i + 2] = adjusted;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
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

  onProgress?.({ status: 'Preprocessing receipt image...', progress: 25 });

  let processedImage: string;
  if (typeof imageSource === 'string') {
    processedImage = imageSource;
  } else {
    try {
      processedImage = await preprocessImage(imageSource);
    } catch {
      processedImage = URL.createObjectURL(imageSource);
    }
  }

  onProgress?.({ status: 'Recognizing text...', progress: 40 });

  const worker = await Tesseract.createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        const pct = Math.round(40 + (m.progress || 0) * 55);
        onProgress?.({ status: 'Reading receipt items...', progress: Math.min(95, pct) });
      }
    },
  });

  try {
    const ret = await worker.recognize(processedImage);
    const rawText = ret.data.text;

    onProgress?.({ status: 'Structuring items...', progress: 98 });
    await worker.terminate();

    const parsed = parseReceiptText(rawText, currency);
    onProgress?.({ status: 'Done!', progress: 100 });

    return parsed;
  } catch (err) {
    await worker.terminate();
    throw new Error('OCR recognition failed. You can still enter or edit items manually.');
  }
}
