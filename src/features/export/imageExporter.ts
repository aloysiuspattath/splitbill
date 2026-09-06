import { toPng } from 'html-to-image';

/**
 * Captures an HTML element (e.g. the receipt card) and downloads it as a PNG image.
 */
export async function downloadElementAsImage(
  element: HTMLElement,
  filename: string = 'splitbill-receipt.png'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2, // High resolution for mobile retina screens
      backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    link.remove();
  } catch (err) {
    console.error('Failed to export element as image:', err);
    throw new Error('Image export failed. Please try saving as PDF or taking a screenshot.');
  }
}
