import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import pageMap from './page-map.json';
import './styles.css';
import './legacy.css';
import './store.d.ts';

const screens = [
  { file: '01_landing_page.html', component: lazy(() => import('./pages/Page01LandingPage')) },
  { file: '03_student_dashboard.html', component: lazy(() => import('./pages/Page03StudentDashboard')) },
  { file: '04_job_search.html', component: lazy(() => import('./pages/Page04JobSearch')) },
  { file: '06_cv_analysis.html', component: lazy(() => import('./pages/Page06CvAnalysis')) },
  { file: '07_matched_jobs.html', component: lazy(() => import('./pages/Page07MatchedJobs')) },
  { file: '08_application_tracker.html', component: lazy(() => import('./pages/Page08ApplicationTracker')) },
  { file: '09_h_s_c_nh_n_student_profile.html', component: lazy(() => import('./pages/Page09HSCNhNStudentProfile')) },
  { file: '10_dashboard_nh_tuy_n_d_ng_employer_dashboard.html', component: lazy(() => import('./pages/Page10DashboardNhTuyNDNgEmployerDashboard')) },
  { file: '11_ng_tin_tuy_n_d_ng_post_a_job.html', component: lazy(() => import('./pages/Page11NgTinTuyNDNgPostAJob')) },
  { file: '12.12 - Quản lý ứng viên (Candidate Management).html', component: lazy(() => import('./pages/Page1212QuNLNgViNCandidateManagement')) },
  { file: '13_design_system_components.html', component: lazy(() => import('./pages/Page13DesignSystemComponents')) },
  { file: 'about.html', component: lazy(() => import('./pages/PageInfo')) },
  { file: 'contact.html', component: lazy(() => import('./pages/PageInfo')) },
  { file: 'pricing.html', component: lazy(() => import('./pages/PageInfo')) },
  { file: 'terms.html', component: lazy(() => import('./pages/PageInfo')) },
  { file: 'privacy.html', component: lazy(() => import('./pages/PageInfo')) },
  { file: 'help.html', component: lazy(() => import('./pages/PageInfo')) },
  { file: 'certify.html', component: lazy(() => import('./pages/PageInfo')) },
  { file: 'cv-guide.html', component: lazy(() => import('./pages/PageInfo')) },
  { file: 'ai-match.html', component: lazy(() => import('./pages/PageAIMatch')) },
];

