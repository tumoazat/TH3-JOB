# Design Spec: AI Matching + BI Dashboard (TH3-X)

**Project:** CareerMatch AI — Hệ thống Tìm việc Thông minh tích hợp AI và BI  
**Date:** 2026-10-28  
**Status:** Revised v2 (pending human review)  
**Repo:** https://github.com/tumoazat/TH3-JOB  
**Feedback incorporated:** Matching Score ×100, PDF limits/error handling, AI evaluation scope caveat, BI conversion denominator, CSDL compatibility check, real authentication (no self-assigned role), access control & PII protection.

---

## 1. Goals & Success Criteria

Extend the existing React + Vite + Tailwind frontend and Express backend to satisfy the TH3 checklist:

1. **CSDL 3 thực thể:** Ứng viên, Nhà tuyển dụng, Tin tuyển dụng (schema rõ ràng trong `server/data/db.json`, tương thích dữ liệu mẫu hiện có).
2. **Mô hình AI match:** Tính điểm tương thích CV ↔ JD (heuristic-based trong Node.js, thang 0–100, trích xuất văn bản từ PDF, có giới hạn file/lỗi).
3. **Dashboard BI:** Trực quan hóa ứng viên theo kỹ năng, xu hướng lương, tỷ lệ chuyển đổi giữa các vòng tuyển dụng (công thức thống nhất).
4. **API AI/BI:** Các endpoint mới tích hợp vào frontend hiện có.
5. **Kiểm thử & báo cáo:** Chạy thử với dữ liệu mẫu + báo cáo đánh giá mô hình gợi ý (rõ ràng đây là demo, không khẳng định độ chính xác thực tế).
6. **Bảo mật:** Xác thực danh tính thực sự (không cho tự đổi role), phân quyền, bảo vệ PII.

---

## 2. Current State (baseline)

- Frontend: `src/` — 13 pages (landing, dashboard, job search/detail, CV analysis, matched jobs, application tracker, profile, employer dashboard, post job, candidate management, design system). Routing via `react-router-dom` in `src/main.tsx`.
- Backend: `server/index.ts` — Express + CORS, JSON file DB at `server/data/db.json`. Endpoints: `/api/jobs`, `/api/applications`, `/api/saved`, `/api/profile`, `/api/employer`, `/api/candidates`.
- Store: `window.VL` injected in `src/main.tsx` syncs from API on mount.
- **Không có xác thực danh tính thực tế:** role hiện chỉ là trường giả định trong JSON, không có login/session/token.

---

## 3. Architecture

```
┌──────────────┐      HTTP      ┌─────────────────────┐
│ React SPA    │◄───────────────►│ Express (port 5000) │
│ (Vite, port  │                 │                     │
│  5173)       │                 │ server/index.ts     │
└──────────────┘                 │ - GET/POST /api/*   │
                                 │ - readDB/writeDB    │
                                 │ - auth middleware   │
                                 └──────────┬──────────┘
                                            │
                                            ▼
                                     server/data/db.json
```

- Single server (Express) already running on port 5000; frontend proxies to `API_BASE = 'http://localhost:5000/api'`.
- No new frameworks/languages. AI = deterministic heuristic in Node (stdlib + `pdf-parse` for PDF text). BI = aggregation over the same JSON DB.
- UI additions: 2 new routes (`/ai-match.html`, `/bi-dashboard.html`) + updated employer dashboard charts.
- **Auth:** thêm session/cookie đơn giản (express-session) hoặc Bearer token trong demo, role chỉ được gán bởi server khi login, client không thể tự thiết lập role.

---

## 4. Data Model (`server/data/db.json`)

Schema formalized (additive, backward compatible). **Trước khi triển khai phải kiểm tra dữ liệu mẫu hiện có có tương thích schema này hay không (xem mục 11).**

```json
{
  "users": [ { id, email, passwordHash, role: "student"|"employer"|"admin", createdAt } ],
  "employers": [ { id, userId, company, email, industry, size } ],
  "jobs": [ { id, employerId, company, title, location, type, salary, tags[], description, requirements, benefits[], deadline, status, posted } ],
  "candidates": [ { id, userId, name, university, skills[], gpa, graduationYear, cvFileName, email, phone, bio, cvText, role: "candidate" } ],
  "applications": [ { id, jobId, candidateId, employerId, status, appliedDate, note, matchScore } ],
  "savedJobs": [ { candidateId, jobId[] } ],
  "profile": { ... }
}
```

