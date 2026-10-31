import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { execFileSync } from 'child_process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
dotenv.config();
import {
  normalizeSkill,
  computeSkillScore,
  computeKeywordScore,
  computeMatch,
  classifyBand,
} from '../src/lib/matching.ts';
import multer from 'multer';
import { extractPdfText, isPdfSignature } from './cvExtractor.ts';
import { geminiMatch, RUBRIC_VERSION, PROMPT_VERSION } from './services/geminiMatch.ts';
import type { MatchResult } from './services/geminiMatch.ts';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// ponytail: minimum AI config — env toggle, stdlib fs only, no external deps.
// ML stays off by default (spec: pending until real CV + multiple reviewers).
const MATCHING_METHOD = process.env.MATCHING_METHOD || (process.env.GEMINI_API_KEY ? 'gemini' : 'baseline');
const MODEL_FILE = path.join(__dirname, 'models', 'linear-match.json');
let mlModel = null;
try {
  if (fs.existsSync(MODEL_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf-8'));
    mlModel = parsed.weights
      ? { w0: parsed.weights.w0, w1: parsed.weights.w1, w2: parsed.weights.w2, modelVersion: parsed.modelVersion }
      : null;
  }
} catch { /* ignore: model optional */ }

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_EXPIRES = '7d';
const COOKIE_NAME = 'cm_token';
const VALID_ROLES = ['candidate', 'employer', 'admin'];

type AuthUser = { id: string; email: string; role: string; name: string };

function signToken(user: AuthUser) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function setAuthCookie(res: any, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function authFromReq(req: any): AuthUser | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    return { id: payload.id, email: payload.email, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

function requireAuth(req: any, res: any, next: any) {
  const user = authFromReq(req);
  if (!user) return res.status(401).json({ error: { code: 401, message: 'Chưa đăng nhập' } });
  req.user = user;
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    requireAuth(req, res, () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: { code: 403, message: 'Không có quyền truy cập' } });
      }
      next();
    });
  };
}

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
  } else {
    // Migrate existing DB: ensure users collection + seed demo admin once.
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      let changed = false;
      if (!Array.isArray(db.users)) { db.users = []; changed = true; }
      if (!db.users.some((u: any) => u.role === 'admin')) {
        db.users.push({
          id: 'u_admin',
          email: 'admin@careermatch.local',
          passwordHash: bcrypt.hashSync('admin123', 10),
          role: 'admin',
          name: 'Quản trị viên',
          createdAt: new Date().toISOString(),
        });
        changed = true;
      }
      if (changed) fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch { /* ignore: DB corrupt, initDB will recreate on next if missing */ }
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

// Auth
function publicUser(u: any) {
  return { id: u.id, email: u.email, role: u.role, name: u.name, createdAt: u.createdAt };
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: { code: 400, message: 'Thiếu email, mật khẩu hoặc tên' } });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: { code: 400, message: 'Email không hợp lệ' } });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: { code: 400, message: 'Mật khẩu phải từ 6 ký tự' } });
  }
  const chosenRole = VALID_ROLES.includes(role) ? role : 'candidate';
  if (chosenRole === 'admin') {
    return res.status(403).json({ error: { code: 403, message: 'Không thể đăng ký vai trò admin' } });
  }
  const db = readDB();
  db.users = db.users || [];
  if (db.users.some((u: any) => String(u.email).toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ error: { code: 409, message: 'Email đã được đăng ký' } });
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = {
    id: `u_${uuidv4().slice(0, 8)}`,
    email: String(email).toLowerCase(),
    passwordHash,
    role: chosenRole,
    name: String(name),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDB(db);

  const token = signToken(publicUser(user));
  setAuthCookie(res, token);
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: { code: 400, message: 'Thiếu email hoặc mật khẩu' } });
  }
  const db = readDB();
  db.users = db.users || [];
  const user = db.users.find((u: any) => String(u.email).toLowerCase() === String(email).toLowerCase());
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return res.status(401).json({ error: { code: 401, message: 'Email hoặc mật khẩu không đúng' } });
  }
  const token = signToken(publicUser(user));
  setAuthCookie(res, token);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req: any, res) => {
  res.json({ user: req.user });
});

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
  const authUser = authFromReq(req);
  const job = {
    id: `pj${Date.now()}`,
    title: req.body.title,
    status: 'active',
    applicants: 0,
    views: 0,
    deadline: req.body.deadline || '',
    employerId: authUser?.id || null,
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

// Matching engine (Level 1 baseline + Gemini semantic matching with fallback)
async function buildMatchResult(job: any, candidate: any) {
  const jobTags: string[] = Array.isArray(job?.tags) ? job.tags : [];
  const skills: string[] = Array.isArray(candidate?.skills) ? candidate.skills : [];
  const cvText: string = candidate?.cvText || candidate?.bio || '';
  const jdText = [job?.title, job?.description, job?.requirements].filter(Boolean).join(' ');

  const skillScore = computeSkillScore(skills, jobTags);
  const keywordScore = computeKeywordScore(cvText, jdText);
  const ruleScore = computeMatch(skillScore, keywordScore);

  const dataStatus =
    skillScore != null && keywordScore != null
      ? 'complete'
      : skillScore != null || keywordScore != null
        ? 'partial'
        : 'insufficient';

  let match: number | null = ruleScore;
  let method: string = 'rule-based';
  let fallback = false;
  let geminiResult: MatchResult | null = null;

  if (MATCHING_METHOD === 'gemini') {
    try {
      const result = await geminiMatch(
        cvText,
        job?.title || '',
        job?.description || '',
        job?.requirements || '',
        ruleScore,
        skills,
        jobTags,
      );
      match = result.match;
      method = result.matchingMethod === 'gemini_semantic' ? 'gemini_semantic' : 'rule-based';
      fallback = result.matchingMethod === 'rule_based_fallback';
      geminiResult = result;
    } catch {
      match = ruleScore;
      method = 'rule-based';
      fallback = true;
    }
  }

  const cSet = new Set(skills.map(s => s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '')));
  const seen = new Set<string>();
  const ruleMatchedSkills: string[] = [];
  const ruleMissingSkills: string[] = [];
  for (const tag of jobTags) {
    const n = tag.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '');
    if (!n || seen.has(n)) continue;
    seen.add(n);
    if (cSet.has(n)) ruleMatchedSkills.push(tag);
    else ruleMissingSkills.push(tag);
  }

  const finalExplanation = geminiResult
    ? {
        skillScore,
        keywordScore,
        summary: geminiResult.explanation,
        criteria: geminiResult.criteria,
        confidence: geminiResult.confidence,
      }
    : {
        skillScore,
        keywordScore,
        summary:
          match == null
            ? 'Chưa đủ dữ liệu để đánh giá.'
            : `Khớp ${ruleMatchedSkills.length}/${ruleMatchedSkills.length + ruleMissingSkills.length} kỹ năng yêu cầu.`,
      };

  return {
    jobId: job?.id,
    match,
    band: classifyBand(match),
    method,
    fallback,
    modelVersion: method === 'ml' ? (mlModel?.modelVersion ?? null) : null,
    dataStatus,
    matchedSkills: geminiResult?.matchedSkills ?? ruleMatchedSkills,
    missingSkills: geminiResult?.missingSkills ?? ruleMissingSkills,
    explanation: finalExplanation,
    strengths: geminiResult?.strengths ?? [],
    weaknesses: geminiResult?.weaknesses ?? [],
    recommendations: geminiResult?.recommendations ?? [],
    matchingMethod: geminiResult?.matchingMethod ?? (fallback ? 'rule_based_fallback' : 'rule_based'),
    criteria: geminiResult?.criteria ?? [],
    confidence: geminiResult?.confidence ?? (fallback ? 0.5 : null),
    rubricVersion: geminiResult?.rubricVersion ?? RUBRIC_VERSION,
    promptVersion: geminiResult?.promptVersion ?? PROMPT_VERSION,
  };
}

