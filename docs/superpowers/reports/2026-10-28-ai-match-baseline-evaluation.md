# Báo cáo đánh giá Matching — CareerMatch AI

**Ngày:** 2026-10-28  
**Phương pháp:** Level 1 baseline (rule-based: skillScore 60% + keywordScore 40%)  
**Dữ liệu:** seed `server/data/db.json` (6 job, profile + 5 candidate mẫu)  
**Trạng thái ML:** `insufficient_training_data` — chưa huấn luyện, chỉ chạy baseline.

> Số liệu dưới đây là kết quả THỰC TẾ đo được khi chạy API, không phải số liệu dự kiến.
> Chưa có nhãn do người đánh giá cho golden dataset (0/20 cặp có nhãn), nên KHÔNG có `accuracy@band`, `MAE`, `Precision/Recall` cho mô hình ML.

## 1. Kết quả baseline đo được

### 1.1. `POST /api/match` (jobId=1, profile mặc định, cvText rỗng → fallback bio)

```json
{
  "jobId": 1,
  "match": 50,
  "band": "Cần bổ sung",
  "method": "baseline",
  "modelVersion": null,
  "dataStatus": "complete",
  "matchedSkills": ["ReactJS", "Git", "Tailwind CSS"],
  "missingSkills": ["HTML5", "CSS3"],
  "explanation": { "skillScore": 60, "keywordScore": 34 }
}
```

Kiểm chứng công thức: `round(60*0.6 + 34*0.4) = round(36 + 13.6) = round(49.6) = 50`. ✅

### 1.2. `GET /api/match/all` (xếp giảm dần, `match: null` cuối)

| jobId | match | band | dataStatus |
|-------|-------|------|------------|
| 1 | 50 | Cần bổ sung | complete |
| 2 | 42 | Cần bổ sung | complete |
| 5 | 29 | Cần bổ sung | complete |
| 3 | 20 | Cần bổ sung | complete |
| 6 | 16 | Cần bổ sung | complete |
| 4 | 13 | Cần bổ sung | complete |

### 1.3. Sau khi nhập CV thủ công (`PUT /api/cv/manual`)

`match` jobId=1 = 40 (skillScore 60, keywordScore 11). `dataStatus` vẫn `complete`.
Ghi chú: `skillScore` lấy từ `profile.skills` (không đổi); `keywordScore` thay đổi theo `cvText` — đúng thiết kế hai nguồn dữ liệu tách biệt.

### 1.4. Ca lỗi

| Ca | Kết quả |
|----|---------|
| jobId không tồn tại (999) | `404` |
| cvText rỗng khi `PUT /api/cv/manual` | `400` |

## 2. Chỉ số đánh giá ML

| Chỉ số | Giá trị |
|--------|---------|
| accuracy@band | `not_evaluated` |
| MAE | `not_evaluated` |
| Skill Precision / Recall | `not_evaluated` |
| Coverage (baseline) | Toàn bộ 6 job có dữ liệu → 100% ở lần chạy này |

## 3. Giới hạn

- Không có nhãn người đánh giá → không thể so sánh baseline vs ML, không thể tuyên bố mô hình hiệu quả.
- Keywords tiếng Việt trong JD làm `keywordScore` thấp (thiếu stopword tiếng Việt đầy đủ, chưa stemming). Cần cải thiện tokenizer.
- Baseline dùng alias thủ công; chưa có từ điển kỹ năng đầy đủ.
- Chưa có `/api/cv/extract` (PDF) — cần `pdf-parse` (chưa cài).

## 4. Kết luận

Baseline hoạt động đúng công thức và xử lý dữ liệu thiếu đúng quy tắc. Level 2 (ML) **không được triển khai** vì chưa đủ dữ liệu gán nhãn — giữ nguyên trạng thái `insufficient_training_data`, tiếp tục dùng baseline.
