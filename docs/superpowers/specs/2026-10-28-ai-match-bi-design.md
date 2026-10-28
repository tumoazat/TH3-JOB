# Design Spec: AI Matching + BI Dashboard (TH3-X)

**Project:** CareerMatch AI — Hệ thống Tìm việc Thông minh tích hợp AI và BI  
**Date:** 2026-10-28  
**Status:** Revised v4 (chờ duyệt)  
**Repo:** https://github.com/tumoazat/TH3-JOB  
**Quyết định đã chốt:** Stack không đổi (React + Vite + Tailwind + Express + JSON DB), Bearer JWT HS256 (chỉ server ký), schema rõ ràng 6 collection chính, công thức BI dựa trên trạng thái hiện tại, heuristic matching (không ML), không tự tạo mật khẩu/tài khoản giả trong migration.

---

## 1. Mục tiêu và tiêu chí thành công

Mở rộng dự án hiện có để đáp ứng checklist TH3:

1. **CSDL 3 thực thể chính:** Ứng viên, Nhà tuyển dụng, Tin tuyển dụng (schema rõ ràng, tương thích dữ liệu mẫu hiện có, có kế hoạch migration an toàn).
2. **Mô hình AI match:** Tính điểm tương thích CV ↔ JD (heuristic-based trong Node.js, thang 0–100, trích xuất văn bản từ PDF, phân biệt điểm thấp với không đủ dữ liệu).
3. **Dashboard BI:** Trực quan hóa ứng viên theo kỹ năng, xu hướng lương, tỷ lệ phân bố trạng thái đơn hiện tại (không tuyên bố là funnel lịch sử nếu không có dữ liệu lịch sử).
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
- **Ghi JSON DB tuần tự:** vì JSON DB không hỗ trợ transaction, backend sử dụng khóa ghi đơn giản (in-memory mutex) để tránh ghi đè khi nhiều request đồng thời.

---

## 4. Mô hình dữ liệu (`server/data/db.json`)

Schema formalized (additive, backward compatible). **Trước khi triển khai phải kiểm tra dữ liệu mẫu hiện có tương thích schema này hay không (xem mục Migration).**

