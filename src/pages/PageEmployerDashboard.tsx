import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';

type PostedJob = { id: string; title: string; status: string; applicants?: number; views?: number; deadline?: string };

export default function PageEmployerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (!me.ok) { navigate('/auth.html'); return; }
        const meData = await me.json();
        setUser(meData.user);
        if (meData.user.role !== 'employer' && meData.user.role !== 'admin') {
          navigate('/03_student_dashboard.html');
          return;
        }
        const res = await fetch(`${API}/employer/stats`, { credentials: 'include' });
        if (!res.ok) throw new Error('Không tải được thống kê');
        setStats(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    navigate('/auth.html');
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background text-on-surface-variant text-body-md">Đang tải dashboard...</div>;
  }

  const jobs: PostedJob[] = stats?.postedJobs || [];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between p-4 w-64 h-screen bg-surface-container-lowest border-r border-outline-variant shadow-sm select-none">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]" data-icon="business_center">business_center</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">CareerMatch AI</span>
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Employer Hub</span>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            <a href="/employer-dashboard.html" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-container text-secondary font-semibold">
              <span className="material-symbols-outlined text-[20px] fill-icon">space_dashboard</span>
              Tổng quan
            </a>
            <a href="/11_ng_tin_tuy_n_d_ng_post_a_job.html" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">post_add</span>
              Đăng tin
            </a>
            <a href="/12.12 - Quản lý ứng viên (Candidate Management).html" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">group</span>
              Ứng viên
            </a>
            <a href="/ai-talent.html" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              AI Talent Demo
            </a>
          </nav>
        </div>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-error-container/40 hover:text-error">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Đăng xuất
        </button>
      </aside>

      <div className="ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 h-16 bg-surface-container-lowest border-b border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 text-body-sm font-body-sm text-outline">
            <span>Trang chủ</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Employer Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-body-sm font-body-sm text-on-surface-variant">{user?.name}</span>
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary grid place-items-center text-label-md font-label-md">
              {(user?.name || 'E').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">Tổng quan tuyển dụng</h1>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Hiệu quả bài đăng và phễu ứng viên của bạn.</p>
            </div>
            <a href="/ai-talent.html" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Mở AI Talent Demo
            </a>
          </div>

          {error && <p className="text-error bg-error-container/40 rounded-lg px-4 py-3 text-body-sm">{error}</p>}

          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px bg-outline-variant/40 rounded-xl overflow-hidden border border-outline-variant/40">
            <Kpi label="Bài đăng" value={stats?.totalPosts} icon="post_add" />
            <Kpi label="Lượt xem" value={stats?.totalViews} icon="visibility" />
            <Kpi label="Ứng tuyển" value={stats?.totalApplicants} icon="assignment" />
            <Kpi label="Offer" value={stats?.offers} icon="verified" />
            <Kpi label="Tỉ lệ apply" value={`${stats?.applyRate ?? 0}%`} icon="trending_up" />
            <Kpi label="Tỉ lệ offer" value={`${stats?.offerRate ?? 0}%`} icon="percent" />
          </section>

          <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
            <h2 className="text-headline-sm font-headline-sm text-on-surface mb-4">Bài viết của bạn</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm font-body-sm">
                <thead>
                  <tr className="text-label-sm font-label-sm text-outline border-b border-outline-variant/50">
                    <th className="pb-2 font-semibold">Vị trí</th>
                    <th className="pb-2 font-semibold text-center">Trạng thái</th>
                    <th className="pb-2 font-semibold text-right">Lượt xem</th>
                    <th className="pb-2 font-semibold text-right">Ứng tuyển</th>
                    <th className="pb-2 font-semibold text-right">Hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td className="py-3 text-on-surface">{j.title}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-label-sm font-label-sm ${j.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {j.status === 'active' ? 'Đang tuyển' : 'Đã đóng'}
                        </span>
                      </td>
                      <td className="py-3 text-right tabular-nums text-on-surface-variant">{j.views ?? 0}</td>
                      <td className="py-3 text-right tabular-nums text-on-surface-variant">{j.applicants ?? 0}</td>
                      <td className="py-3 text-right text-on-surface-variant">{j.deadline || '—'}</td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-on-surface-variant">Chưa có bài đăng.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
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