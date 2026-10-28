# Design Spec: AI Matching + BI Dashboard (TH3-X)

**Project:** CareerMatch AI — Hệ thống Tìm việc Thông minh tích hợp AI và BI  
**Date:** 2026-10-28  
**Status:** Proposed (pending human review)  
**Repo:** https://github.com/tumoazat/TH3-JOB

---

## 1. Goals & Success Criteria

Extend the existing React + Vite + Tailwind frontend and Express backend to satisfy the TH3 checklist:

1. **CSDL 3 thực thể:** Ứng viên, Nhà tuyển dụng, Tin tuyển dụng (schema rõ ràng trong `server/data/db.json`).
2. **Mô hình AI match:** Tính điểm tương thích CV ↔ JD (heuristic-based trong Node.js, không thêm công nghệ mới).
3. **Dashboard BI:** Trực quan hóa ứng viên theo kỹ năng, xu hướng lương, tỷ lệ chuyển đổi tuyển dụng.
4. **API AI/BI:** Các endpoint mới tích hợp vào frontend hiện có.
5. **Kiểm thử & báo cáo:** Chạy thử với dữ liệu mẫu + báo cáo đánh giá mô hình gợi ý.

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
                                 └──────────┬──────────┘
                                            │
                                            ▼
                                     server/data/db.json
```

- Single server (Express) already running on port 5000; frontend proxies to `API_BASE = 'http://localhost:5000/api'`.
- No new frameworks/languages. AI = deterministic heuristic in Node. BI = aggregation over the same JSON DB.
- UI additions: 2 new routes (`/ai-match.html`, `/bi-dashboard.html`) + updated employer dashboard charts.

---

## 4. Data Model (`server/data/db.json`)

Schema formalized (additive, backward compatible):

```json
{
  "jobs": [ { id, company, title, location, type, salary, match, deadline, tags[], description, requirements, benefits[], posted } ],
  "candidates": [ { id, name, university, skills[], gpa, graduationYear, cvFileName, email, phone, status, appliedDate, jobId } ],
  "employers": [ { id, company, email, industry, size } ],
  "jobs_by_employer": [ { employerId, jobId[] } ],
  "applications": [ { id, jobId, candidateId, status, appliedDate, note } ],
  "savedJobs": [ number ],
  "profile": { ... }
}
```

- `jobs_by_employer` replaces/derives from existing `postedJobs`.
- `candidates` populated from `applications` + employer-sourced profiles.

---

## 5. AI Matching Model (`POST /api/match`)

**Approach:** Keyword overlap heuristic (ponytail — stdlib only, no ML libs).

Inputs: `candidate.skills[]`, `cvFileName` text hints, `job.tags[]`, `job.description`, `job.requirements`.

Algorithm:
1. Normalize text (lowercase, trim, remove diacritics via simple map).
2. Tokenize skills/tags into sets.
3. `skillScore = |candidate.skills ∩ job.tags| / |job.tags|` (0–1).
4. `keywordScore` = count of job keywords found in CV text / total job keywords.
5. `match = round(skillScore*0.6 + keywordScore*0.4)` → 0–100.
6. Band: ≥90 "Rất khớp", ≥80 "Khớp tốt", ≥70 "Khớp tiềm năng", <70 "Cần bổ sung".

Output: `{ jobId, match, band, reason: string[], matchedSkills[], missingSkills[] }`.

**Rule-based justification:** deterministic, explainable, zero install cost, works offline — suitable for a student demo. Future upgrade path: replace with vector/semantic model.

---

## 6. BI Dashboard (`GET /api/bi/stats`)

Aggregations from `db.json`:

| Metric | Source | Visualization |
|--------|--------|---------------|
| Ứng viên theo kỹ năng | `candidates[].skills[]` | Bar chart (top 10 skills) |
| Xu hướng lương | `jobs[].salary` parsed ranges | Histogram / box summary |
| Tỷ lệ chuyển đổi | `applications[].status` counts | Donut (reviewing/interview/offer/rejected) |
| Ứng viên theo trường | `candidates[].university` | Bar chart |
| Tin đang mở / tạm dừng / hết hạn | `jobs[].deadline` vs today | Stat cards |

Frontend: new `/bi-dashboard.html` route rendering charts with **Chart.js** (one new dependency) or inline SVG to avoid deps — decision: use Chart.js via CDN in the HTML page to keep `package.json` minimal, or add to package.json. Decision: add `chart.js` to `package.json` and import in the BI page component (consistent with existing Vite build).

---

## 7. API Contracts (new)

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/match` | POST | `{ candidateId, jobId }` | `{ match, band, reason[], matchedSkills[], missingSkills[] }` |
| `/api/match/all` | GET | `?candidateId=` | list of `{ jobId, match, band }` sorted desc |
| `/api/bi/stats` | GET | none | `{ skillsDistribution, salaryDistribution, statusDistribution, universityDistribution }` |

Existing endpoints unchanged.

---

## 8. Frontend Changes

- `src/pages/PageAIMatch.tsx` — `/ai-match.html`: pick candidate + job, call `/api/match`, show score + matched/missing skills + "Ứng tuyển ngay" action.
- `src/pages/PageBIDashboard.tsx` — `/bi-dashboard.html`: charts from `/api/bi/stats`, stat cards, filter by employer.
- `src/main.tsx`: register 2 new routes + add link mappings in `routeByText` ("dashboard BI", "ai match", "xem báo cáo BI").
- Employer dashboard (page 10): add "Xem báo cáo BI" link → `/bi-dashboard.html`.

---

## 9. Testing & Evaluation (Checklist item 5)

- Seed `db.json` with ≥10 jobs, ≥15 candidates, mixed statuses.
- Manual flow: employer posts job → candidate applies → run `/api/match` → verify score band matches expectation → verify `/api/bi/stats` reflects new data.
- Report: `docs/superpowers/reports/2026-10-28-ai-match-bi-evaluation.md` — sample input/output, match accuracy notes, BI chart screenshots (described), limitations.

---

## 10. Implementation Phases (parallelizable after plan approval)

| Phase | Work | Agent |
|-------|------|-------|
| A | DB schema formalize + seed data | backend |
| B | `/api/match` + `/api/match/all` endpoints | backend |
| C | `/api/bi/stats` endpoint | backend |
| D | `PageAIMatch.tsx` + route | frontend |
| E | `PageBIDashboard.tsx` + route + Chart.js | frontend |
| F | Wire employer dashboard → BI link | frontend |
| G | End-to-end demo + evaluation report | qa |

---

## 11. Risks & Mitigations

- **Heuristic match quality:** may mis-score semantic fits. Mitigation: clear "reason[]" explanations; documented as rule-based demo.
- **JSON DB concurrency:** single-file read/write is not transactional. Mitigation: acceptable for demo scale; note in report.
- **Vietnamese diacritics:** normalization map covers common chars.

---

**Next step after approval:** invoke `writing-plans` skill to create the implementation plan, then optionally spawn parallel agents for Phases A–G.

---
*Review requested: please confirm this spec before I write the implementation plan.*