```json
{
  "users": [ { id, email, passwordHash, role: "student" | "employer" | "admin", createdAt } ],
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

### Quan hệ (ERD)

- `users` 1→1 `employers` hoặc `candidates` qua `userId` (một tài khoản là nhà tuyển dụng hoặc ứng viên; admin không thuộc cả hai).
- `employer` 1→N `jobs` qua `employerId`.
- `candidate` 1→N `applications` qua `candidateId`.
- `job` 1→N `applications` qua `jobId`.
- `application` liên kết `candidate` + `job` + `employer` (để tra cứu nhanh).
- `savedJobs` liên kết `candidateId` với mảng `jobId[]` đã lưu (mỗi `candidateId` chỉ xem được danh sách của mình).

### Tương thích dữ liệu mẫu hiện có (đã chốt, cần kiểm tra trước migration)

- **Kiểm tra trước migration:** kiểm tra `postedJobs`, `applications`, `savedJobs`, `profile` và toàn bộ dữ liệu mẫu hiện có trước khi thay đổi schema.
- `savedJobs` hiện là mảng số `[jobId]` chưa gắn `candidateId`. **Quyết định:** chuyển đổi sang `{ candidateId, jobId[] }`; nếu không xác định được chủ sở hữu dữ liệu cũ, **không tự gán dữ liệu cho người dùng** — đánh dấu là "chưa xác định chủ sở hữu" để xử lý sau, không bị khoá/lẫn dữ liệu của người khác.
- `postedJobs` hiện có — giữ lại, ánh xạ sang `jobs` khi cần.
- `applications` hiện có — bổ sung `employerId`, `matchScore`.
- `profile` hiện có — giữ nguyên.

### Ràng buộc toàn vẹn (đã chốt)

- Khóa tham chiếu: `jobs.employerId` phải tồn tại trong `employers.id`; `applications.jobId` phải tồn tại trong `jobs.id`; `applications.candidateId` phải tồn tại trong `candidates.id`; `applications.employerId` phải tồn tại trong `employers.id`; `savedJobs.candidateId` phải tồn tại trong `candidates.id`; `savedJobs.jobId[]` mỗi phần tử phải tồn tại trong `jobs.id`.
- Kiểm tra ID tồn tại trước khi ghi; chống dữ liệu trùng (một ứng viên không được apply cùng một job hai lần, một job không được đăng trùng theo `employerId + title + deadline`).
- Quy tắc cập nhật: chỉ chủ sở hữu hoặc admin được cập nhật/xóa bản ghi liên quan; cập nhật phải đi kèm kiểm tra quyền tại backend.
- `applications.employerId` phải luôn khớp với `jobs.employerId`: backend lấy chủ sở hữu từ bản ghi `job`, **không tin `employerId` do client gửi**.

### Số collection chính (đã chốt)

- **Đối tượng nghiệp vụ chính (6 collection):** `users`, `employers`, `jobs`, `candidates`, `applications`, `savedJobs`.
- **Đối tượng cấu hình/trợ助:** `profile`.
- Không tự ý thêm hệ thống phức tạp không cần thiết.

### Kế hoạch migration (đã chốt)

1. Sao lưu `server/data/db.json` trước khi thay đổi (file `.bak` có timestamp).
2. Kiểm tra dữ liệu thực trước khi quyết định: nếu có email và thông tin người dùng đủ tin cậy, tạo tài khoản theo quy trình được phê duyệt; **không tự sinh mật khẩu mặc định hoặc hash một mật khẩu mà người dùng không biết**; nếu không xác định được chủ sở hữu hồ sơ, đánh dấu cần xử lý thay vì gán bừa.
3. Chạy script migration one-time: tạo bảng `users`, `employers`, `candidates` từ dữ liệu hiện có; backfill `savedJobs` với `candidateId` hoặc đánh dấu chưa xác định chủ sở hữu.
4. Kiểm tra sau migration: tổng số bản ghi khớp trước/sau; không có `jobId` trong `savedJobs` bị bỏ dang; mỗi `application` có `employerId` khớp với `jobs.employerId`.
5. Khả năng khôi phục: nếu migration thất bại, revert về file `.bak` và dừng triển khai.

---

## 5. Xác thực & phân quyền (đã chốt)

- **Xác thực:** chỉ dùng **Bearer JWT do server ký**. Không dùng session/cookie, không trộn lẫn.
  - `POST /api/auth/login` nhận `{ email, password }`, tra cứu `users`, verify `passwordHash` (mã hóa bằng thư viện `bcryptjs` tương đương, không lưu mật khẩu rõ).
  - Server ký JWT với thuật toán `HS256`, khóa lấy từ biến môi trường `JWT_SECRET` (**bắt buộc thiết lập**; nếu `JWT_SECRET` chưa cấu hình, server phải dừng khởi động với thông báo rõ ràng, không tự dùng secret mặc định), thời hạn token `24h`.
  - Phản hồi login: `{ user: { id, email, role }, token }`. **Không trả `passwordHash` hoặc secret token trong phản hồi/log.**
  - Frontend lưu `token` vào `localStorage`, gửi kèm header `Authorization: Bearer <token>` trên mọi yêu cầu cần xác thực. **Giới hạn:** localStorage có rủi ro XSS; tránh render HTML không an toàn và không lưu token trong log.
- **Xử lý lỗi xác thực:**
  - Token sai chữ ký / hết hạn / malformed → `401 Unauthorized`, không rò rãi chi tiết nội bộ.
  - Token hết hạn → frontend xóa `localStorage` token, chuyển hướng trang đăng nhập, cho phép đăng nhập lại.
- **Middleware:**
  - `requireAuth`: kiểm tra token hợp lệ, gán `req.user` từ payload.
  - `requireRole(roles)`: kiểm tra `req.user.role`.
- **Phân quyền theo role VÀ quyền sở hữu tài nguyên (backend kiểm tra, không chỉ ẩn giao diện):**
  - Quy tắc nghiệp vụ nhất quán (đã chốt):
    - **Sinh viên:** chỉ thao tác trên hồ sơ của chính mình; xem các công việc đang mở và còn hạn.
    - **Nhà tuyển dụng:** chỉ thao tác trên tin của mình; chỉ xem CV đầy đủ của ứng viên đã ứng tuyển vào tin thuộc quyền sở hữu của họ.
    - **Admin:** có quyền quản trị theo quy định, nhưng mọi truy cập dữ liệu nhạy cảm vẫn cần được kiểm soát và ghi log phù hợp.
  - Ứng viên (`student`): chỉ truy cập hồ sơ, CV, danh sách tin đã lưu, đơn ứng tuyển của chính mình.
  - Nhà tuyển dụng (`employer`): chỉ thao tác trên công việc thuộc quyền sở hữu (`jobs.employerId` phải bằng `employer.id` được tra cứu từ `employers` qua `userId`, **không so sánh trực tiếp `req.user.userId` với `jobs.employerId`**); chỉ xem thông tin ứng viên theo điều kiện truy cập được quy định (xem mục PII).
  - Admin: xem thống kê toàn hệ thống nếu nghiệp vụ quy định như vậy.
- **API `/api/match/all`:** phải xác minh `candidateId` thuộc tài khoản hiện tại (`candidates.find(c => c.id === candidateId && c.userId === req.user.userId)`), cả hai giá trị ID phải cùng kiểu dữ liệu trước khi so sánh.
- **API `/api/match`:** phải xác minh cả quyền truy cập hồ sơ ứng viên (`candidateId` của tài khoản hiện tại) và quyền truy cập công việc (nhà tuyển dụng chỉ được match ứng viên đã ứng tuyển vào công việc của họ; backend lấy chủ sở hữu công việc từ bản ghi `jobs`, không tin ID/role do client gửi). Nếu không thỏa mãn → `403`.
- **Bảo vệ PII:** `email`, `phone`, `cvFileName`, `cvText` chỉ hiển thị đầy đủ với (a) chủ sở hữu ứng viên, (b) nhà tuyển dụng đã có đơn ứng tuyển (`applications`) đối với ứng viên đó **và** đơn đó thuộc công việc của chính nhà tuyển dụng (`applications.employerId` khớp với `jobs.employerId`); các trường khác bị mask (`****@****.com`, `09xx xxxx xx`). Không ghi log dữ liệu nhạy cảm.
- **Rate limit & giới hạn tài nguyên:** giới hạn số lần gọi `/api/cv/extract` và `/api/match` mỗi IP; giới hạn dung lượng file upload (xem mục 7).

---

## 6. Mô hình AI Matching (`POST /api/match`)

**Phương pháp:** Keyword overlap heuristic (ponytail — stdlib + `pdf-parse` chỉ dùng để trích xuất PDF, không có thư viện ML). Đây là **rule-based matching**, không tuyên bố là mô hình ML đã huấn luyện.

**Đầu vào:** `candidate.skills[]`, `candidate.cvText` (từ PDF), `job.tags[]`, `job.description`, `job.requirements`.

**Thuật toán (đã chốt):**

1. **Trích xuất PDF:** `POST /api/cv/extract` nhận file PDF, dùng `pdf-parse` trích xuất văn bản thô → lưu vào `candidate.cvText`.
2. Chuẩn hóa văn bản: lowercase, trim, bỏ dấu tiếng Việt qua bảng ánh xạ đơn giản.
3. Chuẩn hóa kỹ năng: ánh xạ alias và cụm từ nhiều từ trước khi so sánh (ví dụ: "React JS" → "reactjs", "Node JS" → "nodejs", xóa ký tự đặc biệt). **Không để `React` tự động khớp `React Native` nếu không có quy tắc alias rõ ràng.**
4. `skillScore = |candidate.skills ∩ job.tags| / |job.tags|` (0–1). **Nếu `job.tags` rỗng → `skillScore = 0` và đánh dấu "không đủ dữ liệu kỹ năng" (không trả điểm gây hiểu lầm).**
5. `keywordScore` = số từ khóa trong JD xuất hiện trong `cvText` / tổng từ khóa JD (0–1). **Nếu không có từ khóa JD → `keywordScore = 0` và đánh dấu "không đủ dữ liệu từ khóa JD".**
6. `match = round((skillScore * 0.6 + keywordScore * 0.4) * 100)` → thang **0–100**. Nếu cả `skillScore` và `keywordScore` đều là 0 do thiếu dữ liệu đầu vào, trả về `match = null` và trạng thái "Không đủ dữ liệu để đánh giá" thay vì điểm 0.
7. Band: ≥90 "Rất khớp", 80–89 "Khớp tốt", 70–79 "Khớp tiềm năng", <70 "Cần bổ sung". Kiểm thử ranh giới: 0, 69, 70, 79, 80, 89, 90, 100.

**Xuất ra:** `{ jobId, match, band, reason: string[], matchedSkills[], missingSkills[] }`.

- `reason`: liệt kê thực tế từ kết quả (ví dụ: "Khớp 3/5 kỹ năng yêu cầu: ReactJS, Node.js, PostgreSQL").
- `matchedSkills`: kỹ năng thực sự xuất hiện cả trong `candidate.skills` và `job.tags`.
- `missingSkills`: kỹ năng trong `job.tags` nhưng không có trong `candidate.skills`.
- **Ghi rõ:** `skillScore` dùng `candidate.skills`, còn `keywordScore` dùng `cvText`; hai nguồn này có thể khác nhau và cần xử lý khi dữ liệu mâu thuẫn (ưu tiên hiển thị cả hai nguồn riêng biệt, không hợp nhất thành một danh sách kỹ năng đơn).

**Kiểm thử ranh giới:** 0, 69, 70, 79, 80, 89, 90, 100.

---

## 7. Trích xuất CV PDF (`POST /api/cv/extract`) — giới hạn và xử lý lỗi

- **Loại file:** chỉ `.pdf` (kiểm tra extension, MIME type `application/pdf` và chữ ký file `%PDF-`).
- **Dung lượng:** tối đa 5 MB mỗi file.
- **Cơ chế upload:** giới hạn upload, không lưu file công khai, lưu vào thư mục tạm và xóa file tạm ngay cả khi trích xuất lỗi.
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
| Ứng viên theo kỹ năng | `candidates[].skills[]` | Đếm tần suất mỗi kỹ năng | Bar chart (top 10) |
| Xu hướng lương | `jobs[].salary` | Parse khoảng lương, chuẩn hóa đơn vị tiền tệ, loại dữ liệu không hợp lệ / "thỏa thuận" | Bar chart theo nhóm lương (quy định cách chia khoảng lương, ví dụ: 0–5tr, 5–10tr, 10–15tr, 15tr+) |
| Tỷ lệ trạng thái đơn vòng 1 | `applications[]` | `count(status='interview') / countTổngĐơn` | Donut |
| Tỷ lệ trạng thái đơn vòng 2 | `applications[]` | `count(status='offer') / count(status='interview')` | Donut |
| Tỷ lệ chốt Offer | `applications[]` | `count(status='offer') / countTổngĐơn` | Stat card |
| Ứng viên theo trường | `candidates[].university` | Đếm theo trường ĐH | Bar chart |
| Tin đang mở / tạm dừng / hết hạn | `jobs[].status`, `deadline` | Đếm theo trạng thái | Stat cards |

**Công thức tỷ lệ phân bố trạng thái đơn hiện tại (đã chốt — KHÔNG phải tỷ lệ chuyển đổi funnel lịch sử vì demo không lưu lịch sử chuyển trạng thái):**

- `countTổngĐơn = count(status IN ['applied','reviewing','interview','offer','rejected'])` — tất cả đơn đã nộp.
- `CR1 = count(status='interview') / countTổngĐơn` — tỷ lệ đơn đang ở vòng phỏng vấn so với tổng đơn (chỉ số trạng thái hiện tại, không phải "tỷ lệ đã từng chuyển sang phỏng vấn").
- `CR2 = count(status='offer') / count(status='interview')` — nếu có đơn ở vòng phỏng vấn, không thì `null` / "Chưa đủ dữ liệu".
- `CR3 = count(status='offer') / countTổngĐơn` — tỷ lệ đơn nhận offer so với tổng đơn.

**Lưu ý:** Nếu muốn tính funnel thực sự (số đơn đã từng qua từng vòng), cần bổ sung bảng `applicationStatusHistory` lưu từng thay đổi trạng thái — điều này nằm ngoài phạm vi demo hiện tại.

**Xử lý mẫu số bằng 0:** trả về `null` hoặc trạng thái "Chưa đủ dữ liệu" thay vì lỗi chia cho 0.

**Schema đầu ra thống nhất của `/api/bi/stats`:**
```json
{
  "skillsDistribution": [{ skill, count }],
  "salaryDistribution": [{ range, min, max, avg, count }],
  "statusDistribution": [{ status, count }],
  "universityDistribution": [{ university, count }],
  "conversionRates": { cr1, cr2, cr3 }
}
```

- Phân quyền BI: nhà tuyển dụng lọc theo công việc của mình ở backend; admin mới xem thống kê toàn hệ thống nếu nghiệp vụ quy định như vậy. Thống kê theo nhà tuyển dụng không được trộn lẫn với thống kê toàn hệ thống.

---

## 9. API Contracts (mới)

| Endpoint | Method | Input | Output | Quyền truy cập |
|----------|--------|-------|--------|----------------|
| `/api/auth/login` | POST | `{ email, password }` | `{ user: { id, email, role }, token }` | public |
| `/api/auth/me` | GET | header `Authorization: Bearer <token>` | `{ user, role }` | authenticated |
| `/api/cv/extract` | POST | file PDF | `{ cvText: string }` | candidate owner |
| `/api/match` | POST | `{ candidateId, jobId }` | `{ match, band, reason[], matchedSkills[], missingSkills[] }` | candidate (chỉ hồ sơ mình) hoặc employer (chỉ match ứng viên đã ứng tuyển vào công việc của mình) |
| `/api/match/all` | GET | `?candidateId=` | list `{ jobId, match, band }` giảm dần | candidate (chỉ candidateId của mình) |
| `/api/bi/stats` | GET | none | `{ skillsDistribution, salaryDistribution, statusDistribution, universityDistribution, conversionRates }` | employer (lọc theo mình) / admin (toàn hệ thống) |
| `/api/candidates/:id` | GET | none | candidate profile (PII masked unless owner/employer with application) | candidate/employer/admin |

**Mã lỗi và cấu trúc lỗi (đã chốt):**
- `400`: dữ liệu đầu vào không hợp lệ (thiếu trường, kiểu dữ liệu sai, ID không đúng định dạng).
- `401`: không xác thực (thiếu token, token sai, token hết hạn).
- `403`: không có quyền truy cập tài nguyên (role không đủ hoặc không sở hữu tài nguyên).
- `404`: tài nguyên không tồn tại.
- `409: xung đột dữ liệu (ví dụ: apply trùng, đăng job trùng).
- `422`: lỗi xử lý nghiệp vụ (PDF hỏng, không đủ dữ liệu đánh giá, ...).
- `429`: vượt quá rate limit.
- `500`: lỗi server nội bộ.
- Cấu trúc lỗi trả về: `{ error: { code, message, details? } }`.
- Quy ước kiểu ID: tất cả ID là chuỗi string; trước khi so sánh phải chuẩn hóa kiểu dữ liệu (tránh ID chuỗi và số không khớp).

