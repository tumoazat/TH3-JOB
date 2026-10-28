import { useState } from 'react';

type Section = { heading: string; body: string };
type Info = { title: string; intro: string; sections: Section[]; cta?: { label: string; href: string } };

const CONTENT: Record<string, Info> = {
  '/about.html': {
    title: 'Giới thiệu CareerMatch AI',
    intro: 'Nền tảng hướng nghiệp & tuyển dụng thông minh kết nối sinh viên Việt Nam với doanh nghiệp chất lượng bằng trí tuệ nhân tạo.',
    sections: [
      { heading: 'Sứ mệnh', body: 'Giúp mọi sinh viên tìm được công việc đầu tiên phù hợp với năng lực thực tế, minh bạch và công bằng.' },
      { heading: 'Chúng tôi làm gì', body: 'Phân tích CV bằng AI, đối chiếu kỹ năng với hơn 10.000 tin tuyển dụng và gợi ý vị trí phù hợp cho từng hồ sơ.' },
      { heading: 'Thành tựu', body: 'Hơn 50.000 sinh viên từ Bách Khoa, NEU, FPT và nhiều trường đại học đã kết nối thành công qua nền tảng.' },
    ],
    cta: { label: 'Bắt đầu miễn phí', href: '/03_student_dashboard.html' },
  },
  '/contact.html': {
    title: 'Liên hệ',
    intro: 'Đội ngũ CareerMatch AI luôn sẵn sàng hỗ trợ bạn. Gửi tin nhắn hoặc gọi đường dây nóng bên dưới.',
    sections: [
      { heading: 'Đường dây nóng', body: '1900 1234 — Hỗ trợ 8:00–18:00, Thứ 2 đến Thứ 7.' },
      { heading: 'Email', body: 'support@careermatch.ai — Phản hồi trong vòng 24 giờ làm việc.' },
      { heading: 'Văn phòng', body: 'Tòa nhà Innovation, Cầu Giấy, Hà Nội.' },
    ],
  },
  '/pricing.html': {
    title: 'Bảng giá',
    intro: 'Lựa chọn gói phù hợp cho sinh viên và nhà tuyển dụng.',
    sections: [
      { heading: 'Sinh viên — Miễn phí', body: 'Tạo hồ sơ, phân tích CV bằng AI, gợi ý việc làm phù hợp và theo dõi ứng tuyển không giới hạn.' },
      { heading: 'Nhà tuyển dụng — Starter', body: '1.990.000đ/tháng: đăng 5 tin, xem 200 hồ sơ, bộ lọc AI cơ bản.' },
      { heading: 'Nhà tuyển dụng — Growth', body: '4.990.000đ/tháng: không giới hạn tin, AI Matching Talent nâng cao, báo cáo tuyển dụng.' },
    ],
    cta: { label: 'Đăng tin tuyển dụng', href: '/11_ng_tin_tuy_n_d_ng_post_a_job.html' },
  },
  '/terms.html': {
    title: 'Điều khoản dịch vụ',
    intro: 'Khi sử dụng CareerMatch AI, bạn đồng ý với các điều khoản dưới đây.',
    sections: [
      { heading: '1. Tài khoản', body: 'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động dưới tài khoản của mình.' },
      { heading: '2. Nội dung', body: 'Bạn cam kết thông tin hồ sơ và tin tuyển dụng là chính xác, không vi phạm pháp luật và quyền của bên thứ ba.' },
      { heading: '3. Chấm dứt', body: 'Chúng tôi có quyền tạm khóa tài khoản vi phạm điều khoản mà không cần báo trước.' },
    ],
  },
  '/privacy.html': {
    title: 'Chính sách quyền riêng tư & Bảo mật thông tin sinh viên',
    intro: 'Chúng tôi tôn trọng và bảo vệ dữ liệu cá nhân của bạn.',
    sections: [
      { heading: 'Dữ liệu thu thập', body: 'Thông tin hồ sơ, CV và lịch sử ứng tuyển được dùng để cung cấp và cải thiện dịch vụ.' },
      { heading: 'Bảo mật', body: 'Dữ liệu được mã hóa khi truyền và lưu trữ; chỉ nhà tuyển dụng bạn ứng tuyển mới xem được hồ sơ.' },
      { heading: 'Quyền của bạn', body: 'Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu bất cứ lúc nào qua phần Hồ sơ cá nhân.' },
    ],
  },
  '/help.html': {
    title: 'Trung tâm hỗ trợ',
    intro: 'Câu hỏi thường gặp và hướng dẫn sử dụng CareerMatch AI.',
    sections: [
      { heading: 'Làm sao để tạo hồ sơ?', body: 'Vào Hồ sơ cá nhân, điền thông tin và tải CV (PDF/Word). AI sẽ chấm điểm và gợi ý việc làm.' },
      { heading: 'Làm sao để ứng tuyển?', body: 'Mở việc làm phù hợp, nhấn Ứng tuyển. Hồ sơ được gửi tới nhà tuyển dụng và theo dõi trong Hồ sơ ứng tuyển.' },
      { heading: 'Cần thêm trợ giúp?', body: 'Liên hệ đường dây nóng 1900 1234 hoặc email support@careermatch.ai.' },
    ],
    cta: { label: 'Liên hệ hỗ trợ', href: '/contact.html' },
  },
  '/certify.html': {
    title: 'Quy chuẩn chứng chỉ sinh viên',
    intro: 'Tiêu chuẩn xác minh hồ sơ sinh viên trên CareerMatch AI.',
    sections: [
      { heading: 'Xác minh sinh viên', body: 'Hồ sơ được xác minh khi email trường và thẻ sinh viên hợp lệ được xác nhận.' },
      { heading: 'Chứng chỉ kỹ năng', body: 'Chứng chỉ từ đối tác đào tạo được hiển thị sau khi đối chiếu mã định danh.' },
      { heading: 'GPA & học thuật', body: 'Điểm GPA do sinh viên khai báo, có thể yêu cầu bảng điểm để xác thực khi nhà tuyển dụng cần.' },
    ],
  },
  '/cv-guide.html': {
    title: 'Hướng dẫn viết CV đạt chuẩn ATS',
    intro: 'Mẹo viết CV thân thiện với hệ thống theo dõi ứng viên (ATS).',
    sections: [
      { heading: '1. Cấu trúc rõ ràng', body: 'Dùng tiêu đề mục chuẩn: Học vấn, Kỹ năng, Kinh nghiệm, Dự án. Tránh bảng và cột phức tạp.' },
      { heading: '2. Từ khóa kỹ năng', body: 'Đưa từ khóa đúng JD (ReactJS, Tailwind CSS, Git…) vào phần kỹ năng để AI đối chiếu chính xác.' },
      { heading: '3. Định dạng', body: 'Xuất PDF, font phổ biến, tên file rõ ràng như CV_HoTen_ViTri_2026.pdf.' },
    ],
    cta: { label: 'Phân tích CV ngay', href: '/06_cv_analysis.html' },
  },
};

