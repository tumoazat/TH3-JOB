export default function PageJobDetail() {
  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 z-40 w-60 h-screen flex flex-col justify-between p-4 bg-surface-container-lowest border-r border-outline-variant shadow-sm select-none">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]" data-icon="school" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <div className="overflow-hidden">
              <h1 className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight truncate">CareerMatch AI</h1>
              <p className="text-label-sm font-label-sm text-outline truncate">Early-Career Talent Hub</p>
            </div>
          </div>
          <button data-bookmark="" className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-secondary hover:bg-primary text-on-primary rounded-lg transition-all duration-200 active:scale-[0.99] shadow-sm font-label-lg text-label-lg">
            <span className="material-symbols-outlined text-[18px]" data-icon="cloud_upload">cloud_upload</span>
            <span>Tải lên CV mới</span>
          </button>
        </div>
        <nav className="flex flex-col gap-1 mt-2">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 text-label-md font-label-md" href="/03_student_dashboard.html">
            <span className="material-symbols-outlined text-[20px]" data-icon="space_dashboard">space_dashboard</span>
            <span>Tổng quan</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 text-label-md font-label-md" href="/04_job_search.html">
            <span className="material-symbols-outlined text-[20px]" data-icon="work">work</span>
            <span>Tìm việc</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 text-label-md font-label-md" href="/06_cv_analysis.html">
            <span className="material-symbols-outlined text-[20px]" data-icon="description">description</span>
            <span>Phân tích CV</span>
          </a>
          <a className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface-container text-secondary font-semibold transition-all duration-200 active:scale-[0.99] text-label-md font-label-md" href="/07_matched_jobs.html">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]" data-icon="auto_awesome">auto_awesome</span>
              <span>Việc làm phù hợp</span>
            </div>
            <span className="text-[12px] font-label-md">12</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 text-label-md font-label-md" href="/08_application_tracker.html">
            <span className="material-symbols-outlined text-[20px]" data-icon="fact_check">fact_check</span>
            <span>Hồ sơ ứng tuyển</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 text-label-md font-label-md" href="/09_h_s_c_nh_n_student_profile.html">
            <span className="material-symbols-outlined text-[20px]" data-icon="account_box">account_box</span>
            <span>Hồ sơ cá nhân</span>
          </a>
        </nav>
      </aside>

      <div className="flex-1 pl-60 min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 h-16 w-full bg-surface-container-lowest border-b border-outline-variant shadow-sm">
          <nav className="flex items-center gap-2 text-label-md font-label-md text-on-surface-variant">
            <a className="hover:text-secondary transition-colors" href="/01_landing_page.html">Trang chủ</a>
            <span className="text-outline text-[12px]">/</span>
            <a className="hover:text-secondary transition-colors" href="/04_job_search.html">Tìm việc</a>
            <span className="text-outline text-[12px]">/</span>
            <a className="hover:text-secondary transition-colors" href="/07_matched_jobs.html">Việc làm phù hợp AI</a>
            <span className="text-outline text-[12px]">/</span>
            <span className="text-primary font-semibold truncate max-w-[220px]">Thực tập sinh Front-end Developer</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden xl:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline" data-icon="search">search</span>
              <input className="w-full h-9 pl-9 pr-3 text-body-sm font-body-sm bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all" placeholder="Tìm kỹ năng, công ty..." type="text" />
            </div>
            <div className="hidden lg:flex items-center gap-5 text-label-md font-label-md text-on-surface-variant">
              <a className="hover:text-secondary transition-colors" href="/01_landing_page.html">Explore Companies</a>
              <a className="hover:text-secondary transition-colors" href="/04_job_search.html">Salary Insights</a>
              <a className="hover:text-secondary transition-colors" href="/06_cv_analysis.html">Mentorship</a>
            </div>
            <div className="h-4 w-[1px] bg-outline-variant hidden sm:block"></div>
            <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface hover:text-secondary hover:bg-surface-container-low/50 transition-colors">
              <span className="material-symbols-outlined text-[18px]" data-icon="mark_chat_unread">mark_chat_unread</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface hover:text-secondary hover:bg-surface-container-low/50 transition-colors" data-count="3">
              <span className="material-symbols-outlined text-[18px]" data-icon="notifications">notifications</span>
              <span className="text-[10px] font-label-md bg-secondary text-on-secondary px-1.5 rounded-full">3</span>
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-outline-variant">
              <img className="w-8 h-8 rounded-full border border-outline-variant" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E" alt="Vietnamese student candidate profile avatar" />
              <div className="overflow-hidden">
                <div className="text-label-sm font-label-md text-on-surface">Minh Anh</div>
                <span className="material-symbols-outlined text-[16px] text-outline" data-icon="keyboard_arrow_down">keyboard_arrow_down</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-6 max-w-5xl mx-auto w-full">
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-on-secondary shadow-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]" data-icon="work" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
              </span>
              <div>
                <span className="text-[10px] font-label-md text-outline uppercase tracking-wider">Doanh nghiệp đã xác thực giấy phép</span>
                <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-headline-lg font-bold text-on-surface mb-1">Thực tập sinh Front-end Developer (ReactJS / UI)</h1>
                <p className="text-label-md font-label-md text-secondary mb-2">Đang nhận hồ sơ</p>
                <div className="flex items-center gap-3 text-label-sm font-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline" data-icon="corporate_fare">corporate_fare</span>
                    <span>NovaTech Solutions</span>
                  </span>
                  <span className="h-4 w-[1px] bg-outline-variant"></span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline" data-icon="location_on">location_on</span>
                    <span>Hà Nội (Cầu Giấy)</span>
                  </span>
                  <span className="h-4 w-[1px] bg-outline-variant"></span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline" data-icon="home_work">home_work</span>
                    <span>Hybrid (3 ngày VP, 2 ngày remote)</span>
                  </span>
                  <span className="h-4 w-[1px] bg-outline-variant"></span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline" data-icon="payments">payments</span>
                    <span>3.000.000 - 5.000.000 đ/tháng</span>
                  </span>
                  <span className="h-4 w-[1px] bg-outline-variant"></span>
                  <span className="text-label-sm font-label-sm text-outline">Cập nhật 2 giờ trước</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-label-sm font-label-sm">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary" data-icon="bolt">bolt</span>
                    <span className="text-secondary font-semibold">Phù hợp với hồ sơ của bạn ·</span>
                  </span>
                  <span className="text-primary font-semibold">85% Match</span>
                  <span className="text-[10px] font-label-md bg-primary/10 text-primary px-1.5 rounded-full">Top 5% Ứng viên</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface hover:text-secondary hover:bg-surface-container-low/50 transition-colors" aria-label="Bookmark">
                  <span className="material-symbols-outlined text-[20px]" data-icon="bookmark">bookmark</span>
                </button>
                <button className="flex items-center gap-2 p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface hover:text-secondary hover:bg-surface-container-low/50 transition-colors" aria-label="Share">
                  <span className="material-symbols-outlined text-[20px]" data-icon="share">share</span>
                </button>
                <button className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-semibold transition-colors hover:bg-primary/90 shadow-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" data-icon="send">send</span>
                  <span>Ứng tuyển ngay</span>
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="insights">insights</span>
                <h2 className="text-label-lg font-label-lg font-bold text-on-surface">Vì sao công việc này phù hợp với bạn?</h2>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant mb-3">Phân tích thuật toán CareerMatch AI & Hồ sơ của Nguyễn Minh Anh</p>
              <div className="flex items-start gap-3 mb-4">
                <span className="material-symbols-outlined text-[16px] text-outline" data-icon="schedule">schedule</span>
                <span className="text-[11px] font-label-md text-outline">Thuật toán đối soát v3.4</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-secondary" data-icon="check_circle">check_circle</span>
                  <div>
                    <p className="text-label-sm font-label-sm font-semibold text-on-surface">Điểm mạnh trong hồ sơ của bạn</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">CV của bạn có độ tương thích cao với 4 kỹ năng cốt lõi được NT tuyển dụng yêu cầu:</p>
                    <ul className="mt-2 space-y-1 text-body-sm font-body-sm text-on-surface-variant list-disc pl-5">
                      <li>JavaScript (ES6+)</li>
                      <li>ReactJS</li>
                      <li>HTML5/CSS3</li>
                      <li>Git & GitHub</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-secondary" data-icon="tips_and_updates">tips_and_updates</span>
                  <div>
                    <p className="text-label-sm font-label-sm font-semibold text-on-surface">Kỹ năng gợi ý nên cải thiện</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">Bổ sung các từ khóa & mini project này vào CV để tăng tỷ lệ được duyệt lên 95%:</p>
                    <ul className="mt-2 space-y-1 text-body-sm font-body-sm text-on-surface-variant list-disc pl-5">
                      <li>RESTful API integration</li>
                      <li>State Mgmt (Redux/Zustand)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/50 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary" data-icon="lightbulb">lightbulb</span>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Minh bạch AI:</span> Điểm số và phân tích được AI CareerMatch đối chiếu tự động giữa CV đã tải lên của bạn và bản mô tả công việc của nhà tuyển dụng. Đây là gợi ý hỗ trợ tham khảo; ứng viên hoàn toàn tự quyết định việc ứng tuyển.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="description">description</span>
                <h2 className="text-label-lg font-label-lg font-bold text-on-surface">Mô tả công việc (Job Description)</h2>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">Tại NovaTech Solutions, chúng tôi chào đón các bạn sinh viên nhiệt huyết với lập trình giao diện tham gia trực tiếp vào đội ngũ phát triển sản phẩm SaaS:</p>
              <ul className="space-y-3 text-body-sm font-body-sm text-on-surface-variant list-disc pl-6">
                <li>Tham gia phát triển và tối ưu hóa giao diện ứng dụng web hiện đại sử dụng <span className="font-semibold text-on-surface">ReactJS, TypeScript</span> và hệ thống style <span className="font-semibold text-on-surface">TailwindCSS</span>.</li>
                <li>Phối hợp chặt chẽ cùng <span className="font-semibold text-on-surface">UI/UX Designer</span> (Figma handoff) và Backend team để tích hợp các <span className="font-semibold text-on-surface">RESTful API</span> bảo mật.</li>
                <li>Đảm bảo giao diện đạt chuẩn <span className="font-semibold text-on-surface">responsive</span>, tương thích mượt mà trên mọi kích thước màn hình desktop, tablet và mobile browsers.</li>
                <li>Tham gia đóng góp ý tưởng cải thiện trải nghiệm người dùng (UX) và quy trình làm việc theo mô hình <span className="font-semibold text-on-surface">Agile/Scrum</span> chuyên nghiệp.</li>
              </ul>
              <div className="mt-6 pt-6 border-t border-outline-variant/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="assignment_ind">assignment_ind</span>
                  <h2 className="text-label-lg font-label-lg font-bold text-on-surface">Yêu cầu ứng viên</h2>
                </div>
                <ul className="space-y-2 text-body-sm font-body-sm text-on-surface-variant list-disc pl-6">
                  <li><span className="material-symbols-outlined text-[16px] text-secondary inline" data-icon="check_circle">check_circle</span> Sinh viên năm 3, năm 4 hoặc mới tốt nghiệp chuyên ngành <span className="font-semibold text-on-surface">CNTT, Khoa học Máy tính, Kỹ thuật Phần mềm</span> hoặc các ngành liên quan.</li>
                  <li><span className="material-symbols-outlined text-[16px] text-secondary inline" data-icon="check_circle">check_circle</span> Nắm vững kiến thức nền tảng vững chắc về <span className="font-semibold text-on-surface">HTML5, CSS3, JavaScript (ES6+)</span> và đã từng thực hành làm project cá nhân/môn học với <span className="font-semibold text-on-surface">ReactJS</span>.</li>
                  <li><span className="material-symbols-outlined text-[16px] text-secondary inline" data-icon="check_circle">check_circle</span> Biết sử dụng <span className="font-semibold text-on-surface">Git</span> cơ bản (commit, push, branch, pull request) để quản lý mã nguồn dự án.</li>
                  <li><span className="material-symbols-outlined text-[16px] text-secondary inline" data-icon="check_circle">check_circle</span> Tinh thần học hỏi cao, chủ động đặt câu hỏi, có trách nhiệm với nhiệm vụ được giao và có định hướng phát triển lâu dài trong mảng Frontend Engineering.</li>
                </ul>
                <p className="mt-3 text-body-sm font-body-sm text-on-surface-variant">Từ khóa công nghệ & Kỹ năng liên quan:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-surface-container-low border border-outline-variant rounded text-label-xs font-label-xs text-on-surface-variant">ReactJS</span>
                  <span className="px-2 py-1 bg-surface-container-low border border-outline-variant rounded text-label-xs font-label-xs text-on-surface-variant">JavaScript ES6</span>
                  <span className="px-2 py-1 bg-surface-container-low border border-outline-variant rounded text-label-xs font-label-xs text-on-surface-variant">TailwindCSS</span>
                  <span className="px-2 py-1 bg-surface-container-low border border-outline-variant rounded text-label-xs font-label-xs text-on-surface-variant">RESTful API</span>
                  <span className="px-2 py-1 bg-surface-container-low border border-outline-variant rounded text-label-xs font-label-xs text-on-surface-variant">Git</span>
                  <span className="px-2 py-1 bg-surface-container-low border border-outline-variant rounded text-label-xs font-label-xs text-on-surface-variant">Agile/Scrum</span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="card_giftcard">card_giftcard</span>
                <h2 className="text-label-lg font-label-lg font-bold text-on-surface">Quyền lợi dành cho bạn</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="paid">paid</span>
                  <div>
                    <h3 className="text-label-md font-label-md font-bold text-on-surface">Trợ cấp thực tập cạnh tranh</h3>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">3.000.000 - 5.000.000 đ/tháng + Phụ cấp gửi xe, cơm trưa tại công ty.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="supervisor_account">supervisor_account</span>
                  <div>
                    <h3 className="text-label-md font-label-md font-bold text-on-surface">Senior Mentor 1-on-1</h3>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">Được kèm cặp trực tiếp, review code định kỳ và hỗ trợ lộ trình nghề nghiệp.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="laptop_mac">laptop_mac</span>
                  <div>
                    <h3 className="text-label-md font-label-md font-bold text-on-surface">Trang thiết bị hiện đại</h3>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">Cấp máy tính cấu hình cao và màn hình ngoài tại văn phòng TechHub Cầu Giấy.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="trending_up">trending_up</span>
                  <div>
                    <h3 className="text-label-md font-label-md font-bold text-on-surface">Cơ hội lên Full-time Junior</h3>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">Đánh giá chuyển tiếp ký hợp đồng chính thức sau 3 đến 6 tháng thực tập.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/50 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary" data-icon="celebration">celebration</span>
                <p className="text-body-sm font-body-sm text-on-surface-variant">Tham gia teambuilding, happy hour thứ sáu, sinh nhật và các câu lạc bộ thể thao năng động của công ty.</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="domain">domain</span>
                <h2 className="text-label-lg font-label-lg font-bold text-on-surface">Về công ty NovaTech Solutions</h2>
              </div>
              <a className="flex items-center gap-2 text-label-sm font-label-sm text-secondary hover:text-primary transition-colors mb-4">
                <span className="material-symbols-outlined text-[18px] text-outline" data-icon="open_in_new">open_in_new</span>
                <span>Xem trang công ty</span>
              </a>
              <p className="text-body-sm font-body-sm text-on-surface-variant mb-3">NovaTech Solutions là doanh nghiệp công nghệ tiên phong tại Việt Nam, chuyên sâu trong việc xây dựng hệ sinh thái giải pháp <span className="font-semibold text-on-surface">Fintech & Enterprise SaaS</span> phục vụ các tổ chức tài chính và ngân hàng hàng đầu khu vực.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline" data-icon="groups">groups</span>
                  <span>Quy mô: 100 - 250 nhân sự</span>
                </div>
                <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline" data-icon="location_city">location_city</span>
                  <span>Tầng 8, Tòa TechHub, Cầu Giấy</span>
                </div>
                <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline" data-icon="verified_user">verified_user</span>
                  <span>Top 50 Best IT Workplace VN</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="calendar_clock">calendar_clock</span>
              <h2 className="text-label-lg font-label-lg font-bold text-on-surface">Tổng quan công việc</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-[20px] text-outline" data-icon="calendar_clock">calendar_clock</span>
                <div>
                  <p className="text-[10px] font-label-md text-outline uppercase tracking-wider">Hạn ứng tuyển</p>
                  <p className="text-label-sm font-label-md text-on-surface">30/11/2026</p>
                  <p className="text-[10px] font-label-md text-secondary">Còn 8 ngày</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-[20px] text-outline" data-icon="stairs">stairs</span>
                <div>
                  <p className="text-[10px] font-label-md text-outline uppercase tracking-wider">Cấp bậc</p>
                  <p className="text-label-sm font-label-md text-on-surface">Thực tập sinh (Intern)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-[20px] text-outline" data-icon="person_add">person_add</span>
                <div>
                  <p className="text-[10px] font-label-md text-outline uppercase tracking-wider">Số lượng tuyển</p>
                  <p className="text-label-sm font-label-md text-on-surface">03 người</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-[20px] text-outline" data-icon="apartment">apartment</span>
                <div>
                  <p className="text-[10px] font-label-md text-outline uppercase tracking-wider">Hình thức</p>
                  <p className="text-label-sm font-label-md text-on-surface">Hybrid (3 VP / 2 Remote)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-[20px] text-outline" data-icon="history_edu">history_edu</span>
                <div>
                  <p className="text-[10px] font-label-md text-outline uppercase tracking-wider">Kinh nghiệm</p>
                  <p className="text-label-sm font-label-md text-on-surface">Không yêu cầu (SV)</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full px-4 py-3 bg-primary text-on-primary rounded-lg font-semibold transition-colors hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]" data-icon="task_alt">task_alt</span>
                <span>Ứng tuyển bằng hồ sơ đã duyệt</span>
              </button>
              <p className="mt-2 text-body-sm font-body-sm text-on-surface-variant">CV dùng để nộp: <span className="font-semibold text-on-surface">CV_NguyenMinhAnh_Frontend.pdf</span></p>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="auto_awesome">auto_awesome</span>
              <h2 className="text-label-lg font-label-lg font-bold text-on-surface">Việc làm tương tự</h2>
              <p className="text-[10px] font-label-md text-outline uppercase tracking-wider ml-1">AI gợi ý</p>
            </div>
            <div className="space-y-3">
              <a className="flex items-center gap-4 p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:bg-surface-container-low/50 transition-colors" href="/05_job_detail.html?id=2">
                <div className="flex-1">
                  <h3 className="text-label-md font-label-md font-bold text-on-surface">Thực tập sinh ReactJS</h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">BlueWave Digital • Hà Nội</p>
                </div>
                <div className="text-right">
                  <p className="text-label-md font-label-md font-bold text-primary">82% Match</p>
                  <p className="text-[10px] font-label-md text-outline">4.000.000 - 6.000.000 đ • On-site</p>
                </div>
              </a>
              <a className="flex items-center gap-4 p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:bg-surface-container-low/50 transition-colors" href="/05_job_detail.html?id=3">
                <div className="flex-1">
                  <h3 className="text-label-md font-label-md font-bold text-on-surface">Junior Web Developer</h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">PixelWorks Studio • Toàn quốc</p>
                </div>
                <div className="text-right">
                  <p className="text-label-md font-label-md font-bold text-primary">68% Match</p>
                  <p className="text-[10px] font-label-md text-outline">8.000.000 - 12.000.000 đ • Remote 100%</p>
                </div>
              </a>
              <a className="text-label-sm font-label-sm text-primary hover:text-secondary transition-colors flex items-center gap-1 mt-2" href="/04_job_search.html">
                <span>Xem thêm 10+ việc làm tương tự</span>
                <span className="material-symbols-outlined text-[16px] text-outline" data-icon="arrow_forward">arrow_forward</span>
              </a>
            </div>
          </section>

          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="school">school</span>
              <h2 className="text-label-lg font-label-lg font-bold text-on-surface">Góc chuẩn bị cùng AI Coach</h2>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-3">
              <span className="font-semibold text-on-surface">💡 Bí quyết ứng tuyển vị trí này:</span> NovaTech Solutions rất chú trọng tư duy Component và cách quản lý trạng thái. Hãy đính kèm link <span className="font-semibold text-on-surface">GitHub repository</span> của ít nhất một ứng dụng React cá nhân và ôn lại kỹ các hooks:
            </p>
            <div className="flex items-center gap-1 text-body-sm font-body-sm text-on-surface-variant">
              <span className="bg-surface-container-low px-1 rounded font-mono text-secondary">useEffect</span><span>,</span>
              <span className="bg-surface-container-low px-1 rounded font-mono text-secondary">useState</span><span>,</span>
              <span className="bg-surface-container-low px-1 rounded font-mono text-secondary">useCallback</span><span>.</span>
            </div>
            <a className="mt-3 text-label-sm font-label-sm text-primary hover:text-secondary transition-colors flex items-center gap-1" href="/06_cv_analysis.html">
              <span>Luyện câu hỏi phỏng vấn mô phỏng với AI</span>
              <span className="material-symbols-outlined text-[16px] text-outline" data-icon="chevron_right">chevron_right</span>
            </a>
          </section>
        </main>
      </div>
    </>
  );
}