const routeByText: Record<string, string> = {
  'tổng quan': '/03_student_dashboard.html', dashboard: '/03_student_dashboard.html', 'tìm việc': '/04_job_search.html', 'tìm kiếm': '/04_job_search.html',
  'khám phá việc làm': '/04_job_search.html', 'khám phá việc làm mới': '/04_job_search.html', 'khám phá': '/04_job_search.html',
  'phân tích cv': '/06_cv_analysis.html', 'phân tích': '/06_cv_analysis.html', 'phân tích cv bằng ai': '/06_cv_analysis.html', 'assessments': '/06_cv_analysis.html', 'assessment': '/06_cv_analysis.html',
  'việc làm phù hợp': '/07_matched_jobs.html', 'phù hợp': '/07_matched_jobs.html', 'matched jobs': '/07_matched_jobs.html',
  'hồ sơ ứng tuyển': '/08_application_tracker.html', 'ứng tuyển': '/08_application_tracker.html', 'theo dõi': '/08_application_tracker.html', 'xem lịch sử đầy đủ': '/08_application_tracker.html', applications: '/08_application_tracker.html',
  'hồ sơ cá nhân': '/09_h_s_c_nh_n_student_profile.html', 'profile cv': '/09_h_s_c_nh_n_student_profile.html', 'cá nhân': '/09_h_s_c_nh_n_student_profile.html', 'cập nhật hồ sơ': '/09_h_s_c_nh_n_student_profile.html', 'profile & cv': '/09_h_s_c_nh_n_student_profile.html',
  'quản lý tin': '/11_ng_tin_tuy_n_d_ng_post_a_job.html', 'đăng tin': '/11_ng_tin_tuy_n_d_ng_post_a_job.html', 'tuyển dụng': '/11_ng_tin_tuy_n_d_ng_post_a_job.html', 'post a job': '/11_ng_tin_tuy_n_d_ng_post_a_job.html',
  'ứng viên': '/12.12 - Quản lý ứng viên (Candidate Management).html', candidate: '/12.12 - Quản lý ứng viên (Candidate Management).html',
  'ai matching talent': '/12.12 - Quản lý ứng viên (Candidate Management).html', 'matching talent': '/12.12 - Quản lý ứng viên (Candidate Management).html',
  'về trang chủ': '/01_landing_page.html', 'trang chủ': '/01_landing_page.html', home: '/01_landing_page.html',
  'giới thiệu': '/about.html', 'about us': '/about.html', 'liên hệ': '/contact.html', contact: '/contact.html',
  'bảng giá': '/pricing.html', pricing: '/pricing.html',
  'điều khoản dịch vụ': '/terms.html', 'điều khoản': '/terms.html', terms: '/terms.html',
  'chính sách quyền riêng tư': '/privacy.html', 'bảo mật thông tin sinh viên': '/privacy.html', 'bảo mật': '/privacy.html', privacy: '/privacy.html',
  'trung tâm hỗ trợ': '/help.html', 'trợ giúp': '/help.html', 'help center': '/help.html', help: '/help.html', 'đường dây nóng': '/contact.html',
  'hướng dẫn viết cv': '/cv-guide.html', 'quy chuẩn chứng chỉ': '/certify.html', 'mẫu cv': '/cv-guide.html', forum: '/help.html', mail: '/contact.html',
  'explore companies': '/01_landing_page.html', 'salary insights': '/04_job_search.html',
  mentorship: '/06_cv_analysis.html', 'cài đặt': '/09_h_s_c_nh_n_student_profile.html', settings: '/09_h_s_c_nh_n_student_profile.html',
  'khám phá doanh nghiệp': '/01_landing_page.html', 'báo cáo mức lương': '/04_job_search.html', 'cố vấn nghề nghiệp': '/06_cv_analysis.html',
  'cẩm nang phỏng vấn': '/06_cv_analysis.html', 'đánh giá kỹ năng': '/06_cv_analysis.html', 'đối tác đại học': '/01_landing_page.html',
  'tìm hồ sơ tài năng': '/12.12 - Quản lý ứng viên (Candidate Management).html', 'careermatch ai': '/01_landing_page.html',
  'tin nhắn & phỏng vấn': '/12.12 - Quản lý ứng viên (Candidate Management).html', 'xem tất cả lịch': '/08_application_tracker.html', 'cộng đồng': '/01_landing_page.html',
  'thị trường lương': '/04_job_search.html', 'đăng tuyển dụng': '/10_dashboard_nh_tuy_n_d_ng_employer_dashboard.html',
  'tìm hiểu giải pháp doanh nghiệp': '/10_dashboard_nh_tuy_n_d_ng_employer_dashboard.html', 'xem tất cả công việc': '/04_job_search.html',
  'xem tất cả gợi ý': '/07_matched_jobs.html', 'xem danh sách việc làm đã lưu': '/07_matched_jobs.html', 'luyện câu hỏi phỏng vấn': '/06_cv_analysis.html',
  'tối ưu hóa ngay': '/06_cv_analysis.html', 'tối ưu hồ sơ': '/06_cv_analysis.html', 'xem thêm 10+': '/04_job_search.html', 'xem trang công ty': '/01_landing_page.html',
  'hồ sơ & cv': '/09_h_s_c_nh_n_student_profile.html', 'đăng xuất': '/01_landing_page.html', 'log out': '/01_landing_page.html', 'đăng nhập': '/03_student_dashboard.html', 'bắt đầu miễn phí': '/03_student_dashboard.html',
  'thêm dự án': '/09_h_s_c_nh_n_student_profile.html', 'cập nhật': '/09_h_s_c_nh_n_student_profile.html',
  'upload new cv': '/06_cv_analysis.html', 'tải lên cv mới': '/06_cv_analysis.html', 'upload cv': '/06_cv_analysis.html',
  'quick apply': '/04_job_search.html',
  'xem 12 việc làm phù hợp nhất': '/07_matched_jobs.html', 'cập nhật hồ sơ ngay': '/09_h_s_c_nh_n_student_profile.html',
};
const iconRoutes: Record<string, string> = {
  space_dashboard: '/03_student_dashboard.html', dashboard: '/03_student_dashboard.html', work: '/04_job_search.html', psychology: '/06_cv_analysis.html',
  description: '/06_cv_analysis.html', auto_awesome: '/07_matched_jobs.html', fact_check: '/08_application_tracker.html', assignment: '/08_application_tracker.html',
  account_box: '/09_h_s_c_nh_n_student_profile.html', manage_accounts: '/09_h_s_c_nh_n_student_profile.html', post_add: '/11_ng_tin_tuy_n_d_ng_post_a_job.html',
  group: '/12.12 - Quản lý ứng viên (Candidate Management).html', people: '/12.12 - Quản lý ứng viên (Candidate Management).html',
  search: '/04_job_search.html', explore: '/04_job_search.html',
};

