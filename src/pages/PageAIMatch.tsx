import { useEffect, useState } from 'react';

type MatchRow = { jobId: number; match: number | null; band: string | null; dataStatus: string; method?: string; fallback?: boolean; matchingMethod?: string; confidence?: number; criteria?: Criterion[]; strengths?: string[]; weaknesses?: string[]; recommendations?: string[]; explanation?: any; matchedSkills?: string[]; missingSkills?: string[] };

type Criterion = { name: string; weight: number; score: number; evidenceCV: string[]; evidenceJD: string[] };

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
  const [detail, setDetail] = useState<MatchRow | null>(null);

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
    setDetail(null);
    fetch(`${API}/match/batch?candidateId=${encodeURIComponent(candidateId)}&limit=30`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: any) => {
        setRows(data.results || []);
        if (data.results?.[0]) setDetail(data.results[0]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const selectJob = (row: MatchRow) => {
    setDetail(row);
    if (row.method === 'rule_based_fallback' || row.fallback) {
      showToast('Kết quả này được tính bằng rule-based (Gemini lỗi/timeout)', 'info');
    }
  };

  const bandColor = (band: string | null) => {
    switch (band) {
      case 'Rất khớp': return 'bg-green-100 text-green-800';
      case 'Khớp tốt': return 'bg-blue-100 text-blue-800';
      case 'Khớp tiềm năng': return 'bg-amber-100 text-amber-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const methodLabel = (row: MatchRow) => {
    if (row.matchingMethod === 'gemini_semantic') return 'Gemini AI';
    if (row.matchingMethod === 'rule_based_fallback') return 'Rule-based (fallback)';
    return row.method || '—';
  };

  return (
    <div className="min-h-screen bg-background text-on-surface p-8">
      <h1 className="text-3xl font-bold text-primary mb-2">AI Matching</h1>
      <p className="text-on-surface-variant mb-6">
        Điểm phù hợp giữa hồ sơ ứng viên và các tin tuyển dụng (Gemini semantic matching, fallback rule-based).
      </p>
      {!loading && !error && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-label-md font-label-md text-on-surface">Ứng viên:</span>
            <select
              value={selectedCandidate}
              onChange={(e) => { setSelectedCandidate(e.target.value); loadCandidate(e.target.value); setDetail(null); }}
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
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 flex items-center justify-between cursor-pointer group hover:border-secondary/50"
              onClick={() => selectJob(r)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-on-surface truncate">Việc làm #{r.jobId}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${bandColor(r.band)}`}>{r.band ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm font-body-sm text-on-surface-variant">
                  <span>{methodLabel(r)}</span>
                  <span className="text-xs">•</span>
                  <span>{r.match == null ? 'Chưa đủ dữ liệu' : `${r.match}%`}</span>
                  {r.confidence != null && <span className="text-xs text-outline">Độ tin cậy: {(r.confidence * 100).toFixed(0)}%</span>}
                </div>
              </div>
              <button className="text-xs font-medium text-primary hover:underline ml-4">Xem chi tiết</button>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="mt-8 max-w-3xl bg-surface border border-outline-variant/40 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary">Chi tiết việc làm #{detail.jobId}</h2>
            <button onClick={() => setDetail(null)} className="text-xs font-medium text-on-surface-variant hover:text-primary">Đóng</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-3">
              <div className="text-xs font-medium text-outline mb-1">Điểm phù hợp</div>
              <div className="text-2xl font-bold text-primary">{detail.match == null ? '—' : `${detail.match}%`}</div>
              <div className={`text-xs font-medium ${bandColor(detail.band)} mt-1`}>{detail.band ?? '—'}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-3">
              <div className="text-xs font-medium text-outline mb-1">Phương pháp</div>
              <div className="text-sm font-medium text-on-surface">{methodLabel(detail)}</div>
              {detail.fallback && <div className="text-xs text-red-600 mt-1">Đã fallback về rule-based do Gemini lỗi/timeout</div>}
            </div>
          </div>

          {detail.explanation && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-on-surface mb-2">Giải thích</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                {typeof detail.explanation === 'object' && detail.explanation.summary
                  ? detail.explanation.summary
                  : String(detail.explanation)}
              </p>
            </div>
          )}

          {(detail.strengths?.length || detail.weaknesses?.length || detail.recommendations?.length) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {detail.strengths?.length && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">Điểm mạnh</h4>
                  <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                    {detail.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {detail.weaknesses?.length && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-amber-800 mb-2">Điểm yếu</h4>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    {detail.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              {detail.recommendations?.length && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Đề xuất cải thiện</h4>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    {detail.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {detail.matchedSkills?.length || detail.missingSkills?.length ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-on-surface mb-2">Kỹ năng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-on-surface mb-2">Phù hợp</h4>
                  <div className="flex flex-wrap gap-1">
                    {detail.matchedSkills?.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-on-surface mb-2">Còn thiếu</h4>
                  <div className="flex flex-wrap gap-1">
                    {detail.missingSkills?.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {detail.criteria?.length && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-on-surface mb-2">Chi tiết theo tiêu chí</h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-outline border-b border-outline-variant/40">
                    <th className="pb-2 font-medium text-on-surface-variant">Tiêu chí</th>
                    <th className="pb-2 font-medium text-on-surface-variant text-right">Trọng số</th>
                    <th className="pb-2 font-medium text-on-surface-variant text-right">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.criteria.map((c: Criterion, i) => (
                    <tr key={i} className="border-b border-outline-variant/20">
                      <td className="py-2 text-on-surface">{c.name}</td>
                      <td className="py-2 text-on-surface-variant text-right">{c.weight}%</td>
                      <td className="py-2 text-primary font-medium text-right">{c.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(detail.criteria as Criterion[]).some((c) => c.evidenceCV?.length || c.evidenceJD?.length) && (
                <div className="mt-3 text-xs text-on-surface-variant italic">
                  Có bằng chứng từ CV và JD cho từng tiêu chí (xem chi tiết trong dữ liệu API).
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
