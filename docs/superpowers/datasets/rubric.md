# Rubric gán nhãn mức độ phù hợp CV–JD

Dùng cho người đánh giá (nhóm) khi chấm điểm các cặp CV–JD trong golden dataset.
Không dùng dữ liệu máy tạo để thay thế nhãn do người đánh giá.

## Quy trình

1. Đọc CV và JD của cặp.
2. Chấm điểm 0–100 theo 5 tiêu chí dưới đây.
3. Ghi band suy ra từ ngưỡng đã định nghĩa.
4. Lưu lý do cho các trường hợp khó phân loại.
5. Một tập con (≥20%) được hai người đánh giá độc lập để đo mức đồng thuận.

## 5 tiêu chí

| # | Tiêu chí | Cách chấm |
|---|----------|-----------|
| 1 | Đáp ứng kỹ năng bắt buộc | Tỷ lệ kỹ năng JD yêu cầu có bằng chứng trong CV |
| 2 | Liên quan kinh nghiệm ↔ nhiệm vụ | Kinh nghiệm đã làm có khớp nhiệm vụ JD không |
| 3 | Đáp ứng học vấn | Chỉ chấm khi JD nêu rõ yêu cầu; nếu không, bỏ qua tiêu chí này |
| 4 | Liên quan nội dung CV ↔ công việc | Mức độ liên quan tổng thể của CV với công việc |
| 5 | Yêu cầu bắt buộc chưa chứng minh | Trừ điểm nếu có yêu cầu bắt buộc không có bằng chứng trong hồ sơ |

## Ngưỡng band (khớp với baseline)

| Điểm | Band |
|------|------|
| 90–100 | `excellent_match` |
| 80–89.99 | `good_match` |
| 70–79.99 | `potential_match` |
| < 70 | `needs_improvement` |

## Bắt buộc công bằng

Không dùng tuổi, giới tính, dân tộc, tôn giáo, ảnh chân dung, tên, địa chỉ hoặc thông tin liên hệ làm căn cứ chấm điểm.