export default function PageInfo({ pathname }: { pathname?: string }) {
  const path = pathname || (typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname) : '');
  const info = CONTENT[path] || CONTENT['/about.html'];
  const [sent, setSent] = useState(false);
  const isContact = path === '/contact.html';

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/40 shadow-sm">
        <div className="max-w-[1080px] mx-auto px-6 h-16 flex items-center justify-between">
          <a className="flex items-center gap-2 font-bold text-primary" href="/01_landing_page.html">
            <span className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" data-icon="school">school</span>
            </span>
            <span>CareerMatch <span className="text-secondary font-extrabold">AI</span></span>
          </a>
          <a className="text-label-lg font-label-lg text-secondary hover:text-primary transition-colors" href="/01_landing_page.html">Về trang chủ</a>
        </div>
      </header>

      <main className="flex-1 max-w-[1080px] w-full mx-auto px-6 py-12">
        <h1 className="text-headline-lg font-headline-lg text-primary mb-3">{info.title}</h1>
        <p className="text-body-lg font-body-lg text-on-surface-variant mb-8 max-w-3xl">{info.intro}</p>

        <div className="space-y-5">
          {info.sections.map((s) => (
            <section key={s.heading} className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-sm">
              <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">{s.heading}</h2>
              <p className="text-body-md font-body-md text-on-surface-variant">{s.body}</p>
            </section>
          ))}
        </div>

        {isContact && (
          <form className="mt-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-sm space-y-4"
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <h2 className="text-headline-sm font-headline-sm text-on-surface">Gửi tin nhắn</h2>
            <input required placeholder="Họ và tên" className="w-full h-11 px-4 rounded-lg bg-surface-container-low border border-outline-variant text-body-md focus:outline-none focus:border-secondary" />
            <input required type="email" placeholder="Email" className="w-full h-11 px-4 rounded-lg bg-surface-container-low border border-outline-variant text-body-md focus:outline-none focus:border-secondary" />
            <textarea required placeholder="Nội dung cần hỗ trợ..." rows={4} className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant text-body-md focus:outline-none focus:border-secondary" />
            <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg hover:bg-secondary transition-colors">Gửi liên hệ</button>
            {sent && <p className="text-label-md text-tertiary-container font-semibold">Đã gửi! Chúng tôi sẽ phản hồi trong 24 giờ.</p>}
          </form>
        )}

        {info.cta && (
          <a href={info.cta.href} className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-lg bg-primary text-on-primary font-label-lg hover:bg-secondary transition-colors">
            {info.cta.label}
            <span className="material-symbols-outlined text-[20px]" data-icon="arrow_forward">arrow_forward</span>
          </a>
        )}
      </main>

      <footer className="border-t border-outline-variant/40 bg-surface-container-lowest">
        <div className="max-w-[1080px] mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-body-sm text-on-surface-variant">
          <span>© 2026 CareerMatch AI. Tất cả quyền được bảo lưu.</span>
          <div className="flex items-center gap-4">
            <a className="hover:text-primary" href="/about.html">Giới thiệu</a>
            <a className="hover:text-primary" href="/contact.html">Liên hệ</a>
            <a className="hover:text-primary" href="/terms.html">Điều khoản</a>
            <a className="hover:text-primary" href="/privacy.html">Bảo mật</a>
          </div>
        </div>
      </footer>
    </div>
  );
}