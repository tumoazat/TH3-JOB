import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

app.use(cors());
app.use(express.json());

const SEED_JOBS = [
  { id: 1, company: 'NovaTech Solutions', title: 'Thực tập sinh Front-end Developer (ReactJS / UI)', location: 'Hà Nội · Cầu Giấy', type: 'Hybrid', salary: '3–5 triệu', match: 85, deadline: '30/11/2026', tags: ['HTML5', 'CSS3', 'ReactJS', 'Git', 'Tailwind CSS'], description: 'Phát triển giao diện web hiện đại với ReactJS và Tailwind CSS.', requirements: 'Biết HTML/CSS/JS, cơ bản ReactJS, ưu tiên có kinh nghiệm Tailwind.', benefits: 'Lương cạnh tranh, môi trường năng động, cơ hội chính thức.', posted: '15/10/2026' },
  { id: 2, company: 'BlueWave Digital', title: 'Thực tập sinh ReactJS (Có cơ hội lên Chính thức)', location: 'Hà Nội · Thanh Xuân', type: 'On-site', salary: '4–6 triệu', match: 82, deadline: '05/12/2026', tags: ['React', 'Redux Toolkit', 'REST API', 'JavaScript'], description: 'Làm việc trong team product xây dựng SaaS B2B.', requirements: 'React hooks, Redux cơ bản, gọi REST API.', benefits: 'Laptop, đào tạo mentor 1:1, xét lên chính thức sau 3 tháng.', posted: '18/10/2026' },
  { id: 3, company: 'PixelWorks Studio', title: 'Junior Web Developer (Next.js & Tailwind)', location: 'Remote', type: 'Remote', salary: '8–12 triệu', match: 68, deadline: '15/12/2026', tags: ['Next.js', 'Tailwind CSS', 'TypeScript', 'Vercel'], description: 'Xây dựng các landing page và web app cho khách hàng toàn cầu.', requirements: 'Next.js 14+, TypeScript cơ bản, deploy Vercel.', benefits: 'Remote 100%, flex giờ.', posted: '20/10/2026' },
  { id: 4, company: 'DataNest Solutions', title: 'Thực tập sinh Backend Python (Django / Data Analytics)', location: 'Hà Nội · Hoàng Mai', type: 'Hybrid', salary: '3–4 triệu', match: 71, deadline: '20/12/2026', tags: ['Python', 'Django', 'SQL', 'Pandas'], description: 'Hỗ trợ xây dựng pipeline data và REST API nội bộ.', requirements: 'Python cơ bản, biết SQL, ưu tiên có project Django.', benefits: 'Mentoring trực tiếp, báo cáo kết quả thực tập có giá trị.', posted: '21/10/2026' },
  { id: 5, company: 'CodeNest Studio', title: 'Thực tập sinh Full-stack (Node.js + React)', location: 'Hà Nội · Đống Đa', type: 'On-site', salary: '3–5 triệu', match: 74, deadline: '10/12/2026', tags: ['Node.js', 'React', 'Express', 'MongoDB'], description: 'Tham gia phát triển ứng dụng web full-stack.', requirements: 'JavaScript ES6+, React, Express cơ bản.', benefits: 'Thưởng dự án, đội ngũ trẻ.', posted: '22/10/2026' },
  { id: 6, company: 'NorthStar Technology', title: 'Thực tập sinh DevOps / Cloud (AWS)', location: 'Remote', type: 'Remote', salary: '4–7 triệu', match: 60, deadline: '25/12/2026', tags: ['AWS', 'Docker', 'Linux', 'CI/CD'], description: 'Hỗ trợ infrastructure và tự động hoá CI/CD.', requirements: 'Linux cơ bản, Docker, khái niệm cloud.', benefits: 'Remote, chứng chỉ AWS được hỗ trợ.', posted: '22/10/2026' },
];

const SEED_PROFILE = { name: 'Nguyễn Minh Anh', email: 'minhanh.nguyen@email.edu.vn', phone: '0912 345 678', university: 'Đại học Thủy Lợi', major: 'Công nghệ Thông tin', gpa: '3.65/4.0', graduationYear: '2026', skills: ['ReactJS', 'JavaScript', 'HTML/CSS', 'Git', 'Tailwind CSS'], bio: 'Sinh viên CNTT năm 4, đam mê front-end, tìm kiếm cơ hội thực tập.', avatarUrl: null, cvScore: 85, cvFileName: 'CV_NguyenMinhAnh_Frontend_2026.pdf' };

