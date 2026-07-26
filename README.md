# NẮM English

Website học ngữ pháp và từ vựng tiếng Anh chạy hoàn toàn trên trình duyệt:
nhập file CSV, làm bài, chấm ngay và ôn từ theo spaced repetition. Không cần
máy chủ, không cần đăng nhập — toàn bộ dữ liệu nằm trên thiết bị của bạn.

## Chức năng

### Học tập

- **8 dạng bài**: chọn đáp án, chọn nhiều, điền chỗ trống, sửa lỗi, viết lại
  câu, dạng từ, sắp xếp và ghép cặp. Chấm ngay, hiện đáp án đúng/sai từng
  lựa chọn.
- **Grammar** có gợi ý, nhắc lý thuyết trước khi làm và giải thích sau khi
  chấm.
- **Vocabulary** ôn theo spaced repetition dùng chung `learning_key`: đúng
  lần đầu hẹn sau 1 ngày, lần hai sau 6 ngày, các lần sau giãn theo hệ số
  nhớ; sai hẹn lại sau 10 phút. Từ trả lời sai quay lại cuối lượt cho đến
  khi làm đúng.
- **Flashcards**: lật thẻ nhanh cho từ vựng, tự chấm nhớ/quên, dùng chung
  lịch ôn với chế độ Vocabulary.
- **Luyện câu sai**: gom những câu có lần làm gần nhất bị sai để làm lại.
- **Phát âm tiếng Anh** bằng giọng đọc của thiết bị (Web Speech API), có
  thể tự đọc câu từ vựng và chỉnh tốc độ.
- **Phím tắt**: `1–9` chọn đáp án, `Enter` chấm/tiếp tục, `H` gợi ý,
  `Space` lật thẻ flashcard.
- Mỗi lượt tối đa 30 câu; câu Grammar đã làm không lặp lại trong bộ.
- Lượt học đang dở được khôi phục sau khi tải lại trang.

### Theo dõi tiến độ

- **Chuỗi ngày học (streak)**, **XP và cấp độ**, mục tiêu số câu mỗi ngày.
- **Bản đồ chăm chỉ** (heatmap 17 tuần), biểu đồ 14 ngày, độ chính xác theo
  Grammar/Vocabulary, độ phủ từng chủ điểm.
- **Lịch ôn 7 ngày tới** cho từ vựng và bộ **thành tích** để giữ động lực.

### Quản lý dữ liệu

- Nhập CSV UTF-8 theo đúng 16 cột, xem lỗi chi tiết trước khi lưu. Mỗi file
  là một bộ riêng; tiến độ không trộn giữa các bộ kể cả khi ID trùng nhau.
- Duyệt và tìm kiếm câu hỏi trong bộ: xem đáp án, giải thích, trạng thái
  làm bài.
- Đổi tên, xóa bộ, xuất bộ trở lại thành file CSV.
- **Sao lưu/khôi phục** toàn bộ dữ liệu bằng một file JSON — dùng khi đổi
  máy hoặc đổi trình duyệt.
- Dữ liệu lưu bằng IndexedDB; nếu trình duyệt không hỗ trợ, website tự
  chuyển sang localStorage.

### Giao diện

- Giao diện sáng/tối (theo hệ thống hoặc tự chọn), responsive cho điện
  thoại với thanh điều hướng dưới màn hình.
- Hỗ trợ cài đặt như ứng dụng (PWA) và có cache offline qua service worker.

## Chạy và kiểm tra

Yêu cầu Node.js 22 trở lên.

```bash
npm test
npm run build
```

Lệnh build tạo thư mục `dist/`. Để xem thử tại máy:

```bash
python -m http.server 8080
```

Sau đó mở `http://localhost:8080`. Không mở trực tiếp `index.html` bằng
`file://`, vì trình duyệt sẽ chặn JavaScript module và việc tải CSV mẫu.

## Xuất bản bằng GitHub Pages

1. Đưa **nội dung của thư mục này** lên nhánh `main` của một repository GitHub.
2. Mở **Settings → Pages** trong repository.
3. Ở mục **Build and deployment**, chọn nguồn **GitHub Actions**.
4. Workflow `Xuất bản GitHub Pages` sẽ tự kiểm tra, build và phát hành website.

Tất cả đường dẫn tài nguyên đều là đường dẫn tương đối, nên website chạy đúng
ở dạng `https://ten-tai-khoan.github.io/ten-repository/`.

## Lưu ý về dữ liệu

Dữ liệu học thuộc về một trình duyệt trên một thiết bị và gắn với địa chỉ
website. Đổi trình duyệt, đổi tên repository hoặc xóa dữ liệu trang sẽ tạo
một kho mới — hãy dùng **Cài đặt → Sao lưu toàn bộ** trước khi chuyển.
Website không gửi câu hỏi, đáp án hay lịch học lên bất kỳ máy chủ nào.

Định dạng câu hỏi được mô tả đầy đủ trong
[`QUESTION_CSV_GUIDE.md`](./QUESTION_CSV_GUIDE.md). Có thể bắt đầu bằng
[`sample_questions.csv`](./sample_questions.csv) hoặc nhờ AI soạn bộ mới
theo hướng dẫn đó.

## Cấu trúc mã nguồn

| Tệp | Vai trò |
|---|---|
| `core.js` | Logic thuần: đọc CSV, chấm bài, chọn câu, lịch SRS |
| `stats.js` | Thống kê thuần: streak, XP, heatmap, thành tích, xuất CSV |
| `storage.js` | Kho dữ liệu IndexedDB/localStorage, phiên học, cài đặt |
| `speech.js` | Phát âm tiếng Anh qua Web Speech API |
| `app.js` | Toàn bộ giao diện và điều phối |
| `sw.js` | Service worker cache offline |
| `tests/` | Kiểm thử bằng `node --test` |
