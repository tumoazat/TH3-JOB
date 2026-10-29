# Báo cáo đánh giá Matching — CareerMatch AI

**Ngày:** 2026-10-29  
**Phương pháp:** Level 1 baseline (rule-based: skillScore 60% + keywordScore 40%)  
**Dữ liệu:** `server/data/db.json` — 50 công việc thật (ITviec), profile ứng viên mặc định + 3 synthetic candidates  
**Trạng thái ML:** `pending` — 40/40 cặp golden đã gán nhãn, đã huấn luyện Linear Regression, đánh giá leave-one-candidate-out hoàn thành. ML tốt hơn baseline trên test độc lập (MAE 0.1676 vs 0.2184) nhưng giữ `pending` vì 3/4 ứng viên là synthetic — cần CV thật và nhiều reviewer hơn trước khi kích hoạt. Baseline vẫn chạy làm chủ.

> Số liệu dưới đây là kết quả THỰC TẾ đo được khi chạy API `GET /api/match/all`, không phải số liệu dự kiến.  
> Mô hình Linear Regression đã được huấn luyện trên 40 cặp có nhãn và đánh giá độc lập theo leave-one-candidate-out (tránh rò rỉ train/test theo spec), nhưng KHÔNG được kích hoạt để claim hiệu quả thực tế cho đến khi có CV thật và nhiều reviewer độc lập.

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
| accuracy@band | `not_evaluated` (chưa có tập test độc lập đủ lớn) |
| MAE (in-sample) | `0.0905` (40 cặp, không độc lập) |
| MAE (leave-one-candidate-out) | `0.1676` (độc lập theo candidate) |
| Baseline MAE (leave-one-candidate-out) | `0.2184` |
| Skill Precision / Recall | `not_evaluated` |
| Coverage (baseline) | 50/50 job = 100% |
| Mô hình | `server/models/linear-match.json`, `modelVersion: pending` |
| Trạng thái phê duyệt | `pending` |

## 3. So sánh baseline với ML

| Mục | Baseline | ML |
|-----|----------|-----|
| Đã triển khai | Có | Không (pending) |
| Được đánh giá trên tập test độc lập | Không có tập test | Có (leave-one-candidate-out) |
| Số lượng mẫu đánh giá | 50 job (inference thực tế) | 40 cặp có nhãn (4 ứng viên) |
| MAE | `0.2184` (LOO) | `0.1676` (LOO) |
| Kết luận | Hoạt động đúng công thức | MAE tốt hơn baseline trên test độc lập, nhưng giữ `pending` vì 3/4 ứng viên synthetic |

ML có MAE thấp hơn baseline trên leave-one-candidate-out test (0.1676 < 0.2184) → đáp ứng tiêu chí "MAE không tệ hơn baseline và cải thiện một cách có ý nghĩa".  
Tuy nhiên, ML **không được kích hoạt** vì:
- 3/4 ứng viên (c_backend_java, c_data_analyst, c_qa_tester) là synthetic — spec cấm tạo số liệu đánh giá giả để claim mô hình hiệu quả thực tế.
- Chỉ 1 reviewer (spec khuyến nghị ≥20% tập có 2 người đánh giá để đo đồng thuận).
- Số lượng mẫu nhỏ (40 cặp, 4 ứng viên).

Giữ nguyên trạng thái `pending`, tiếp tục dùng baseline. Để kích hoạt ML cần: CV thật từ nhiều ứng viên, ≥2 reviewer độc lập, và đánh giá lại trên tập test độc lập.

## 4. Giới hạn

- 3/4 ứng viên golden là synthetic (mẫu test, KHÔNG phải CV thật) — dùng để kiểm tra luồng train/test, KHÔNG dùng claim hiệu quả ML thực tế.
- Không có nhãn người đánh giá độc lập (≥20% tập nên có 2 người đánh giá) → chỉ có 1 reviewer.
- Keywords tiếng Việt trong JD làm `keywordScore` thấp (thiếu stopword tiếng Việt đầy đủ, chưa stemming). Cần cải thiện tokenizer.
- Baseline dùng alias thủ công; chưa có từ điển kỹ năng đầy đủ.
- Số lượng mẫu nhỏ (40 cặp, 4 ứng viên) → kết quả chỉ mang tính thăm dò.

## 5. Kết luận

Baseline hoạt động đúng công thức `matchScore = 0.6 × skillScore + 0.4 × keywordScore`, xử lý dữ liệu thiếu đúng quy tắc (`null` khi không đủ, không gán điểm ảo), sắp xếp `match: null` cuối danh sách `/api/match/all`.  
Level 2 (ML) **không được kích hoạt** vì 3/4 ứng viên là synthetic và chỉ có 1 reviewer — giữ nguyên trạng thái `pending`, tiếp tục dùng baseline. Có thể kích hoạt sau khi bổ sung CV thật và nhiều reviewer độc lập.
