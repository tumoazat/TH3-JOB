# Design Spec: AI Matching + BI Dashboard (TH3-X)

**Project:** CareerMatch AI — Hệ thống Tìm việc Thông minh tích hợp AI và BI  
**Date:** 2026-10-28  
**Status:** Revised v9 (chờ duyệt)  
**Repo:** https://github.com/tumoazat/TH3-JOB  
**Quyết định đã chốt:** Stack không đổi (React + Vite + Tailwind + Express + JSON DB), Bearer JWT HS256 (chỉ server ký), schema rõ ràng 6 collection chính, công thức BI dựa trên trạng thái hiện tại, heuristic matching (không ML), không tự tạo mật khẩu/tài khoản giả trong migration.

---

## 1. Mục tiêu và tiêu chí thành công

Mở rộng dự án hiện có để đáp ứng checklist TH3:

1. **CSDL 3 thực thể chính:** Ứng viên, Nhà tuyển dụng, Tin tuyển dụng (schema rõ ràng, tương thích dữ liệu mẫu hiện có, có kế hoạch migration an toàn).
2. **Mô hình AI match:** Tính điểm tương thích CV ↔ JD (heuristic-based trong Node.js, thang 0–100, trích xuất văn bản từ PDF, phân biệt điểm thấp với không đủ dữ liệu).
3. **Dashboard BI:** Trực quan hóa ứng viên theo kỹ năng, phân bố mức lương, tỷ lệ phân bố trạng thái đơn hiện tại (không tuyên bố là funnel lịch sử nếu không có dữ liệu lịch sử).
4. **API AI/BI:** Các endpoint mới tích hợp vào frontend hiện có, bảo vệ bằng xác thực và kiểm tra quyền sở hữu.
5. **Kiểm thử & báo cáo:** Chạy thử với dữ liệu mẫu + báo cáo đánh giá mô hình gợi ý (rõ ràng giới hạn dữ liệu demo).
6. **Bảo mật:** Xác thực thực sự (Bearer JWT), phân quyền theo role và sở hữu tài nguyên, bảo vệ PII.

---

## 2. Trạng thái hiện tại (baseline)

- Frontend: `src/` — 13 trang (landing, dashboard, job search/detail, CV analysis, matched jobs, application tracker, profile, employer dashboard, post job, candidate management, design system). Routing qua `react-router-dom` trong `src/main.tsx`.
- Backend: `server/index.ts` — Express + CORS, JSON file DB tại `server/data/db.json`. Endpoints: `/api/jobs`, `/api/applications`, `/api/saved`, `/api/profile`, `/api/employer`, `/api/candidates`.
- Store: `window.VL` bị inject trong `src/main.tsx` đồng bộ từ API khi mount.
- **Chưa có xác thực danh tính thực tế:** role chỉ là trường giả định trong JSON, không có login/session/token.

---

## 3. Kiến trúc

```
┌──────────────┐      HTTP + Bearer JWT      ┌─────────────────────┐
│ React SPA    │◄───────────────────────────►│ Express (port 5000) │
│ (Vite, port  │                             │                     │
│  5173)       │                             │ server/index.ts     │
└──────────────┘                             │ - GET/POST /api/*   │
                                             │ - readDB/writeDB    │
                                             │ - auth middleware   │
                                             │ - ghi tuần tự (lock)│
                                             └──────────┬──────────┘
                                                        │
                                                        ▼
                                                 server/data/db.json
```

- Một server Express chạy cổng 5000; frontend gọi `API_BASE = 'http://localhost:5000/api'`.
- Không thêm framework/ngôn ngữ mới. AI = heuristic deterministic trong Node (stdlib + `pdf-parse`). BI = aggregation trên cùng JSON DB.
- Thêm 2 route frontend (`/ai-match.html`, `/bi-dashboard.html`) + cập nhật trang dashboard nhà tuyển dụng.
- **Auth:** Bearer JWT do server ký, secret từ biến môi trường `JWT_SECRET`, lưu trong `localStorage`, gửi qua header `Authorization: Bearer <token>`. Không dùng session/cookie. Không trộn lẫn.
- **Ghi JSON DB tuần tự:** vì JSON DB không hỗ trợ transaction, backend sử dụng khóa ghi đơn giản (in-memory mutex) để tránh ghi đè khi nhiều request đồng thời. **Mutex phải bao trùm toàn bộ thao tác đọc–kiểm tra–thay đổi–ghi đối với mỗi nghiệp vụ cập nhật, không chỉ riêng lệnh ghi file.** Mọi endpoint có thay đổi dữ liệu phải dùng chung một hàng đợi khóa. Quy trình cập nhật:
  1. Chờ lấy khóa.
  2. Đọc trạng thái DB mới nhất.
  3. Kiểm tra quyền sở hữu, khóa ngoại và điều kiện nghiệp vụ.
  4. Thực hiện thay đổi trên dữ liệu trong bộ nhớ.
  5. Ghi ra file tạm trong cùng hệ thống tệp, sau đó thay thế file chính an toàn.
  6. Giải phóng khóa trong `finally`, kể cả khi có lỗi.
  Các lỗi ghi file phải được trả về theo cấu trúc lỗi thống nhất. Không báo cập nhật thành công nếu dữ liệu chưa được ghi thành công. Phạm vi hỗ trợ chỉ là một tiến trình backend; không tuyên bố mutex này bảo vệ được nhiều instance hoặc nhiều tiến trình cùng sửa DB.

---

## 4. Mô hình dữ liệu (`server/data/db.json`)

Schema formalized (additive, backward compatible). **Trước khi triển khai phải kiểm tra dữ liệu mẫu hiện có tương thích schema này hay không (xem mục Migration).**

```json
{
  "users": [ { id, email, passwordHash, role: "student" | "employer" | "admin", createdAt, isActive: boolean } ],
  "employers": [ { id, userId, company, email, industry, size } ],
  "jobs": [ { id, employerId, company, title, location, type, salary, tags[], description, requirements, benefits[], deadline, status, posted } ],
  "candidates": [ { id, userId, name, university, skills[], gpa, graduationYear, cvFileName, email, phone, bio, cvText } ],
  "applications": [ { id, jobId, candidateId, employerId, status, appliedDate, note, matchScore } ],
  "savedJobs": [ { candidateId, jobId[] } ],
  "profile": { ... }
}
```

### Quy ước role và ID (đã chốt)

- `users.role` là **vai trò tài khoản duy nhất**: `student`, `employer`, `admin`. Đây là nguồn sự thật duy nhất cho phân quyền.
- `candidates.role` và `employers.role` **bỏ qua / không dùng** để phân quyền, tránh trùng thông tin với `users.role`.
- `userId` = id trong bảng `users` (tài khoản đã xác thực).
- `candidateId` = id trong bảng `candidates` (hồ sơ ứng viên). Tra cứu: `candidates.find(c => c.userId === req.user.userId)`.
- `employerId` = id trong bảng `employers` (hồ sơ nhà tuyển dụng). Tra cứu: `employers.find(e => e.userId === req.user.userId)`.
- Ánh xạ từ tài khoản đã xác thực: `req.user.userId` → tra cứu `candidates` (nếu role student) hoặc `employers` (nếu role employer) để lấy `candidateId` / `employerId` tương ứng.
- **Admin:** không có hồ sơ `candidates` hoặc `employers`; tài khoản admin chỉ được xác thực qua `users` và không cần ánh xạ sang bảng hồ sơ ứng viên/nhà tuyển dụng.

### Số collection chính (đã chốt)

- **Đối tượng nghiệp vụ chính (6 collection):** `users`, `employers`, `jobs`, `candidates`, `applications`, `savedJobs`.
- **Đối tượng cấu hình/trợ助:** `profile`.
- Không tự ý thêm hệ thống phức tạp không cần thiết.