Các endpoint hiện có giữ nguyên.

---

## 10. Thay đổi frontend

- `src/pages/PageAIMatch.tsx` — `/ai-match.html`: sinh viên lấy hồ sơ hiện tại từ token (không chọn tùy ý hồ sơ người khác); nhà tuyển dụng chỉ hiển thị ứng viên đủ điều kiện truy cập (đã ứng tuyển vào công việc của nhà tuyển dụng đó); gọi `/api/match`, hiển thị điểm + kỹ năng phù hợp/thiếu + nút "Ứng tuyển ngay".
- `src/pages/PageBIDashboard.tsx` — `/bi-dashboard.html`: biểu đồ từ `/api/bi/stats`, thẻ chỉ số, lọc theo nhà tuyển dụng.
- `src/main.tsx`: đăng ký 2 route mới + ánh xạ `routeByText` ("dashboard BI", "ai match", "xem báo cáo BI"). **Kiểm tra routing hiện có trước khi thêm.**
- Dashboard nhà tuyển dụng (trang 10): thêm liên kết "Xem báo cáo BI" → `/bi-dashboard.html`.
- Thêm trang đăng nhập đơn giản (nếu chưa có) và gắn header `Authorization: Bearer <token>` vào mọi yêu cầu API cần xác thực.
- Xử lý `401`, `403`, loading, lỗi mạng, dữ liệu rỗng và token hết hạn.
- Không cho ứng viên chọn hồ sơ người khác; nhà tuyển dụng chỉ chọn dữ liệu thuộc quyền truy cập.
- Nút "Ứng tuyển ngay": dùng luồng ứng tuyển hiện có, kiểm tra tin còn hạn, chống ứng tuyển trùng, ghi đúng `jobId`, `candidateId`, `employerId` quan hệ (lấy `employerId` từ bản ghi `jobs`, không tin client gửi).
- Giữ nguyên chức năng cũ và kiểm tra hồi quy sau tích hợp.