app.post('/api/match', async (req, res) => {
  const db = readDB();
  const { jobId, candidateId } = req.body || {};
  const job = db.jobs.find((j: any) => j.id === Number(jobId));
  if (!job) {
    return res.status(404).json({ error: { code: 404, message: 'Công việc không tồn tại' } });
  }
  const candidate = candidateId
    ? db.candidates.find((c: any) => c.id === candidateId)
    : db.profile;
  if (!candidate) {
    return res.status(404).json({ error: { code: 404, message: 'Ứng viên không tồn tại' } });
  }
  res.json(await buildMatchResult(job, candidate));
});

app.get('/api/match/batch', (req, res) => {
  const file = path.join(__dirname, '..', 'match_all_candidates.json');
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: { code: 404, message: 'Chưa có dữ liệu matching batch' } });
  }
  let data: Record<string, any[]>;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e: any) {
    return res.status(500).json({ error: { code: 500, message: 'Lỗi đọc dữ liệu matching: ' + e.message } });
  }
  const db = readDB();
  const jmap: Record<number, any> = {};
  db.jobs.forEach((j: any) => { jmap[j.id] = j; });
  const { candidateId, limit, category, location, minMatch, band } = req.query;
  if (candidateId) {
    const results = data[candidateId as string];
    if (!results) {
      return res.status(404).json({ error: { code: 404, message: 'Không tìm thấy kết quả cho candidate này' } });
    }
    let filtered = results.filter((r: any) => {
      const j = jmap[r.jobId];
      if (category && j?.category && String(j.category).toLowerCase() !== String(category).toLowerCase()) return false;
      if (location && j?.location && !String(j.location).toLowerCase().includes(String(location).toLowerCase())) return false;
      if (minMatch != null && (r.match ?? 0) < Number(minMatch)) return false;
      if (band && r.band !== String(band)) return false;
      return true;
    });
    const top = limit ? filtered.slice(0, Number(limit)) : filtered;
    return res.json({ candidateId, total: filtered.length, results: top });
  }
  const summary = Object.entries(data).map(([cid, arr]) => {
    const filtered = arr.filter((r: any) => {
      const j = jmap[r.jobId];
      if (category && j?.category && String(j.category).toLowerCase() !== String(category).toLowerCase()) return false;
      if (location && j?.location && !String(j.location).toLowerCase().includes(String(location).toLowerCase())) return false;
      if (minMatch != null && (r.match ?? 0) < Number(minMatch)) return false;
      if (band && r.band !== String(band)) return false;
      return true;
    });
    return {
      candidateId: cid,
      topJob: filtered[0]?.jobId ?? null,
      topMatch: filtered[0]?.match ?? null,
      topBand: filtered[0]?.band ?? null,
      ratKhopCount: filtered.filter((x: any) => x.band === 'Rất khớp').length,
    };
  });
  res.json({ totalCandidates: summary.length, summary });
});