### Quan hệ (ERD)

- `users` 1→1 `employers` hoặc `candidates` qua `userId` (một tài khoản là nhà tuyển dụng hoặc ứng viên; admin không thuộc cả hai).
- `employer` 1→N `jobs` qua `employerId`.
- `candidate` 1→N `applications` qua `candidateId`.
- `job` 1→N `applications` qua `jobId`.
- `application` liên kết `candidate` + `job` + `employer` (để tra cứu nhanh).
- `savedJobs` liên kết `candidateId` với mảng `jobId[]` đã lưu (mỗi `candidateId` chỉ xem được danh sách của mình).

### Tương thích dữ liệu mẫu hiện có (đã chốt, cần kiểm tra trước migration)

- **Kiểm tra trước migration:** kiểm tra `postedJobs`, `applications`, `savedJobs`, `profile` và toàn bộ dữ liệu mẫu hiện có trước khi thay đổi schema.
- `savedJobs` hiện là mảng số `[jobId]` chưa gắn `candidateId`. **Quyết định:** chuyển đổi sang `{ candidateId, jobId[] }`; nếu không xác định được chủ sở hữu dữ liệu cũ, **không tự gán dữ liệu cho người dùng** — đánh dấu là "chưa xác định chủ sở hữu" để xử lý sau, không bị khoá/lẫn dữ liệu của người khác. Dữ liệu chưa xác định chủ sở hữu được cách ly ở một vùng riêng, không đưa vào danh sách của bất kỳ người dùng nào, chờ xác minh thủ công.
- `postedJobs` hiện có — giữ lại, ánh xạ sang `jobs` khi cần.
- `applications` hiện có — bổ sung `employerId`, `matchScore`.
- `profile` hiện có — giữ nguyên.

### Ràng buộc toàn vẹn (đã chốt)

- Khóa tham chiếu: `jobs.employerId` phải tồn tại trong `employers.id`; `applications.jobId` phải tồn tại trong `jobs.id`; `applications.candidateId` phải tồn tại trong `candidates.id`; `applications.employerId` phải tồn tại trong `employers.id`; `savedJobs.candidateId` phải tồn tại trong `candidates.id`; `savedJobs.jobId[]` mỗi phần tử phải tồn tại trong `jobs.id`.
- **Chuyển đổi ID nhất quán:** tất cả ID trong schema mới là chuỗi string. Trong migration, chuyển đổi ID và khóa ngoại từ số sang chuỗi, kiểm tra trùng ID và liên kết sau khi chuyển đổi.
- Kiểm tra ID tồn tại trước khi ghi; chống dữ liệu trùng (một ứng viên không được apply cùng một job hai lần, một job không được đăng trùng theo `employerId + title + deadline`).
- Quy tắc cập nhật: chỉ chủ sở hữu hoặc admin được cập nhật/xóa bản ghi liên quan; cập nhật phải đi kèm kiểm tra quyền tại backend.
- `applications.employerId` phải luôn khớp với `jobs.employerId`: backend lấy chủ sở hữu từ bản ghi `job`, **không tin `employerId` do client gửi**.

### Kế hoạch migration (đã chốt)

1. Sao lưu `server/data/db.json` trước khi thay đổi (file `.bak` có timestamp).
2. Kiểm tra dữ liệu thực trước khi quyết định: nếu có email và thông tin người dùng đủ tin cậy, tạo tài khoản theo quy trình được phê duyệt; **không tự sinh mật khẩu mặc định hoặc hash một mật khẩu mà người dùng không biết**; nếu không xác định được chủ sở hữu hồ sơ, đánh dấu cần xử lý thay vì gán bừa.
3. **Quy tắc cách ly bản ghi không thể liên kết:**
   - Chỉ đưa bản ghi vào collection chính khi các quan hệ khóa ngoại đã được xác minh (`jobs.employerId` tồn tại trong `employers`, `applications.candidateId` tồn tại trong `candidates`, `jobs.employerId` có hồ sơ `employers` tương ứng, v.v.).
   - Bản ghi không xác định được chủ sở hữu hoặc có khóa ngoại không hợp lệ **phải được cách ly** để xử lý thủ công, không tự gán chủ sở hữu và **không xóa âm thầm**.
   - Báo cáo migration phải đối chiếu: **bản ghi hợp lệ sau migration + bản ghi cách ly = tổng bản ghi nguồn** (có xem xét các phép chuyển đổi hoặc gộp trùng đã được phê duyệt).
   - Nếu không bảo đảm được toàn vẹn dữ liệu, migration phải dừng và giữ nguyên bản sao lưu.
4. Chạy script migration one-time: tạo bảng `users`, `employers`, `candidates` từ dữ liệu hiện có; backfill `savedJobs` với `candidateId` hoặc đánh dấu chưa xác định chủ sở hữu.
5. Kiểm tra sau migration: tổng số bản ghi khớp trước/sau; không có `jobId` trong `savedJobs` bị bỏ dang; mỗi `application` có `employerId` khớp với `jobs.employerId`; không có ID trùng.
6. Khả năng khôi phục: nếu migration thất bại, revert về file `.bak` và dừng triển khai.

### Quy trình tạo tài khoản và kích hoạt ban đầu (đã chốt)

- Nếu dữ liệu cũ chỉ có hồ sơ mà chưa có tài khoản hợp lệ, người dùng **không thể đăng nhập ngay** cho đến khi có tài khoản.
- Quy trình: đăng ký tài khoản mới qua `/api/auth/register` (hoặc trang đăng ký frontend), kích hoạt qua email (nếu có hệ thống email) hoặc tạo tài khoản quản trị ban đầu bằng quy trình thiết lập an toàn (admin setup).
- Hồ sơ cũ chưa xác định chủ sở hữu phải chờ xác minh, **không tự ghép tài khoản theo tên**.
- **isActive:** mặc định `true` sau khi đăng ký thành công và xác minh (nếu có). Tài khoản chỉ được phép đăng nhập khi `isActive === true`.
- **Tài khoản admin ban đầu:** chỉ được tạo qua script thiết lập riêng, chỉ chạy theo hướng dẫn quản trị, **không phải endpoint công khai**, **không có mật khẩu mặc định**.
- **Đăng ký tính nguyên tử và chính sách kích hoạt (đã chốt):**
  - Email phải được chuẩn hóa nhất quán (trim và chuyển về chữ thường) trước khi kiểm tra trùng và đăng nhập.
  - Việc tạo `users` và hồ sơ `candidates`/`employers` phải là một thao tác logic thống nhất: nếu một bước thất bại thì rollback, hoặc tài khoản phải ở trạng thái chưa thể đăng nhập cho đến khi hoàn tất.
  - **Chỉ cấp token sau khi toàn bộ điều kiện đăng ký thành công được đáp ứng.**
  - **Chính sách kích hoạt tài khoản cho bản demo:** Do chưa triển khai email verification, tài khoản student và employer được kích hoạt ngay sau khi đăng ký thành công. Backend chỉ cấp JWT sau khi `users` và hồ sơ tương ứng đã được ghi thành công trong cùng một nghiệp vụ có khóa. Nếu nghiệp vụ thất bại, phải rollback hoặc đảm bảo tài khoản chưa thể đăng nhập cho đến khi hoàn tất. Chính sách này **không áp dụng cho tài khoản admin**; admin được tạo bằng quy trình thiết lập riêng.
  - Tài khoản mới đăng ký thành công: `isActive = true`.
  - Tài khoản admin được tạo qua script thiết lập: phải thiết lập trạng thái kích hoạt rõ ràng.
  - Tài khoản được chuyển đổi hoặc tạo từ dữ liệu cũ: phải có chính sách kích hoạt cụ thể; **không mặc định cho phép đăng nhập chỉ vì bản ghi tồn tại**.
  - Middleware luôn kiểm tra `isActive === true`; giá trị thiếu hoặc không hợp lệ đều không được xác thực.
  - Nếu nhóm muốn có email verification thực sự thì phải đặc tả thêm luồng xác minh, token xác minh, thời hạn và cách gửi email. Với đồ án hiện tại, phương án kích hoạt ngay sẽ đơn giản hơn.
  - Với JSON DB, cần áp dụng chung mutex đã nêu ở mục 3.

