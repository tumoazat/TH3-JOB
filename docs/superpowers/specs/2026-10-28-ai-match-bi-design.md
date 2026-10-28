# Design Spec: AI Matching + BI Dashboard (TH3-X)

**Project:** CareerMatch AI — Hệ thống Tìm việc Thông minh tích hợp AI và BI  
**Date:** 2026-10-28  
**Status:** Revised (pending human review)  
**Repo:** https://github.com/tumoazat/TH3-JOB  
**Feedback incorporated:** Matching Score ×100, PDF text extraction, AI evaluation metrics, BI conversion formula, ERD relationships, access control & PII protection.

---

## 1. Goals & Success Criteria

Extend the existing React + Vite + Tailwind frontend and Express backend to satisfy the TH3 checklist:

1. **CSDL 3 thực thể:** Ứng viên, Nhà tuyển dụng, Tin tuyển dụng (schema rõ ràng trong `server/data/db.json`).
2. **Mô hình AI match:** Tính điểm tương thích CV ↔ JD (heuristic-based trong Node.js, thang 0–100, trích xuất văn bản từ PDF).
3. **Dashboard BI:** Trực quan hóa ứng viên theo kỹ năng, xu hướng lương, tỷ lệ chuyển đổi giữa các vòng tuyển dụng.
4. **API AI/BI:** Các endpoint mới tích hợp vào frontend hiện có.
5. **Kiểm thử & báo cáo:** Chạy thử với dữ liệu mẫu + báo cáo đánh giá mô hình gợi ý (bộ dữ liệu chuẩn, chỉ số đo).

---

## 2. Current State (baseline)

- Frontend: `src/` — 13 pages (landing, dashboard, job search/detail, CV analysis, matched jobs, application tracker, profile, employer dashboard, post job, candidate management, design system). Routing via `react-router-dom` in `src/main.tsx`.
- Backend: `server/index.ts` — Express + CORS, JSON file DB at `server/data/db.json`. Endpoints: `/api/jobs`, `/api/applications`, `/api/saved`, `/api/profile`, `/api/employer`, `/api/candidates`.
- Store: `window.VL` injected in `src/main.tsx` syncs from API on mount.

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
- Access control: role middleware on API routes; PII fields (email, phone, cvFileName) masked unless requester is owner or employer with an application to that candidate's job.

---

## 4. Data Model (`server/data/db.json`)

Schema formalized (additive, backward compatible):

```json
{
  "employers": [ { id, company, email, industry, size, role: "employer" } ],
  "jobs": [ { id, employerId, company, title, location, type, salary, tags[], description, requirements, benefits[], deadline, status, posted } ],
  "candidates": [ { id, name, university, skills[], gpa, graduationYear, cvFileName, email, phone, bio, cvText, role: "candidate" } ],
  "applications": [ { id, jobId, candidateId, employerId, status, appliedDate, note, matchScore } ],
  "savedJobs": [ { candidateId, jobId[] } ],
  "profile": { ... }
}
```

**Quan hệ (ERD):**
- `employer` 1→N `jobs` qua `employerId`.
- `candidate` 1→N `applications` qua `candidateId` (một ứng viên ứng tuyển nhiều tin).
- `job` 1→N `applications` qua `jobId` (một tin có nhiều đơn ứng tuyển).
- `application` liên kết `candidate` + `job` + `employer` (để tra cứu nhanh).
- `savedJobs` liên kết `candidateId` với mảng `jobId[]` đã lưu.
- `cvText` là nội dung trích xuất từ file PDF, dùng để tính match (không lưu PII nhạy cảm ngoài email/phone cần bảo vệ).

---

## 5. AI Matching Model (`POST /api/match`)

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

## 6. BI Dashboard (`GET /api/bi/stats`)

Aggregations từ `db.json`:

| Chỉ số | Nguồn | Công thức | Trực quan hoá |
|--------|-------|-----------|---------------|
| Ứng viên theo kỹ năng | `candidates[].skills[]` | Đếm tần suất mỗi kỹ năng | Bar chart (top 10) |
| Xu hướng lương | `jobs[].salary` parse range | Trung bình min/max theo khu vực | Histogram / thang thang |
| Tỷ lệ chuyển đổi vòng 1 | `applications[]` | interview / total applications | Donut |
| Tỷ lệ chuyển đổi vòng 2 | `applications[]` | offer / interview | Donut |
| Tỷ lệ chốt Offer | `applications[]` | offer / total applications | Stat card |
| Ứng viên theo trường | `candidates[].university` | Đếm theo trường ĐH | Bar chart |
| Tin đang mở / tạm dừng / hết hạn | `jobs[].status`, `deadline` | Đếm theo trạng thái | Stat cards |

**Công thức tỷ lệ chuyển đổi:**
- `CR1 = count(status='interview') / count(status='applied')` (ứng tuyển → phỏng vấn)
- `CR2 = count(status='offer') / count(status='interview')` (phỏng vấn → offer)
- `CR3 = count(status='offer') / count(status='applied')` (ứng tuyển → offer)

Frontend: trang `/bi-dashboard.html` vẽ bằng **Chart.js** (thêm vào `package.json`), stat cards, lọc theo nhà tuyển dụng.

---

## 7. API Contracts (mới)