app.get('/api/match/all', async (req, res) => {
  const db = readDB();
  const { candidateId } = req.query;
  const candidate = candidateId === 'profile'
    ? db.profile
    : candidateId
      ? db.candidates.find((c: any) => c.id === candidateId)
      : db.profile;
  if (!candidate) {
    return res.status(404).json({ error: { code: 404, message: 'Ứng viên không tồn tại' } });
  }
  const results = await Promise.all(db.jobs.map(async (job: any) => {
    const r = await buildMatchResult(job, candidate);
    return { jobId: r.jobId, match: r.match, band: r.band, dataStatus: r.dataStatus };
  }));
  results.sort((a: any, b: any) => (b.match ?? -1) - (a.match ?? -1));
  res.json(results);
});

app.put('/api/cv/manual', (req, res) => {
  const db = readDB();
  const { cvText, candidateId } = req.body || {};
  if (typeof cvText !== 'string' || cvText.trim() === '') {
    return res.status(400).json({ error: { code: 400, message: 'Nội dung CV không được rỗng' } });
  }
  if (candidateId) {
    const idx = db.candidates.findIndex((c: any) => c.id === candidateId);
    if (idx === -1) {
      return res.status(404).json({ error: { code: 404, message: 'Ứng viên không tồn tại' } });
    }
    db.candidates[idx] = { ...db.candidates[idx], cvText: cvText.trim() };
  } else {
    db.profile = { ...db.profile, cvText: cvText.trim() };
  }
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/cv/extract', upload.single('file'), async (req, res) => {
  const file = (req as any).file as { mimetype: string; buffer: Buffer } | undefined;
  if (!file) {
    return res.status(400).json({ error: { code: 400, message: 'File PDF bắt buộc' } });
  }
  if (file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: { code: 400, message: 'Chỉ chấp nhận file PDF' } });
  }
  if (!isPdfSignature(file.buffer)) {
    return res.status(400).json({ error: { code: 400, message: 'File không phải PDF hợp lệ' } });
  }
  try {
    const text = await extractPdfText(file.buffer, 30000);
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return res.status(422).json({
        error: {
          code: 422,
          message: 'Không thể trích xuất văn bản từ PDF. Vui lòng nhập thông tin CV thủ công.',
        },
      });
    }
    const db = readDB();
    db.profile = { ...db.profile, cvText: trimmed };
    writeDB(db);
    res.json({ cvText: trimmed });
  } catch (e: any) {
    const isTimeout = e?.message === 'PDF_EXTRACT_TIMEOUT';
    res.status(422).json({
      error: {
        code: 422,
        message: isTimeout
          ? 'Xử lý PDF quá lâu, đã hủy. Vui lòng nhập thông tin CV thủ công.'
          : 'Không thể trích xuất văn bản từ PDF. Vui lòng nhập thông tin CV thủ công.',
      },
    });
  }
});