---

## 5. Xác thực & phân quyền (đã chốt)

- **Xác thực:** chỉ dùng **Bearer JWT do server ký**. Không dùng session/cookie, không trộn lẫn.
  - `POST /api/auth/register` (công khai): nhận `{ email, password, role }`. **Chỉ chấp nhận role `student` hoặc `employer`.** Không bao giờ tin role do client gửi nếu giá trị không nằm trong danh sách cho phép. Tài khoản admin chỉ được tạo qua quy trình thiết lập riêng, có kiểm soát. Email phải kiểm tra trùng (sau khi chuẩn hóa: trim và chuyển chữ thường); mật khẩu cần có chính sách độ dài tối thiểu và xác thực đầu vào. Đăng ký công khai **không được tạo tài khoản admin**.
  - `POST /api/auth/login` nhận `{ email, password }`, tra cứu `users` (email đã chuẩn hóa), verify `passwordHash` (mã hóa bằng thư viện `bcryptjs` tương đương, không lưu mật khẩu rõ). Có giới hạn số lần đăng nhập sai theo IP và/hoặc tài khoản, phản hồi lỗi không tiết lộ email có tồn tại hay không.
  - Server ký JWT với thuật toán `HS256`, khóa lấy từ biến môi trường `JWT_SECRET` (**bắt buộc thiết lập**; nếu `JWT_SECRET` chưa cấu hình, server phải dừng khởi động với thông báo rõ ràng, không tự dùng secret mặc định), thời hạn token `24h`, payload chứa `userId`, `email`, `role`, `exp`. Trường `role` trong payload chỉ giữ để tiện nhận diện, phải đối chiếu với DB; không sử dụng role trong JWT làm nguồn sự thật cuối cùng cho phân quyền.
  - Phản hồi login: `{ user: { id, email, role }, token }`. **Không trả `passwordHash` hoặc secret token trong phản hồi/log.**
  - Frontend lưu `token` vào `localStorage`, gửi kèm header `Authorization: Bearer <token>` trên mọi yêu cầu cần xác thực. **Giới hạn:** localStorage có rủi ro XSS; tránh render HTML không an toàn và không lưu token trong log.
  - **Xử lý tài khoản bị vô hiệu hóa hoặc đổi role khi token còn hạn:** backend kiểm tra `users[userId].isActive` và `users[userId].role` tại mỗi yêu cầu cần phân quyền (không tin token role là bất biến). Nếu tài khoản bị vô hiệu hóa hoặc role đã đổi → trả về `401` hoặc `403`, yêu cầu đăng nhập lại.
- **Xử lý lỗi xác thực:**
  - Token sai chữ ký / hết hạn / malformed → `401 Unauthorized`, không rò rãi chi tiết nội bộ.
  - Token hết hạn → frontend xóa `localStorage` token, chuyển hướng trang đăng nhập, cho phép đăng nhập lại.
- **Middleware (đã chốt):**
  - `requireAuth`: xác minh chữ ký, thuật toán và thời hạn JWT; lấy `userId` từ payload đã xác minh; tra cứu tài khoản hiện tại trong `users`; kiểm tra `isActive === true`; gán `req.user` từ dữ liệu tài khoản hiện tại trong DB (đặc biệt là `role`). **Không sử dụng role trong JWT làm nguồn sự thật cuối cùng cho phân quyền.**
  - `requireRole(roles)`: kiểm tra `req.user.role` đã được đối chiếu từ DB.