---

## 11. Kiểm thử & báo cáo (Checklist item 5)

**Dữ liệu mẫu:** seed `db.json` với ≥10 công việc, ≥15 ứng viên, trộn trạng thái đơn (áp dụng, phỏng vấn, offer, từ chối).

**Bộ dữ liệu chuẩn (golden dataset):** 20 cặp CV-JD được chọn theo các nhóm kỹ năng phổ biến (Frontend, Backend, Design, Data) với điểm/band dự kiến đã định sẵn (do nhân viên HR đánh giá trước). Tiêu chí chọn mẫu: mỗi nhóm 4–5 cặp, đảm bảo phân bố các mức band. Cách gán điểm chuẩn: HR đánh giá thủ công mức độ phù hợp dựa trên kỹ năng và kinh nghiệm, quy thang 0–100. Hạn chế: 20 cặp không đại diện, **không tuyên bố độ chính xác thực tế chỉ từ bộ dữ liệu này**.

**Chỉ số đo:**
- `accuracy@band`: tỷ lệ cặp dự đoán đúng band so với golden dataset.
- `precision/recall kỹ năng`: kỹ năng khớp dự đoán so với kỹ năng gắn thẻ chuẩn.
- `MAE điểm số`: sai số tuyệt đối trung bình giữa `match` dự đoán và điểm thủ công.

