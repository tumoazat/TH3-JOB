# Design Spec: AI Matching Engine (TH3-X)

**Project:** CareerMatch AI — Hệ thống Tìm việc Thông minh tích hợp AI và BI  
**Date:** 2026-10-28  
**Status:** Revised v1 (chờ duyệt)  
**Repo:** https://github.com/tumoazat/TH3-JOB  
**Quyết định đã chốt:** Stack không đổi (React + Vite + Tailwind + Express + JSON DB), không tự thêm framework ML mới, không tự tạo số liệu đánh giá giả, không tự huấn luyện mô hình nếu chưa có đủ dữ liệu và kết quả kiểm chứng.

---

## 1. Mục tiêu

Xây dựng thuật toán phân tích CV, Job Description (JD), tính mức độ phù hợp giữa ứng viên và công việc; hỗ trợ giải thích điểm matching và đề xuất kỹ năng cần bổ sung.

Hệ thống triển khai theo hai cấp độ:

- **Level 1 — Baseline Matching (bắt buộc):** Thuật toán matching dựa trên kỹ năng và độ tương đồng nội dung văn bản. Đây là phần phải hoàn thành trước.
- **Level 2 — Trained Matching Model (tùy chọn):** Mô hình Machine Learning được huấn luyện bằng dữ liệu CV–JD đã gán nhãn. Chỉ tích hợp khi có đủ dữ liệu và kết quả đánh giá chứng minh mô hình tốt hơn baseline.

Không được tuyên bố hệ thống đã huấn luyện AI nếu chỉ sử dụng công thức tính điểm cố định. Không được tạo kết quả đánh giá giả hoặc tự tạo số liệu để chứng minh mô hình hiệu quả. Nếu chưa có đủ dữ liệu thật, phải ghi rõ trạng thái là `insufficient_training_data` và tiếp tục sử dụng baseline.

---

## 2. Kiến trúc tổng thể

Luồng xử lý:

1. Ứng viên nhập CV hoặc tải lên file PDF.
2. Backend trích xuất văn bản CV (chỉ file PDF, giới hạn 5 MB, có xử lý lỗi và dọn file tạm).
3. Hệ thống chuẩn hóa kỹ năng, chức danh, kinh nghiệm và học vấn nếu có dữ liệu.
4. Hệ thống lấy JD từ cơ sở dữ liệu và chuẩn hóa yêu cầu tuyển dụng.
5. Matching Engine trích xuất đặc trưng và tính điểm phù hợp.
6. Nếu mô hình ML đã được huấn luyện và vượt qua tiêu chí đánh giá, hệ thống có thể sử dụng mô hình để dự đoán điểm.
7. Backend trả về điểm matching, mức độ phù hợp, kỹ năng trùng khớp, kỹ năng còn thiếu và giải thích kết quả.
8. Frontend hiển thị kết quả trên trang chi tiết công việc và trang gợi ý việc làm.

**Công nghệ:** Giữ nguyên React, Vite, TypeScript/JavaScript, Express và JSON DB đang sử dụng. Không tự ý thay đổi kiến trúc hoặc thêm framework mới. Việc bổ sung thư viện ML chỉ được thực hiện sau khi kiểm tra `package.json`, lockfile và khả năng tương thích.

---

## 3. Chuẩn hóa dữ liệu CV và JD

### 3.1. Dữ liệu ứng viên

Các trường có thể sử dụng:

- `skills`: danh sách kỹ năng của ứng viên.
- `cvText`: nội dung CV đã trích xuất.
- `experienceYears`: số năm kinh nghiệm, nếu xác định được đáng tin cậy.
- `education`: trình độ học vấn, nếu có.
- `targetRole`: vị trí ứng tuyển mong muốn, nếu có.

Không được tự suy diễn kỹ năng hoặc kinh nghiệm mà CV không cung cấp đủ bằng chứng.

### 3.2. Dữ liệu công việc

Các trường có thể sử dụng:

- `tags`: danh sách kỹ năng yêu cầu.
- `requirements`: yêu cầu tuyển dụng.
- `description`: mô tả công việc.
- `title`: chức danh.
- `minExperience`: số năm kinh nghiệm tối thiểu, nếu có.
- `educationRequirement`: yêu cầu học vấn, nếu có.

### 3.3. Chuẩn hóa kỹ năng

Thực hiện:

