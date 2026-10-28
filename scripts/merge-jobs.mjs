import fs from 'fs';

const dbPath = 'server/data/db.json';
const seedPath = 'server/data/seed-jobs.vn.json';

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

db.jobs = db.jobs || [];
const existing = new Set(db.jobs.map((j) => j.id));
let added = 0;
for (const job of seed) {
  if (!existing.has(job.id)) {
    db.jobs.push(job);
    added += 1;
  }
}
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`added ${added} jobs, total ${db.jobs.length}`);