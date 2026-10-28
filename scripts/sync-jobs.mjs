import fs from 'fs';

const dbPath = 'server/data/db.json';
const seedPath = 'server/data/seed-jobs.vn.json';

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

db.jobs = db.jobs || [];
const index = new Map(db.jobs.map((j, i) => [j.id, i]));
let added = 0;
let updated = 0;
for (const job of seed) {
  const i = index.get(job.id);
  if (i == null) {
    db.jobs.push(job);
    added += 1;
  } else {
    db.jobs[i] = job;
    updated += 1;
  }
}
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`added ${added}, updated ${updated}, total ${db.jobs.length}`);