**Quan hệ (ERD):**
- `users` 1→1 `employers` / `candidates` qua `userId` (một tài khoản là một employeer hoặc một candidate).
- `employer` 1→N `jobs` qua `employerId`.
- `candidate` 1→N `applications` qua `candidateId` (một ứng viên ứng tuyển nhiều tin).
- `job` 1→N `applications` qua `jobId` (một tin có nhiều đơn ứng tuyển).
- `application` liên kết `candidate` + `job` + `employer` (để tra cứu nhanh).
- `savedJobs` liên kết `candidateId` với mảng `jobId[]` đã lưu.
- `cvText` là nội dung trích xuất từ file PDF, dùng để tính match (không lưu PII nhạy cảm ngoài email/phone cần bảo vệ).

**Tương thích dữ liệu mẫu hiện có:**
- Kiểm tra `savedJobs` hiện đang là mảng số `[jobId]` — cần đổi thành `{ candidateId, jobId[] }` hoặc giữ mảng số và liên kết qua session userId hiện tại. **Quyết định:** giữ `savedJobs` là mảng số `[jobId]` gắn với `userId` của candidate đang đăng nhập (đã có trong session), không thay đổi cấu trúc để giảm rủi ro.
- `postedJobs` hiện có sẵn — giữ lại, ánh xạ sang `jobs` khi cần.
- `applications` hiện có sẵn — bổ sung `employerId`, `matchScore`.

---

## 5. Xác thực & Phân quyền (bảo đảm không tự đổi role)

- **Đăng nhập thực tế:** thêm endpoint `POST /api/auth/login` nhận `{ email, password }`, tra cứu trong `users`, verify password hash, tạo session (express-session) hoặc trả về token, lưu `role` vào session/server-side. **Không để client tự đặt role.**
- **Middleware `requireRole(roles)`:** kiểm tra `req.session.user.role` trước khi cho truy cập endpoint. Role chỉ thay đổi khi admin can thiệp trực tiếp vào DB, không có endpoint cho user tự đổi role của mình.
- **PII protection:** `email`, `phone`, `cvFileName`, `cvText` chỉ hiển thị đầy đủ với (a) chủ sở hữu ứng viên, (b) nhà tuyển dụng đã có đơn ứng tuyển đối với ứng viên đó. Các trường khác bị mask (`****@****.com`, `09xx xxxx xx`).
- **Access log:** ghi nhận `userId`, `endpoint`, `timestamp`, `ip` cho mỗi truy cập PII.
- **Rate limit:** giới hạn số lần gọi `/api/cv/extract` và `/api/match` mỗi IP để tránh lạm dụng.

---

## 6. AI Matching Model (`POST /api/match`)

**Approach:** Keyword overlap heuristic (ponytail — stdlib + `pdf-parse` only, no ML libs).

Inputs: `candidate.skills[]`, `candidate.cvText` (từ PDF), `job.tags[]`, `job.description`, `job.requirements`.

Algorithm:
1. **PDF extraction:** `POST /api/cv/extract` nhận file PDF, dùng `pdf-parse` trích xuất văn bản thô → lưu vào `candidate.cvText`.
2. Normalize text (lowercase, trim, bỏ dấu tiếng Việt qua bảng ánh xạ đơn giản).
3. Tokenize kỹ năng/tags thành tập từ.
4. `skillScore = |candidate.skills ∩ job.tags| / |job.tags|` (0–1).
5. `keywordScore` = số từ khóa trong JD xuất hiện trong `cvText` / tổng từ khóa JD (0–1).
6. `match = round((skillScore * 0.6 + keywordScore * 0.4) * 100)` → thang **0–100**.
7. Band: ≥90 "Rất khớp", ≥80 "Khớp tốt", ≥70 "Khớp tiềm năng", <70 "Cần bổ sung".

Output: `{ jobId, match, band, reason: string[], matchedSkills[], missingSkills[] }`.

**Rule-based justification:** deterministic, giải thích được, chi phí cài đặt thấp, hoạt động ngoại tuyến — phù hợp demo sinh viên. Nâng cấp sau: thay bằng mô hình vector/semantic.

---