const API_BASE = 'http://localhost:5000/api';

const cache: any = {
  jobs: [],
  applications: [],
  savedJobs: [],
  profile: { name: 'Nguyễn Minh Anh', email: 'minhanh.nguyen@email.edu.vn', phone: '0912 345 678', university: 'Đại học Thủy Lợi', major: 'Công nghệ Thông tin', gpa: '3.65/4.0', graduationYear: '2026', skills: ['ReactJS', 'JavaScript', 'HTML/CSS', 'Git', 'Tailwind CSS'], bio: 'Sinh viên CNTT năm 4, đam mê front-end, tìm kiếm cơ hội thực tập.', avatarUrl: null, cvScore: 85, cvFileName: 'CV_NguyenMinhAnh_Frontend_2026.pdf' },
  employer: { company: 'NovaTech Solutions', email: 'hr@novatech.vn', industry: 'Công nghệ', size: '50–200 nhân viên' },
  postedJobs: [],
  candidates: [],
};

async function syncFromAPI() {
  try {
    const [jobs, apps, saved, profile, employer, posted, candidates] = await Promise.all([
      fetch(`${API_BASE}/jobs`).then(r => r.json()).catch(() => cache.jobs),
      fetch(`${API_BASE}/applications`).then(r => r.json()).catch(() => cache.applications),
      fetch(`${API_BASE}/saved`).then(r => r.json()).catch(() => cache.savedJobs),
      fetch(`${API_BASE}/profile`).then(r => r.json()).catch(() => cache.profile),
      fetch(`${API_BASE}/employer`).then(r => r.json()).catch(() => cache.employer),
      fetch(`${API_BASE}/posted-jobs`).then(r => r.json()).catch(() => cache.postedJobs),
      fetch(`${API_BASE}/candidates`).then(r => r.json()).catch(() => cache.candidates),
    ]);
    cache.jobs = jobs;
    cache.applications = apps;
    cache.savedJobs = saved;
    cache.profile = profile;
    cache.employer = employer;
    cache.postedJobs = posted;
    cache.candidates = candidates;
  } catch (e) {
    console.error('Failed to sync from API', e);
  }
}

function initStoreApi() {
  syncFromAPI();
  window.VL = {
    getJobs: () => cache.jobs,
    getJob: (id: any) => cache.jobs.find((job: any) => job.id === Number(id)) || null,
    getSaved: () => cache.savedJobs,
    isSaved: (id: any) => cache.savedJobs.includes(Number(id)),
    toggleSave: (id: any) => {
      const numericId = Number(id);
      fetch(`${API_BASE}/saved/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: numericId })
      }).then(r => r.json()).then(data => {
        cache.savedJobs = data.savedJobs;
      }).catch(() => {});
      const current = cache.savedJobs;
      const next = current.includes(numericId) ? current.filter((item: number) => item !== numericId) : [...current, numericId];
      cache.savedJobs = next;
      return next.includes(numericId);
    },
    getApps: () => cache.applications,
    getApp: (id: any) => cache.applications.find((app: any) => app.jobId === Number(id)) || null,
    apply: (id: any, note = '') => {
      if (cache.applications.some((app: any) => app.jobId === Number(id))) return false;
      fetch(`${API_BASE}/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: Number(id), note })
      }).then(r => r.json()).then(data => {
        if (data.success) {
          cache.applications.push(data.application);
        }
      }).catch(() => {});
      const app = { id: `a${Date.now()}`, jobId: Number(id), status: 'reviewing', appliedDate: new Date().toLocaleDateString('vi-VN'), note };
      cache.applications.push(app);
      return true;
    },
    getProfile: () => cache.profile,
    saveProfile: (data: any) => {
      cache.profile = { ...cache.profile, ...data };
      fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
    },
    getEmployer: () => cache.employer,
    getPostedJobs: () => cache.postedJobs,
    addPostedJob: (job: any) => {
      fetch(`${API_BASE}/posted-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      }).then(r => r.json()).then(data => {
        if (data.success) {
          cache.postedJobs.push(data.job);
        }
      }).catch(() => {});
      const newJob = { id: `pj${Date.now()}`, title: job.title, status: 'active', applicants: 0, views: 0, deadline: job.deadline || '' };
      cache.postedJobs.push(newJob);
    },
    getCandidates: (jobId: any) => {
      const items = cache.candidates;
      return jobId ? items.filter((candidate: any) => candidate.jobId === jobId) : items;
    },
    updateCandidateStatus: (id: any, status: any) => {
      cache.candidates = cache.candidates.map((candidate: any) => candidate.id === id ? { ...candidate, status } : candidate);
      fetch(`${API_BASE}/candidates/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }).catch(() => {});
    },
    statusLabel: (status: string) => ({ reviewing: 'Đang xét duyệt', interview: 'Mời phỏng vấn', offer: 'Offer', rejected: 'Từ chối', saved: 'Đã lưu', active: 'Đang tuyển', closed: 'Đã đóng' }[status] || status),
    statusColor: (status: string) => ({ reviewing: 'text-amber-600 bg-amber-50', interview: 'text-blue-600 bg-blue-50', offer: 'text-green-600 bg-green-50', rejected: 'text-red-600 bg-red-50', saved: 'text-purple-600 bg-purple-50', active: 'text-green-600 bg-green-50', closed: 'text-gray-500 bg-gray-100' }[status] || 'text-gray-600 bg-gray-50'),
  };
}