- **API công khai vs yêu cầu xác thực (đã chốt):**
  - Công khai: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/jobs` (xem công việc công khai, chỉ trả những tin được phép hiển thị công khai, chưa hết hạn và có trạng thái phù hợp; không chỉ ẩn tin hết hạn ở frontend).
  - Bắt buộc xác thực: tất cả endpoint còn lại, bao gồm `GET /api/auth/me` (bắt buộc có token hợp lệ; không có token trả `401`).
  - Các endpoint cũ được rà soát lại quyền truy cập (**điều kiện bắt buộc trước khi nghiệm thu**); không cho phép sửa dữ liệu mà không kiểm tra quyền sở hữu.
- **Phân quyền theo role VÀ quyền sở hữu tài nguyên (backend kiểm tra, không chỉ ẩn giao diện):**
  - Quy tắc nghiệp vụ nhất quán (đã chốt):
    - **Sinh viên:** chỉ thao tác trên hồ sơ của chính mình; xem các công việc đang mở và còn hạn.
    - **Nhà tuyển dụng:** chỉ thao tác trên tin của mình; chỉ xem CV đầy đủ của ứng viên đã ứng tuyển vào tin thuộc quyền sở hữu của họ.
    - **Admin:** có quyền quản trị theo quy định, nhưng mọi truy cập dữ liệu nhạy cảm vẫn cần được kiểm soát và ghi log phù hợp; PII mặc định bị mask (xem mục PII).
  - Ứng viên (`student`): chỉ truy cập hồ sơ, CV, danh sách tin đã lưu, đơn ứng tuyển của chính mình.
  - Nhà tuyển dụng (`employer`): chỉ thao tác trên công việc thuộc quyền sở hữu (`jobs.employerId` phải bằng `employer.id` được tra cứu từ `employers` qua `req.user.userId`, **không so sánh trực tiếp `req.user.userId` với `jobs.employerId`**); chỉ xem thông tin ứng viên theo điều kiện truy cập được quy định (xem mục PII).
  - Admin: xem thống kê toàn hệ thống nếu nghiệp vụ quy định như vậy; PII vẫn bị mask theo mặc định (trừ khi có quy định riêng kèm audit log).
- **Quyyền truy cập `/api/match` theo từng role (đã chốt):**
  - `student`: chỉ được match hồ sơ ứng viên gắn với `req.user.userId` của mình với tin tuyển dụng công khai, đang mở và chưa hết hạn.
  - `employer`: chỉ được match ứng viên đã ứng tuyển vào tin tuyển dụng thuộc quyền sở hữu của nhà tuyển dụng đang đăng nhập. `employerId` phải được tra cứu từ tài khoản và đối chiếu với chủ sở hữu của bản ghi `jobs`.
  - Không sử dụng `candidateId`, `employerId` hoặc `role` do client gửi để xác định quyền sở hữu.
  - `admin`: chỉ được sử dụng matching nếu nghiệp vụ thực sự yêu cầu; không tự động cấp quyền truy cập CV đầy đủ hoặc PII chỉ vì tài khoản có role `admin`.
  - ID không tồn tại trả `404`; tài nguyên tồn tại nhưng người dùng không được phép truy cập trả `403` theo quy ước API.
- **API `/api/match/all`:** phải xác minh `candidateId` thuộc tài khoản hiện tại (`candidates.find(c => c.id === candidateId && c.userId === req.user.userId)`), cả hai giá trị ID phải cùng kiểu dữ liệu (chuỗi) trước khi so sánh.
- **API ứng tuyển:** kiểm tra quyền ngay tại backend, lấy `candidateId` từ tài khoản đăng nhập và `employerId` từ tin tuyển dụng (lấy từ bản ghi `jobs`), **không tin các ID quyền sở hữu do frontend gửi lên**.
- **Bảo vệ PII:** `email`, `phone`, `cvFileName`, `cvText` chỉ hiển thị đầy đủ với (a) chủ sở hữu ứng viên, (b) nhà tuyển dụng đã có đơn ứng tuyển (`applications`) đối với ứng viên đó **và** đơn đó thuộc công việc của chính nhà tuyển dụng (`applications.employerId` khớp với `jobs.employerId`). Các trường khác bị mask (`****@****.com`, `09xx xxxx xx`). Admin cũng bị mask PII theo mặc định (trừ khi có quy định riêng kèm audit log). Không ghi log dữ liệu nhạy cảm.
- **Rate limit & giới hạn tài nguyên:** giới hạn số lần gọi `/api/cv/extract` và `/api/match` mỗi IP; giới hạn số lần đăng nhập sai tại `/api/auth/login` theo IP và/hoặc tài khoản, phản hồi lỗi không tiết lộ email có tồn tại hay không; giới hạn dung lượng file upload (xem mục 7).
- **Rà soát API cũ và PII (điều kiện bắt buộc trước khi nghiệm thu):** Kiểm tra tất cả endpoint đọc, tạo, sửa và xóa dữ liệu. Kiểm tra việc trả về `cvText`, `cvFileName`, `email` và số điện thoại ở từng endpoint, không chỉ `/api/candidates/:id`. Mọi endpoint ghi dữ liệu phải xác thực và kiểm tra quyền sở hữu ở backend. Chỉ trả các trường được phép theo role và quan hệ sở hữu; không trả nguyên bản ghi DB rồi trông chờ frontend tự ẩn PII. Kiểm thử bằng ít nhất hai tài khoản sinh viên và hai tài khoản nhà tuyển dụng khác nhau, bao gồm trường hợp sửa ID trong request. Nếu một API cũ chưa được bảo vệ hoặc chưa thể xác minh an toàn, phải chặn truy cập hoặc sửa trước khi nghiệm thu.
- **Đăng xuất (frontend):** xóa token khỏi `localStorage` và trạng thái người dùng trên giao diện. Nếu không triển khai cơ chế thu hồi token ở server, ghi rõ token đã phát hành vẫn có thể hợp lệ cho đến khi hết hạn hoặc tài khoản bị vô hiệu hóa.

---

## 6. Mô hình AI Matching (`POST /api/match`)

**Phương pháp:** Keyword-overlap heuristic (rule-based) — stdlib + `pdf-parse` chỉ dùng để trích xuất PDF, không có thư viện ML. Đây là **rule-based matching**, không tuyên bố là mô hình ML đã huấn luyện. Quy tắc đếm từ khóa không đồng nghĩa với hiểu ngữ nghĩa.

**Đầu vào:** `candidate.skills[]`, `candidate.cvText` (từ PDF), `job.tags[]`, `job.description`, `job.requirements`.

**Lấy từ khóa JD (đã chốt):** từ khóa được lấy từ `job.tags`, `job.requirements`, `job.description`. Bỏ từ phổ biến (stopwords tiếng Việt/Anh), xử lý từ khóa trùng (loại bỏ bản sao), chuẩn hóa cụm nhiều từ trước khi so sánh.

**Quy tắc nhận diện từ khóa (đã chốt):**
- Chuẩn hóa chữ hoa/thường, dấu tiếng Việt, khoảng trắng và alias trước khi so sánh.
- Từ khóa đơn phải khớp theo ranh giới từ; không tính khớp chỉ vì nó là một phần tùy ý của từ khác.
- Cụm nhiều từ phải được so sánh như một cụm sau chuẩn hóa; quy định rõ cách xử lý dấu câu nằm giữa các từ.
- Mỗi kỹ năng hoặc từ khóa JD duy nhất chỉ được tính tối đa một lần, dù xuất hiện nhiều lần trong CV.
- `matchedSkills` và `missingSkills` lấy từ `candidate.skills` đối chiếu với `job.tags`; không suy diễn các trường này từ `cvText`.
- Nếu hai thành phần có kết quả mâu thuẫn, giữ riêng hai nguồn dữ liệu và giải thích nguồn nào tạo ra từng nhận xét.
- Không cần thêm thư viện NLP hoặc mô hình ML. Quy tắc khớp từ và cụm từ xác định là đủ cho phạm vi heuristic của đồ án.

**Điều kiện thành phần hợp lệ (đã chốt):**
- `skillScore` hợp lệ chỉ khi `job.tags` có dữ liệu **và** `candidate.skills` có dữ liệu. Nếu `job.tags` rỗng hoặc `candidate.skills` rỗng → `skillScore` không khả dụng.
- `keywordScore` hợp lệ chỉ khi `candidate.cvText` có nội dung hữu ích **và** JD có ít nhất một từ khóa hợp lệ sau khi chuẩn hóa và loại stopwords. Nếu `cvText` rỗng / không có / chỉ chứa khoảng trắng → `keywordScore` không khả dụng. Nếu CV có văn bản nhưng không chứa từ khóa JD → `keywordScore` tính được (có thể bằng 0), không phải "không đủ dữ liệu".
- Nếu JD không có `tags` nhưng có `requirements` hoặc `description`: `skillScore` không khả dụng, còn `keywordScore` vẫn có thể tính nếu trích xuất được từ khóa hợp lệ.

**Công thức thành phần Matching (đã chốt):**
- skillScore = số kỹ năng khớp giữa `candidate.skills` và `job.tags` / tổng số kỹ năng yêu cầu duy nhất trong `job.tags` (0–1).
- keywordScore = số từ khóa JD duy nhất được tìm thấy trong `candidate.cvText` / tổng số từ khóa JD duy nhất hợp lệ sau khi chuẩn hóa và loại stopwords (0–1).
- Kết quả mỗi điểm thành phần được giới hạn trong [0, 1]. Nếu mẫu số bằng 0 hoặc dữ liệu đầu vào không đáp ứng điều kiện hợp lệ đã quy định, thành phần đó là không khả dụng, **không tự gán bằng 0**.

**Thuật toán (đã chốt):**

1. **Trích xuất PDF:** `POST /api/cv/extract` nhận file PDF, dùng `pdf-parse` trích xuất văn bản thô → lưu vào `candidate.cvText`.
2. Chuẩn hóa văn bản: lowercase, trim, bỏ dấu tiếng Việt qua bảng ánh xạ đơn giản.
3. Chuẩn hóa kỹ năng: ánh xạ alias và cụm từ nhiều từ trước khi so sánh (ví dụ: "React JS" → "reactjs", "Node JS" → "nodejs", xóa ký tự đặc biệt). **Không để `React` tự động khớp `React Native` nếu không có quy tắc alias rõ ràng.**
4. Xử lý dữ liệu thiếu như mục trên.
5. **Chỉ tính điểm trên những thành phần có dữ liệu hợp lệ.** Nếu có ít nhất một thành phần tính được, chuẩn hóa lại trọng số của thành phần còn dùng được:
   - Có cả `skillScore` và `keywordScore`: `match = round((skillScore * 0.6 + keywordScore * 0.4) * 100)`.
   - Chỉ có `skillScore`: `match = round(skillScore * 100)`.
   - Chỉ có `keywordScore`: `match = round(keywordScore * 100)`.
   - Không có thành phần hợp lệ: `match = null`, `dataStatus = "insufficient"`.
6. Band (chỉ khi `match` không null): ≥90 "Rất khớp", 80–89 "Khớp tốt", 70–79 "Khớp tiềm năng", <70 "Cần bổ sung". Kiểm thử ranh giới: 0, 69, 70, 79, 80, 89, 90, 100.

**Xuất ra:** `{ jobId, match, band, reason: string[], matchedSkills[], missingSkills[], dataStatus }`.

- `dataStatus`: `"complete"` (có đủ dữ liệu), `"partial"` (chỉ tính được một thành phần), `"insufficient"` (không đủ dữ liệu).
- `reason`: liệt kê thực tế từ kết quả (ví dụ: "Khớp 3/5 kỹ năng yêu cầu: ReactJS, Node.js, PostgreSQL").
- `matchedSkills`: kỹ năng thực sự xuất hiện cả trong `candidate.skills` và `job.tags`.
- `missingSkills`: kỹ năng trong `job.tags` nhưng không có trong `candidate.skills` (chỉ diễn giải là kỹ năng không có trong hồ sơ ghi chép, không khẳng định ứng viên hoàn toàn không biết kỹ năng đó).
- **Ghi rõ:** `skillScore` dùng `candidate.skills`, còn `keywordScore` dùng `cvText`; hai nguồn này có thể khác nhau và cần xử lý khi dữ liệu mâu thuẫn (ưu tiên hiển thị cả hai nguồn riêng biệt, không hợp nhất thành một danh sách kỹ năng đơn).
- **Giao diện:** cần hiển thị `dataStatus` để người dùng phân biệt kết quả đầy đủ, một phần và không đủ dữ liệu.

**Kiểm thử ranh giới:** 0, 69, 70, 79, 80, 89, 90, 100.

**Mã lỗi / trạng thái phản hồi:** Matching thành công về mặt xử lý nhưng thiếu dữ liệu → trả kết quả HTTP 200 với `match: null` và `dataStatus: "insufficient"`, không trả về lỗi 422. Chỉ trả lỗi khi đầu vào không hợp lệ (thiếu `candidateId` hoặc `jobId`): ID không tồn tại → `404`; ID tồn tại nhưng không có quyền → `403`.

**Quyền truy cập `/api/match` theo từng role (đã chốt):**
- `student`: chỉ được match hồ sơ ứng viên gắn với `req.user.userId` của mình với tin tuyển dụng công khai, đang mở và chưa hết hạn.
- `employer`: chỉ được match ứng viên đã ứng tuyển vào tin tuyển dụng thuộc quyền sở hữu của nhà tuyển dụng đang đăng nhập. `employerId` phải được tra cứu từ tài khoản và đối chiếu với chủ sở hữu của bản ghi `jobs`.
- Không sử dụng `candidateId`, `employerId` hoặc `role` do client gửi để xác định quyền sở hữu.
- `admin`: chỉ được sử dụng matching nếu nghiệp vụ thực sự yêu cầu; không tự động cấp quyền truy cập CV đầy đủ hoặc PII chỉ vì tài khoản có role `admin`.
- ID không tồn tại trả `404`; tài nguyên tồn tại nhưng người dùng không được phép truy cập trả `403` theo quy ước API.

**Sắp xếp `/api/match/all`:** `match: null` nằm cuối danh sách hoặc được tách thành nhóm "Chưa đủ dữ liệu"; không coi `null` như 0.

---

## 7. Trích xuất CV PDF (`POST /api/cv/extract`) — giới hạn và xử lý lỗi

- **Loại file:** chỉ `.pdf` (kiểm tra extension, MIME type `application/pdf` và chữ ký file `%PDF-`).
- **Dung lượng:** tối đa 5 MB mỗi file.
- **Cơ chế upload:** giới hạn upload, không lưu file công khai, lưu vào thư mục tạm và xóa file tạm ngay cả khi trích xuất lỗi.
- **Timeout:** cố định 30 giây cho một yêu cầu trích xuất. Khi quá hạn, API trả lỗi theo cấu trúc đã thống nhất, không ghi đè CV cũ và phải dọn file tạm. Cần kiểm tra khả năng hủy xử lý thật của thư viện; chỉ đặt timeout cho HTTP response không đảm bảo công việc phân tích PDF đã dừng. Với phạm vi đồ án, không cần xây hệ thống xử lý file phức tạp, nhưng phải có ca kiểm thử cho timeout và việc dọn file tạm.
- **Xử lý lỗi:**
  - File không phải PDF, sai MIME, sai chữ ký hoặc quá lớn → `400` với thông báo rõ ràng.
  - PDF mã hóa / bị hỏng / không có văn bản đọc được → bắt lỗi từ `pdf-parse` → trả về `422` với thông báo "Không thể trích xuất văn bản từ PDF. Vui lòng nhập thông tin CV thủ công."
  - Kết quả trích xuất rỗng hoặc quá ngắn (không phải CV hữu ích) → không ghi đè `cvText` hiện tại bằng chuỗi rỗng; giữ giá trị cũ và thông báo người dùng nhập lại.
  - Fallback: cho phép người dùng nhập `cvText` thủ công qua form khi extraction thất bại.
- **Giới hạn tài nguyên xử lý file:** thời gian xử lý tối đa, không cho phép file quá lớn làm treo server.

---

## 8. Dashboard BI (`GET /api/bi/stats`)

Aggregations từ `db.json`:

| Chỉ số | Nguồn | Công thức | Trực quan hoá |
|--------|-------|-----------|---------------|
| Ứng viên theo kỹ năng | `candidates[].skills[]` | Đếm tần suất mỗi kỹ năng (áp dụng cho candidateId duy nhất, tránh một ứng viên nộp nhiều đơn bị đếm nhiều lần) | Bar chart (top 10) |
| Phân bố mức lương tuyển dụng | `jobs[].salary` | Parse khoảng lương, đơn vị VNĐ/tháng, chuẩn hóa, loại dữ liệu không hợp lệ / "thỏa thuận" | Bar chart theo nhóm lương |
| Tỷ trọng đơn đang ở trạng thái phỏng vấn | `applications[]` | `count(status='interview') / countTổngĐơn` | Donut (hiển thị phân bố tất cả trạng thái ứng tuyển) |
| Số đơn Offer so với số đơn Interview | `applications[]` | `count(status='offer') / count(status='interview')` | KPI hoặc biểu đồ so sánh (không trình bày như một phần của funnel) |
| Tỷ trọng đơn đang ở trạng thái Offer trên tổng số đơn | `applications[]` | `count(status='offer') / countTổngĐơn` | Stat card |
| Ứng viên theo trường | `candidates[].university` | Đếm theo trường ĐH (áp dụng cho candidateId duy nhất, tránh đếm lặp nếu ứng viên có nhiều đơn) | Bar chart |
| Tin đang mở / tạm dừng / hết hạn | `jobs[].status`, `deadline` | Đếm theo trạng thái | Stat cards |

**Công thức tỷ lệ phân bố trạng thái đơn hiện tại (đã chốt — KHÔNG phải tỷ lệ chuyển đổi funnel lịch sử vì demo không lưu lịch sử chuyển trạng thái):**

- `countTổngĐơn = count(status IN ['applied','reviewing','interview','offer','rejected'])` — tất cả đơn đã nộp. Chỉ các trạng thái hợp lệ được tính vào `countTổngĐơn`. Trạng thái không nhận diện được không bị âm thầm chuyển thành `rejected`.
- `interviewShare = count(status='interview') / countTổngĐơn` — tỷ trọng đơn đang ở vòng phỏng vấn so với tổng đơn (**chỉ số trạng thái hiện tại, không phải "tỷ lệ đã từng chuyển sang phỏng vấn"**).
- `offerToInterviewCountRatio = count(status='offer') / count(status='interview')` — **tỷ số giữa số đơn ở trạng thái offer và số đơn ở trạng thái interview (hai nhóm trạng thái hiện tại), không phải tỷ lệ chuyển đổi thực sự qua từng vòng.** Có thể vượt 100% nếu số đơn ở offer nhiều hơn số đơn ở interview. Không được trình bày như funnel tuyển dụng thực sự.
- `offerShare = count(status='offer') / countTổngĐơn` — tỷ trọng đơn đang ở trạng thái Offer trên tổng số đơn.

**Lưu ý:** Chỉ tính tỷ lệ chuyển đổi thực sự khi có lịch sử chuyển trạng thái (bảng `applicationStatusHistory`), điều này nằm ngoài phạm vi demo hiện tại.

**Phạm vi thống kê ứng viên của nhà tuyển dụng:** tính ứng viên từ các đơn ứng tuyển vào tin của nhà tuyển dụng đó, **đếm theo `candidateId` duy nhất**, tránh một ứng viên nộp nhiều đơn bị đếm nhiều lần. Nhà tuyển dụng không truy cập toàn bộ ứng viên hệ thống.

**Xử lý mẫu số bằng 0:** trả về `null` hoặc trạng thái "Chưa đủ dữ liệu" thay vì lỗi chia cho 0.

**Trạng thái đơn ứng tuyển và tin tuyển dụng (đã chốt):**
- Trạng thái đơn ứng tuyển: `applied`, `reviewing`, `interview`, `offer`, `rejected`. `statusDistribution` luôn dùng tập trạng thái chuẩn này, kể cả trạng thái có số lượng bằng 0. Các trạng thái không nhận diện được phải được ghi nhận để xử lý và loại khỏi mẫu số thống kê, đồng thời báo cáo số bản ghi bị loại (`dataQuality.invalidApplicationStatusCount`).
- Trạng thái tin tuyển dụng: `open`, `paused`, `expired`.
- `expired` được suy ra từ `deadline` (nếu `deadline` đã qua và status vẫn là `open`, hệ thống coi là đã hết hạn khi thống kê). Không để trạng thái `open` nhưng deadline đã qua vẫn bị thống kê là tin đang mở. Quy tắc này áp dụng đồng nhất ở mọi nơi, không chỉ ở biểu đồ BI.
- **Quy tắc xử lý `deadline` và `expired` (đã chốt):**
  - Deadline hợp lệ đã qua: quy tắc hết hạn phải nhất quán trong danh sách việc làm công khai, matching, thống kê BI và xử lý ứng tuyển.
  - Deadline thiếu hoặc không hợp lệ: không tự suy ra đã hết hạn; ghi nhận dữ liệu cần xử lý và không cho phép áp dụng logic hết hạn dựa trên ngày không hợp lệ.
  - Deadline được so sánh theo múi giờ của dự án (định nghĩa rõ trong cài đặt hệ thống), đồng nhất ở mọi endpoint.
  - Với trạng thái `paused` đã quá deadline: hệ thống giữ trạng thái `tạm dừng` (không tự chuyển sang `expired`); bất kỳ thay đổi trạng thái nào phải đi qua quy trình xác minh rõ ràng.
- Xử lý giá trị cũ hoặc không hợp lệ: **chỉ ánh xạ giá trị cũ khi có quy tắc chuyển đổi được xác minh.** Trạng thái không nhận diện được phải được ghi nhận để xử lý; **không tự gán thành `rejected`.** Không đưa trạng thái không hợp lệ vào các mẫu số thống kê cho đến khi được xử lý, đồng thời báo cáo số bản ghi bị loại.

**Schema đầu ra thống nhất của `/api/bi/stats`:**
```json
{
  "skillsDistribution": [{ skill, count }],
  "salaryDistribution": [{ range, rangeMin, rangeMax, avgSalary, count }],
  "statusDistribution": [{ status, count }],
  "universityDistribution": [{ university, count }],
  "jobStatusDistribution": [{ status: "open", count }, { status: "paused", count }, { status: "expired", count }],
  "applicationStatusMetrics": {
    "interviewShare": null,
    "offerToInterviewCountRatio": null,
    "offerShare": null
  },
  "dataQuality": {
    "invalidApplicationStatusCount": 0,
    "excludedSalaryCount": 0
  }
}
```

- `statusDistribution`: luôn dùng tập trạng thái chuẩn `applied`, `reviewing`, `interview`, `offer`, `rejected`, kể cả trạng thái có số lượng bằng 0.
- `universityDistribution`: theo ứng viên duy nhất, tránh đếm lặp ứng viên nếu họ có nhiều đơn ứng tuyển.
- `range`, `rangeMin`, `rangeMax`: cận của nhóm lương (ví dụ: "0–dưới 5 triệu", rangeMin=0, rangeMax=5000000).
- `avgSalary`: mức lương đại diện trung bình của các tin trong nhóm (không phải cận nhóm).
- Nhóm lương: [0, 5 triệu), [5 triệu, 10 triệu), [10 triệu, 15 triệu), [15 triệu, +∞). Các nhóm phải có ranh giới không chồng lấn.
- Quy tắc nhóm lương:
  - Nếu lương là một mức cụ thể: sử dụng mức đó.
  - Nếu lương là khoảng: sử dụng trung điểm của khoảng lương để phân nhóm.
  - Nếu lương là "thỏa thuận", không hợp lệ hoặc không xác định được đơn vị: loại khỏi phân bố số học và ghi nhận số bản ghi bị loại vào `excludedSalaryCount`.
  - Nếu có lương theo năm hoặc theo giờ: chỉ quy đổi khi xác định được đơn vị và giả định quy đổi; nếu không, loại khỏi thống kê.
- Phân quyền BI: nhà tuyển dụng lọc theo công việc của mình ở backend (chỉ thống kê jobs/Applications của employer đó); admin mới xem thống kê toàn hệ thống nếu nghiệp vụ quy định như vậy. Thống kê theo nhà tuyển dụng không được trộn lẫn với thống kê toàn hệ thống.

---

## 9. API Contracts (mới)

| Endpoint | Method | Input | Output | Quyền truy cập |
|----------|--------|-------|--------|----------------|
| `/api/auth/register` | POST | `{ email, password, role }` | `{ user: { id, email, role }, token }` | public (chỉ role student/employer) |
| `/api/auth/login` | POST | `{ email, password }` | `{ user: { id, email, role }, token }` | public (có giới hạn lần đăng nhập sai) |
| `/api/auth/me` | GET | header `Authorization: Bearer <token>` | `{ user, role }` | authenticated (bắt buộc token hợp lệ; không có token trả 401) |
| `/api/cv/extract` | POST | file PDF | `{ cvText: string }` | candidate owner |
| `/api/match` | POST | `{ candidateId, jobId }` | `{ jobId, match, band, reason[], matchedSkills[], missingSkills[], dataStatus }` | student: chỉ match hồ sơ gắn với `req.user.userId` của mình với tin tuyển dụng công khai, đang mở, chưa hết hạn; employer: chỉ match ứng viên đã ứng tuyển vào tin tuyển dụng thuộc quyền sở hữu của nhà tuyển dụng (backend tra cứu `employerId` từ tài khoản và đối chiếu chủ sở hữu bản ghi `jobs`); không được dùng `candidateId`/`employerId`/`role` từ client để xác định quyền sở hữu |
| `/api/match/all` | GET | `?candidateId=` | list `{ jobId, match, band }` giảm dần (match: null nằm cuối hoặc nhóm riêng) | candidate: chỉ candidateId của mình, backend phải xác minh quyền sở hữu trước khi sử dụng |
| `/api/bi/stats` | GET | none | `{ skillsDistribution, salaryDistribution, statusDistribution, universityDistribution, jobStatusDistribution, applicationStatusMetrics, dataQuality }` | employer (lọc theo mình) / admin (toàn hệ thống) |
| `/api/candidates/:id` | GET | none | candidate profile (PII masked unless owner/employer with application) | candidate/employer/admin |

**Mã lỗi và cấu trúc lỗi (đã chốt):**
- `400`: dữ liệu đầu vào không hợp lệ (thiếu trường, kiểu dữ liệu sai, ID không đúng định dạng).
- `401`: không xác thực (thiếu token, token sai, token hết hạn, tài khoản bị vô hiệu hóa).
- `403`: không có quyền truy cập tài nguyên (role không đủ hoặc không sở hữu tài nguyên).
- `404`: tài nguyên không tồn tại (ID candidateId/jobId không tồn tại).
- `409`: xung đột dữ liệu (ví dụ: apply trùng, đăng job trùng).
- `422`: lỗi xử lý nghiệp vụ (PDF hỏng, ...).
- `429`: vượt quá rate limit.
- `500`: lỗi server nội bộ.
- Cấu trúc lỗi trả về: `{ error: { code, message, details? } }`.
- Quy ước kiểu ID: tất cả ID là chuỗi string; trước khi so sánh phải chuẩn hóa kiểu dữ liệu (tránh ID chuỗi và số không khớp).

Các endpoint hiện có giữ nguyên.

**Tiêu chí nghiệm thu định lượng (đã chốt):**
- Không mất dữ liệu migration (tổng số bản ghi khớp trước/sau).
- Không truy cập chéo tài khoản (mỗi tài khoản chỉ thấy dữ liệu của mình).
- Công thức Matching Score được kiểm tra đầy đủ tại các giá trị biên.
- Tất cả luồng E2E chạy thành công.
- Báo cáo đánh giá AI nêu rõ giới hạn dữ liệu demo.

**Rà soát API cũ và PII (điều kiện bắt buộc trước khi nghiệm thu):** Kiểm tra tất cả endpoint đọc, tạo, sửa và xóa dữ liệu. Kiểm tra việc trả về `cvText`, `cvFileName`, `email` và số điện thoại ở từng endpoint, không chỉ `/api/candidates/:id`. Mọi endpoint ghi dữ liệu phải xác thực và kiểm tra quyền sở hữu ở backend. Chỉ trả các trường được phép theo role và quan hệ sở hữu; không trả nguyên bản ghi DB rồi trông chờ frontend tự ẩn PII. Kiểm thử bằng ít nhất hai tài khoản sinh viên và hai tài khoản nhà tuyển dụng khác nhau, bao gồm trường hợp sửa ID trong request. Nếu một API cũ chưa được bảo vệ hoặc chưa thể xác minh an toàn, phải chặn truy cập hoặc sửa trước khi nghiệm thu.

---

## 10. Thay đổi frontend

- `src/pages/PageAIMatch.tsx` — `/ai-match.html`: sinh viên lấy hồ sơ hiện tại từ token (không chọn tùy ý hồ sơ người khác); nhà tuyển dụng chỉ hiển thị ứng viên đủ điều kiện truy cập (đã ứng tuyển vào công việc của nhà tuyển dụng đó); gọi `/api/match`, hiển thị điểm + kỹ năng phù hợp/thiếu + nút "Ứng tuyển ngay".
- `src/pages/PageBIDashboard.tsx` — `/bi-dashboard.html`: biểu đồ từ `/api/bi/stats`, thẻ chỉ số, lọc theo nhà tuyển dụng.
- `src/main.tsx`: đăng ký 2 route mới + ánh xạ `routeByText` ("dashboard BI", "ai match", "xem báo cáo BI"). **Kiểm tra routing hiện có trước khi thêm.**
- Dashboard nhà tuyển dụng (trang 10): thêm liên kết "Xem báo cáo BI" → `/bi-dashboard.html`.
- Thêm trang đăng nhập đơn giản (nếu chưa có) và gắn header `Authorization: Bearer <token>` vào mọi yêu cầu API cần xác thực.
- Xử lý `401`, `403`, loading, lỗi mạng, dữ liệu rỗng và token hết hạn.
- Không cho ứng viên chọn hồ sơ người khác; nhà tuyển dụng chỉ chọn dữ liệu thuộc quyền truy cập.
- Nút "Ứng tuyển ngay": **chỉ hiển thị ở luồng ứng viên**. Nhà tuyển dụng **không nên nhìn thấy nút ứng tuyển cho tin của chính họ**. Dùng luồng ứng tuyển hiện có, kiểm tra tin còn hạn, chống ứng tuyển trùng, ghi đúng `jobId`, `candidateId`, `employerId` quan hệ (lấy `employerId` từ bản ghi `jobs`, không tin client gửi).
- Giữ nguyên chức năng cũ và kiểm tra hồi quy sau tích hợp. "Giữ nguyên chức năng cũ" nghĩa là giữ các luồng nghiệp vụ, không có nghĩa mọi API cũ giữ nguyên mức truy cập công khai. Các endpoint có thể cần bổ sung xác thực và kiểm tra quyền.

---

## 11. Kiểm thử & báo cáo (Checklist item 5)

**Dữ liệu mẫu:** seed `db.json` với ≥10 công việc, ≥15 ứng viên, trộn trạng thái đơn (áp dụng, phỏng vấn, offer, từ chối).

**Bộ dữ liệu chuẩn (golden dataset):** 20 cặp CV-JD được chọn theo các nhóm kỹ năng phổ biến (Frontend, Backend, Design, Data) với điểm/band dự kiến đã định sẵn. Bộ dữ liệu này là bộ dữ liệu chuẩn do người đánh giá gán nhãn thủ công (trừ khi thực sự có HR tham gia đánh giá — không nên ghi "HR đánh giá" như một sự kiện đã xảy ra nếu chưa thực hiện). Tiêu chí chọn mẫu: mỗi nhóm 4–5 cặp, đảm bảo phân bố các mức band. Cách gán điểm chuẩn: HR đánh giá thủ công mức độ phù hợp dựa trên kỹ năng và kinh nghiệm, quy thang 0–100. Hạn chế: 20 cặp không đại diện, **không tuyên bố độ chính xác thực tế chỉ từ bộ dữ liệu này**.

**Chỉ số đo:**
- `accuracy@band`: tỷ lệ cặp dự đoán đúng band so với golden dataset.
- `precision/recall kỹ năng`: kỹ năng khớp dự đoán so với kỹ năng gắn thẻ chuẩn.
- `MAE điểm số`: sai số tuyệt đối trung bình giữa `match` dự đoán và điểm thủ công.

**Kiểm thử bảo mật:** xác thực, phân quyền, ID giả mạo, truy cập chéo tài khoản, file PDF không hợp lệ, dữ liệu thiếu/sai, lỗi DB.

**Kiểm thử nghiệp vụ:** kỹ năng/JD rỗng, band biên (0, 69, 70, 79, 80, 89, 90, 100), lương không hợp lệ, mẫu số BI bằng 0.

**Kiểm thử JSON DB:** yêu cầu ghi đồng thời vì JSON DB không hỗ trợ transaction (sử dụng khóa ghi đơn giản in-memory mutex). Kiểm tra khả năng hủy xử lý PDF quá hạn và việc dọn file tạm.

**Luồng end-to-end:** đăng nhập → đăng tin → cập nhật CV → match → ứng tuyển → xử lý đơn → cập nhật BI → kiểm tra quyền truy cập.

**Kiểm tra hồi quy:** chạy lại các chức năng cũ để phát hiện sự suy giảm.

**Báo cáo đánh giá AI (đã chốt):** `docs/superpowers/reports/2026-10-28-ai-match-bi-evaluation.md` — **phải ghi số lượng mẫu thực tế đã chạy, kết quả đo được và trường hợp lỗi; không điền số liệu dự kiến như kết quả đã đạt.** Bao gồm input/output mẫu, chỉ số đánh giá, mô tả biểu đồ BI, hạn chế (heuristic không bắt được ngữ nghĩa ngữ cảnh; 20 cặp golden dataset chỉ phục vụ demo internship).

---

## 12. Kế hoạch triển khai (đã chốt thứ tự)

Mỗi giai đoạn phải có tiêu chí hoàn thành và kết quả kiểm chứng. Có thể chia việc song song nhưng phải có một API contract và schema thống nhất trước.

| Giai đoạn | Công việc | Tiêu chí hoàn thành |
|-----------|-----------|---------------------|
| A | Kiểm tra repository/dữ liệu hiện tại (savedJobs, applications, postedJobs, profile) | Báo cáo sự không tương thích, danh sách migration cần làm |
| B | Chốt schema và migration (có sao lưu, kiểm tra sau migration, khả năng khôi phục, không tự tạo mật khẩu/tài khoản giả) | Migration chạy thành công trên bản sao lưu, dữ liệu không mất/lẫn |
| C | Xác thực/phân quyền (Bearer JWT, bcrypt, middleware, PII mask, rate limit, JWT_SECRET bắt buộc) | Login/logout hoạt động, 401/403 đúng, PII không rò rãi, server dừng nếu thiếu JWT_SECRET |
| D | PDF extraction (`/api/cv/extract` + giới hạn/lỗi/xóa file tạm/timeout) | Trích xuất PDF đúng, lỗi trả về 400/422 rõ ràng, không ghi đè cvText bằng chuỗi rỗng |
| E | Matching API (`/api/match`, `/api/match/all`) | Điểm đúng công thức, phân quyền đúng, không chia cho 0, phân biệt không đủ dữ liệu |
| F | BI API (`/api/bi/stats` + công thức chuyển đổi) | Số liệu khớp với DB, mẫu số 0 xử lý gracefully, phân quyền BI đúng |
| G | Frontend (`PageAIMatch`, `PageBIDashboard`, route, auth header) | Trang render đúng, xử lý 401/403/loading/lỗi mạng |
| H | Kiểm thử end-to-end + báo cáo | Luồng E2E chạy thành công, báo cáo đánh giá có chỉ số |
| I | Kiểm tra hồi quy | Chức năng cũ vẫn hoạt động sau tích hợp |

---

## 13. Rủi ro & giảm thiểu

- **Chất lượng match heuristic:** có thể đánh giá sai sự phù hợp ngữ nghĩa. Giảm thiểu: mục `reason[]` rõ ràng, ghi chép là demo dựa trên quy tắc, hướng nâng cấp sang vector model.
- **CSDL JSON không tương tác:** đọc/ghi tệp đơn không có transaction. Giảm thiểu: chấp nhận với quy mô demo, ghi chú trong báo cáo, sử dụng khóa ghi đơn giản in-memory mutex.
- **Dấu tiếng Việt:** ánh xạ bảng đơn giản bao gồm các ký tự phổ biến.
- **Trích xuất PDF thất bại:** nếu file bị mã hóa/hình ảnh, trả về lỗi rõ ràng và hỏi người dùng nhập văn bản thủ công.
- **Role giả định không an toàn:** bắt buộc phải có đăng nhập thực tế trước khi cho truy cập API match/BI/PII.
- **JWT trong localStorage:** có rủi ro XSS; tránh render HTML không an toàn và không lưu token trong log.
- **Nhiều instance dùng chung JSON DB:** không được phép; chỉ chạy một instance.

---

## 14. Giai đoạn tiếp theo (chờ duyệt)

Sau khi bạn duyệt spec v9 này, tôi sẽ gọi skill `writing-plans` để lập kế hoạch triển khai chi tiết, rồi có thể khai nhiều đại lý song song thực hiện các giai đoạn A–I.

---

## Đánh dấu quyết định & giới hạn còn lại

**Đã chốt:**
- Stack không đổi (React + Vite + Tailwind + Express + JSON DB).
- Bearer JWT HS256, secret từ `JWT_SECRET` (bắt buộc, không dùng default), expiry 24h, localStorage + header.
- Schema 6 collection chính (`users`, `employers`, `jobs`, `candidates`, `applications`, `savedJobs`) + 1 đối tượng cấu hình (`profile`); role chỉ trong `users`; `savedJobs` → `{candidateId, jobId[]}`.
- Matching heuristic 60% kỹ năng + 40% từ khóa, thang 0–100, fallback "không đủ dữ liệu" thay vì điểm 0.
- BI dựa trên trạng thái hiện tại, không lưu lịch sử chuyển trạng thái (ngoài phạm vi demo); gọi là tỷ lệ phân bố trạng thái đơn, không phải funnel thực sự. Trường `applicationStatusMetrics` thay thế `conversionRates`.
- Golden dataset 20 cặp chỉ phục vụ demo, không khẳng định độ chính xác thực tế.
- Migration không tự tạo mật khẩu/tài khoản giả; kiểm tra dữ liệu thật trước khi quyết định.
- PII admin: bị mask theo mặc định (trừ khi có quy định riêng kèm audit log).
- CR2: tỷ số giữa hai trạng thái hiện tại, không gọi là conversion rate thực sự.
- Đăng ký công khai chỉ cho student/employer, không tạo admin.
- Mutex ghi JSON DB bao trùm toàn bộ thao tác đọc–kiểm tra–thay đổi–ghi.
- Tài khoản đăng ký: tính nguyên tử, chỉ cấp token sau khi toàn bộ điều kiện thành công, email chuẩn hóa (trim + chữ thường) trước khi kiểm tra trùng.
- Kích hoạt tài khoản demo: kích hoạt ngay sau khi đăng ký thành công (nếu chưa có email verification), chỉ cấp JWT sau khi users và hồ sơ đã ghi thành công trong cùng nghiệp vụ có khóa. Admin tạo qua script riêng.

**Giới hạn còn lại (chưa thể xác minh mà không chạy code):**
- Dữ liệu mẫu thực tế trong `server/data/db.json` chưa được kiểm tra chi tiết (cần migration phase A xem sự không tương thích thực).
- `bcryptjs`, `pdf-parse`, `chart.js` chưa có trong `package.json` (cần cài thêm).
- Hiệu năng JSON DB khi dữ liệu lớn chưa được đo lường.
- Khóa ghi in-memory mutex chưa được triển khai và đo lường.
- Quy trình đăng ký/kích hoạt tài khoản qua email chưa được triển khai.

---

## Checklist trước khi duyệt v9

| Mục | Trạng thái |
|-----|------------|
| Đăng ký công khai không thể tạo tài khoản admin | [x] Bắt buộc — đã chốt |
| Đăng ký tạo hồ sơ candidate/employer nhất quán với users | [x] Bắt buộc — đã chốt |
| CV rỗng được phân biệt với CV không khớp từ khóa | [x] Bắt buộc — đã chốt |
| Tên BI không gây hiểu nhầm thành funnel chuyển đổi | [x] Bắt buộc — đã chốt |
| Trạng thái cũ không hợp lệ có một quy tắc xử lý duy nhất | [x] Bắt buộc — đã chốt |
| API cũ được rà soát lại quyền truy cập | [x] Bắt buộc trước khi nghiệm thu — đã chốt |
| Quy tắc deadline, nhóm lương và match null | [x] Đã chốt |
| Có tiêu chí kiểm thử và báo cáo kết quả thực tế | [x] Đã nêu |

---
*Vui lòng review spec v9 đã chỉnh sửa. Nếu đồng ý, tôi sẽ viết kế hoạch triển khai. Nếu cần sửa thêm, hãy chỉ ra phần cụ thể. Chưa triển khai code cho đến khi spec này được phê duyệt.*