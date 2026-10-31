import { useRef, useState } from 'react';

const API = 'http://localhost:5000/api';

const KNOWN_SKILLS = ['React', 'ReactJS', 'Node.js', 'NodeJS', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'HTML', 'CSS', 'Tailwind', 'Next.js', 'Spring', 'Django', 'Express', 'REST', 'Figma', 'Redux'];

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

function detectSkills(text: string): string[] {
  const lower = (text || '').toLowerCase();
  return KNOWN_SKILLS.filter((s) => lower.includes(s.toLowerCase())).slice(0, 20);
}

export default function PageAITalent() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cvText, setCvText] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [reco, setReco] = useState<any>(null);
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { showToast('Vui lòng chọn PDF', 'error'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/cv/extract`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Lỗi trích xuất');
      const text = data.cvText || '';
      setCvText(text);
      setSkills(detectSkills(text));
      await fetch(`${API}/cv/manual`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: text }),
      });
      showToast('Đã trích xuất CV', 'success');
    } catch (e2: any) {
      showToast(e2.message || 'Lỗi upload', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runMatch = async () => {
    if (!cvText) { showToast('Hãy upload CV trước', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/match/all`);
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
      showToast(`Đã matching ${data.length} công việc`, 'success');
    } catch (e2: any) {
      showToast(e2.message || 'Lỗi matching', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (jobId: number) => {
    setSelectedJob(jobId);
    setReco(null);
    try {
      const res = await fetch(`${API}/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Lỗi gợi ý');
      setReco(data);
    } catch (e2: any) {
      showToast(e2.message || 'Lỗi gợi ý', 'error');
    }
  };

  const startInterview = async () => {
    if (selectedJob == null && matches[0]) setSelectedJob(matches[0].jobId);
    const jobId = selectedJob ?? matches[0]?.jobId;
    if (jobId == null) { showToast('Chọn công việc trước', 'error'); return; }
    try {
      const res = await fetch(`${API}/ai/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Lỗi phỏng vấn');
      setInterview(data);
    } catch (e2: any) {
      showToast(e2.message || 'Lỗi phỏng vấn', 'error');
    }
  };

  const bandColor = (band: string) => {
    switch (band) {
      case 'Rất khớp': return 'bg-emerald-50 text-emerald-700';
      case 'Khớp tốt': return 'bg-blue-50 text-blue-700';
      case 'Khớp tiềm năng': return 'bg-amber-50 text-amber-700';
      default: return 'bg-red-50 text-red-700';
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="sticky top-0 z-30 flex items-center justify-between px-8 h-16 bg-surface-container-lowest border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-2 text-body-sm font-body-sm text-outline">
          <a href="/employer-dashboard.html" className="hover:text-primary">Employer Dashboard</a>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-semibold">AI Talent Demo</span>
        </div>
        <a href="/employer-dashboard.html" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary text-label-md font-label-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại
        </a>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">AI Talent — Demo</h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Trích xuất CV, chấm điểm phù hợp, gợi ý nâng cao CV và phỏng vấn thử.</p>
        </div>

        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <h2 className="text-headline-sm font-headline-sm text-on-surface mb-3">1. Trích xuất CV</h2>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {loading ? 'Đang xử lý...' : 'Tải CV PDF'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
          {skills.length > 0 && (
            <div className="mt-4">
              <div className="text-label-md font-label-md text-outline mb-2">Kỹ năng nhận diện</div>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => <span key={s} className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface text-label-md font-label-md">{s}</span>)}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-headline-sm font-headline-sm text-on-surface">2. Điểm phù hợp công việc</h2>
            <button onClick={runMatch} disabled={loading || !cvText} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md disabled:opacity-50">
              Chấm điểm
            </button>
          </div>
          {matches.length === 0 ? (
            <p className="text-body-sm font-body-sm text-on-surface-variant">Upload CV rồi bấm "Chấm điểm".</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {matches.slice(0, 20).map((m) => (
                <div key={m.jobId} className="flex items-center justify-between gap-3 py-2 border-b border-outline-variant/30">
                  <span className="text-body-sm font-body-sm text-on-surface">Việc làm #{m.jobId}</span>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-md text-label-sm font-label-sm ${bandColor(m.band)}`}>{m.band ?? '—'}</span>
                    <span className="text-body-sm font-body-sm text-on-surface tabular-nums w-12 text-right">{m.match == null ? '—' : `${m.match}%`}</span>
                    <button onClick={() => getRecommendations(m.jobId)} className="text-label-sm font-label-sm text-primary hover:underline">Gợi ý CV</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reco && (
            <div className="mt-5 rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
              <h3 className="text-label-lg font-label-lg text-on-surface mb-2">Gợi ý nâng cao CV — {reco.jobTitle}</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant mb-3">{reco.summary}</p>
              {reco.missingSkills?.length > 0 && (
                <div className="mb-3">
                  <div className="text-label-sm font-label-sm text-error mb-1">Kỹ năng còn thiếu</div>
                  <div className="flex flex-wrap gap-1.5">
                    {reco.missingSkills.map((s: string) => <span key={s} className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-label-sm font-label-sm">{s}</span>)}
                  </div>
                </div>
              )}
              <ul className="list-disc list-inside space-y-1 text-body-sm font-body-sm text-on-surface-variant">
                {(reco.suggestions || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                {(reco.improvement || []).map((s: string, i: number) => <li key={`imp-${i}`}>{s}</li>)}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-headline-sm font-headline-sm text-on-surface">3. Phỏng vấn thử (demo)</h2>
            <button onClick={startInterview} disabled={matches.length === 0} className="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary font-label-md text-label-md disabled:opacity-50">
              Vào phòng phỏng vấn
            </button>
          </div>
          {!interview ? (
            <p className="text-body-sm font-body-sm text-on-surface-variant">Chấm điểm trước, chọn công việc, rồi vào phòng phỏng vấn demo.</p>
          ) : (
            <div>
              <div className="text-label-md font-label-md text-outline mb-2">Câu hỏi cho {interview.jobTitle}</div>
              <ol className="list-decimal list-inside space-y-1.5 text-body-sm font-body-sm text-on-surface">
                {interview.questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
              </ol>
              <div className="mt-4 rounded-lg bg-surface-container-low p-3">
                <div className="text-label-sm font-label-sm text-outline mb-1">Mẹo trả lời</div>
                <ul className="list-disc list-inside text-body-sm font-body-sm text-on-surface-variant space-y-1">
                  {interview.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}