1. Chuyển văn bản về chữ thường.
2. Chuẩn hóa khoảng trắng và dấu câu.
3. Chuẩn hóa tên kỹ năng theo danh mục alias có kiểm soát.
4. Loại bỏ kỹ năng trùng lặp sau chuẩn hóa.
5. Chỉ ghép hai tên kỹ năng khi chúng thực sự tương đương.

Ví dụ:

- `JS` → `JavaScript`.
- `TS` → `TypeScript`.
- `PostgreSQL` và `Postgres` → cùng một kỹ năng chuẩn.
- `React` và `React Native` phải được xem là hai kỹ năng riêng biệt, trừ khi có quy tắc matching cụ thể.

Không sử dụng phép so khớp chuỗi gần đúng để tự động kết luận hai kỹ năng khác nhau là một.

---

## 4. Level 1 — Thuật toán matching cơ sở (bắt buộc)

### 4.1. Tính điểm kỹ năng

Gọi:

- `J`: tập kỹ năng yêu cầu của công việc.
- `C`: tập kỹ năng được xác định từ hồ sơ ứng viên.
- `M = C ∩ J`: tập kỹ năng trùng khớp sau chuẩn hóa.

Công thức:

`skillScore = |M| / |J| × 100`

Nếu công việc không có kỹ năng yêu cầu hợp lệ thì `skillScore = null`.

Ví dụ: JD yêu cầu 5 kỹ năng, ứng viên có 3 kỹ năng trùng khớp. Điểm kỹ năng là `3 / 5 × 100 = 60`.

### 4.2. Tính độ tương đồng nội dung

Sử dụng TF-IDF và Cosine Similarity để so sánh nội dung CV với phần yêu cầu và mô tả công việc.

Các bước:

1. Chuẩn hóa văn bản.
2. Tách từ hoặc cụm từ theo phương pháp phù hợp với tiếng Việt và thuật ngữ công nghệ.
3. Loại bỏ từ ít giá trị đối với matching nhưng giữ lại các thuật ngữ chuyên ngành.
4. Tạo vector TF-IDF cho CV và JD.
5. Tính Cosine Similarity.

Công thức:

`keywordScore = cosineSimilarity(CV, JD) × 100`

Giá trị được giới hạn trong khoảng từ 0 đến 100.

Để giảm nhiễu, nội dung dùng so sánh cần ưu tiên kỹ năng, yêu cầu tuyển dụng và mô tả nhiệm vụ; không để các phần văn bản chung như giới thiệu công ty quyết định phần lớn kết quả.

### 4.3. Tổng điểm baseline

Khi có đủ cả hai thành phần:

`matchScore = 0.6 × skillScore + 0.4 × keywordScore`

Khi chỉ có một thành phần hợp lệ, sử dụng thành phần đó và ghi nhận kết quả là dữ liệu một phần. Không được tự gán điểm 0 cho thành phần không có dữ liệu.

Khi cả hai thành phần không thể tính toán:

- `match = null`
- `dataStatus = insufficient`

Không trả về điểm ảo để giao diện luôn hiển thị một phần trăm.

### 4.4. Phân loại mức độ phù hợp

| Điểm | Nhãn hiển thị |
|---|---|
| 90–100 | Rất khớp |
| 80–89.99 | Khớp tốt |
| 70–79.99 | Khớp tiềm năng |
| Dưới 70 | Cần bổ sung |

Phân loại dựa trên điểm chưa làm tròn; chỉ làm tròn khi hiển thị.

Các ngưỡng trên là ngưỡng ban đầu để triển khai, không phải ngưỡng đã được chứng minh bằng thực nghiệm. Có thể hiệu chỉnh sau khi đánh giá trên dữ liệu gán nhãn.

### 4.5. Kỹ năng phù hợp và kỹ năng còn thiếu

- `matchedSkills`: các kỹ năng thuộc cả CV và danh sách kỹ năng yêu cầu.
- `missingSkills`: các kỹ năng được JD yêu cầu nhưng chưa tìm thấy trong hồ sơ ứng viên.
- `evidence`: đoạn văn bản CV hỗ trợ cho kỹ năng nếu hệ thống có thể xác định được.

Không được kết luận ứng viên chắc chắn không có một kỹ năng chỉ vì hệ thống không tìm thấy kỹ năng đó trong CV. Giao diện nên sử dụng cách diễn đạt “Chưa tìm thấy trong CV”.

---

