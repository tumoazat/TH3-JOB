import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATASET = path.join(ROOT, 'docs', 'superpowers', 'datasets', 'golden-cv-jd.json');
const DB = path.join(ROOT, 'server', 'data', 'db.json');

const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf-8'));
const db = JSON.parse(fs.readFileSync(DB, 'utf-8'));

const jobIds = new Set(db.jobs.map((j) => j.id));
const candidateIds = new Set((db.candidates || []).map((c) => c.id));
candidateIds.add('profile');

const pairs = dataset.pairs || [];
let valid = 0;
let invalid = 0;
const missing = [];

for (const p of pairs) {
  const jobOk = jobIds.has(p.jobId);
  const candOk = candidateIds.has(p.candidateId);
  if (jobOk && candOk) {
    valid++;
  } else {
    invalid++;
    missing.push({ pairId: p.pairId, jobId: p.jobId, jobOk, candidateId: p.candidateId, candOk });
  }
}

console.log(`Golden dataset: ${pairs.length} cặp`);
console.log(`Hợp lệ (tham chiếu job/candidat tồn tại): ${valid}`);
console.log(`Không hợp lệ: ${invalid}`);
if (missing.length) {
  console.log('Cặp tham chiếu ID không tồn tại:');
  for (const m of missing) {
    console.log(`  ${m.pairId}: jobId=${m.jobId} (${m.jobOk ? 'ok' : 'MISSING'}), candidateId=${m.candidateId} (${m.candOk ? 'ok' : 'MISSING'})`);
  }
}

process.exit(invalid > 0 ? 1 : 0);
