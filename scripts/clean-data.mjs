import fs from 'fs';

const dbPath = 'server/data/db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.jobs = (db.jobs || []).filter((j) => Number(j.id) >= 7);
db.applications = [];
db.savedJobs = [];
db.candidates = [];
db.postedJobs = [];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('jobs:', db.jobs.length, '| ids', db.jobs[0]?.id, '..', db.jobs[db.jobs.length - 1]?.id);
console.log('applications:', db.applications.length, '| savedJobs:', db.savedJobs.length, '| candidates:', db.candidates.length, '| postedJobs:', db.postedJobs.length);
console.log('profile kept:', !!db.profile, '| employer kept:', !!db.employer);