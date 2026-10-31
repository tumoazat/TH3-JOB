import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

const BAND_ORDER = ['Rất khớp', 'Khớp tốt', 'Khớp tiềm năng', 'Cần bổ sung'];
const BAND_COLOR: Record<string, string> = {
  'Rất khớp': 'bg-tertiary-fixed-dim',
  'Khớp tốt': 'bg-secondary',
  'Khớp tiềm năng': 'bg-amber-400',
  'Cần bổ sung': 'bg-error',
};
const BAND_TEXT: Record<string, string> = {
  'Rất khớp': 'text-emerald-700',
  'Khớp tốt': 'text-secondary',
  'Khớp tiềm năng': 'text-amber-700',
  'Cần bổ sung': 'text-error',
};

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export default function PageBIDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [skills, setSkills] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/stats/overview`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/stats/matching-distribution`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/stats/skills`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/ai/model-status`).then((r) => r.json()).catch(() => null),
    ]).then(([o, d, s, m]) => {
      setOverview(o);
      setDistribution(d);
      setSkills(s);
      setModelStatus(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const matchingTotal = distribution?.distribution
    ? BAND_ORDER.reduce((sum, b) => sum + (distribution.distribution[b] || 0), 0)
    : 0;

  const skillRows = (skills?.comparison || []) as Array<{ name: string; requiredByJobs: number; ownedByCandidates: number }>;
  const gapSkills = skillRows
    .filter((s) => s.requiredByJobs > s.ownedByCandidates)
    .sort((a, b) => (b.requiredByJobs - b.ownedByCandidates) - (a.requiredByJobs - a.ownedByCandidates))
    .slice(0, 6);

  const ds = overview?.dataSources || { real: 0, synthetic: 0, aiPredicted: 0 };
  const dsTotal = ds.real + ds.synthetic + ds.aiPredicted || 1;
  const conversion = (overview?.conversion || []) as Array<{ status: string; count: number; rate: number }>;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between p-4 w-64 h-screen bg-surface-container-lowest border-r border-outline-variant shadow-sm select-none">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]" data-icon="insights">insights</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">CareerMatch AI</span>
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Business Intelligence</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <NavItem icon="space_dashboard" label="Tổng quan" href="/03_student_dashboard.html" />
            <NavItem icon="work" label="Việc làm" href="/04_job_search.html" />
            <NavItem icon="auto_awesome" label="AI Matching" href="/ai-match.html" />
            <NavItem icon="psychology" label="Phân tích CV" href="/06_cv_analysis.html" />
            <NavItem icon="group" label="Ứng viên" href="/12.12 - Quản lý ứng viên (Candidate Management).html" />
            <div className="my-2 h-px bg-outline-variant/60" />
            <NavItem icon="query_stats" label="BI Analytics" href="/bi-dashboard.html" active />
          </nav>
        </div>
        <div className="px-2">
          <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${modelStatus?.healthy ? 'bg-emerald-500' : 'bg-error'}`} />
              <span className="text-label-sm font-label-sm text-on-surface">AI Engine</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-snug">
              {modelStatus?.aiMatchingMethod === 'gemini' ? 'Gemini semantic' : 'Rule-based'} · {modelStatus?.mlBestModel ?? 'n/a'}
            </p>
          </div>
        </div>
      </aside>

      <div className="ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 h-16 w-full bg-surface-container-lowest border-b border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 text-body-sm font-body-sm text-outline">
            <span>Trang chủ</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">BI Analytics</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 text-label-md font-label-md text-on-surface-variant">
              <span className={`w-2 h-2 rounded-full ${modelStatus?.geminiConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {modelStatus?.geminiConfigured ? 'Gemini đã kết nối' : 'Gemini chưa có key'}
            </span>
            <button className="w-9 h-9 grid place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary grid place-items-center text-label-md font-label-md">AD</div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">Tổng quan tuyển dụng</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
              Chỉ số vận hành, phân bố kỹ năng và hiệu năng AI matching.
            </p>
          </div>

          {loading ? (
            <div className="grid place-items-center h-64 text-on-surface-variant text-body-sm">Đang tải dữ liệu BI...</div>
          ) : (
            <>
              {/* KPI strip */}
              <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px bg-outline-variant/40 rounded-xl overflow-hidden border border-outline-variant/40">
                <Kpi label="Tin tuyển dụng" value={overview?.totalJobs} icon="work" />
                <Kpi label="Ứng viên" value={overview?.totalCandidates} icon="group" />
                <Kpi label="Hồ sơ CV" value={overview?.totalProfile} icon="description" />
                <Kpi label="Tin đã đăng" value={overview?.totalPostedJobs} icon="post_add" />
                <Kpi label="Đơn ứng tuyển" value={overview?.totalApplications} icon="assignment" />
                <Kpi label="Nhà tuyển dụng" value={overview?.totalEmployers} icon="business" />
              </section>

              {/* Matching distribution + AI model */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-headline-sm font-headline-sm text-on-surface">Phân bố mức độ phù hợp CV–JD</h2>
                      <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                        {distribution?.sampled ? 'Mẫu 30 ứng viên × 20 việc làm' : 'Toàn bộ cặp CV–JD'}
                      </p>
                    </div>
                    <span className="text-label-sm font-label-sm text-outline tabular-nums">{matchingTotal} cặp</span>
                  </div>
                  <div className="space-y-4">
                    {BAND_ORDER.map((band) => {
                      const count = distribution?.distribution?.[band] ?? 0;
                      const rate = pct(count, matchingTotal);
                      return (
                        <div key={band}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-label-md font-label-md ${BAND_TEXT[band]}`}>{band}</span>
                            <span className="text-label-md font-label-md text-on-surface-variant tabular-nums">{count} · {rate}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-surface-container overflow-hidden">
                            <div className={`h-full rounded-full ${BAND_COLOR[band]}`} style={{ width: `${Math.max(rate, count > 0 ? 2 : 0)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
                  <h2 className="text-headline-sm font-headline-sm text-on-surface mb-4">Trạng thái AI Model</h2>
                  <dl className="divide-y divide-outline-variant/40 text-body-sm font-body-sm">
                    <StatusRow label="Matching" value={modelStatus?.aiMatchingMethod ?? '—'} />
                    <StatusRow label="Gemini" value={modelStatus?.geminiConfigured ? `Đã cấu hình` : 'Chưa có key'} accent={modelStatus?.geminiConfigured ? 'emerald' : 'amber'} />
                    <StatusRow label="Model" value={modelStatus?.geminiModel ?? '—'} />
                    <StatusRow label="ML model" value={modelStatus?.mlStatus ?? '—'} />
                    <StatusRow label="Thuật toán" value={modelStatus?.mlBestModel ?? '—'} />
                    <StatusRow label="Train gần nhất" value={modelStatus?.lastTrainingDate ? String(modelStatus.lastTrainingDate).slice(0, 10) : '—'} />
                  </dl>
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
                    <span className={`w-2 h-2 rounded-full ${modelStatus?.healthy ? 'bg-emerald-500' : 'bg-error'}`} />
                    <span className="text-label-md font-label-md text-on-surface-variant">
                      {modelStatus?.healthy ? 'Hệ thống AI hoạt động bình thường' : 'Có lỗi cần kiểm tra'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Category + skills gap */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
                  <h2 className="text-headline-sm font-headline-sm text-on-surface mb-4">Ứng viên theo ngành</h2>
                  <div className="space-y-3">
                    {(overview?.categoryDistribution || []).map((c: any) => {
                      const rate = pct(c.count, overview?.totalCandidates || 1);
                      return (
                        <div key={c.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-body-sm font-body-sm text-on-surface-variant">{c.name}</span>
                            <span className="text-label-sm font-label-sm text-on-surface tabular-nums">{c.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                            <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.max(rate, 2)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 className="text-headline-sm font-headline-sm text-on-surface">Kỹ năng thiếu hụt</h2>
                    <span className="text-label-sm font-label-sm text-outline">JD yêu cầu &gt; ứng viên có</span>
                  </div>
                  {gapSkills.length === 0 ? (
                    <p className="text-body-sm font-body-sm text-on-surface-variant">Không có khoảng trống kỹ năng đáng kể.</p>
                  ) : (
                    <table className="w-full text-body-sm font-body-sm">
                      <thead>
                        <tr className="text-label-sm font-label-sm text-outline">
                          <th className="text-left font-semibold pb-2">Kỹ năng</th>
                          <th className="text-right font-semibold pb-2">Yêu cầu</th>
                          <th className="text-right font-semibold pb-2">Có</th>
                          <th className="text-right font-semibold pb-2">Thiếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/40">
                        {gapSkills.map((s) => (
                          <tr key={s.name}>
                            <td className="py-2 text-on-surface">{s.name}</td>
                            <td className="py-2 text-right text-on-surface-variant tabular-nums">{s.requiredByJobs}</td>
                            <td className="py-2 text-right text-on-surface-variant tabular-nums">{s.ownedByCandidates}</td>
                            <td className="py-2 text-right font-semibold text-error tabular-nums">−{s.requiredByJobs - s.ownedByCandidates}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div className="mt-3 text-label-sm font-label-sm text-outline">
                    Tổng {skillRows.length} kỹ năng được đối chiếu giữa JD và ứng viên.
                  </div>
                </div>
              </section>

              {/* Salary + conversion */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
                  <h2 className="text-headline-sm font-headline-sm text-on-surface mb-4">Phân bố mức lương</h2>
                  <div className="space-y-2.5">
                    {(overview?.salaryDistribution || []).map((s: any) => (
                      <div key={s.name} className="flex items-center justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant truncate max-w-[65%]">{s.name}</span>
                        <span className="text-on-surface font-medium tabular-nums">{s.count} tin</span>
                      </div>
                    ))}
                  </div>
                  {overview?.salaryDataNote && (
                    <p className="mt-4 text-label-sm font-label-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      {overview.salaryDataNote}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
                  <h2 className="text-headline-sm font-headline-sm text-on-surface mb-4">Phễu chuyển đổi ứng tuyển</h2>
                  {conversion.length === 0 ? (
                    <p className="text-body-sm font-body-sm text-on-surface-variant">Chưa có dữ liệu ứng tuyển.</p>
                  ) : (
                    <div className="space-y-3">
                      {conversion.map((c) => (
                        <div key={c.status} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 text-body-sm font-body-sm text-on-surface-variant truncate">{c.status}</span>
                          <div className="flex-1 h-2.5 rounded-full bg-surface-container overflow-hidden">
                            <div className="h-full rounded-full bg-tertiary-fixed-dim" style={{ width: `${Math.max(c.rate, c.count > 0 ? 4 : 0)}%` }} />
                          </div>
                          <span className="w-24 shrink-0 text-right text-label-sm font-label-sm text-on-surface tabular-nums">
                            {c.count} · {c.rate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Data source provenance */}
              <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-headline-sm font-headline-sm text-on-surface">Nguồn dữ liệu</h2>
                    <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                      Phân biệt dữ liệu thực tế, mô phỏng và dự đoán AI.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <Donut real={ds.real} synthetic={ds.synthetic} total={dsTotal} />
                    <div className="space-y-2 text-body-sm font-body-sm">
                      <Legend color="bg-primary" label="Thực tế" value={ds.real} />
                      <Legend color="bg-secondary" label="Mô phỏng" value={ds.synthetic} />
                      <Legend color="bg-tertiary-fixed-dim" label="AI dự đoán" value={ds.aiPredicted} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 flex-1">
                    <MiniStat label="Top vị trí" value={overview?.topLocations?.[0]?.name ?? '—'} />
                    <MiniStat label="Top kỹ năng" value={overview?.topSkills?.[0]?.name ?? '—'} />
                    <MiniStat label="Cặp matching" value={distribution?.totalPairs ?? 0} />
                  </div>
                </div>
              </section>

              <div className="text-label-sm font-label-sm text-outline text-center pt-2">
                Dữ liệu từ API backend (port 5000) · Gemini semantic matching + rule-based fallback
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, href, active }: { icon: string; label: string; href: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-lg font-label-lg transition-colors duration-150 ${
        active
          ? 'bg-surface-container text-secondary font-semibold'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
      }`}
    >
      <span className={`material-symbols-outlined text-[20px] ${active ? 'fill-icon' : ''}`} data-icon={icon}>{icon}</span>
      <span className="truncate">{label}</span>
    </a>
  );
}

function Kpi({ label, value, icon }: { label: string; value: number | string | undefined; icon: string }) {
  return (
    <div className="bg-surface-container-lowest p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-label-sm font-label-sm text-outline uppercase tracking-wide">{label}</span>
        <span className="material-symbols-outlined text-[18px] text-outline-variant" data-icon={icon}>{icon}</span>
      </div>
      <div className="text-headline-lg font-headline-lg text-primary tabular-nums leading-none">{value ?? '—'}</div>
    </div>
  );
}

function StatusRow({ label, value, accent }: { label: string; value: string; accent?: 'emerald' | 'amber' }) {
  const accentClass = accent === 'emerald' ? 'text-emerald-700' : accent === 'amber' ? 'text-amber-700' : 'text-on-surface';
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={`font-medium ${accentClass} truncate max-w-[60%] text-right`}>{value}</dd>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface font-medium tabular-nums">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-label-sm font-label-sm text-outline uppercase tracking-wide mb-1">{label}</div>
      <div className="text-body-md font-body-md text-on-surface font-semibold truncate">{value}</div>
    </div>
  );
}

function Donut({ real, synthetic, total }: { real: number; synthetic: number; total: number }) {
  const r = pct(real, total);
  const s = pct(synthetic, total);
  const gradient = `conic-gradient(#00236f 0% ${r}%, #0051d5 ${r}% ${r + s}%, #4edea3 ${r + s}% 100%)`;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <div className="absolute inset-0 rounded-full" style={{ background: gradient }} />
      <div className="absolute inset-[22%] rounded-full bg-surface-container-lowest grid place-items-center">
        <span className="text-label-sm font-label-sm text-outline">Tổng</span>
        <span className="text-body-md font-body-md font-bold text-on-surface tabular-nums leading-none">{total}</span>
      </div>
    </div>
  );
}