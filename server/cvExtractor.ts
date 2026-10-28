import { PDFParse } from 'pdf-parse';

export function isPdfSignature(buf: Buffer): boolean {
  return Buffer.isBuffer(buf) && buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-';
}

export async function extractPdfText(data: Buffer, timeoutMs = 30000): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(data) });
  let timer: NodeJS.Timeout | undefined;
  try {
    const result = await Promise.race([
      parser.getText(),
      new Promise<never>((_, reject) => {
        // ponytail: best-effort timeout — pdfjs worker may keep running in background; sufficient for demo scale
        timer = setTimeout(() => reject(new Error('PDF_EXTRACT_TIMEOUT')), timeoutMs);
      }),
    ]);
    return (result as { text?: string }).text || '';
  } finally {
    if (timer) clearTimeout(timer);
    try {
      await parser.destroy();
    } catch {
      /* ignore cleanup errors */
    }
  }
}