## 7. PDF Extraction (`POST /api/cv/extract`) — Giới hạn & Xử lý lỗi

- **Chỉ cho phép loại file:** `.pdf` (kiểm tra extension + MIME type).
- **Giới hạn dung lượng:** tối đa 5 MB mỗi file.
- **Xử lý lỗi:**
  - File không phải PDF hoặc quá lớn → trả về `400` với thông báo rõ ràng.
  - PDF mã hóa / bị hỏng / không có văn bản đọc được → `pdf-parse` ném lỗi → bắt lỗi và trả về `422` với thông báo "Không thể trích xuất văn bản từ PDF. Vui lòng nhập thông tin CV thủ công."
  - Fallback: cho phép người dùng nhập `cvText` thủ công qua form khi extraction thất bại.

---

## 8. BI Dashboard (`GET /api/bi/stats`)

Aggregations từ `db.json`:

| Chỉ số | Nguồn | Công thức | Trực quan hoá |
|--------|-------|-----------|---------------|
| Ứng viên theo kỹ năng | `candidates[].skills[]` | Đếm tần suất mỗi kỹ năng | Bar chart (top 10) |
| Xu hướng lương | `jobs[].salary` parse range | Trung bình min/max theo khu vực | Histogram / thang thang |
| Tỷ lệ chuyển đổi vòng 1 | `applications[]` | `count(status='interview') / countTổngĐơn` | Donut |
| Tỷ lệ chuyển đổi vòng 2 | `applications[]` | `count(status='offer') / count(status='interview')` | Donut |
| Tỷ lệ chốt Offer | `applications[]` | `count(status='offer') / countTổngĐơn` | Stat card |
| Ứng viên theo trường | `candidates[].university` | Đếm theo trường ĐH | Bar chart |
| Tin đang mở / tạm dừng / hết hạn | `jobs[].status`, `deadline` | Đếm theo trạng thái | Stat cards |

**Công thức tỷ lệ chuyển đổi (thống nhất):**
- `countTổngĐơn = count(status IN ['applied','reviewing','interview','offer','rejected'])` — tất cả đơn đã nộp (không chỉ status='applied' hiện tại, tránh mẫu số co fühl khi đơn đã chuyển sang trạng thái khác).
- `CR1 = count(status='interview') / countTổngĐơn` (ứng tuyển → phỏng vấn)
- `CR2 = count(status='offer') / count(status='interview')` (phỏng vấn → offer)
- `CR3 = count(status='offer') / countTổngĐơn` (ứng tuyển → offer)

Frontend: trang `/bi-dashboard.html` vẽ bằng **Chart.js** (thêm vào `package.json`), stat cards, lọc theo nhà tuyển dụng.

---

## 9. API Contracts (mới)

| Endpoint | Method | Input | Output | Quyền truy cập |
|----------|--------|-------|--------|----------------|
| `/api/auth/login` | POST | `{ email, password }` | `{ user, role, token }` | public |
| `/api/auth/me` | GET | session/token | `{ user, role }` | authenticated |
| `/api/cv/extract` | POST | file PDF | `{ cvText: string }` | candidate owner |
| `/api/match` | POST | `{ candidateId, jobId }` | `{ match, band, reason[], matchedSkills[], missingSkills[] }` | candidate/employer |
| `/api/match/all` | GET | `?candidateId=` | list `{ jobId, match, band }` giảm dần | candidate |
| `/api/bi/stats` | GET | none | `{ skillsDistribution, salaryDistribution, statusDistribution, universityDistribution, conversionRates }` | employer/admin |
| `/api/candidates/:id` | GET | none | candidate profile (PII masked unless owner/employer with application) | candidate/employer/admin |

Các endpoint hiện có giữ nguyên.

---

## 10. Frontend Changes

- `src/pages/PageAIMatch.tsx` — `/ai-match.html`: chọn ứng viên + công việc, gọi `/api/match`, hiển thị điểm + kỹ năng phù hợp/thiếu + nút "Ứng tuyển ngay".
- `src/pages/PageBIDashboard.tsx` — `/bi-dashboard.html`: biểu đồ từ `/api/bi/stats`, thẻ chỉ số, lọc theo nhà tuyển dụng.
- `src/main.tsx`: đăng ký 2 route mới + ánh xạ `routeByText` ("dashboard BI", "ai match", "xem báo cáo BI").
- Dashboard nhà tuyển dụng (trang 10): thêm liên kết "Xem báo cáo BI" → `/bi-dashboard.html`.
- Thêm trang đăng nhập đơn giản (nếu chưa có) và gắn session vào mọi yêu cầu API.