**Kiểm thử bảo mật:** xác thực, phân quyền, ID giả mạo, truy cập chéo tài khoản, file PDF không hợp lệ, dữ liệu thiếu/sai, lỗi DB.

**Kiểm thử nghiệp vụ:** kỹ năng/JD rỗng, band biên (0, 69, 70, 79, 80, 89, 90, 100), lương không hợp lệ, mẫu số BI bằng 0.

**Kiểm thử JSON DB:** yêu cầu ghi đồng thời vì JSON DB không hỗ trợ transaction (sử dụng khóa ghi đơn giản in-memory mutex).

**Luồng end-to-end:** đăng nhập → đăng tin → cập nhật CV → match → ứng tuyển → xử lý đơn → cập nhật BI → kiểm tra quyền truy cập.

**Kiểm tra hồi quy:** chạy lại các chức năng cũ để phát hiện sự suy giảm.

**Báo cáo:** `docs/superpowers/reports/2026-10-28-ai-match-bi-evaluation.md` — input/output mẫu, chỉ số đánh giá, mô tả biểu đồ BI, hạn chế (heuristic không bắt được ngữ nghĩa ngữ cảnh; 20 cặp golden dataset chỉ phục vụ demo internship).

---

## 12. Kế hoạch triển khai (đã chốt thứ tự)

