import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

export async function initYolo() {
  if (!session) {
    ort.env.wasm.wasmPaths = '/';
    session = await ort.InferenceSession.create('/yolo-total.onnx', { executionProviders: ['wasm'] });
  }
}

export async function detectTotalBox(img: HTMLImageElement): Promise<[number, number, number, number] | null> {
  await initYolo();
  if (!session) return null;

  const targetSize = 640;
  
  // Calculate letterbox scaling
  const scale = Math.min(targetSize / img.width, targetSize / img.height);
  const scaledW = Math.round(img.width * scale);
  const scaledH = Math.round(img.height * scale);
  
  const padX = (targetSize - scaledW) / 2;
  const padY = (targetSize - scaledH) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fill padding with neutral gray
  ctx.fillStyle = '#777777';
  ctx.fillRect(0, 0, targetSize, targetSize);
  
  // Draw scaled image
  ctx.drawImage(img, padX, padY, scaledW, scaledH);
  
  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const data = imgData.data;
  
  // Convert to Float32Array (1, 3, 640, 640)
  const float32Data = new Float32Array(3 * targetSize * targetSize);
  for (let i = 0; i < targetSize * targetSize; i++) {
    float32Data[i] = data[i * 4] / 255.0; // R
    float32Data[targetSize * targetSize + i] = data[i * 4 + 1] / 255.0; // G
    float32Data[2 * targetSize * targetSize + i] = data[i * 4 + 2] / 255.0; // B
  }

  const tensor = new ort.Tensor('float32', float32Data, [1, 3, targetSize, targetSize]);
  
  const results = await session.run({ images: tensor });
  const output = results.output0.data as Float32Array; // [1, 5, 8400]
  
  let bestConf = 0;
  let bestIndex = -1;
  
  for (let i = 0; i < 8400; i++) {
    const conf = output[4 * 8400 + i];
    if (conf > bestConf) {
      bestConf = conf;
      bestIndex = i;
    }
  }

  if (bestConf < 0.25 || bestIndex === -1) return null;

  const xc = output[0 * 8400 + bestIndex];
  const yc = output[1 * 8400 + bestIndex];
  const w = output[2 * 8400 + bestIndex];
  const h = output[3 * 8400 + bestIndex];

  // Un-scale and un-pad back to original image dimensions
  const x1 = ((xc - w / 2) - padX) / scale;
  const y1 = ((yc - h / 2) - padY) / scale;
  const x2 = ((xc + w / 2) - padX) / scale;
  const y2 = ((yc + h / 2) - padY) / scale;

  return [
    Math.max(0, x1),
    Math.max(0, y1),
    Math.min(img.width, x2),
    Math.min(img.height, y2)
  ];
}