---

## 11. Kiểm thử & Đánh giá AI (Checklist item 5)

**Dữ liệu mẫu:** seed `db.json` với ≥10 công việc, ≥15 ứng viên, trộn trạng thái đơn (áp dụng, phỏng vấn, offer, từ chối).

**Bộ dữ liệu chuẩn (golden dataset):** 20 cặp CV-JD có điểm/band dự kiến đã định sẵn (do nhân viên HR đánh giá trước). **Ràng buộc:** đây chỉ là demo internship, 20 cặp chưa đủ để khẳng định độ chính xác của mô hình trên thực tế; báo cáo phải nêu rõ hạn chế này.

**Chỉ số đo:**
- `accuracy@band`: tỷ lệ cặp dự đoán đúng band so với golden dataset.
- `precision/recall kỹ năng`: kỹ năng khớp dự đoán so với kỹ năng gắn thẻ chuẩn.
- `MAE điểm số`: sai số tuyệt đối trung bình giữa `match` dự đoán và điểm thủ công.

**Luồng chạy thử:** nhà tuyển dụng đăng tin → ứng viên nộp đơn → gọi `/api/match` → kiểm tra điểm/band khớp mong đợi → kiểm tra `/api/bi/stats` phản ánh dữ liệu mới.

**Báo cáo:** `docs/superpowers/reports/2026-10-28-ai-match-bi-evaluation.md` — input/output mẫu, chỉ số đánh giá, mô tả biểu đồ BI, hạn chế (heuristic không bắt được ngữ nghĩa ngữ cảnh; 20 cặp golden dataset chỉ phục vụ demo internship).

---

## 12. Giai đoạn triển khai (có thể song song sau khi phê duyệt kế hoạch)

| Giai đoạn | Công việc | Đại lý |
|-----------|-----------|--------|
| A | Kiểm tra tương thích dữ liệu mẫu + formalize schema CSDL | backend |
| B | Đăng nhập / session + middleware phân quyền (không tự đổi role) | backend |
| C | Endpoint `/api/cv/extract` (pdf-parse + giới hạn/lỗi) | backend |
| D | Endpoint `/api/match` + `/api/match/all` | backend |
| E | Endpoint `/api/bi/stats` + công thức chuyển đổi | backend |
| F | Mask PII + access log | backend |
| G | Trang `PageAIMatch.tsx` + route | frontend |
| H | Trang `PageBIDashboard.tsx` + route + Chart.js | frontend |
| I | Nối dashboard nhà tuyển dụng → báo cáo BI | frontend |
| J | Chạy thử cuối cùng + báo cáo đánh giá | qa |

---

## 13. Rủi ro & Giảm thiểu

- **Chất lượng match heuristic:** có thể đánh giá sai sự phù hợp ngữ nghĩa. Giảm thiểu: mục `reason[]` rõ ràng, ghi chép là demo dựa trên quy tắc, có hướng nâng cấp sang vector model.
- **CSDL JSON không tương tác:** đọc/ghi tệp đơn không có transaction. Giảm thiểu: chấp nhận với quy mô demo; ghi chú trong báo cáo.
- **Dấu tiếng Việt:** ánh xạ bảng đơn giản bao gồm các ký tự phổ biến.
- **Trích xuất PDF thất bại:** nếu file bị mã hóa/hình ảnh, trả về lỗi rõ ràng và hỏi người dùng nhập văn bản thủ công.
- **Role giả định không an toàn:** bắt buộc phải có đăng nhập thực tế trước khi cho truy cập API match/BI/PII.

---

## 14. Giai đoạn tiếp theo (chờ duyệt spec)

Sau khi bạn duyệt spec này, tôi sẽ gọi skill `writing-plans` để lập kế hoạch triển khai chi tiết, rồi có thể khai nhiều đại lý song song thực hiện các giai đoạn A–J.

---
*Vui lòng review spec đã chỉnh sửa. Nếu đồng ý, tôi sẽ viết kế hoạch triển khai. Nếu cần sửa thêm, hãy chỉ ra phần cụ thể.*