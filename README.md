# NẮM Học tập

[Mở website](https://dangkhue1301.github.io/nam-english/) · [Hướng dẫn tạo CSV cho AI](./QUESTION_CSV_GUIDE.md)

Website tự luyện Tiếng Anh, Tiếng Nhật, Hóa học, Vật lí và Sinh học từ bộ CSV do giáo viên hoặc AI chuẩn bị. Ứng dụng chấm ngay trên trình duyệt, có giao diện tiếng Việt và chạy tĩnh trên GitHub Pages.

## Cách dùng

1. Gửi `QUESTION_CSV_GUIDE.md` cho AI tạo câu hỏi, kèm môn/lớp/chủ điểm và số câu.
2. Chọn **Thêm bộ CSV**. Mỗi file chỉ có một môn và tạo một bộ riêng; ID trùng giữa hai file không ghi đè nhau.
3. Chọn bộ bài, chọn chế độ luyện rồi bấm **Bắt đầu**. Có thể mở bộ lọc trình độ, lớp, chủ điểm hoặc chương/bài. Mỗi lượt tối đa 30 câu.

Trang Luyện tập hiển thị chuỗi ngày, XP/cấp độ và huy hiệu, cùng lối vào ôn thẻ đến hạn và ôn câu sai. Điện thoại dùng thanh điều hướng dưới; lúc làm bài chỉ giữ **Lưu và thoát**. Trang Kết quả ghi XP của lượt và cho mở từng câu chưa đúng để xem lại. Thư viện hỗ trợ tìm theo bộ/câu hỏi và lọc môn; trang Dữ liệu tập trung nhập CSV, báo cáo, sao lưu và cài đặt.

Tiếng Anh dùng `grammar` (ngữ pháp), `vocabulary` (flashcard) hoặc `vocabulary_practice` (bài tập từ vựng). Grammar và Hóa/Lí/Sinh (`practice`) có nhắc lý thuyết, giải thích tiếng Việt; câu đã chấm không lặp trong bộ, dù đúng hay sai. Một bộ 50 câu sẽ đi theo 30 rồi 20.

Flashcard dùng `learning_key`: chưa nhớ quay lại cuối lượt, lịch SRS dùng chung cho cùng một nghĩa giữa các bộ. Bài tập từ vựng Anh và Nhật tính theo từng câu, không dùng SRS; chấm xong đi tiếp, câu sai vào Ôn câu sai. Gợi ý CSV được kiểm tra trước khi hiển thị; lý thuyết và lời giải chỉ hiện sau chấm. Tiếng Nhật không hiển thị furigana. Có thẻ ghi nhớ và giọng đọc tiếng Anh của thiết bị; bài khoa học không gọi giọng đọc tiếng Anh.

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

Các tài nguyên dùng đường dẫn tương đối để chạy dưới `/nam-english/`. Build gắn cùng phiên bản cho mô-đun, CSS và cache PWA để tránh trộn bản cũ/mới. Sau lần tải thành công, các tài nguyên được lưu để học ngoại tuyến. Khi có bản cập nhật, ứng dụng báo và chờ đóng các tab cũ rồi mở lại để áp dụng, giữ lượt đang học trên cùng một phiên bản.