| Endpoint | Method | Input | Output | Quyền truy cập |
|----------|--------|-------|--------|----------------|
| `/api/cv/extract` | POST | file PDF | `{ cvText: string }` | candidate owner |
| `/api/match` | POST | `{ candidateId, jobId }` | `{ match, band, reason[], matchedSkills[], missingSkills[] }` | candidate/employer |
| `/api/match/all` | GET | `?candidateId=` | list `{ jobId, match, band }` giảm dần | candidate |
| `/api/bi/stats` | GET | none | `{ skillsDistribution, salaryDistribution, statusDistribution, universityDistribution, conversionRates }` | employer/admin |
| `/api/candidates/:id` | GET | none | candidate profile (PII masked unless owner/employer with application) | candidate/employer/admin |

Các endpoint hiện có giữ nguyên.

---

## 8. Bảo mật & Phân quyền

- **Middleware role:** `student`, `employer`, `admin` gán từ `profile.role` / `employers[].role`.
- **PII protection:** `email`, `phone`, `cvFileName`, `cvText` chỉ hiển thị đầy đủ với (a) chủ sở hữu ứng viên, (b) nhà tuyển dụng đã có đơn ứng tuyển đối với ứng viên đó. Các trường khác bị mask (`****@****.com`, `09xx xxxx xx`).
- **Access log:** ghi nhận `userId`, `endpoint`, `timestamp` cho mỗi truy cập PII (để báo cáo bảo mật).
- Không lưu mật khẩu dạng văn bản thuần (nếu có auth sau này) — demo hiện tại dùng role giả định.

---

## 9. Frontend Changes

- `src/pages/PageAIMatch.tsx` — `/ai-match.html`: chọn ứng viên + công việc, gọi `/api/match`, hiển thị điểm + kỹ năng phù hợp/thiếu + nút "Ứng tuyển ngay".
- `src/pages/PageBIDashboard.tsx` — `/bi-dashboard.html`: biểu đồ từ `/api/bi/stats`, thẻ chỉ số, lọc theo nhà tuyển dụng.
- `src/main.tsx`: đăng ký 2 route mới + ánh xạ `routeByText` ("dashboard BI", "ai match", "xem báo cáo BI").
- Dashboard nhà tuyển dụng (trang 10): thêm liên kết "Xem báo cáo BI" → `/bi-dashboard.html`.

---

## 9. Kiểm thử & Đánh giá AI (Checklist item 5)

**Dữ liệu mẫu:** seed `db.json` với ≥10 công việc, ≥15 ứng viên, trộn trạng thái đơn (áp dụng, phỏng vấn, offer, từ chối).

**Bộ dữ liệu chuẩn (golden dataset):** 20 cặp CV-JD có điểm/band dự kiến đã định sẵn (do nhân viên HR đánh giá trước).

**Chỉ số đo:**
- `accuracy@band`: tỷ lệ cặp dự đoán đúng band so với golden dataset.
- `precision/recall kỹ năng`: kỹ năng khớp dự đoán so với kỹ năng gắn thẻ chuẩn.
- `MAE điểm số`: sai số tuyệt đối trung bình giữa `match` dự đoán và điểm thủ công.

**Luồng chạy thử:** nhà tuyển dụng đăng tin → ứng viên nộp đơn → gọi `/api/match` → kiểm tra điểm/band khớp mong đợi → kiểm tra `/api/bi/stats` phản ánh dữ liệu mới.

**Báo cáo:** `docs/superpowers/reports/2026-10-28-ai-match-bi-evaluation.md` — input/output mẫu, chỉ số đánh giá, mô tả biểu đồ BI, hạn chế (heuristic không bắt được ngữ nghĩa ngữ cảnh).

---

## 10. Giai đoạn triển khai (có thể song song sau khi phê duyệt kế hoạch)

| Giai đoạn | Công việc | Đại lý |
|-----------|-----------|--------|
| A | Formalize schema CSDL + seed dữ liệu mẫu | backend |
| B | Endpoint `/api/cv/extract` (pdf-parse) | backend |
| C | Endpoint `/api/match` + `/api/match/all` | backend |
| D | Endpoint `/api/bi/stats` + công thức chuyển đổi | backend |
| E | Middleware phân quyền + mask PII | backend |
| F | Trang `PageAIMatch.tsx` + route | frontend |
| G | Trang `PageBIDashboard.tsx` + route + Chart.js | frontend |
| H | Nối dashboard nhà tuyển dụng → báo cáo BI | frontend |
| I | Chạy thử cuối cùng + báo cáo đánh giá | qa |

---

## 11. Rủi ro & Giảm thiểu

- **Chất lượng match heuristic:** có thể đánh giá sai sự phù hợp ngữ nghĩa. Giảm thiểu: mục `reason[]` rõ ràng, ghi chép là demo dựa trên quy tắc, có hướng nâng cấp sang vector model.
- **CSDL JSON không tương tác:** đọc/ghi tệp đơn không có transaction. Giảm thiểu: chấp nhận với quy mô demo, ghi chú trong báo cáo.
- **Dấu tiếng Việt:** ánh xạ bảng đơn giản bao gồm các ký tự phổ biến.
- **Trích xuất PDF thất bại:** nếu file bị mã hóa/hình ảnh, trả về lỗi rõ ràng và hỏi người dùng nhập văn bản thủ công.

---

## 12. Giai đoạn tiếp theo (chờ duyệt spec)

Sau khi bạn duyệt spec này, tôi sẽ gọi skill `writing-plans` để lập kế hoạch triển khai chi tiết, rồi có thể khai nhiều đại lý song song thực hiện các giai đoạn A–I.

---
*Vui lòng review spec đã chỉnh sửa. Nếu đồng ý, tôi sẽ viết kế hoạch triển khai. Nếu cần sửa thêm, hãy chỉ ra phần cụ thể.*