## 5. Level 2 — Huấn luyện mô hình Machine Learning (tùy chọn)

### 5.1. Mục tiêu huấn luyện

Huấn luyện một mô hình dự đoán mức độ phù hợp giữa một cặp CV–JD dựa trên đặc trưng được trích xuất.

Đầu vào là một cặp CV–JD; đầu ra là điểm dự đoán trong khoảng 0–100.

Mô hình đầu tiên được đề xuất là **hồi quy tuyến tính (Linear Regression)** với các đặc trưng đã chuẩn hóa. Ưu điểm là dễ triển khai, dễ giải thích và có thể thử nghiệm trong stack hiện tại bằng TypeScript/JavaScript.

Nếu kết quả chưa đạt yêu cầu, có thể thử Logistic Regression cho bài toán phân loại phù hợp/không phù hợp, hoặc Random Forest Regression khi thư viện tương thích đã được xác minh. Không bắt buộc phải dùng mô hình phức tạp hơn nếu không chứng minh được lợi ích.

### 5.2. Cấu trúc dữ liệu huấn luyện

Tạo tập dữ liệu các cặp CV–JD đã được con người đánh giá.

Mỗi bản ghi nên có cấu trúc tương đương:

```json
{
  "pairId": "pair_0001",
  "candidateId": "candidate_001",
  "jobId": "job_001",
  "skillScore": 80,
  "keywordScore": 65,
  "experienceFit": 1,
  "educationFit": 1,
  "labelScore": 78,
  "labelBand": "good_match",
  "labelSource": "manual_review",
  "reviewerCount": 2
}
```

Đây là ví dụ cấu trúc dữ liệu, không phải kết quả đánh giá thực tế. `candidateId` và `jobId` phải tham chiếu dữ liệu có thật trong tập đánh giá; không đưa thông tin nhận dạng cá nhân không cần thiết vào tập huấn luyện.

Quy định:

- `labelScore` là điểm phù hợp do người đánh giá chấm theo rubric thống nhất.
- `labelBand` là nhãn phân loại được suy ra từ rubric và ngưỡng đã định nghĩa.
- `labelSource` ghi rõ nguồn gán nhãn.
- Nếu có nhiều người đánh giá, lưu điểm riêng của từng người hoặc quy trình tổng hợp để có thể kiểm tra tính nhất quán.
- Không sử dụng `labelScore` hoặc `labelBand` làm đặc trưng đầu vào mô hình.
- Không sử dụng dữ liệu giả làm dữ liệu đánh giá hiệu quả thực tế.

### 5.3. Rubric gán nhãn

Người đánh giá xem xét các tiêu chí:

1. Mức độ đáp ứng kỹ năng bắt buộc.
2. Mức độ liên quan giữa kinh nghiệm và nhiệm vụ.
3. Mức độ đáp ứng điều kiện học vấn nếu JD quy định rõ.
4. Mức độ liên quan của nội dung CV với công việc.
5. Các yêu cầu bắt buộc chưa được chứng minh trong hồ sơ.

Người đánh giá chấm điểm theo cùng một hướng dẫn và lưu lý do cho các trường hợp khó phân loại. Nên có ít nhất hai người đánh giá cho một tập con để đo mức độ đồng thuận.

Không sử dụng tuổi, giới tính, dân tộc, tôn giáo, ảnh chân dung hoặc các thuộc tính nhạy cảm làm đặc trưng dự đoán mức độ phù hợp. Tên, địa chỉ và thông tin liên hệ cũng không nên được đưa vào đặc trưng nếu không cần thiết.

### 5.4. Đặc trưng đầu vào

Phiên bản đầu tiên sử dụng các đặc trưng số:

- `skillScore`: mức độ đáp ứng kỹ năng JD.
- `keywordScore`: độ tương đồng nội dung CV–JD.
- `experienceFit`: mức độ đáp ứng yêu cầu kinh nghiệm, nếu cả hai phía có dữ liệu hợp lệ.
- `educationFit`: mức độ đáp ứng yêu cầu học vấn, chỉ khi JD thực sự đặt ra yêu cầu đó.
- Các đặc trưng bổ sung chỉ được thêm khi có định nghĩa rõ ràng, dữ liệu đủ tin cậy và không gây rò rỉ nhãn.

