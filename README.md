# NẮM English — bản GitHub Pages

Đây là bản website tĩnh, không cần máy chủ và không cần đăng nhập. Bạn có thể
nhập file CSV, làm bài và chấm ngay trên trình duyệt.

## Chức năng

- Nhập CSV UTF-8 theo đúng 16 cột và xem lỗi trước khi lưu.
- Mỗi file CSV là một bộ riêng; học sinh chọn đúng bộ muốn làm và tiến độ
  không bị trộn giữa các bộ, kể cả khi ID câu hỏi trùng nhau.
- Mỗi lượt tối đa 30 câu. Bộ 50 câu được chia thành 30 + 20; câu Grammar đã
  làm sẽ không xuất hiện lại trong bộ đó.
- Hỗ trợ đủ 8 dạng bài: chọn đáp án, chọn nhiều, điền chỗ trống, sửa lỗi,
  viết lại câu, dạng từ, sắp xếp và ghép cặp.
- Grammar có gợi ý, phần nhắc lý thuyết và giải thích sau khi chấm.
- Vocabulary trả lời sai sẽ quay lại cuối lượt cho đến khi làm đúng.
- Lịch spaced repetition dùng chung `learning_key`: đúng lần đầu hẹn sau 1
  ngày, lần hai sau 6 ngày, các lần sau giãn theo hệ số nhớ; sai hẹn lại sau
  10 phút.
- Dữ liệu được lưu bằng IndexedDB; nếu trình duyệt không hỗ trợ, website tự
  chuyển sang localStorage.

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
`file://`, vì trình duyệt có thể chặn JavaScript module và việc tải CSV mẫu.

## Xuất bản bằng GitHub Pages

1. Đưa **nội dung của thư mục này** lên nhánh `main` của một repository GitHub.
2. Mở **Settings → Pages** trong repository.
3. Ở mục **Build and deployment**, chọn nguồn **GitHub Actions**.
4. Workflow `Xuất bản GitHub Pages` sẽ tự kiểm tra, build và phát hành website.

Tất cả đường dẫn tài nguyên đều là đường dẫn tương đối, nên website chạy đúng
ở dạng `https://ten-tai-khoan.github.io/ten-repository/`.

## Lưu ý về dữ liệu

Dữ liệu học thuộc về một trình duyệt trên một thiết bị và gắn với địa chỉ
website. Đổi trình duyệt, đổi tên repository hoặc xóa dữ liệu trang sẽ tạo một
kho mới. Website không gửi câu hỏi, đáp án hay lịch học lên GitHub.

Định dạng câu hỏi được mô tả đầy đủ trong
[`QUESTION_CSV_GUIDE.md`](./QUESTION_CSV_GUIDE.md). Có thể bắt đầu bằng
[`sample_questions.csv`](./sample_questions.csv).