Mỗi giai đoạn phải có tiêu chí hoàn thành và kết quả kiểm chứng. Có thể chia việc song song nhưng phải có một API contract và schema thống nhất trước.

| Giai đoạn | Công việc | Tiêu chí hoàn thành |
|-----------|-----------|---------------------|
| A | Kiểm tra repository/dữ liệu hiện tại (savedJobs, applications, postedJobs, profile) | Báo cáo sự không tương thích, danh sách migration cần làm |
| B | Chốt schema và migration (có sao lưu, kiểm tra sau migration, khả năng khôi phục, không tự tạo mật khẩu/tài khoản giả) | Migration chạy thành công trên bản sao lưu, dữ liệu không mất/lẫn |
| C | Xác thực/phân quyền (Bearer JWT, bcrypt, middleware, PII mask, rate limit, JWT_SECRET bắt buộc) | Login/logout hoạt động, 401/403 đúng, PII không rò rãi, server dừng nếu thiếu JWT_SECRET |
| D | PDF extraction (`/api/cv/extract` + giới hạn/lỗi/xóa file tạm) | Trích xuất PDF đúng, lỗi trả về 400/422 rõ ràng, không ghi đè cvText bằng chuỗi rỗng |
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

---

## 14. Giai đoạn tiếp theo (chờ duyệt)

