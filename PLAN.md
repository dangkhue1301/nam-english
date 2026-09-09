# PLAN — NẮM: kho bài CSV đa môn

Cập nhật: 09/09/2026.

## Tiến độ hiện tại

- Terra Max đã hoàn tất phần triển khai. `npm test`: 64/64 đạt; `npm run build`: đạt, 12 tệp, phiên bản kiểm thử local `5195cf211793`.
- Agent chính đã rà soát và kiểm tra trình duyệt: nhập CSV Vật lí lớp 8, chấm đúng/sai, tải lại ở màn hình đáp án và kết quả, hoàn tất bộ với 0 câu chưa làm. Câu khoa học sai không lặp lại.
- Các mẫu CSV cho đủ bốn môn đã được kiểm tra bằng chính parser. Guide không yêu cầu nguồn hoặc số trang cho grammar; vocabulary giữ hướng dẫn SRS.
- Đã đẩy commit mã triển khai `5afb003bc395b91229193555d2d0c4f720397cca` lên `main` theo fast-forward, không force. Dùng tài khoản chủ repo cho riêng lệnh Git; không đổi cấu hình đăng nhập lưu trên máy, không ảnh hưởng tài khoản khác.
- [GitHub Actions 34355746950](https://github.com/dangkhue1301/nam-english/actions/runs/34355746950) đã hoàn tất thành công. Website live đã được mở và xác minh: tên Tiếng Anh · Hóa · Lí · Sinh, kho mặc định trống, hộp thêm CSV hoạt động, không có console error/warning trong lần kiểm tra.
- Phiên bản tài nguyên live `0e6e757b9c5d` khớp mã đã commit trên GitHub. Hash local khác do kiểu xuống dòng Windows; toàn bộ mô-đun/CSS trên mỗi bản vẫn dùng cùng một phiên bản.
- Agent chính chạy độc lập 63 kiểm thử logic/dữ liệu: đạt 63/63. Tổng bộ kiểm thử do Terra và CI chạy là 64 bài, gồm cả kiểm thử build.

## Quy tắc làm việc

- Agent chính lập/cập nhật kế hoạch, rà soát và kiểm chứng kết quả.
- Terra, mức suy luận Max, thực hiện các thay đổi mã, kiểm thử và build.
- Ưu tiên backend/logic dữ liệu. Chỉ nối giao diện tối thiểu để chức năng dùng được; thiết kế frontend sẽ làm sau.
- Giữ nguyên GitHub Pages và URL đang có; không chuyển sang Sites hoặc tạo dịch vụ có phí.

## Mục tiêu

Một website tự luyện cho Tiếng Anh, Hóa học, Vật lí và Sinh học lớp 6–9 tại Việt Nam. Giáo viên dùng AI khác soạn CSV theo chủ điểm được giao. Học sinh nhập file, chọn môn/bộ/lớp rồi làm bài và được chấm ngay.

Phạm vi hiện tại là ứng dụng tĩnh: IndexedDB trên từng trình duyệt, localStorage dự phòng. Không có máy chủ, tài khoản học sinh, tự đồng bộ giữa máy hoặc bảng điểm giáo viên tập trung. Không thêm hạ tầng mới trong lần triển khai này.

## Yêu cầu chốt

1. Mỗi file CSV thuộc một môn, tạo một bộ riêng. ID trùng giữa hai file không ghi đè câu hoặc tiến độ.
2. Mỗi lượt tối đa 30 câu. Bộ 50 câu chia 30 rồi 20. Grammar và bài Hóa/Lí/Sinh đã chấm không lặp trong bộ, dù đúng hay sai.
3. Vocabulary giữ cơ chế cũ: sai quay lại cuối lượt đến khi đúng; lịch SRS dùng chung theo `learning_key`, nhưng lần học đầu tính riêng theo bộ.
4. Grammar và các môn khoa học có lý thuyết ngắn, giải thích đáp án; tiếng Việt có dấu.
5. CSV mới có 18 cột: `subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key`.
6. `subject`: `english`, `chemistry`, `physics`, `biology`. Hóa/Lí/Sinh bắt buộc `grade` từ `6` đến `9`, `domain=practice`; Tiếng Anh dùng `grammar` hoặc `vocabulary`.
7. File tiếng Anh cũ 16 cột vẫn nhập được, mặc định `subject=english` và không có lớp.
8. Chấm tự động, không dùng AI trực tuyến. Câu nhập chữ chỉ chấp nhận các đáp án đã khai báo. Tag `case-sensitive` dùng khi phải phân biệt hoa/thường, đặc biệt `Co` và `CO`, hoặc ký hiệu đơn vị.
9. Kiểm tra toàn bộ file trước khi nhập: header, số ô, ngoặc kép, mã hóa, kiểu bài, đáp án, ID, môn/lớp. Một dòng lỗi thì không nhập một phần. Giới hạn 5 MB, 2.000 câu/file, 10.000 ký tự/ô.
10. Kho bài mặc định trống. Khi nâng cấp, dữ liệu cũ được chuyển vào bản phục hồi, không tự xuất hiện thành bài học. Không xóa lại dữ liệu mới ở lần mở tiếp theo.
11. Sao lưu/khôi phục và xóa bộ an toàn, không xóa lịch SRS còn được dùng ở bộ khác. Thay/xóa kho giữ một bản trước thao tác để tải về.
12. Tạo Markdown guide để đưa cho AI khác, có prompt dùng ngay, ví dụ từng môn và đúng quy tắc máy chấm. Grammar chỉ theo topic được giao, không đòi nguồn/số trang.

## Mốc bàn giao ban đầu cho Terra (lưu lại để đối chiếu)

### Đã thực hiện, cần giữ và kiểm tra hồi quy

- Giao diện cơ bản đã làm lại, font hệ thống hỗ trợ tiếng Việt, đã kiểm tra màn hình 390 px.
- Kho dữ liệu mới ghi kết quả, lịch ôn và vị trí lượt học trong cùng giao dịch; chấm lại cùng bước không tạo lịch sử trùng.
- Vá session rỗng sau khi hoàn thành gây lỗi đọc `context` của undefined.
- Bảo vệ xung đột nhiều tab, lỗi quota, bản sao lưu không hợp lệ, trộn cache mô-đun cũ/mới.
- Guide tiếng Anh đã viết lại; dữ liệu mẫu chuyển vào `tests/fixtures`, không được đưa vào bản web.
- 46 bài kiểm thử đã đạt trước khi thêm đa môn. Luồng nhập CSV, trả lời, chấm và tải lại đã kiểm tra trên trình duyệt thật.

### Các phần còn dở tại mốc bàn giao — nay đã xử lý theo checklist bên dưới

- `core.js`, `storage.js`, `stats.js` đã thêm một phần `subject`, `grade`, `practice`, header 18 cột và chấm phân biệt hoa/thường.
- `app.js` mới nối một phần chọn bộ/môn và thẻ luyện khoa học. Các nhánh session, summary, upload, bộ lọc và nhãn vẫn cần hoàn thiện.
- Guide, README và một số test vẫn đang mô tả 16 cột hoặc chỉ Tiếng Anh; phải đồng bộ lại.
- Chưa chạy lại toàn bộ test sau thay đổi đa môn. Chưa commit hoặc xuất bản bản mới.

## Công việc triển khai cho Terra Max

### A. Hoàn thiện backend đa môn

- [x] Rà soát schema và chuẩn hóa dữ liệu xuyên suốt import → lưu → chọn câu → chấm → thống kê → export → restore.
- [x] Mọi nhánh `practice` dùng tiến độ theo câu, không đi vào SRS hay hàng đợi từ vựng.
- [x] Lọc lớp/môn không trộn bộ; giữ quy tắc 30 + 20 và không lặp câu đã chấm.
- [x] Bảo đảm `case-sensitive` nhất quán ở kiểm tra options, chấm và hiển thị đáp án; công thức Unicode được chuẩn hóa đúng.
- [x] Bản sao lưu chứa nhiều bộ thuộc nhiều môn vẫn hợp lệ, nhưng một bộ không trộn môn.
- [x] Tăng kiểm tra trạng thái session khi khôi phục nếu phát hiện dữ liệu có thể gây crash; không xóa dữ liệu học còn hợp lệ.

### B. Guide và hợp đồng dữ liệu

- [x] Cập nhật `QUESTION_CSV_GUIDE.md` cho 18 cột, tương thích file Anh cũ, ví dụ Anh/Hóa/Lí/Sinh và prompt theo môn/lớp/chủ điểm.
- [x] Ví dụ khoa học ngắn, an toàn, kiến thức cơ bản; không thêm nội dung vào kho mặc định.
- [x] Nêu rõ nhập đáp án số theo đơn vị đã cho, các cách viết tương đương dùng `||`, không có chấm gần đúng hay chấm tự luận bằng AI.
- [x] Giữ hướng dẫn SRS vocabulary; cập nhật README và tên hiển thị đa môn, không đổi URL/repository.

### C. Giao diện tối thiểu

- [x] Nối lựa chọn môn/lớp, số câu còn lại, mở lượt học `practice`, feedback và summary.
- [x] Không dùng giọng đọc tiếng Anh cho câu khoa học bằng tiếng Việt.
- [x] Không tiếp tục thiết kế lại giao diện, thêm trang biểu đồ hoặc animation.

### D. Kiểm chứng và bàn giao

- [x] Toàn bộ test cũ và mới đạt trên cả IndexedDB và localStorage.
- [x] Thêm test mỗi môn/lớp, sai môn/lớp, nhiều bộ trùng ID, 50 câu khoa học chia 30 + 20, sai vẫn không lặp, SRS không bị ảnh hưởng, sao lưu đa môn và tag phân biệt hoa/thường.
- [x] Test các khối CSV trong Markdown guide qua chính parser.
- [x] Build không chứa CSV mẫu/test; mọi import JS và CSS dùng cùng phiên bản.
- [x] Tóm tắt file thay đổi, kết quả test và hạn chế còn lại để agent chính rà soát trước khi xuất bản.
- [x] Sau rà soát, cập nhật GitHub Pages bằng push không force, xác minh deploy thành công và web live mở được.
- [x] Chép guide và PLAN vào thư mục `outputs/` của workspace để người dùng tải, đã cập nhật trạng thái xuất bản sau khi xác minh.

## Tiêu chí hoàn tất

Nhập được CSV cả bốn môn, chọn đúng lớp/bộ, chấm và tiếp tục lượt không lỗi; tiến độ và SRS tồn tại sau tải lại; bộ học bắt đầu trống, có phục hồi dữ liệu cũ; guide khớp parser; test/build đạt; bản GitHub Pages đã được xác minh. Không tuyên bố đã có backend máy chủ hay đồng bộ học sinh.

## Địa chỉ làm việc

- Worktree: `work/remote-live`.
- Nhánh triển khai: `codex/study-refresh-20260908`.
- Remote: `https://github.com/dangkhue1301/nam-english.git`.
- Website: `https://dangkhue1301.github.io/nam-english/`.
- Checkout `github-pages` đang có lịch sử local khác remote: không reset hoặc ghi đè checkout đó.
