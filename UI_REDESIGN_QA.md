# Kiểm tra UI/UX NẮM

Ngày kiểm tra: 03/10/2026. Build mới nhất: `187c000d35ce`.

## Phạm vi

- Giao diện phẳng, nền kem, màu terracotta; giữ logo, chế độ sáng/tối/tự động và cỡ chữ 14–26px.
- Bốn trang chính: Luyện tập, Bộ bài, Thống kê, Dữ liệu. Điện thoại có thanh điều hướng dưới; khi làm bài dùng Lưu và thoát.
- Trang chủ có XP/cấp độ, chuỗi ngày, huy hiệu, chọn chế độ học và một nút Bắt đầu. Bộ lọc có thể thu gọn; bộ lọc đang dùng vẫn hiển thị.
- Màn làm bài một cột; gợi ý được kiểm tra trước chấm, lời giải và lý thuyết hiện sau chấm. Flashcard chỉ cho tự đánh giá sau khi lật.
- Kết quả có XP của lượt, hành động học tiếp/ôn sai và phần mở từng câu chưa đúng. Thống kê có mục thu gọn và số liệu biểu đồ bằng văn bản.
- Thư viện kết hợp tìm kiếm và lọc môn, giữ đổi tên/chia sẻ/xuất/xóa bộ. Dữ liệu nhóm nhập CSV, báo cáo, sao lưu, cài đặt và dọn kho.
- Không thêm schema, thay lịch SRS hay thay quy tắc chấm trong đợt đổi UI này.

## Kiểm tra tự động

`npm test`: **229/229 vượt qua**, bao gồm kiểm tra build. `node --check app.js`, `node --check core.js` và `git diff --check` thành công.

Các kiểm tra mới bao gồm ưu tiên chế độ theo môn, số câu khớp bộ chọn phiên thật, giữ chế độ khi bộ lọc không có câu, từ vựng Nhật không thành flashcard, đếm một lần các thẻ chung learning key, tìm bộ theo môn/từ khóa, XP/kết quả/ôn sai, trạng thái thu gọn thống kê và ẩn nghĩa/ẩn tự đánh giá trước khi lật thẻ. Các kiểm tra cũ về chấm bài, nháp nhiều tab, import, backup và dữ liệu IndexedDB/localStorage tiếp tục vượt qua.

## Kiểm tra trực tiếp trong trình duyệt

| Luồng | Kết quả |
| --- | --- |
| Bộ mẫu Anh: chọn chế độ, bắt đầu, điền từ, chọn đáp án, ghép cặp, hoàn tất | Đạt |
| Lưu nháp, thoát, tiếp tục, chấm bằng Enter | Đạt |
| Trả lời sai, chuyển câu, kết quả 3/4 và +32 XP, ôn riêng câu sai | Đạt |
| Flashcard: mặt trước, lật, Chưa nhớ và lưu kết quả | Đạt |
| Nhập CSV Nhật 14 câu, xem trước, đổi tên bộ, chọn ngữ pháp mặc định | Đạt |
| Sắp xếp câu Nhật, phản hồi sau chấm, không có ruby/rt | Đạt |
| Tìm bộ không có kết quả, xóa tìm kiếm/bộ lọc, tìm câu theo nội dung | Đạt |
| Thống kê mở rộng, dữ liệu, chế độ sáng/tối và chữ 26px | Đạt |
| CSV có hint “Chọn phương án thứ hai”: cảnh báo lúc nhập, thay bằng gợi ý chung trước chấm | Đạt |
| Hai tab cùng sửa nháp Đúng/Sai: Esc báo xung đột, giữ lựa chọn đang nhập, không có lỗi console | Đạt |
| Dùng bản nháp đã lưu rồi Esc: lấy đúng nháp mới và lưu/thoát thành công | Đạt |
| Focus ở Sai của ý a được giữ sau khi tab khác sửa ý b và đồng bộ màn hình | Đạt |
| Flashcard Chưa nhớ → Chưa nhớ → Đã nhớ: +14 XP, 0/1 “nhớ ngay lần đầu”, “tỷ lệ nhớ lần đầu” | Đạt |

## Các lỗi đã sửa sau đợt rà soát

- Enter/Space trên nút flashcard thực hiện đúng thao tác của nút đang focus.
- XP cuối lượt tính cả các lần ôn lại; kết quả cũ thiếu tổng XP được ghi rõ là XP từ lần trả lời đầu.
- Bộ lọc vẫn hiển thị giá trị đang chọn khi thu hẹp phạm vi không còn câu phù hợp.
- Đổi bộ từ tab khác xóa cả bộ lọc chương/bài/mục của tiếng Nhật.
- Thông báo cập nhật PWA được giữ sau khi mất mạng/kết nối lại hoặc đóng lời nhắc cài ứng dụng.
- Gợi ý chỉ phương án bằng thứ tự viết bằng chữ và nhận định như “Phương án B là phù hợp” được chặn.
- Thao tác bàn phím dùng cùng cơ chế báo lỗi với nút bấm; xung đột lưu nháp giữ nội dung và cho lấy bản đã lưu rõ ràng.
- Render lại giữ đúng lựa chọn Đúng/Sai và dropdown matching đang focus.
- Nhãn tỷ lệ nhớ flashcard ghi rõ tính theo lần đầu.

Các kiểm tra hồi quy mới xác nhận cả IndexedDB và localStorage, cảnh báo CSV, gợi ý phương pháp hợp lệ, lỗi hành động không tạo Promise rejection, khôi phục sau xung đột và tổng XP sau tải lại. Tab gốc ở cổng 4193 vẫn giữ nguyên dữ liệu; kiểm tra trực tiếp dùng origin riêng ở cổng 4195 để đọc đúng bundle mới.

Đã đo bố cục các trang chính ở 375, 390, 768, 1024, 1440 và 1920px. Nhãn huy hiệu dài đã được sửa để xuống dòng khi chữ lớn, không gây cuộn ngang toàn trang. Màn làm bài và kết quả được xem trực tiếp ở 390px. Reflow ở 720 CSS px cũng đã kiểm tra, tương ứng chiều rộng nội dung của màn 1440px khi phóng 200%; chưa thao tác zoom thật của trình duyệt.

## Giới hạn kiểm tra

- Chưa kiểm tra trên thiết bị iOS/Android thật, Safari hay bàn phím ảo/IME thật.
- Backup/restore JSON được xác nhận bằng kiểm thử tự động. Công cụ trình duyệt không trả sự kiện tải file JSON trong lần thử trực tiếp, nên chưa xác nhận được tệp tải xuống qua giao diện.
- Các bản xem trước dùng origin riêng để tránh tải giao diện cũ từ cache PWA. Không thay cơ chế cập nhật PWA trong đợt này.

Ảnh giao diện đã lưu trong thư mục visualizations của phiên làm việc. Website được xuất bản bằng workflow GitHub Pages trên nhánh main.
