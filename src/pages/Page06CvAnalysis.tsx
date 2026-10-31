import { useState, useEffect, useRef } from 'react';

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

export default function Page06CvAnalysis() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/profile`)
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => {});
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showToast('Vui lòng chọn file PDF', 'error');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/cv/extract`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Lỗi trích xuất');
      setExtracted(data.cvText);
      setProfile({ ...(profile || {}), cvText: data.cvText });
      showToast('Đã trích xuất nội dung CV', 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi upload CV', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveCVText = async (text: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cv/manual`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Lỗi lưu');
      setProfile({ ...(profile || {}), cvText: text });
      showToast('Đã lưu nội dung CV', 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi lưu CV', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runMatch = async () => {
    if (!profile?.cvText) {
      showToast('Vui lòng nhập/trích xuất CV trước khi matching', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/match/all`, {
        method: 'GET',
      });
      const data = await res.json();
      setMatchResults(Array.isArray(data) ? data : []);
      showToast(`Đã matching ${data.length} việc làm`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi matching', 'error');
    } finally {
      setLoading(false);
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

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between p-4 w-64 h-screen bg-surface-container-lowest border-r border-outline-variant shadow-sm select-none">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-display-lg font-bold shadow-sm">
              <span className="material-symbols-outlined text-[24px]" data-icon="psychology">psychology</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">CareerMatch AI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline">Early-Career Talent Hub</span>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-lg text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-200 disabled:opacity-60 ${
              loading ? 'bg-secondary' : 'bg-primary hover:bg-primary-container active:scale-[0.99]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>{loading ? 'Đang xử lý...' : 'Upload New CV'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
          <nav className="flex flex-col gap-1">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 font-label-lg text-label-lg" href="#dashboard">
              <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
              <span>Dashboard</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 font-label-lg text-label-lg" href="#matched-jobs">
              <span className="material-symbols-outlined text-[20px]">work</span>
              <span>Matched Jobs</span>
            </a>
          </nav>
        </div>
      </aside>
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 w-full bg-surface-container-lowest border-b border-outline-variant shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant">
              <span>Trang chủ</span>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
              <span className="text-on-surface font-semibold">Phân tích CV bằng AI</span>
            </div>
            <div className="relative w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
              <input className="w-full h-9 pl-9 pr-4 text-body-sm font-body-sm bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 placeholder:text-outline transition-all" placeholder="Tìm kiếm công ty, vị trí..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <nav className="hidden lg:flex items-center gap-6 text-label-md font-label-md text-on-surface-variant">
              <a className="hover:text-secondary transition-colors duration-150" href="#">Explore Companies</a>
              <a className="hover:text-secondary transition-colors duration-150" href="#">Salary Insights</a>
              <a className="hover:text-secondary transition-colors duration-150" href="#">Mentorship</a>
            </nav>
            <div className="h-4 w-[1px] bg-outline-variant hidden lg:block"></div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8">
          <section id="dashboard">
            <h2 className="text-2xl font-bold text-primary mb-4">Thông tin hồ sơ</h2>
            {profile ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-outline-variant/40 rounded-xl p-4">
                  <div className="text-xs font-medium text-outline mb-1">Họ và tên</div>
                  <div className="text-body-md font-body-md text-on-surface">{profile.name || 'Chưa có'}</div>
                </div>
                <div className="bg-surface border border-outline-variant/40 rounded-xl p-4">
                  <div className="text-xs font-medium text-outline mb-1">Email</div>
                  <div className="text-body-md font-body-md text-on-surface">{profile.email || 'Chưa có'}</div>
                </div>
                <div className="bg-surface border border-outline-variant/40 rounded-xl p-4">
                  <div className="text-xs font-medium text-outline mb-1">Điểm CV</div>
                  <div className="text-2xl font-bold text-primary">{profile.cvScore ?? '—'}</div>
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-outline-variant/40 rounded-xl p-8 text-center">
                <p className="text-on-surface-variant">Chưa có hồ sơ. Vui lòng upload CV.</p>
              </div>
            )}
          </section>

          <section id="upload">
            <h2 className="text-2xl font-bold text-primary mb-4">Upload CV PDF</h2>
            <div className="bg-surface border border-outline-variant/40 rounded-xl p-6">
              <label className="block mb-4 text-sm font-medium text-on-surface">Chọn file CV (PDF, tối đa 5 MB)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                disabled={loading}
                className="block w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container"
              />
              {loading && <p className="mt-2 text-xs text-outline">Đang trích xuất nội dung PDF...</p>}
              {extracted && (
                <div className="mt-4 bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-4">
                  <div className="text-xs font-medium text-outline mb-2">Nội dung CV đã trích xuất (xem trước)</div>
                  <div className="text-xs text-on-surface-variant break-words max-h-64 overflow-y-auto">
                    {extracted.slice(0, 2000)}{extracted.length > 2000 ? '...' : ''}
                  </div>
                  <textarea
                    className="mt-2 w-full h-32 p-3 text-sm text-on-surface bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:outline-none"
                    placeholder="Chỉnh sửa nội dung CV nếu cần..."
                    defaultValue={extracted}
                    onChange={(e) => saveCVText(e.target.value)}
                  />
                </div>
              )}
            </div>
          </section>

          <section id="matched-jobs">
            <h2 className="text-2xl font-bold text-primary mb-4">Việc làm phù hợp</h2>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={runMatch}
                disabled={loading || !profile?.cvText}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors duration-200 ${
                  loading || !profile?.cvText
                    ? 'bg-outline/20 text-outline-variant cursor-not-allowed'
                    : 'bg-primary text-on-primary hover:bg-primary-container active:scale-[0.98]'
                }`}
              >
                {loading ? 'Đang matching...' : 'Tìm việc phù hợp'}
              </button>
              {!profile?.cvText && <span className="text-xs text-red-500">Cần có nội dung CV trước khi matching</span>}
            </div>
            {matchResults.length > 0 && (
              <div className="space-y-3">
                {matchResults.slice(0, 10).map((r: any) => (
                  <div key={r.jobId} className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-on-surface">Việc làm #{r.jobId}</span>
                      <div className="text-xs text-outline mt-1">{r.method ?? '—'} • {r.matchingMethod ?? '—'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${bandColor(r.band)}`}>{r.band ?? '—'}</span>
                      <span className="font-bold text-on-surface">{r.match == null ? '—' : `${r.match}%`}</span>
                    </div>
                  </div>
                ))}
                {matchResults.length > 10 && <p className="text-xs text-outline mt-2">Hiển thị 10/{matchResults.length} kết quả đầu tiên</p>}
              </div>
            )}
            {matchResults.length === 0 && profile?.cvText && (
              <p className="text-on-surface-variant">Chưa có kết quả matching. Nhấn nút bên trên để bắt đầu.</p>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
