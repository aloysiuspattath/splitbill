import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

export async function initYolo() {
  if (!session) {
    ort.env.wasm.wasmPaths = '/';
    session = await ort.InferenceSession.create('/yolo-total.onnx', { executionProviders: ['wasm'] });
  }
}

export interface YoloResult {
  box: [number, number, number, number];
  rotation: 0 | 90 | 180 | 270;
}

export async function autoRotateAndDetect(img: HTMLImageElement): Promise<YoloResult | null> {
  await initYolo();
  if (!session) return null;

  const targetSize = 640;
  
  // Test 4 rotations: 0, 90, 180, 270
  const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 270, 180];
  
  for (const rotation of rotations) {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Fill padding with neutral gray
    ctx.fillStyle = '#777777';
    ctx.fillRect(0, 0, targetSize, targetSize);
    
    // Rotate canvas context around the center
    ctx.translate(targetSize / 2, targetSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Determine scaling for the rotated image
    const isRotated = rotation === 90 || rotation === 270;
    const w = isRotated ? img.height : img.width;
    const h = isRotated ? img.width : img.height;
    
    const scale = Math.min(targetSize / w, targetSize / h);
    const scaledW = Math.round(img.width * scale);
    const scaledH = Math.round(img.height * scale);
    
    // Draw scaled image centered at 0,0
    ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
    
    // Reset transform to read pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
    const data = imgData.data;
    
    const float32Data = new Float32Array(3 * targetSize * targetSize);
    for (let i = 0; i < targetSize * targetSize; i++) {
      float32Data[i] = data[i * 4] / 255.0; // R
      float32Data[targetSize * targetSize + i] = data[i * 4 + 1] / 255.0; // G
      float32Data[2 * targetSize * targetSize + i] = data[i * 4 + 2] / 255.0; // B
    }

    const tensor = new ort.Tensor('float32', float32Data, [1, 3, targetSize, targetSize]);
    const results = await session.run({ images: tensor });
    const output = results.output0.data as Float32Array;
    
    let bestConf = 0;
    let bestIndex = -1;
    
    for (let i = 0; i < 8400; i++) {
      const conf = output[4 * 8400 + i];
      if (conf > bestConf) {
        bestConf = conf;
        bestIndex = i;
      }
    }

    if (bestConf > 0.4) {
      const xc = output[0 * 8400 + bestIndex];
      const yc = output[1 * 8400 + bestIndex];
      const bw = output[2 * 8400 + bestIndex];
      const bh = output[3 * 8400 + bestIndex];

      // We found it! The receipt orientation is 'rotation'.
      // We don't need to un-scale the coordinates here because we will just rotate the original 
      // image before doing the mathematical overlay! But we DO need the coordinates 
      // RELATIVE to the newly rotated image!
      
      const padX = (targetSize - (isRotated ? scaledH : scaledW)) / 2;
      const padY = (targetSize - (isRotated ? scaledW : scaledH)) / 2;

      // The un-scaled coordinates on the logically upright image
      const x1 = ((xc - bw / 2) - padX) / scale;
      const y1 = ((yc - bh / 2) - padY) / scale;
      const x2 = ((xc + bw / 2) - padX) / scale;
      const y2 = ((yc + bh / 2) - padY) / scale;
      
      return {
        box: [
          Math.max(0, x1),
          Math.max(0, y1),
          Math.min(w, x2),
          Math.min(h, y2)
        ],
        rotation
      };
    }
  }

  return null;
}