Mỗi đặc trưng phải được chuẩn hóa nhất quán trong lúc huấn luyện và dự đoán. Giá trị không có dữ liệu phải được xử lý theo quy tắc rõ ràng; không tự động coi dữ liệu thiếu là không đáp ứng.

Phiên bản đầu tiên không cần đưa toàn bộ văn bản CV vào mô hình hồi quy. Nội dung văn bản được dùng để tạo đặc trưng ở bước matching trước đó.

### 5.5. Quy trình huấn luyện

1. Thu thập và làm sạch các cặp CV–JD.
2. Kiểm tra bản ghi trùng lặp, nhãn thiếu và lỗi tham chiếu.
3. Tạo đặc trưng đầu vào bằng đúng quy trình được sử dụng khi dự đoán.
4. Chia tập train, validation và test theo ứng viên và công việc, hạn chế để cùng một CV hoặc JD xuất hiện ở nhiều tập.
5. Fit các bước tiền xử lý chỉ trên tập train.
6. Huấn luyện mô hình trên tập train.
7. Dùng validation để chọn cấu hình và hiệu chỉnh.
8. Đánh giá một lần trên test độc lập.
9. So sánh với baseline.
10. Chỉ tích hợp mô hình khi kết quả đạt tiêu chí đã định nghĩa.

Không chia ngẫu nhiên từng cặp một cách đơn giản nếu cùng CV hoặc cùng JD xuất hiện ở cả train và test, vì có thể làm kết quả đánh giá cao hơn thực tế.

Với dữ liệu nhỏ, kết quả chỉ mang tính thăm dò. Nếu chưa có đủ dữ liệu để tạo các tập độc lập đáng tin cậy, phải ghi rõ giới hạn thay vì tuyên bố mô hình đã đạt chất lượng triển khai.

### 5.6. Huấn luyện Linear Regression

Gọi `x` là vector đặc trưng và `y` là điểm gán nhãn đã chuẩn hóa về khoảng 0–1.

Mô hình:

`yPred = w0 + w1*x1 + w2*x2 + ... + wn*xn`

Huấn luyện bằng cách tối thiểu hóa Mean Squared Error trên tập train:

`MSE = (1/N) × Σ(yPred - y)^2`

Sau huấn luyện:

- Chặn điểm dự đoán về khoảng 0–100.
- Không coi điểm dự đoán là xác suất nếu mô hình chưa được hiệu chỉnh xác suất.
- Lưu phiên bản mô hình, cấu hình đặc trưng, thời điểm huấn luyện, số lượng mẫu và chỉ số đánh giá.
- Không huấn luyện lại tự động trong mỗi request API.
- Chỉ cập nhật mô hình thông qua quy trình huấn luyện và kiểm tra có kiểm soát.

Nếu triển khai thuật toán hồi quy bằng TypeScript thuần, cần viết unit test cho bước chuẩn hóa đặc trưng, tính dự đoán và cập nhật trọng số. Nếu sử dụng thư viện bên ngoài, phải xác minh dependency trước khi thêm.

---

## 6. Dữ liệu và quy mô huấn luyện

Các cặp CV–JD đã gán nhãn cần phản ánh nhiều ngành nghề, mức kinh doanh, mức độ đáp ứng kỹ năng và tình huống thiếu dữ liệu.

Quy mô khởi đầu đề xuất:

- **20 cặp:** chỉ dùng để kiểm tra luồng dữ liệu và chạy thử thuật toán; chưa đủ để khẳng định khả năng tổng quát hóa.
- **200–500 cặp:** có thể dùng cho thử nghiệm ML ban đầu, nhưng kết quả vẫn có thể không ổn định.
- **Từ 1.000 cặp trở lên:** mục tiêu mở rộng để có cơ sở đánh giá tốt hơn; vẫn phải xem xét độ đa dạng và chất lượng nhãn.

Các con số này là mục tiêu lập kế hoạch, không phải ngưỡng bảo đảm chất lượng. Chất lượng nhãn, độ đa dạng dữ liệu và cách chia tập quan trọng không kém số lượng mẫu.

Nếu dự án hiện chỉ có 20 cặp golden CV–JD, giữ nguyên tập này làm bộ kiểm thử nhỏ được kiểm soát; không sử dụng cùng một tập để vừa lựa chọn mô hình vừa tuyên bố kết quả cuối cùng. Cần thu thập thêm dữ liệu trước khi kết luận mô hình ML tốt hơn baseline.

---

## 7. Đánh giá mô hình