const SEED_APPLICATIONS = [
  { id: 'a1', jobId: 1, status: 'reviewing', appliedDate: '20/10/2026', note: 'HR đã xem hồ sơ' },
  { id: 'a2', jobId: 2, status: 'interview', appliedDate: '18/10/2026', note: 'Online: 28/11 • 09:30' },
  { id: 'a3', jobId: 4, status: 'reviewing', appliedDate: '21/10/2026', note: '' },
  { id: 'a4', jobId: 5, status: 'rejected', appliedDate: '12/10/2026', note: 'Chưa đạt tiêu chí đợt này' },
  { id: 'a5', jobId: 6, status: 'done', appliedDate: '10/10/2026', note: 'Quy trình đã kết thúc' },
];

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const db = {
      jobs: SEED_JOBS,
      applications: SEED_APPLICATIONS,
      savedJobs: [1, 2],
      profile: SEED_PROFILE,
      employer: { company: 'NovaTech Solutions', email: 'hr@novatech.vn', industry: 'Công nghệ', size: '50–200 nhân viên' },
      postedJobs: [
        { id: 'pj1', title: 'Thực tập sinh Front-end Developer (ReactJS / UI)', status: 'active', applicants: 12, views: 89, deadline: '30/11/2026' },
        { id: 'pj2', title: 'Senior Backend Engineer (Node.js)', status: 'active', applicants: 7, views: 54, deadline: '15/12/2026' },
        { id: 'pj3', title: 'UI/UX Designer (Figma)', status: 'closed', applicants: 23, views: 130, deadline: '01/10/2026' },
      ],
      candidates: [
        { id: 'c1', jobId: 'pj1', name: 'Nguyễn Văn An', university: 'BKHN', match: 85, status: 'interview', appliedDate: '20/10/2026' },
        { id: 'c2', jobId: 'pj1', name: 'Trần Thị Bình', university: 'NEU', match: 78, status: 'reviewing', appliedDate: '21/10/2026' },
        { id: 'c3', jobId: 'pj2', name: 'Lê Minh Cường', university: 'UET', match: 91, status: 'offer', appliedDate: '19/10/2026' },
        { id: 'c4', jobId: 'pj1', name: 'Phạm Thị Dung', university: 'PTIT', match: 65, status: 'rejected', appliedDate: '17/10/2026' },
        { id: 'c5', jobId: 'pj2', name: 'Hoàng Văn Em', university: 'BKHN', match: 80, status: 'reviewing', appliedDate: '22/10/2026' },
      ],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
}

function readDB() {
  initDB();
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeDB(db: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Jobs
app.get('/api/jobs', (req, res) => {
  const db = readDB();
  res.json(db.jobs);
});

app.get('/api/jobs/:id', (req, res) => {
  const db = readDB();
  const job = db.jobs.find((j: any) => j.id === Number(req.params.id));
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

// Applications
app.get('/api/applications', (req, res) => {
  const db = readDB();
  res.json(db.applications);
});

app.post('/api/applications/apply', (req, res) => {
  const db = readDB();
  const { jobId, note = '' } = req.body;
  if (db.applications.some((app: any) => app.jobId === Number(jobId))) {
    return res.json({ success: false, message: 'Đã ứng tuyển' });
  }
  const app = {
    id: `a${Date.now()}`,
    jobId: Number(jobId),
    status: 'reviewing',
    appliedDate: new Date().toLocaleDateString('vi-VN'),
    note
  };
  db.applications.push(app);
  writeDB(db);
  res.json({ success: true, application: app });
});

// Saved jobs
app.get('/api/saved', (req, res) => {
  const db = readDB();
  res.json(db.savedJobs);
});

app.post('/api/saved/toggle', (req, res) => {
  const db = readDB();
  const { jobId } = req.body;
  const numericId = Number(jobId);
  const idx = db.savedJobs.indexOf(numericId);
  if (idx > -1) {
    db.savedJobs.splice(idx, 1);
    writeDB(db);
    return res.json({ saved: false, savedJobs: db.savedJobs });
  } else {
    db.savedJobs.push(numericId);
    writeDB(db);
    return res.json({ saved: true, savedJobs: db.savedJobs });
  }
});

// Profile
app.get('/api/profile', (req, res) => {
  const db = readDB();
  res.json(db.profile);
});

app.put('/api/profile', (req, res) => {
  const db = readDB();
  db.profile = { ...db.profile, ...req.body };
  writeDB(db);
  res.json(db.profile);
});

// Employer
app.get('/api/employer', (req, res) => {
  const db = readDB();
  res.json(db.employer);
});

// Posted jobs
app.get('/api/posted-jobs', (req, res) => {
  const db = readDB();
  res.json(db.postedJobs);
});

app.post('/api/posted-jobs', (req, res) => {
  const db = readDB();
  const job = {
    id: `pj${Date.now()}`,
    title: req.body.title,
    status: 'active',
    applicants: 0,
    views: 0,
    deadline: req.body.deadline || ''
  };
  db.postedJobs.push(job);
  writeDB(db);
  res.json({ success: true, job });
});

// Candidates
app.get('/api/candidates', (req, res) => {
  const db = readDB();
  const { jobId } = req.query;
  if (jobId) {
    res.json(db.candidates.filter((c: any) => c.jobId === jobId));
  } else {
    res.json(db.candidates);
  }
});

app.put('/api/candidates/:id/status', (req, res) => {
  const db = readDB();
  const { status } = req.body;
  db.candidates = db.candidates.map((c: any) => c.id === req.params.id ? { ...c, status } : c);
  writeDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
