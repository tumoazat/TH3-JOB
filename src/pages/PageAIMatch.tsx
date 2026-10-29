import { useEffect, useState } from 'react';

type MatchRow = { jobId: number; match: number | null; band: string | null; dataStatus: string };

const API = 'http://localhost:5000/api';

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

export default function PageAIMatch() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

  useEffect(() => {
    fetch(`${API}/match/batch`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: any) => {
        setCandidates(data.summary.map((s: any) => s.candidateId));
        if (data.summary.length > 0) {
          setSelectedCandidate(data.summary[0].candidateId);
          loadCandidate(data.summary[0].candidateId);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadCandidate = (candidateId: string) => {
    setLoading(true);
    fetch(`${API}/match/batch?candidateId=${encodeURIComponent(candidateId)}&limit=30`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: any) => setRows(data.results))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-background text-on-surface p-8">
      <h1 className="text-3xl font-bold text-primary mb-2">AI Matching</h1>
      <p className="text-on-surface-variant mb-6">
        Điểm phù hợp giữa hồ sơ ứng viên và các tin tuyển dụng (ML rule-based).
      </p>
      {!loading && !error && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-label-md font-label-md text-on-surface">Ứng viên:</span>
            <select
              value={selectedCandidate}
              onChange={(e) => { setSelectedCandidate(e.target.value); loadCandidate(e.target.value); }}
              className="bg-surface border border-outline-variant rounded-lg py-2 px-3 text-body-sm font-body-sm text-on-surface w-full sm:w-80"
            >
              {candidates.map((cid) => (
                <option key={cid} value={cid}>{cid}</option>
              ))}
            </select>
          </div>
          <span className="text-body-sm font-body-sm text-outline">
            {rows.length} việc làm phù hợp
          </span>
        </div>
      )}
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-red-500">Lỗi tải dữ liệu: {error}</p>}
      {!loading && !error && (
        <div className="space-y-3 max-w-3xl">
          {rows.map((r) => (
            <div
              key={r.jobId}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <span className="font-medium text-on-surface">Việc làm #{r.jobId}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">
                  {r.match == null ? 'Chưa đủ dữ liệu' : `${r.match}%`}
                </span>
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-outline/10 text-outline">{r.band ?? '—'}</span>
                <button
                  onClick={() => {
                    fetch(`${API}/match/feedback`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ candidateId: selectedCandidate, jobId: r.jobId, action: 'view' }),
                    }).then(() => showToast('Đã ghi nhận phản hồi'));
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ghi nhận
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
