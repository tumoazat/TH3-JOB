import fs from 'fs';

const AGENT_FILE = process.argv[2];
if (!AGENT_FILE) {
  console.error('usage: node scripts/build-seed.mjs <agent-output.json>');
  process.exit(1);
}

const LOC_MAP = {
  'Ho Chi Minh': 'TP. Hồ Chí Minh',
  'Ha Noi': 'Hà Nội',
  'Da Nang': 'Đà Nẵng',
  'Can Tho': 'Cần Thơ',
};

function normLocation(loc) {
  if (!loc) return 'Việt Nam';
  const key = Object.keys(LOC_MAP).find((k) => loc.toLowerCase().includes(k.toLowerCase()));
  return key ? LOC_MAP[key] : loc;
}

function normSalary(s) {
  if (!s) return 'Thỏa thuận';
  if (/not\s*(specified|disclosed)|sign in to view|competitive/i.test(s)) return 'Thỏa thuận';
  return s.trim();
}

function normSkills(list) {
  return [...new Set((list || []).map((x) => String(x).trim()).filter(Boolean))];
}

const detailJobs = [
  {
    id: 7,
    company: 'DNSE',
    title: 'Senior Backend Developer (Golang)',
    location: 'Hà Nội',
    type: 'On-site',
    salary: 'Thỏa thuận',
    tags: ['Golang', 'API', 'Docker', 'MySQL', 'Microservices', 'SQL'],
    description:
      'Thiết kế và phát triển RESTful API cho các ứng dụng web và mobile; xây dựng hệ thống backend an toàn, mở rộng tốt; cải thiện chất lượng code qua testing và review.',
    requirements:
      '3-5 năm kinh nghiệm Backend với Golang; tư duy system design và xử lý bất đồng bộ; thành thạo Git; kinh nghiệm RESTful API và hệ thống tải cao; kiến thức SQL (Postgres/MySQL).',
    benefits: 'Lương cạnh tranh, bảo hiểm, môi trường sản phẩm tài chính.',
    deadline: '31/12/2026',
    status: 'open',
    posted: '28/10/2026',
    source: 'https://itviec.com/it-jobs/senior-backend-developer-golang-dnse-1612',
  },
  {
    id: 8,
    company: 'CodeHQ',
    title: 'Senior Manual QA/QC Testers (Playwright)',
    location: 'TP. Hồ Chí Minh',
    type: 'On-site',
    salary: 'Thỏa thuận',
    tags: ['Tester', 'Playwright', 'API', 'TestRail', 'QA QC', 'English'],
    description:
      'Tham gia team CodeHQ Việt Nam, làm việc trên nhiều công nghệ cho các dự án phần mềm của khách hàng New Zealand; đảm bảo chất lượng qua lập kế hoạch và thực thi kiểm thử.',
    requirements:
      'Tối thiểu 5 năm kinh nghiệm kiểm thử phần mềm; mạnh về manual testing; quen công cụ quản lý test như Xray, TestRail; tiếng Anh tốt (ưu tiên IELTS).',
    benefits: 'Dự án quốc tế, môi trường chuyên nghiệp.',
    deadline: '31/12/2026',
    status: 'open',
    posted: '28/10/2026',
    source: 'https://itviec.com/it-jobs/senior-manual-qa-qc-testers-playwright-codehq-2705',
  },
  {
    id: 9,
    company: 'ETC Technology Systems',
    title: 'Data Analyst (SQL, PowerBI, Looker)',
    location: 'Hà Nội',
    type: 'On-site',
    salary: 'Thỏa thuận',
    tags: ['Data Analysis', 'Data modeling', 'SQL', 'Power BI', 'Looker'],
    description:
      'Khảo sát, thu thập và phân tích dữ liệu để tài liệu hóa nguồn dữ liệu nghiệp vụ; phối hợp xây dựng và tối ưu data model, dashboard tự động bằng BI tools; đưa ra khuyến nghị dựa trên dữ liệu.',
    requirements:
      'Tốt nghiệp đại học ngành liên quan; tối thiểu 1 năm kinh nghiệm BA/Data Analyst; ưu tiên Bank/Fintech; tiếng Anh (IELTS 6.0+); quen PowerBI/Looker; SQL vững; hiểu data governance.',
    benefits: 'Lộ trình phát triển dữ liệu, dự án tài chính.',
    deadline: '31/12/2026',
    status: 'open',
    posted: '28/10/2026',
    source: 'https://itviec.com/it-jobs/data-analyst-sql-powerbi-looker-etc-technology-systems-3448',
  },
  {
    id: 10,
    company: 'GeoComply',
    title: 'Senior iOS Engineer',
    location: 'TP. Hồ Chí Minh',
    type: 'Hybrid',
    salary: 'Thỏa thuận',
    tags: ['iOS', 'Swift', 'Objective C', 'CI/CD', 'English'],
    description:
      'Tham gia hiện đại hóa dịch vụ định vị địa lý; tối ưu iOS SDK, phối hợp team client để nâng cao trải nghiệm và độ tin cậy sản phẩm.',
    requirements:
      '5+ năm lập trình; thành thạo Objective-C và Swift; kinh nghiệm CI/CD; tư duy phân tích và giải quyết vấn đề tốt; tiếng Anh kỹ thuật trung cấp.',
    benefits: 'Sản phẩm quốc tế, hybrid.',
    deadline: '31/12/2026',
    status: 'open',
    posted: '28/10/2026',
    source: 'https://itviec.com/it-jobs/senior-ios-engineer-fluent-in-english-geocomply-geotech-hub-vietnam-3355',
  },
  {
    id: 11,
    company: 'Saigon Technology',
    title: 'Java Developer (Middle/Senior)',
    location: 'Đà Nẵng',
    type: 'On-site',
    salary: 'Thỏa thuận',
    tags: ['Java', 'Spring', 'Database', 'Kafka', 'AWS', 'SOLID'],
    description:
      'Thiết kế, xây dựng và bảo trì API, service và hệ thống giữa các team; xử lý thách thức kỹ thuật và quản lý kỳ vọng khách hàng.',
    requirements:
      '3+ năm xây dựng ứng dụng web; hiểu vững database và thiết kế DB; mạnh Java; kinh nghiệm microservices Java trên AWS; nắm SOLID và design pattern; tiếng Anh tốt.',
    benefits: 'Dự án outsourcing, đào tạo.',
    deadline: '31/12/2026',
    status: 'open',
    posted: '28/10/2026',
    source: 'https://itviec.com/it-jobs/java-developer-middle-senior-saigon-technology-2159',
  },
  {
    id: 12,
    company: 'LG CNS Việt Nam',
    title: 'Frontend ReactJS Developer',
    location: 'Hà Nội',
    type: 'On-site',
    salary: 'Thỏa thuận',
    tags: ['ReactJS', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Figma'],
    description:
      'Tham gia dự án lớn từ Hàn Quốc; thiết kế UI theo tiêu chuẩn khách hàng, tối ưu hiệu năng và viết unit test.',
    requirements:
      'React.js; HTML/CSS/JavaScript; Figma; CI/CD; ưu tiên TypeScript, Node.js, kiến thức backend, thư viện chart.',
    benefits: 'Dự án quốc tế, môi trường chuyên nghiệp.',
    deadline: '31/12/2026',
    status: 'open',
    posted: '28/10/2026',
    source: 'https://itviec.com/it-jobs/frontend-reactjs-developer-lg-cns-viet-nam-1045',
  },
  {
    id: 13,
    company: 'NEXLAB IT Solutions',
    title: 'Senior Frontend Developer (ReactJS/NextJS/TypeScript)',
    location: 'TP. Hồ Chí Minh',
    type: 'On-site',
    salary: 'Thỏa thuận',
    tags: ['ReactJS', 'Figma', 'GraphQL', 'JavaScript', 'TypeScript', 'NextJS'],
    description:
      'Dẫn dắt phát triển ứng dụng web an toàn, hiệu năng cao trên Next.js và React.js; sở hữu kiến trúc frontend và hiệu năng, phối hợp chặt với design và backend.',
    requirements:
      'Chuyên sâu React.js và Next.js; TypeScript/JavaScript vững; REST/GraphQL/WebSockets; quen design system Figma; dùng AI coding tools; 5+ năm kinh nghiệm frontend.',
    benefits: 'Sản phẩm quốc tế.',
    deadline: '31/12/2026',
    status: 'open',
    posted: '28/10/2026',
    source: 'https://itviec.com/it-jobs/senior-frontend-developer-cong-ty-tnhh-nexlab-it-solutions-5550',
  },
];

const raw = JSON.parse(fs.readFileSync(AGENT_FILE, 'utf8'));
const agentJobs = (raw.data && raw.data.jobs) || raw.jobs || [];
if (!Array.isArray(agentJobs) || agentJobs.length === 0) {
  console.error('no jobs found in agent output');
  process.exit(1);
}

let nextId = 14;
const converted = agentJobs.map((j) => {
  const tags = normSkills(j.skills);
  const reqs = Array.isArray(j.requirements) && j.requirements.length
    ? j.requirements.join('; ')
    : `Kỹ năng: ${tags.join(', ')}.`;
  return {
    id: nextId++,
    company: (j.company || '').trim() || 'Nhà tuyển dụng',
    title: (j.title || '').trim() || 'Vị trí tuyển dụng',
    location: normLocation(j.location),
    type: 'On-site',
    salary: normSalary(j.salary),
    tags,
    description: (j.description || '').trim(),
    requirements: reqs,
    benefits: '',
    deadline: '31/12/2026',
    status: 'open',
    posted: '28/10/2026',
    source: j.sourceUrl || '',
  };
});

const all = [...detailJobs, ...converted];
fs.writeFileSync('server/data/seed-jobs.vn.json', JSON.stringify(all, null, 2));
console.log(`wrote ${all.length} jobs (detail ${detailJobs.length} + agent ${converted.length})`);