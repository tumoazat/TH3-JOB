import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const roleHome: Record<string, string> = {
  candidate: '/03_student_dashboard.html',
  employer: '/employer-dashboard.html',
  admin: '/bi-dashboard.html',
};

export default function PageAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = mode === 'login' ? `${API}/auth/login` : `${API}/auth/register`;
      const body: any = { email, password };
      if (mode === 'register') { body.name = name; body.role = role; }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Thao tác thất bại');
      showToast(mode === 'login' ? 'Đăng nhập thành công' : 'Đăng ký thành công', 'success');
      const dest = roleHome[data.user?.role] || '/03_student_dashboard.html';
      setTimeout(() => navigate(dest), 500);
    } catch (e2: any) {
      setError(e2.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[24px]" data-icon="school">school</span>
          </div>
          <div>
            <div className="text-headline-sm font-headline-sm font-bold text-primary">CareerMatch <span className="text-secondary">AI</span></div>
            <div className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Nền tảng tuyển dụng thông minh</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-sm p-8">
          <div className="flex gap-1 p-1 bg-surface-container rounded-lg mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-label-lg font-label-lg transition-colors ${mode === 'login' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md text-label-lg font-label-lg transition-colors ${mode === 'register' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1.5">Họ và tên</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 text-body-md font-body-md"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1.5">Bạn là</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('candidate')}
                      className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-label-md font-label-md transition-colors ${role === 'candidate' ? 'border-secondary bg-surface-container text-primary' : 'border-outline-variant text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-[22px]">person_search</span>
                      Người tìm việc
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('employer')}
                      className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-label-md font-label-md transition-colors ${role === 'employer' ? 'border-secondary bg-surface-container text-primary' : 'border-outline-variant text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-[22px]">business_center</span>
                      Nhà tuyển dụng
                    </button>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 text-body-md font-body-md"
                placeholder="ban@email.com"
              />
            </div>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 text-body-md font-body-md"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            {error && <p className="text-label-md font-label-md text-error bg-error-container/40 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors disabled:opacity-60"
            >
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="mt-4 text-center text-label-sm font-label-sm text-outline">
            Demo admin: admin@careermatch.local / admin123
          </p>
        </div>

        <p className="mt-6 text-center text-label-sm font-label-sm text-on-surface-variant">
          <a href="/01_landing_page.html" className="hover:text-primary">← Về trang chủ</a>
        </p>
      </div>
    </div>
  );
}