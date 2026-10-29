# Báo cáo đánh giá Matching — CareerMatch AI

**Ngày:** 2026-10-29  
**Phương pháp:** Level 1 baseline (rule-based: skillScore 60% + keywordScore 40%)  
**Dữ liệu:** `server/data/db.json` — 50 công việc thật (ITviec), profile ứng viên mặc định  
**Trạng thái ML:** `pending_approval` — 20/20 cặp golden đã gán nhãn, đã huấn luyện Linear Regression, chờ so sánh độc lập trước khi kích hoạt. Baseline vẫn chạy làm chủ.

> Số liệu dưới đây là kết quả THỰC TẾ đo được khi chạy API `GET /api/match/all`, không phải số liệu dự kiến.  
> Golden dataset đã có 20/20 cặp gán nhãn theo rubric, mô hình Linear Regression đã được huấn luyện (in-sample) nhưng **chưa được kích hoạt** — cần đánh giá trên tập test độc lập và so sánh với baseline trước khi phê duyệt.

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
| accuracy@band | `not_evaluated` (chưa có tập test độc lập) |
| MAE | `0.037` (in-sample trên 20 cặp, không phải độc lập) |
| Skill Precision / Recall | `not_evaluated` |
| Coverage (baseline) | 50/50 job = 100% |
| Mô hình | `server/models/linear-match.json`, `modelVersion: pending` |

## 3. So sánh baseline với ML

| Mục | Baseline | ML |
|-----|----------|-----|
| Đã triển khai | Có | Không (pending phê duyệt) |
| Được đánh giá trên tập test độc lập | Không có tập test | Không (training in-sample, có rò rỉ candidate) |
| Số lượng mẫu đánh giá | 50 job (inference thực tế) | 20 cặp có nhãn (in-sample) |
| Kết luận | Hoạt động đúng công thức | Không được kích hoạt — chưa qua kiểm tra độc lập |

ML **không được triển khai** vì: (1) chưa có tập test độc lập — tất cả 20 cặp dùng cùng candidate `profile`, vi phạm quy tắc chia tập theo spec; (2) chưa so sánh được với baseline trên test độc lập. Giữ nguyên trạng thái `pending_approval`, tiếp tục dùng baseline.

## 4. Giới hạn

- Rò rỉ train/test: tất cả 20 cặp golden dùng cùng candidate `profile`, không thể chia tập độc lập theo quy tắc spec (cùng CV không xuất hiện ở cả train và test). Cần thu thập CV từ nhiều ứng viên khác.
- Không có nhãn người đánh giá độc lập (≥20% tập nên có 2 người đánh giá để đo đồng thuận) → chỉ có 1 reviewer.
- Keywords tiếng Việt trong JD làm `keywordScore` thấp (thiếu stopword tiếng Việt đầy đủ, chưa stemming). Cần cải thiện tokenizer.
- Baseline dùng alias thủ công; chưa có từ điển kỹ năng đầy đủ.
- Chưa có tập test độc lập → không thể tính `accuracy@band`, `MAE` đáng tin cậy.

## 5. Kết luận

Baseline hoạt động đúng công thức `matchScore = 0.6 × skillScore + 0.4 × keywordScore`, xử lý dữ liệu thiếu đúng quy tắc (`null` khi không đủ, không gán điểm ảo), sắp xếp `match: null` cuối danh sách `/api/match/all`.  
Level 2 (ML) **không được triển khai** vì chưa vượt qua kiểm tra độc lập và chưa so sánh được với baseline — giữ nguyên trạng thái `pending_approval`, tiếp tục dùng baseline.
