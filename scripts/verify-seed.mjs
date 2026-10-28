import fs from 'fs';

const a = JSON.parse(fs.readFileSync('server/data/seed-jobs.vn.json', 'utf8'));
console.log('total', a.length);
const detail = a.filter((j) => j.id <= 13);
const agent = a.filter((j) => j.id > 13);
console.log('detail (scrape tay):', detail.length, '| agent (firecrawl_agent):', agent.length);
console.log('co sourceUrl:', a.filter((j) => j.source).length, '/', a.length);
console.log('description rong:', a.filter((j) => !j.description).length);
const fallback = a.filter((j) => typeof j.requirements === 'string' && j.requirements.startsWith('Kỹ năng:'));
console.log('requirements fallback:', fallback.length, 'ids=', fallback.map((j) => j.id));
console.log('requirements rong:', a.filter((j) => !j.requirements).length);
console.log('--- 4 mau agent (id, company, title, source) ---');
agent.slice(0, 4).forEach((j) => {
  console.log(j.id, '|', j.company, '|', j.title);
  console.log('   source:', j.source);
  console.log('   skills:', (j.tags || []).join(', '));
  console.log('   req[0:120]:', String(j.requirements).slice(0, 120));
});