Sau khi bạn duyệt spec v4 này, tôi sẽ gọi skill `writing-plans` để lập kế hoạch triển khai chi tiết, rồi có thể khai nhiều đại lý song song thực hiện các giai đoạn A–I.

---

## Đánh dấu quyết định & giới hạn còn lại

**Đã chốt:**
- Stack không đổi (React + Vite + Tailwind + Express + JSON DB).
- Bearer JWT HS256, secret từ `JWT_SECRET` (bắt buộc, không dùng default), expiry 24h, localStorage + header.
- Schema 6 collection chính (`users`, `employers`, `jobs`, `candidates`, `applications`, `savedJobs`) + 1 đối tượng cấu hình (`profile`); role chỉ trong `users`; `savedJobs` → `{candidateId, jobId[]}`.
- Matching heuristic 60% kỹ năng + 40% từ khóa, thang 0–100, fallback "không đủ dữ liệu" thay vì điểm 0.
- BI dựa trên trạng thái hiện tại, không lưu lịch sử chuyển trạng thái (ngoài phạm vi demo); gọi là tỷ lệ phân bố trạng thái đơn, không phải funnel thực sự.
- Golden dataset 20 cặp chỉ phục vụ demo, không khẳng định độ chính xác thực tế.
- Migration không tự tạo mật khẩu/tài khoản giả; kiểm tra dữ liệu thật trước khi quyết định.

**Giới hạn còn lại (chưa thể xác minh mà không chạy code):**
- Dữ liệu mẫu thực tế trong `server/data/db.json` chưa được kiểm tra chi tiết (cần migration phase A xem sự không tương thích thực).
- `bcryptjs`, `pdf-parse`, `chart.js` chưa có trong `package.json` (cần cài thêm).
- Hiệu năng JSON DB khi dữ liệu lớn chưa được đo lường.
- Khóa ghi in-memory mutex chưa được triển khai và đo lường.

---
*Vui lòng review spec v4 đã chỉnh sửa. Nếu đồng ý, tôi sẽ viết kế hoạch triển khai. Nếu cần sửa thêm, hãy chỉ ra phần cụ thể. Chưa triển khai code cho đến khi spec này được phê duyệt.*