app.post('/api/match/feedback', (req, res) => {
  const { candidateId, jobId, action } = req.body || {};
  if (!candidateId || !jobId || !action) {
    return res.status(400).json({ error: { code: 400, message: 'Thiếu candidateId, jobId hoặc action' } });
  }
  const file = path.join(__dirname, 'data', 'match_feedback.json');
  let existing: any[] = [];
  try {
    existing = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch { /* ignore */ }
  existing.push({ candidateId, jobId: Number(jobId), action, createdAt: new Date().toISOString() });
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));
  res.json({ success: true, count: existing.length });
});

app.get('/api/match/feedback', (_req, res) => {
  const file = path.join(__dirname, 'data', 'match_feedback.json');
  let existing: any[] = [];
  try {
    existing = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch { /* ignore */ }
  res.json({ count: existing.length, feedback: existing });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: { code: 400, message: 'File vượt quá 5 MB' } });
  }
  res.status(500).json({ error: { code: 500, message: 'Lỗi server nội bộ' } });
});

// BI Statistics endpoints
app.get('/api/stats/overview', (_req, res) => {
  const db = readDB();
  const jobs = db.jobs || [];
  const candidates = db.candidates || [];
  const profile = db.profile || {};
  const employers = db.employer ? 1 : 0;
  const postedJobs = db.postedJobs || [];
  const applications = db.applications || [];

  const skillsCount: Record<string, number> = {};
  jobs.forEach((j: any) => {
    (j.tags || []).forEach((t: string) => { skillsCount[t] = (skillsCount[t] || 0) + 1; });
  });
  const topSkills = Object.entries(skillsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const locationsCount: Record<string, number> = {};
  jobs.forEach((j: any) => { locationsCount[j.location] = (locationsCount[j.location] || 0) + 1; });
  const topLocations = Object.entries(locationsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const statusCount: Record<string, number> = {};
  applications.forEach((a: any) => { statusCount[a.status] = (statusCount[a.status] || 0) + 1; });

  // Phase 7: phân bố ứng viên theo ngành
  const categoryCount: Record<string, number> = {};
  candidates.forEach((c: any) => {
    const cat = c.category || 'Khác';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const categoryDistribution = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Phase 7: nguồn dữ liệu (thực tế vs synthetic vs AI)
  const dataSources = {
    real: candidates.filter((c: any) => !c.synthetic).length,
    synthetic: candidates.filter((c: any) => c.synthetic).length,
    aiPredicted: 0,
  };

  // Phase 7: phân bố lương (dựa trên trường salary text; cảnh báo nếu thiếu số liệu)
  const salaryCount: Record<string, number> = {};
  let numericSalaryJobs = 0;
  jobs.forEach((j: any) => {
    if (typeof j.salary_min === 'number' && typeof j.salary_max === 'number') numericSalaryJobs++;
    const key = j.salary ? String(j.salary).trim() : 'Không rõ';
    salaryCount[key] = (salaryCount[key] || 0) + 1;
  });
  const salaryDistribution = Object.entries(salaryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Phase 7: tỷ lệ chuyển đổi qua trạng thái ứng tuyển
  const totalApps = applications.length || 1;
  const conversion = Object.entries(statusCount).map(([status, count]) => ({
    status,
    count,
    rate: Math.round((count / totalApps) * 100),
  }));

  res.json({
    totalJobs: jobs.length,
    totalCandidates: candidates.length,
    totalProfile: profile ? 1 : 0,
    totalEmployers: employers,
    totalPostedJobs: postedJobs.length,
    totalApplications: applications.length,
    topSkills,
    topLocations,
    applicationStatus: statusCount,
    categoryDistribution,
    dataSources,
    salaryDistribution,
    salaryDataNote: numericSalaryJobs === 0
      ? 'Không có dữ liệu lương dạng số (salary_min/salary_max). Chỉ phân bố theo mô tả lương.'
      : `${numericSalaryJobs} tin có dữ liệu lương dạng số.`,
    conversion,
  });
});

app.get('/api/stats/matching-distribution', (_req, res) => {
  const db = readDB();
  const jobs = db.jobs || [];
  const candidates = db.candidates || [];
  const profile = db.profile;

  const bands: Record<string, number> = { 'Rất khớp': 0, 'Khớp tốt': 0, 'Khớp tiềm năng': 0, 'Cần bổ sung': 0 };
  let count = 0;

  const sampleJobs = jobs.slice(0, 20);
  const sampleCands = (candidates.length ? candidates : [profile]).slice(0, 30);
  sampleCands.forEach((cand: any) => {
    sampleJobs.forEach((job: any) => {
      const skillScore = computeSkillScore(cand.skills || [], job.tags || []);
      const keywordScore = computeKeywordScore(cand.cvText || cand.bio || '', [job.title, job.description, job.requirements].filter(Boolean).join(' '));
      const match = computeMatch(skillScore, keywordScore);
      if (match != null) {
        const band = classifyBand(match);
        bands[band] = (bands[band] || 0) + 1;
        count++;
      }
    });
  });

  res.json({ totalPairs: count, distribution: bands, sampled: true });
});

app.get('/api/stats/skills', (_req, res) => {
  const db = readDB();
  const jobs = db.jobs || [];
  const candidates = db.candidates || [];
  const profile = db.profile;

  const requiredSkills: Record<string, number> = {};
  const candidateSkills: Record<string, number> = {};

  jobs.forEach((j: any) => {
    (j.tags || []).forEach((t: string) => { requiredSkills[t] = (requiredSkills[t] || 0) + 1; });
  });
  (candidates.length ? candidates : [profile]).forEach((c: any) => {
    (c.skills || []).forEach((t: string) => { candidateSkills[t] = (candidateSkills[t] || 0) + 1; });
  });

  const allSkills = new Set([...Object.keys(requiredSkills), ...Object.keys(candidateSkills)]);
  const comparison = Array.from(allSkills).map(skill => ({
    name: skill,
    requiredByJobs: requiredSkills[skill] || 0,
    ownedByCandidates: candidateSkills[skill] || 0,
  })).sort((a, b) => b.requiredByJobs - a.requiredByJobs).slice(0, 20);

  res.json({ comparison });
});

// ML endpoints
app.get('/api/ai/model-info', (_req, res) => {
  const metaPath = path.join(__dirname, 'models', 'ml_meta.json');
  let meta = null;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  } catch { /* ignore */ }
  res.json(meta || { status: 'not_trained', message: 'Chưa huấn luyện mô hình ML' });
});

app.get('/api/ai/model-status', (_req, res) => {
  const metaPath = path.join(__dirname, 'models', 'ml_meta.json');
  const modelPath = path.join(__dirname, 'models', 'ml_model.joblib');
  let meta: any = null;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  } catch { /* ignore */ }
  res.json({
    aiMatchingMethod: MATCHING_METHOD,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    mlModelExists: fs.existsSync(modelPath),
    mlModelVersion: meta?.model_version ?? null,
    mlBestModel: meta?.best_model ?? null,
    mlStatus: meta?.status ?? (meta ? 'trained' : 'not_trained'),
    lastTrainingDate: meta?.training_date ?? null,
    healthy: true,
  });
});

app.post('/api/ai/predict', (req, res) => {
  const { candidateId, jobId } = req.body || {};
  if (!candidateId || jobId == null) {
    return res.status(400).json({ error: { code: 400, message: 'Thiếu candidateId hoặc jobId' } });
  }
  try {
    const output = execFileSync(
      'python',
      [path.join(__dirname, '..', 'ml', 'predict.py'), String(candidateId), String(jobId)],
      { encoding: 'utf-8', maxBuffer: 1024 * 1024, timeout: 30000 },
    );
    const result = JSON.parse(output);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: { code: 500, message: 'Lỗi dự đoán ML: ' + e.message } });
  }
});

// Employer dashboard stats
app.get('/api/employer/stats', requireRole(['employer', 'admin']), (req: any, res) => {
  const db = readDB();
  const allPosted = db.postedJobs || [];
  const mine = allPosted.filter((p: any) => !p.employerId || p.employerId === req.user.id);
  const postedJobs = mine.length ? mine : allPosted;
  const totalPosts = postedJobs.length;
  const totalViews = postedJobs.reduce((s: number, p: any) => s + (Number(p.views) || 0), 0);
  const totalApplicants = postedJobs.reduce((s: number, p: any) => s + (Number(p.applicants) || 0), 0);
  const candidates = db.candidates || [];
  const offers = candidates.filter((c: any) => c.status === 'offer').length;
  const applyRate = totalViews ? Math.round((totalApplicants / totalViews) * 100) : 0;
  const offerRate = totalApplicants ? Math.round((offers / totalApplicants) * 100) : 0;
  res.json({ totalPosts, totalViews, totalApplicants, offers, applyRate, offerRate, postedJobs });
});

// AI recommendations for CV improvement
app.post('/api/ai/recommendations', async (req, res) => {
  const db = readDB();
  const { jobId, candidateId } = req.body || {};
  const job = db.jobs.find((j: any) => j.id === Number(jobId));
  if (!job) return res.status(404).json({ error: { code: 404, message: 'Công việc không tồn tại' } });
  const candidate = candidateId
    ? db.candidates.find((c: any) => c.id === candidateId)
    : db.profile;
  if (!candidate) return res.status(404).json({ error: { code: 404, message: 'Ứng viên không tồn tại' } });

  const jobTags: string[] = job.tags || [];
  const skills: string[] = candidate.skills || [];
  const cSet = new Set(skills.map((s: string) => normalizeSkill(s)));
  const missingSkills = jobTags.filter((t: string) => !cSet.has(normalizeSkill(t)));
  const matchedSkills = jobTags.filter((t: string) => cSet.has(normalizeSkill(t)));

  const baseSuggestions = missingSkills.slice(0, 8).map((s: string) => `Bổ sung kỹ năng "${s}" qua khóa học, chứng chỉ hoặc dự án thực tế.`);
  const improvement = [
    'Thêm số liệu định lượng vào kinh nghiệm/dự án (ví dụ: tăng tốc 30%, giảm lỗi 20%).',
    'Viết mô tả dự án theo cấu trúc: bài toán – hành động – kết quả.',
    'Nêu rõ công nghệ sử dụng trong từng dự án.',
  ];

  let suggestions = baseSuggestions;
  let summary = `Thiếu ${missingSkills.length}/${jobTags.length} kỹ năng yêu cầu.`;
  if (process.env.GEMINI_API_KEY) {
    try {
      const r = await geminiMatch(candidate.cvText || candidate.bio || '', job.title || '', job.description || '', job.requirements || '', 0, skills, jobTags);
      if (r.recommendations?.length) suggestions = r.recommendations;
      if (r.explanation) summary = r.explanation;
    } catch { /* fallback to rule-based */ }
  }
  res.json({ jobId: job.id, jobTitle: job.title, matchedSkills, missingSkills, suggestions, improvement, summary });
});

// AI mock interview (demo)
app.post('/api/ai/interview', (req, res) => {
  const db = readDB();
  const { jobId } = req.body || {};
  const job = db.jobs.find((j: any) => j.id === Number(jobId));
  const title = job?.title || 'vị trí ứng tuyển';
  const tags: string[] = job?.tags || [];
  const questions = [
    `Hãy giới thiệu ngắn gọn bản thân và lý do bạn phù hợp với vị trí ${title}.`,
    tags[0] ? `Bạn đã từng làm việc với ${tags[0]} như thế nào? Cho ví dụ cụ thể.` : 'Kể về dự án kỹ thuật bạn tự hào nhất.',
    'Mô tả một thử thách trong công việc/nhóm và cách bạn giải quyết.',
    'Bạn ưu tiên điều gì khi làm việc nhóm trong dự án công nghệ?',
    'Bạn học công nghệ mới như thế nào? Cho ví dụ gần đây.',
  ];
  const tips = [
    'Trả lời theo STAR: Situation – Task – Action – Result.',
    'Nêu công nghệ cụ thể và vai trò của bạn trong dự án.',
    'Giữ câu trả lời 1–2 phút, có số liệu nếu có.',
  ];
  res.json({ jobTitle: title, questions, tips, mode: 'demo', note: 'Phỏng vấn demo offline.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
