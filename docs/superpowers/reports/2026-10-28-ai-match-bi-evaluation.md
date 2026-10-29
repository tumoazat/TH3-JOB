# Báo cáo đánh giá Matching — CareerMatch AI

**Ngày:** 2026-10-29  
**Phương pháp:** Level 1 baseline (rule-based: skillScore 60% + keywordScore 40%)  
**Dữ liệu:** `server/data/db.json` — 50 công việc thật (ITviec), profile ứng viên mặc định  
**Trạng thái ML:** `insufficient_training_data` — 0/20 cặp golden có nhãn, chưa huấn luyện, chỉ chạy baseline.

> Số liệu dưới đây là kết quả THỰC TẾ đo được khi chạy API `GET /api/match/all`, không phải số liệu dự kiến.  
> Chưa có nhãn do người đánh giá cho golden dataset (0/20 cặp có nhãn), nên KHÔNG có `accuracy@band`, `MAE`, `Precision/Recall` cho mô hình ML.

## 1. Kết quả baseline đo được

### 1.1. Phân bố điểm (50 công việc)

| match | số lượng | jobId |
|-------|----------|-------|
| 21 | 1 | 13 |
| 20 | 2 | 12, 53 |
| 12 | 1 | 55 |
| 11 | 6 | 15, 22, 26, 30, 33, 54 |
| 10 | 7 | 14, 27, 28, 29, 32, 34, 45 |
| 1 | 14 | 7, 8, 9, 10, 11, 16, 20, 38, 41, 43, 44, 47, 50, 52 |
| 0 | 19 | 17, 18, 19, 21, 23, 24, 25, 31, 35, 36, 37, 39, 40, 42, 46, 48, 49, 51, 56 |

### 1.2. Phân bố band

| Band | Ngưỡng | Số lượng |
|------|--------|----------|
| Rất khớp | 90–100 | 0 |
| Khớp tốt | 80–89.99 | 0 |
| Khớp tiềm năng | 70–79.99 | 0 |
| Cần bổ sung | < 70 | 50 |

### 1.3. Data status

| Trạng thái | Số lượng |
|------------|----------|
| complete | 50 |
| partial | 0 |
| insufficient | 0 |

### 1.4. Ca lỗi

| Ca | Kết quả |
|----|---------|
| jobId không tồn tại | `404` |
| cvText rỗng khi `PUT /api/cv/manual` | `400` |
| PDF không hợp lệ / quá lớn | `400` / `422` |

## 2. Chỉ số đánh giá ML

| Chỉ số | Giá trị |
|--------|---------|
| accuracy@band | `not_evaluated` |
| MAE | `not_evaluated` |
| Skill Precision / Recall | `not_evaluated` |
| Coverage (baseline) | 50/50 job = 100% |

## 3. So sánh baseline với ML

| Mục | Baseline | ML |
|-----|----------|-----|
| Đã triển khai | Có | Không |
| Được đánh giá trên tập test độc lập | Không có tập test (không có nhãn) | Không có |
| Số lượng mẫu đánh giá | 50 job (inference thực tế) | 0 cặp có nhãn |
| Kết luận | Hoạt động đúng công thức | Không được triển khai |

ML **không được triển khai** vì chưa đủ dữ liệu gán nhãn — giữ nguyên trạng thái `insufficient_training_data`, tiếp tục dùng baseline.

## 4. Giới hạn

- Không có nhãn người đánh giá → không thể so sánh baseline vs ML, không thể tuyên bố mô hình hiệu quả.
- Keywords tiếng Việt trong JD làm `keywordScore` thấp (thiếu stopword tiếng Việt đầy đủ, chưa stemming). Cần cải thiện tokenizer.
- Baseline dùng alias thủ công; chưa có từ điển kỹ năng đầy đủ.
- Chưa có tập test độc lập → không thể tính `accuracy@band`, `MAE`.
- Golden dataset (20 c_pair) tham chiếu job 7–26 + candidate `profile`, nhưng labelScore/labelBand đều null — chờ nhóm reviewer gán nhãn theo `rubric.md`.

## 5. Kết luận

Baseline hoạt động đúng công thức `matchScore = 0.6 × skillScore + 0.4 × keywordScore`, xử lý dữ liệu thiếu đúng quy tắc (`null` khi không đủ, không gán điểm ảo), sắp xếp `match: null` cuối danh sách `/api/match/all`.  
Level 2 (ML) **không được triển khai** vì chưa đủ dữ liệu gán nhãn — giữ nguyên trạng thái `insufficient_training_data`, tiếp tục dùng baseline.
