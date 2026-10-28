import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPdfSignature, extractPdfText } from '../server/cvExtractor';

function makePdf(text: string): Buffer {
  const stream = `BT /F1 24 Tf 72 700 Td (${text}) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

test('isPdfSignature validates %PDF- header', () => {
  assert.equal(isPdfSignature(Buffer.from('%PDF-1.4')), true);
  assert.equal(isPdfSignature(Buffer.from('hello world')), false);
});

test('extractPdfText returns text from a valid PDF', async () => {
  const buf = makePdf('Hello CV Regression');
  const text = await extractPdfText(buf, 20000);
  assert.ok(text.includes('Hello CV Regression'));
});
