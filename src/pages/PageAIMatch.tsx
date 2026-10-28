import { useEffect, useState } from 'react';

type MatchRow = { jobId: number; match: number | null; band: string | null; dataStatus: string };

const API = 'http://localhost:5000/api';

export default function PageAIMatch() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/match/all`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: MatchRow[]) => setRows(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface p-8">
      <h1 className="text-3xl font-bold text-primary mb-2">AI Matching</h1>
      <p className="text-on-surface-variant mb-6">
        Điểm phù hợp giữa hồ sơ của bạn và các tin tuyển dụng (baseline rule-based).
      </p>
      {loading && <p>Đang tính điểm...</p>}
      {error && <p className="text-red-500">Lỗi tải dữ liệu: {error}</p>}
      {!loading && !error && (
        <div className="space-y-3 max-w-2xl">
          {rows.map((r) => (
            <div
              key={r.jobId}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 flex items-center justify-between"
            >
              <span>Việc làm #{r.jobId}</span>
              <span className="font-bold">
                {r.match == null ? 'Chưa đủ dữ liệu' : `${r.match} – ${r.band}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
