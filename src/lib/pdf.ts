import { shrink } from './util';

/* eslint-disable @typescript-eslint/no-explicit-any -- pdf.js is loaded from a CDN, no bundled types */
declare global { interface Window { pdfjsLib?: any } }

// PDF.js loads only when the first PDF is uploaded; a cross-origin worker URL is wrapped by PDF.js itself
let pdfjsReady: Promise<any> | null = null;
function loadPdfJs(): Promise<any> {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return pdfjsReady || (pdfjsReady = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(window.pdfjsLib); };
    s.onerror = () => { pdfjsReady = null; reject(new Error('pdf.js did not load')); };
    document.head.appendChild(s);
  }));
}

// ponytail: pages kept as JPEG pictures in browser storage (4 pages, 800px wide); the real service stores the PDF on the server
export async function bulletinPages(file: File): Promise<{ pages: string[]; pageCount: number }> {
  if (file.type !== 'application/pdf') return { pages: [await shrink(file, 1400)], pageCount: 1 };
  const pdf = await (await loadPdfJs()).getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(pdf.numPages, 4); n++) {
    const page = await pdf.getPage(n), vp = page.getViewport({ scale: 800 / page.getViewport({ scale: 1 }).width });
    const c = document.createElement('canvas'), ctx = c.getContext('2d')!;
    c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    pages.push(c.toDataURL('image/jpeg', 0.72));
  }
  return { pages, pageCount: pdf.numPages };
}
