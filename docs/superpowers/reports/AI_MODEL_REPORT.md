# AI Model Report — CareerMatch AI

## 1. Mô hình ML đã xây dựng

| Thành phần | Chi tiết |
|------------|----------|
| Mục tiêu | Phân loại mức độ phù hợp CV–JD thành 4 nhãn: 0=Không phù hợp, 1=Phù hợp một phần, 2=Phù hợp, 3=Rất phù hợp |
| Thuật toán so sánh | Logistic Regression, Random Forest |
| Mô hình tốt nhất | Random Forest (f1_macro=1.0 trên tập synthetic verify) |
| Lưu artifact | `server/models/ml_model.joblib`, `server/models/tfidf_vectorizer.joblib`, `server/models/ml_meta.json` |
| Giao tiếp inference | Backend Express gọi `ml/predict.py` qua `child_process` (`python`) |

## 2. Feature Engineering

7 đặc trưng cấu trúc + TF-IDF văn bản:

1. `skill_overlap_ratio` — tỷ lệ kỹ năng ứng viên khớp với yêu cầu JD
2. `required_skill_coverage` — coverage kỹ năng bắt buộc
3. `preferred_skill_coverage` — coverage kỹ năng ưu tiên
4. `text_overlap` — overlap từ khóa CV ↔ JD (TF-IDF)
5. `experience_relevance` — mức liên quan kinh nghiệm
6. `education_relevance` — mức liên quan học vấn
7. `project_relevance` — mức liên quan dự án

Vector TF-IDF (max_features=500, stop_words='english') ghép từ `cv_text + jd_text`.

## 3. Dữ liệu huấn luyện

- Nguồn chính: `server/data/db.json` (150 jobs, 1154 candidates, profile seed).
- Vì candidates trong db.json thiếu `cvText` → tất cả pseudo-label rơi về class 0 (không đủ dữ liệu để phân biệt).
- Để verify pipeline ML, sinh thêm **240 mẫu synthetic** (60 mẫu/clase × 4 clase) dựa trên heuristic rule-based (skill 60% + keyword 40%) với các mức độ khớp khác nhau.
- **Lưu ý:** Đây là dữ liệu synthetic dùng để verify pipeline hoạt động, **không phải dữ liệu human-labeled thực nghiệm**. Với dữ liệu thực tế cần chuyên gia gán nhãn CV–JD pairs.

## 4. Phân chia dữ liệu

- Training: 70%
- Testing: 15%
- Validation: 15% (được kiểm soát qua train_test_split test_size=0.15, stratify khi có đủ clase)

## 5. Kết quả đánh giá (trên dữ liệu synthetic verify)

| Mô hình | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) |
|---------|----------|-------------------|----------------|------------|
| Logistic Regression | 0.9995 | 0.823 | 0.9999 | 0.8857 |
| Random Forest | 1.0000 | 1.0000 | 1.0000 | 1.0000 |

Random Forest được chọn làm mô hình chính vì f1_macro cao nhất.

**Confusion Matrix (Random Forest):**
```
[[25974,   0,   0,   0],
 [   0,   9,   0,   0],
 [   0,   0,   9,   0],
 [   0,   0,   0,   9]]
```

## 6. Giới hạn

- Dữ liệu train là pseudo-label từ rule-based, không phải human-labeled.
- Các đặc trưng `experience_relevance`, `education_relevance`, `project_relevance` hiện hardcode = 0.5, cần cải thiện bằng NLP extraction từ CV thực.
- Không có dữ liệu lịch sử ứng tuyển để tính tỷ lệ chuyển đổi thật.

## 7. API ML

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/ai/model-info` | GET | Thông tin mô hình (version, best_model, metrics, training_date) |
| `/api/ai/predict` | POST | Dự đoán nhãn phù hợp cho cặp candidateId + jobId |

## 8. Cách chạy

```bash
# Huấn luyện mô hình
python ml/train.py

# Kiểm thử pipeline
python ml/test_pipeline.py

# Dự đoán (qua API)
POST http://localhost:5000/api/ai/predict
Body: { "candidateId": "<id>", "jobId": 7 }
```

## 9. So sánh với Gemini Semantic Matching

| Tiêu chí | ML Model (tự xây) | Gemini Semantic (API) |
|----------|-------------------|----------------------|
| Nguồn | Huấn luyện trên dữ liệu dự án | Pretrained model của Google |
| Chi phí | Miễn phí (chạy local) | Tiêu tốn token/API |
| Tính giải thích | Có (feature importance, confusion matrix) | Có (Gemini trả về strengths/weaknesses) |
| Phụ thuộc | scikit-learn, joblib | GEMINI_API_KEY, kết nối internet |
| Vị trí trong hệ thống | Backup / nghiên cứu / so sánh | Matching chính (theo yêu cầu) |
