# NẮM Học tập

[Mở website](https://dangkhue1301.github.io/nam-english/) · [Hướng dẫn tạo CSV cho AI](./QUESTION_CSV_GUIDE.md)

Website tự luyện Tiếng Anh, Hóa học, Vật lí và Sinh học lớp 6–9 từ bộ CSV do giáo viên chuẩn bị. Ứng dụng chấm ngay trên trình duyệt, có giao diện tiếng Việt và chạy tĩnh trên GitHub Pages.

## Cách dùng

1. Gửi `QUESTION_CSV_GUIDE.md` cho AI tạo câu hỏi, kèm môn/lớp/chủ điểm và số câu.
2. Chọn **Thêm bộ CSV**. Mỗi file chỉ có một môn và tạo một bộ riêng; ID trùng giữa hai file không ghi đè nhau.
3. Chọn môn, bộ, lớp và chủ điểm để bắt đầu. Mỗi lượt tối đa 30 câu.

Tiếng Anh dùng `grammar` hoặc `vocabulary`. Grammar và Hóa/Lí/Sinh (`practice`) có nhắc lý thuyết, giải thích tiếng Việt; câu đã chấm không lặp trong bộ, dù đúng hay sai. Một bộ 50 câu sẽ đi theo 30 rồi 20.

Vocabulary dùng `learning_key`: làm sai quay lại cuối lượt đến khi đúng, còn lịch ôn được dùng chung cho cùng một nghĩa giữa các bộ. Có thẻ ghi nhớ và giọng đọc tiếng Anh của thiết bị; bài khoa học không gọi giọng đọc tiếng Anh.

## Dữ liệu và giới hạn

Kho mới bắt đầu trống. Khi nâng cấp từ dữ liệu cũ, ứng dụng đặt dữ liệu cũ vào bản phục hồi thay vì tự đưa vào bài học. Xóa hoặc thay kho cũng giữ một bản ngay trước thao tác; hãy tải bản đó về nếu cần lưu lâu.

Mọi dữ liệu nằm trên **trình duyệt của từng thiết bị**: IndexedDB là kho chính, localStorage là dự phòng. Không có backend/server, tài khoản học sinh, đồng bộ giữa máy, hay bảng điểm giáo viên tập trung. Giáo viên gửi đường dẫn website và CSV; học sinh tự nhập file trên máy của mình. Dùng sao lưu JSON để chuyển tiến độ sang máy khác.

File CSV và bản sao lưu được kiểm tra trước khi thay đổi dữ liệu. Website không tải CSV lên máy chủ. Đây là công cụ tự luyện: đáp án nằm ở phía trình duyệt, không phù hợp làm hệ thống thi bảo mật. Xóa dữ liệu trang web hoặc dùng chế độ ẩn danh có thể làm mất tiến độ.

## Chạy tại máy

Yêu cầu Node.js 22 trở lên:

```bash
npm ci --ignore-scripts
npm test
npm run build
npm run dev
```

Mở `http://127.0.0.1:4173/nam-english/`. Sau khi sửa mã, chạy build rồi tải lại trang. Không mở `index.html` trực tiếp bằng `file://`.

## GitHub Pages

Đẩy lên `main`; workflow sẽ cài thư viện kiểm thử, chạy test, build `dist/` và xuất bản bằng GitHub Actions. Nguồn trong **Settings → Pages** phải là **GitHub Actions**.

Các tài nguyên dùng đường dẫn tương đối để chạy dưới `/nam-english/`. Build gắn cùng phiên bản cho mô-đun và CSS; service worker cũ được gỡ để tránh trộn phiên bản. Bản mới không cam kết chạy offline.