function showToast(message: string, kind: 'success' | 'info' | 'error' = 'success') {
  let wrap = document.getElementById('vl-toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'vl-toast-wrap';
    wrap.setAttribute('aria-live', 'polite');
    document.body.append(wrap);
  }
  const toast = document.createElement('div');
  toast.className = `vl-toast vl-toast-${kind}`;
  toast.textContent = message;
  wrap.append(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(() => { toast.classList.remove('is-visible'); window.setTimeout(() => toast.remove(), 200); }, 3000);
}

function markApplied(button: HTMLElement) {
  if (button.dataset.applied === 'true') return;
  button.dataset.applied = 'true';
  const label = button.querySelector<HTMLElement>('span:not([class*="material"]):not([data-icon])');
  if (label) label.textContent = 'Đã ứng tuyển';
  else button.textContent = 'Đã ứng tuyển';
  if (button instanceof HTMLButtonElement) button.disabled = true;
  button.classList.add('opacity-60', 'cursor-not-allowed');
}

function initializePage() {
  const store = window.VL;
  const jobId = new URLSearchParams(window.location.search).get('id');
  if (store && jobId) {
    const job = store.getJob(jobId);
    if (job) {
      const set = (selector: string, value: string) => { const element = document.querySelector<HTMLElement>(selector); if (element && element.textContent !== value) element.textContent = value; };
      set('[data-job-title]', job.title); set('[data-job-company]', job.company); set('[data-job-location]', job.location); set('[data-job-salary]', job.salary);
      document.title = `${job.title} | CareerMatch AI`;
      document.querySelectorAll<HTMLButtonElement>('[data-apply]').forEach((button) => { button.dataset.jobId = jobId; });
      document.querySelectorAll<HTMLButtonElement>('[data-bookmark]').forEach((button) => { button.dataset.jobId = jobId; });
      if (store.getApp(jobId)) document.querySelectorAll<HTMLElement>('[data-apply]').forEach(markApplied);
    }
  }
  document.querySelectorAll<HTMLElement>('[data-icon="bookmark"]').forEach((icon) => {
    const button = icon.closest<HTMLButtonElement>('button');
    if (button && button.dataset.bookmark === undefined) button.dataset.bookmark = '';
  });
  (store?.getSaved() || []).forEach((id) => {
    document.querySelectorAll<HTMLElement>(`[data-job-id="${id}"] [data-bookmark], [data-bookmark][data-job-id="${id}"]`).forEach((button) => {
      button.dataset.saved = 'true';
      const icon = button.querySelector<HTMLElement>('[class*="material-symbol"]');
      if (icon) { icon.style.fontVariationSettings = "'FILL' 1"; icon.style.color = '#f59e0b'; }
    });
  });
  store?.getApps().forEach((app: any) => document.querySelectorAll<HTMLElement>(`[data-job-id="${app.jobId}"] [data-apply], [data-apply="${app.jobId}"]`).forEach(markApplied));
  const profile = store?.getProfile();
  if (profile) {
    const set = (selector: string, value: unknown) => { const element = document.querySelector<HTMLElement>(selector); if (element && typeof value === 'string' && element.textContent !== value) element.textContent = value; };
    set('[data-profile-name]', profile.name); set('[data-profile-name-header]', profile.name); set('[data-profile-email]', profile.email); set('[data-profile-phone]', profile.phone);
    const score = document.querySelector<HTMLElement>('[data-ats-score]'); if (score) { const v = String(profile.cvScore ?? 85); if (score.textContent !== v) score.textContent = v; }
    const file = document.querySelector<HTMLElement>('[data-cv-filename]'); if (file && typeof profile.cvFileName === 'string' && file.textContent !== profile.cvFileName) file.textContent = profile.cvFileName;
  }
  wireForms();
}

function decodedPath(pathname: string) {
  try { return decodeURIComponent(pathname); } catch { return pathname; }
}

function resolveAnchorDestination(anchor: HTMLAnchorElement, pathname: string): string {
  const icon = anchor.querySelector('[data-icon]')?.getAttribute('data-icon')?.toLowerCase();
  const text = anchor.textContent?.trim().toLowerCase() ?? '';
  const label = (anchor.getAttribute('aria-label') || anchor.title || '').toLowerCase();
  // Label text is more specific than icons (e.g. "Matched Jobs" uses the generic work icon).
  let destination = Object.entries(routeByText).find(([key]) => text.includes(key) || label.includes(key))?.[1] ?? '';
  // Breadcrumb naming the current page (e.g. "Chi tiết việc làm" on the job detail page).
  if (!destination && text.replace(/\s+/g, ' ').trim() === 'chi tiết việc làm') destination = pathname;
  if (!destination && icon === 'work' && /^(\/10_|\/11_|\/12\.)/.test(pathname)) destination = '/11_ng_tin_tuy_n_d_ng_post_a_job.html';
  if (!destination) destination = (icon && iconRoutes[icon]) || '';
  if (!destination && /bắt đầu|tìm việc ngay|đăng nhập/i.test(text)) destination = '/03_student_dashboard.html';
  if (!destination && /nhà tuyển dụng|đăng tuyển|post a job/i.test(text)) destination = '/10_dashboard_nh_tuy_n_d_ng_employer_dashboard.html';
  return destination;
}

function refreshPageDom(pathname: string) {
  const currentPath = decodedPath(pathname);
  document.querySelectorAll<HTMLAnchorElement>('a[href="#"], a[href=""]').forEach((anchor) => {
    const destination = resolveAnchorDestination(anchor, currentPath);
    if (!destination) return;
    anchor.setAttribute('href', destination);
    if (destination === currentPath) anchor.classList.add('vl-active');
    else anchor.classList.remove('vl-active');
  });
  initializePage();
  wireSearchAndFilters();
}

function runInteraction(event: Event, navigate: ReturnType<typeof useNavigate>) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement | HTMLAnchorElement>('button, a');
  if (!button) return;
  const btnText = button.textContent || '';
  const btnTextLower = btnText.toLowerCase();
  if (button.matches('[data-status-filter]')) {
    event.preventDefault();
    const key = (button as HTMLElement).dataset.statusFilter || 'all';
    const group = button.closest('[data-tab-group]') || button.parentElement;
    group?.querySelectorAll<HTMLElement>('[data-status-filter]').forEach((tab) => {
      tab.classList.remove('bg-surface-container-low', 'bg-surface-container', 'text-primary', 'font-bold');
      tab.classList.add('text-on-surface-variant');
    });
    (button as HTMLElement).classList.remove('text-on-surface-variant');
    (button as HTMLElement).classList.add('bg-surface-container', 'text-primary', 'font-bold');
    document.querySelectorAll<HTMLElement>('tr[data-status]').forEach((row) => {
      row.style.display = key === 'all' || row.dataset.status === key ? '' : 'none';
    });
    return;
  }
  const iconEl = button.querySelector('[data-icon]');
  const iconName = iconEl?.getAttribute('data-icon')?.toLowerCase() || '';
  if (button instanceof HTMLAnchorElement && /^(share|link)$/i.test((button.textContent || '').trim())) {
    event.preventDefault();
    try { navigator.clipboard?.writeText(window.location.href); } catch { /* ignore */ }
    showToast('Đã sao chép liên kết', 'success');
    return;
  }
  // AI Talent / Messages / Interview actions
  if (button.tagName === 'BUTTON' && (/tin nhắn|chat|mark_chat|tin nhan/i.test(btnText) || iconName === 'mark_chat_unread')) {
    event.preventDefault();
    showToast('Hộp tin nhắn đang được đồng bộ với hệ thống tuyển dụng', 'info');
    return;
  }
  if (button.tagName === 'BUTTON' && /vào phòng|phòng pv|phỏng vấn ảo|interview room/i.test(btnText)) {
    event.preventDefault();
    showToast('Đang kết nối đến phòng phỏng vấn...', 'info');
    setTimeout(() => showToast('Phòng phỏng vấn ảo đã sẵn sàng (demo)', 'success'), 600);
    return;
  }
  if (button.tagName === 'BUTTON' && /mời pv|mời phỏng vấn/i.test(btnText)) {
    event.preventDefault();
    showToast('Đã gửi lời mời phỏng vấn đến ứng viên', 'success');
    return;
  }
  if (button.tagName === 'BUTTON' && /khám phá.*ứng viên|8 ứng viên|ai matching.*ứng viên/i.test(btnText)) {
    event.preventDefault();
    navigate('/12.12 - Quản lý ứng viên (Candidate Management).html');
    showToast('Đang hiển thị danh sách ứng viên được AI đề xuất', 'info');
    return;
  }
  if (/ai talent|talent pool/i.test(btnText)) {
    event.preventDefault();
    navigate('/12.12 - Quản lý ứng viên (Candidate Management).html');
    return;
  }
  if (button.tagName === 'BUTTON' && /đăng tin ngay/i.test(btnText)) {
    event.preventDefault();
    submitPostJob({
      title: (document.getElementById('job-title') as HTMLInputElement | null)?.value || '',
      deadline: (document.getElementById('closing-date') as HTMLInputElement | null)?.value || '',
    });
    return;
  }
  if (/đặt lại bộ lọc|reset filter/i.test(btnText)) {
    event.preventDefault();
    document.querySelectorAll<HTMLElement>('tr[data-status], [data-job-id]').forEach((el) => { el.style.display = ''; });
    const all = document.querySelector<HTMLElement>('[data-status-filter="all"]'); all?.click();
    showToast('Đã đặt lại bộ lọc', 'info');
    return;
  }
  if (button.tagName === 'BUTTON' && /^(tất cả|đang tuyển|tạm dừng|hết hạn)/i.test(btnText.trim()) && document.querySelectorAll('article').length) {
    event.preventDefault();
    const key = btnText.trim();
    const group = button.parentElement;
    group?.querySelectorAll<HTMLElement>('button').forEach((b) => { b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm'); b.classList.add('text-on-surface-variant'); });
    (button as HTMLElement).classList.remove('text-on-surface-variant');
    (button as HTMLElement).classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
    const kw = /tất cả/i.test(key) ? '' : (/đang tuyển/i.test(key) ? 'Đang tuyển' : (/tạm dừng/i.test(key) ? 'Tạm dừng' : 'Hết hạn'));
    document.querySelectorAll<HTMLElement>('article').forEach((a) => {
      a.style.display = !kw || (a.textContent || '').includes(kw) ? '' : 'none';
    });
    return;
  }
  const feedback: Array<[RegExp, string, 'success' | 'info']> = [
    [/phân tích lại cv|phân tích cv/i, 'Đang phân tích CV bằng AI...', 'info'],
    [/mời ứng tuyển/i, 'Đã gửi lời mời ứng tuyển', 'success'],
    [/chi tiết hồ sơ/i, 'Đang mở chi tiết hồ sơ ứng viên', 'info'],
    [/xem thêm.*ứng viên|xem hồ sơ/i, 'Đang tải danh sách ứng viên phù hợp', 'info'],
    [/tải xuống|download|xuất danh sách|export/i, 'Đang xuất dữ liệu...', 'info'],
    [/xem trước cv|preview cv/i, 'Đang mở bản xem trước CV', 'info'],
    [/duyệt cv|approve/i, 'Đã duyệt CV ứng viên', 'success'],
    [/xem offer/i, 'Đang mở thư Offer', 'info'],
    [/lưu hồ sơ|save profile/i, 'Đã lưu hồ sơ', 'success'],
    [/thêm kỹ năng|thêm dự án|thêm chứng chỉ|thêm từ khóa|thêm tag/i, 'Đã mở biểu mẫu thêm mới', 'info'],
    [/cập nhật trạng thái/i, 'Cập nhật trạng thái hồ sơ', 'info'],
    [/chia sẻ liên kết/i, 'Đã sao chép liên kết hồ sơ', 'success'],
    [/làm bài test|luyện câu hỏi|đánh giá kỹ năng/i, 'Đang mở bài đánh giá kỹ năng', 'info'],
  ];
  for (const [re, msg, kind] of feedback) {
    if (button.tagName === 'BUTTON' && re.test(btnText)) { event.preventDefault(); showToast(msg, kind); return; }
  }
  // Generic button navigation
  if (button instanceof HTMLButtonElement && !button.matches('[data-apply],[data-bookmark],[data-status-filter],[role="switch"],[role="tab"]')) {
    const label = (button.getAttribute('aria-label') || '').toLowerCase();
    for (const [key, dest] of Object.entries(routeByText)) {
      if (btnTextLower.includes(key) || label.includes(key)) {
        if (dest && !button.closest('form')) {
          event.preventDefault();
          navigate(dest);
          return;
        }
      }
    }
  }
  const jobId = button.dataset.jobId || button.dataset.apply || button.closest<HTMLElement>('[data-job-id]')?.dataset.jobId;
  const store = window.VL;
  if (/xem chi tiết|view detail/i.test(btnText)) { event.preventDefault(); if (jobId) { navigate(`/04_job_search.html?id=${jobId}`); return; } const path = window.location.pathname; if (path.includes('03_student_dashboard') || path.includes('08_application')) { navigate('/08_application_tracker.html'); return; } navigate('/04_job_search.html?id=1'); return; }
  if (/lý do đề xuất/i.test(btnText)) { event.preventDefault(); showToast('Vị trí này phù hợp nhờ kỹ năng và kinh nghiệm trong hồ sơ của bạn.', 'info'); return; }
  const isBookmarkBtn = button.matches('[data-bookmark]') || /^bookmark(_border|_added)?$/i.test(btnText.trim()) || !!button.querySelector('[data-icon="bookmark"], [data-icon="bookmark_border"], [data-icon="bookmark_added"]');
  if (isBookmarkBtn) {
    event.preventDefault();
    if (!jobId || !store) return;
    const saved = store.toggleSave(jobId); button.dataset.saved = String(saved);
    const icon = button.querySelector<HTMLElement>('[class*="material-symbol"]');
    if (icon) { icon.style.fontVariationSettings = saved ? "'FILL' 1" : "'FILL' 0"; icon.style.color = saved ? '#f59e0b' : ''; }
    showToast(saved ? 'Đã lưu việc làm' : 'Đã bỏ lưu', saved ? 'success' : 'info'); return;
  }
  if (button.matches('[data-apply], [data-quick-apply]') || (button.tagName === 'BUTTON' && /ứng tuyển/i.test(btnText) && !(button as HTMLButtonElement).disabled && !/đã ứng tuyển/i.test(btnText) && !button.closest('form'))) {
    event.preventDefault();
    const applyJobId = jobId || '1';
    if (!store) { navigate(`/04_job_search.html?id=${applyJobId}`); return; }
    if (store.getApp(applyJobId)) { showToast('Bạn đã ứng tuyển vào vị trí này rồi', 'info'); navigate(`/04_job_search.html?id=${applyJobId}`); return; }
    if (!store.apply(applyJobId)) return;
    document.querySelectorAll<HTMLElement>(`[data-job-id="${applyJobId}"] [data-apply], [data-apply="${applyJobId}"]`).forEach(markApplied);
    showToast('Ứng tuyển thành công! Kiểm tra hồ sơ ứng tuyển.');
    setTimeout(() => navigate('/08_application_tracker.html'), 800);
    return;
  }
  if (button instanceof HTMLAnchorElement) {
    const rawHref = button.getAttribute('href') || '';
    const isInternal = rawHref === '' || rawHref === '#' || rawHref.startsWith('/');
    const mouse = event instanceof MouseEvent ? event : null;
    const plainClick = !mouse || (!mouse.metaKey && !mouse.ctrlKey && !mouse.shiftKey && !mouse.altKey);
    if (isInternal && !event.defaultPrevented && plainClick && button.target !== '_blank') {
      event.preventDefault();
      const destination = resolveAnchorDestination(button, window.location.pathname);
      if (destination) navigate(destination);
      return;
    }
  }
}

function markCandidateAction(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('button');
  const text = button?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (/lưu thay đổi$/i.test(text) && window.VL) { window.VL.saveProfile({}); showToast('Đã lưu hồ sơ'); }
}

function wireForms() {
  const profileForm = document.querySelector<HTMLFormElement>('form[data-profile-form], form#profile-form');
  if (profileForm && window.VL && !profileForm.dataset.wired) {
    profileForm.dataset.wired = '1';
    Object.entries(window.VL.getProfile()).forEach(([key, value]: [string, any]) => { const field = profileForm.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${key}"], #${key}`); if (field && typeof value === 'string') field.value = value; });
    profileForm.addEventListener('submit', (event) => { event.preventDefault(); window.VL?.saveProfile(Object.fromEntries(new FormData(profileForm))); showToast('Đã lưu hồ sơ'); });
  }
}

function submitPostJob(data: Record<string, FormDataEntryValue>) {
  if (!window.VL) return;
  const title = String(data.title || ''); if (!title) { showToast('Vui lòng nhập tên vị trí', 'error'); return; }
  window.VL.addPostedJob({ id: `pj${Date.now()}`, title, status: 'active', applicants: 0, views: 0, deadline: String(data.deadline || '') });
  showToast('Đăng tin tuyển dụng thành công!'); window.setTimeout(() => { window.location.href = '/10_dashboard_nh_tuy_n_d_ng_employer_dashboard.html'; }, 1200);
}

function wireSearchAndFilters() {
  const bind = (input: HTMLInputElement) => {
    if (input.dataset.wired) return;
    input.dataset.wired = '1';
    input.addEventListener('input', () => {
      const query = input.value.trim().toLocaleLowerCase('vi');
      let targets: HTMLElement[];
      if (input.dataset.searchTarget) {
        targets = Array.from(document.querySelectorAll<HTMLElement>(input.dataset.searchTarget));
      } else {
        const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-job-id]'));
        targets = cards.length ? cards : Array.from(document.querySelectorAll<HTMLElement>('tbody tr'));
      }
      targets.forEach((el) => {
        const match = !query || (el.textContent || '').toLocaleLowerCase('vi').includes(query);
        el.style.display = match ? '' : 'none';
      });
    });
  };
  document.querySelectorAll<HTMLInputElement>('[data-search-target]').forEach(bind);
  document.querySelectorAll<HTMLInputElement>('input[type="text"]').forEach((input) => {
    const ph = (input.placeholder || '').toLocaleLowerCase('vi');
    if (/(tìm|search)/.test(ph)) bind(input);
  });
}

function AppEffects() {
  const location = useLocation(); const navigate = useNavigate();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  useEffect(() => {
    initStoreApi();
  }, []);
  useEffect(() => {
    const currentPath = decodedPath(location.pathname);
    const page = pageMap.find((item: any) => `/${item.file}` === currentPath); document.title = page?.title ?? 'CareerMatch AI'; document.body.className = page?.bodyClass ?? '';
    refreshPageDom(location.pathname);
  }, [location.pathname]);
  useEffect(() => {
    // Lazy-loaded pages render AFTER the location effect runs, so re-wire the DOM
    // whenever new nodes appear. All writes are idempotent (attribute/text guards),
    // so the follow-up mutation pass converges instead of looping.
    // NOTE: runs synchronously — rAF is suspended in hidden/background tabs.
    const observer = new MutationObserver(() => {
      refreshPageDom(pathRef.current);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const interaction = (event: Event) => runInteraction(event, navigate);
    const markCandidate = (event: Event) => markCandidateAction(event);
    document.addEventListener('click', interaction);
    document.addEventListener('click', markCandidate);
    return () => {
      document.removeEventListener('click', interaction);
      document.removeEventListener('click', markCandidate);
    };
  }, []);
  return null;
}

function App() {
  return <BrowserRouter><AppEffects /><Suspense fallback={<main className="min-h-screen grid place-items-center text-primary">CareerMatch AI</main>}><Routes><Route path="/" element={<Navigate to="/01_landing_page.html" replace />} />{screens.map(({ file, component: Screen }: any) => <Route key={file} path={`/${file}`} element={<Screen />} />)}<Route path="*" element={<Navigate to="/01_landing_page.html" replace />} /></Routes></Suspense></BrowserRouter>;
}

const root = document.getElementById('root');
if (!root) throw new Error('React root element is missing');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);