### 7.1. Chỉ số bắt buộc

- `MAE`: sai số tuyệt đối trung bình giữa điểm dự đoán và điểm do người đánh giá gán nhãn.
- `RMSE`: nhấn mạnh các trường hợp dự đoán sai nhiều.
- `Accuracy@Band`: tỷ lệ dự đoán đúng nhóm phù hợp.
- `Skill Precision`: trong các kỹ năng hệ thống cho là đã khớp, tỷ lệ thực sự có bằng chứng.
- `Skill Recall`: trong các kỹ năng thực sự có bằng chứng, tỷ lệ hệ thống tìm thấy.
- `Coverage`: tỷ lệ cặp CV–JD mà hệ thống có đủ dữ liệu để đưa ra kết quả.

Nếu mô hình phân loại phù hợp/không phù hợp, báo cáo thêm Precision, Recall, F1 và confusion matrix.

### 7.2. So sánh baseline và mô hình ML

Cả hai phương pháp phải được đánh giá trên cùng một tập test độc lập.

Báo cáo:

- Số lượng mẫu và cách chia tập.
- Kết quả từng chỉ số của baseline.
- Kết quả từng chỉ số của mô hình ML.
- Mức cải thiện hoặc suy giảm.
- Các nhóm công việc hoặc tình huống mà mô hình hoạt động kém.
- Giới hạn do dữ liệu thiếu, nhãn chủ quan hoặc dữ liệu chưa đa dạng.

Không tự điền số liệu minh họa vào cột kết quả thực nghiệm. Khi chưa chạy đánh giá, ghi `not_evaluated`.

### 7.3. Điều kiện chấp nhận mô hình

Mô hình chỉ được đề xuất thay baseline khi:

1. Hoàn thành kiểm thử dữ liệu và không có rò rỉ giữa train/test.
2. Kết quả trên test độc lập đạt tiêu chí được thống nhất trước khi đánh giá.
3. MAE không tệ hơn baseline và nên cải thiện một cách có ý nghĩa.
4. Chất lượng phát hiện kỹ năng không suy giảm đáng kể.
5. Có thể giải thích kết quả ở mức phù hợp với mục tiêu sản phẩm.
6. Không có lỗi nghiêm trọng về quyền truy cập, dữ liệu cá nhân hoặc xử lý hồ sơ thiếu thông tin.

Nếu chưa đạt, tiếp tục sử dụng baseline và ghi lại nguyên nhân.

---

## 8. Tích hợp vào backend

Giữ các API hiện có và bổ sung hoặc điều chỉnh API matching theo kiến trúc đang sử dụng.

Ví dụ phản hồi:

```json
{
  "jobId": "job_001",
  "match": 78,
  "method": "baseline",
  "modelVersion": null,
  "dataStatus": "complete",
  "matchedSkills": ["JavaScript", "React"],
  "missingSkills": ["TypeScript"],
  "explanation": {
    "skillScore": 80,
    "keywordScore": 75,
    "summary": "CV có nhiều kỹ năng liên quan nhưng còn thiếu một số yêu cầu."
  }
}
```

Đây là ví dụ hợp đồng API, không phải kết quả từ dữ liệu thực tế.

Quy định:

- `method` là `baseline` hoặc `ml`.
- `modelVersion` phải xác định phiên bản mô hình nếu sử dụng ML.
- `dataStatus` phản ánh mức độ đầy đủ của dữ liệu đầu vào.
- Không gửi `cvText`, email, số điện thoại hoặc toàn bộ hồ sơ cá nhân trong phản hồi matching nếu frontend không cần.
- Backend phải tự xác định ứng viên từ thông tin xác thực; không tin `candidateId` do client tự gửi trong luồng sinh viên.
- Kiểm tra quyền sở hữu công việc và hồ sơ trước khi tính matching hoặc trả về thông tin cá nhân.
- Không lưu dữ liệu huấn luyện hoặc log nội dung CV đầy đủ theo mặc định.

---

## 9. Quy trình huấn luyện lại

Huấn luyện lại chỉ được thực hiện khi có dữ liệu nhãn mới đủ chất lượng hoặc khi kết quả giám sát cho thấy baseline/mô hình hiện tại cần cải thiện.

Mỗi lần huấn luyện phải lưu:

- `modelVersion`
- `trainingDatasetVersion`
- `featureSchemaVersion`
- `trainedAt`
- `trainingSampleCount`
- `evaluationMetrics`
- `baselineComparison`
- `approvalStatus`

Mô hình mới phải qua kiểm thử trước khi được sử dụng. Nếu không đạt, giữ nguyên mô hình hoặc baseline đang hoạt động. Không ghi đè phiên bản tốt chỉ vì một lần huấn luyện mới đã hoàn tất.

Phản hồi của người dùng như lưu việc làm, ứng tuyển hoặc bỏ qua gợi ý không tự động được coi là nhãn đúng/sai. Chỉ sử dụng chúng để huấn luyện khi đã định nghĩa quy tắc gán nhãn và đánh giá độ tin cậy.

---

## 10. Kiểm thử và tiêu chí hoàn thành

Các kiểm thử tối thiểu:

- CV rỗng, JD rỗng và kỹ năng không hợp lệ.
- CV có kỹ năng trùng tên nhưng không tương đương.
- JD thiếu yêu cầu kỹ năng.
- PDF lỗi hoặc không trích xuất được nội dung.
- Điểm không vượt ngoài khoảng 0–100.
- Kết quả thiếu dữ liệu không bị hiển thị như điểm chắc chắn.
- Kết quả matching của sinh viên chỉ dựa trên hồ sơ của chính sinh viên.
- Không thể truy cập hồ sơ ứng viên trái quyền.
- Kết quả dự đoán ổn định với cùng phiên bản mô hình và cùng đầu vào.
- Kiểm tra so sánh baseline/ML trên cùng tập test.
- Kiểm tra dữ liệu train/test không bị trùng CV hoặc JD theo quy tắc chia tập đã chọn.

Tạo báo cáo tại:

`docs/superpowers/reports/2026-10-28-ai-match-bi-evaluation.md`

Báo cáo phải chứa kết quả thực tế sau khi chạy, phương pháp chia dữ liệu, số lượng mẫu, các chỉ số đánh giá, so sánh baseline với ML và giới hạn của thử nghiệm.

---

## 11. Phân chia giai đoạn triển khai

**Giai đoạn A — Baseline:** Chuẩn hóa CV/JD, matching kỹ năng, TF-IDF/Cosine Similarity, giải thích kết quả và kiểm thử.

**Giai đoạn B — Dataset:** Thiết kế schema dữ liệu gán nhãn, rubric đánh giá, công cụ kiểm tra dữ liệu và bộ golden test.

**Giai đoạn C — Training:** Chỉ triển khai khi dữ liệu đủ điều kiện; huấn luyện Linear Regression hoặc mô hình đã được lựa chọn dựa trên thử nghiệm.

**Giai đoạn D — Evaluation:** So sánh baseline và ML trên tập test độc lập, ghi kết quả thật vào báo cáo.

**Giai đoạn E — Integration:** Chỉ bật mô hình ML khi đạt tiêu chí chấp nhận; nếu không, giữ baseline.

**Giai đoạn F — Regression:** Kiểm thử lại authentication, phân quyền, CV extraction, matching, ứng tuyển, BI và các API hiện có.

### Điều kiện nghiệm thu cuối cùng

Project phải có thuật toán matching chạy được, đầu ra giải thích được, kiểm thử tái lập được và báo cáo đánh giá trung thực.

Nếu chưa đủ dữ liệu huấn luyện, hệ thống vẫn phải hoạt động bằng baseline. Không bắt buộc phải có mô hình ML được triển khai để tuyên bố hoàn thành phần matching cơ sở; tuy nhiên, không được tuyên bố đã huấn luyện thành công khi chưa có kết quả kiểm chứng.

---

## 12. Checklist duyệt spec

| Mục | Trạng thái |
|-----|------------|
| Level 1 baseline matching rõ ràng và có thể triển khai | [ ] Bắt buộc |
| Level 2 ML training chỉ khi đủ dữ liệu và đạt tiêu chí | [ ] Bắt buộc |
| Không tự tạo số liệu đánh giá giả | [ ] Bắt buộc |
| Công thức skillScore/keywordScore rõ ràng | [ ] Bắt buộc |
| Quy trình huấn luyện và đánh giá ML rõ ràng | [ ] Bắt buộc |
| API matching bảo mật, không tin candidateId từ client | [ ] Bắt buộc |
| Báo cáo đánh giá phải chứa kết quả thực tế | [ ] Bắt buộc |

---

