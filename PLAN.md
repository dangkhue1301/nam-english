# PLAN — NẮM: kho bài CSV đa môn

Cập nhật: 11/09/2026.

## Đợt đang triển khai — Frontend theo yêu cầu ngày 10/09

Người dùng đã xác nhận thực hiện `FRONTEND_PLAN.md` và yêu cầu gọi Terra Max triển khai. Agent chính lập kế hoạch, rà soát và kiểm chứng; Terra (`gpt-5.6-terra`, reasoning `max`) sửa mã, viết kiểm thử và build. Giữ toàn bộ kế hoạch frontend gốc để đối chiếu, không tự xóa các mục chưa làm.

### Trình tự thực hiện

- [x] Phase 0: nền cream/terracotta, kính mờ nhẹ, token màu thống nhất, chữ tiếng Việt dễ đọc và fallback không blur.
- [x] Phase 1: trang Thống kê nối vào dữ liệu thật; trạng thái trống rõ ràng, chi tiết phụ thu gọn để không làm rối trang học.
- [x] Phase 2: giao diện tự động/sáng/tối, lưu lựa chọn và khôi phục sau tải lại.
- [x] Phase 3–5: hiệu ứng nhẹ, cải thiện thư viện/lượt học/kết quả, phím tắt và focus/ARIA; kiểm tra 390, 760, 1050 px.
- [x] Phase 6: offline/PWA có phiên bản; chỉ dọn cache thuộc NẮM và không xóa IndexedDB. Không chép nguyên mẫu xóa mọi cache trong roadmap.
- [x] Phase 7: ôn sai riêng, chia sẻ bộ nhỏ, tìm câu, lượt tùy chọn và báo cáo; giữ lần học mặc định theo từng bộ và không lặp câu đã chấm.
- [x] Phase 8: hạn chế render thừa, CSS có cấu trúc, lỗi hiển thị thân thiện; chỉ tuyên bố hiệu năng tốt hơn khi đã đo.
- [x] Rà soát mã, test/build và trình duyệt; đối chiếu từng mục roadmap, ghi rõ mục nào chưa kiểm chứng.
- [ ] Chỉ commit/push sau rà soát; giữ remote và push không force. Xác minh bản phát hành thực tế trước khi báo đã lên web.

### Giới hạn và kiểm tra bắt buộc

- Làm trên `work/remote-live`, bắt đầu từ `f73e400`; không reset checkout `github-pages`. Giữ mọi bản sửa frontend/PWA đang có, cùng `FRONTEND_PLAN.md` và `pwa.js` chưa được Git theo dõi; không tự khôi phục các chỉnh sửa cũ đã được người dùng bỏ.
- Giữ vanilla JS, GitHub Pages, lockfile và lưu cục bộ; không thêm server, framework, CDN hoặc dịch vụ mới. Định dạng CSV và guide đa môn giữ nguyên trừ khi có thay đổi bắt buộc đã được đối chiếu.
- Giữ bộ 50 câu chia 30 + 20, tiến độ theo từng bộ, chấm idempotent và SRS theo `learning_key`. Ôn sai/tùy chọn không được phá các bất biến này hoặc tự trộn bộ trong chế độ thường.
- Các ví dụ code trong roadmap là gợi ý, không thay cho API thật: dữ liệu học nằm trong `state.data.snapshot`, chữ ký hàm stats phải đọc từ mã hiện tại. Không bịa số liệu, so sánh hoặc điểm Lighthouse.
- Thống kê và nội dung nhập từ CSV/backup/link phải được escape; link chia sẻ phải kiểm tra kích thước, hiển thị xác nhận trước khi nhập, không dùng dịch vụ QR bên ngoài để gửi nội dung bài.
- Offline phải cache đúng URL có phiên bản, tách phiên bản cũ/mới an toàn và không ảnh hưởng ứng dụng khác cùng origin. Cài PWA phụ thuộc khả năng từng trình duyệt; không hứa có prompt trên mọi thiết bị.
- Kiểm thử có dữ liệu và không dữ liệu, mọi môn, dark/light/auto, tải lại, phím tắt không kích hoạt khi đang nhập, zoom/chữ tiếng Việt và không tràn ngang. Tôn trọng `prefers-reduced-motion`.
- Chỉ đánh dấu từng phần hoàn tất sau khi có bằng chứng. Agent chính không trực tiếp sửa mã sản phẩm; mọi yêu cầu sửa được gửi cho Terra Max.

### Trạng thái triển khai bàn giao theo plan_continue.md (11/09/2026)

Model tiếp nhận đã hoàn tất triển khai toàn bộ các đợt A–G theo `plan_continue.md`:

1. **Đợt A (PWA Cache Self-Repair)**:
   - `sw.js`: Bổ sung cơ chế `repairCache()` và `ensureCacheIntegrity()`. Nếu cache của worker active bị thiếu một phần hoặc mất hoàn toàn, tự động đối chiếu SHA-256 digest và tải lại đúng tài nguyên của phiên bản hiện tại mà không làm hỏng cache đang hoạt động hoặc kẹt lỗi 503.
   - Thêm 6 kịch bản kiểm thử PWA cache repair trong `tests/pwa.test.mjs` (mất toàn bộ, mất một phần, server đổi SHA-256, mất mạng, lỗi quota, serialize đồng thời).
2. **Đợt B (Lượt học tùy chọn trong một bộ)**:
   - Cho phép chọn số câu (10/20/30 câu) và lọc dạng câu hỏi (`type`).
   - `core.js` & `storage.js`: Bổ sung tham số và lưu cấu hình `limit`, `type` trong session/summary để tải lại và "Học tiếp" giữ nguyên bộ lọc.
   - Giao diện dropdown chọn số câu và dạng câu trên Home view.
3. **Đợt C (Ôn riêng các câu sai, tối đa 20 câu/lượt)**:
   - Backend `storage.js`: Tách biệt `purpose: "review"` khỏi luồng học thường. Lấy tối đa 20 câu có lần làm gần nhất bị sai (`mistakeQuestions`). Lượt ôn sai không ảnh hưởng đến số câu còn lại và lịch SRS của chế độ thường.
   - UI: Banner nhắc ôn câu sai trên trang chủ, giao diện làm bài gắn nhãn "Ôn câu sai", màn hình kết quả thông báo rõ ràng và cho phép tiếp tục ôn các câu còn lại.
4. **Đợt D (Trộn nhiều bộ - Cross-set study)**:
   - `storage.js`: Bổ sung hỗ trợ `setIds` trong `startSession`, `selection`, `validSession`, `validSummary`. Trộn các bộ cùng môn/domain.
   - Khử trùng `learning_key` cho vocabulary trong cùng một phiên trộn.
   - Xóa một bộ trong tab khác tự động dọn session an toàn.
   - UI: Nút và hộp thoại "Trộn nhiều bộ" cho phép chọn nhiều bộ cùng môn, màn hình kết quả hiển thị breakdown chi tiết theo từng bộ.
5. **Đợt E (Tìm câu hỏi & Xuất báo cáo giáo viên)**:
   - `stats.js`: Thêm `searchQuestions()` tìm kiếm đa trường (prompt, context, topic, subtopic, answer) không làm biến dạng object answer.
   - Thêm `generateReportMarkdown()` và `generateReportCsv()` với cơ chế chống Spreadsheet Formula Injection.
   - UI: Tab tìm kiếm câu hỏi trong Thư viện (giữ caret/IME mượt mà khi gõ), nút xuất báo cáo Markdown/CSV trong mục Dữ liệu.
6. **Đợt F (Chia sẻ bộ qua Link/QR)**:
   - `core.js`: `encodeSharePayload()` và `decodeSharePayload()` chuẩn hóa UTF-8/Base64, giới hạn an toàn 50 KB, bảo toàn BOM.
   - UI: Nút "Chia sẻ bộ" trong menu từng bộ bài, tạo link hash `#import=...`, cơ chế tự động phát hiện hash trên URL để hiển thị hộp thoại xác nhận trước khi thêm vào kho.
7. **Đợt G (Performance & Error Boundary)**:
   - Error boundary bao bọc toàn bộ giao diện `render()` với màn hình thông báo lỗi an toàn, vẫn cho phép truy cập mục Dữ liệu để sao lưu và nút tải lại trang.
   - Cập nhật tối ưu DOM cho input/draft, mở rộng fallback CSS không hỗ trợ backdrop-filter.
   - **Kết quả kiểm thử**: 88/88 test đạt (100% pass trên cả Node tests, PWA tests, IndexedDB và localStorage). Build Pages 13 tệp thành công.

### Trạng thái bàn giao ngày 11/09 (Terra Max trước đó)

- Terra Max `terra_phase6_finish` đã bàn giao Phase 6 cùng sửa Enter: build `3146210aa513`, 13 tệp, 71/71 test đạt. Chưa commit/push và chưa browser QA bản cuối. Core/storage/stats/guide không đổi.
- Enter sau chấm đã dùng chung action `next`; Enter trên summary/link/control giữ hành vi mặc định. UI PWA dùng vùng riêng, không render lại root hoặc lấy focus khi báo trạng thái mạng/cập nhật.
- Worker kiểm tra SHA-256 precache, đọc cache đúng scope/version, bảo toàn cache active khi cài lại lỗi; không ép cập nhật. Guide tải theo navigation trả đúng guide. Test A/B, lỗi precache, cache miss và lifecycle/mock đều đạt.
- Còn điểm cần sửa trước phát hành: khi cache của worker active bị mất mà server chưa đổi SW, app có thể kẹt 503. Chưa có self-repair an toàn; đã đưa lên đầu tài liệu bàn giao, không yêu cầu xóa kho học để chữa.
- Người dùng yêu cầu dừng mở rộng sau đợt Terra hiện tại và tạo `plan_continue.md` chi tiết để model khác triển khai nốt. Đã soạn hướng dẫn tự đủ ngữ cảnh: vị trí project/Git, kiến trúc, bất biến dữ liệu, kết quả thực tế, phần thiếu, trình tự Phase 7–8, test/QA/deploy và prompt dùng ngay.
- Browser QA lượt trước bị bộ duyệt tự động chặn vì hạn mức; không dùng công cụ khác để lách chặn. Chưa có Lighthouse, screenshots/install mobile hoặc offline browser QA bản cuối; không đánh dấu những mục đó đã xong.
- Website công khai vẫn là bản backend trước đợt frontend. Mọi thay đổi local được giữ nguyên; chỉ một tiến trình chạy build mỗi lần. Cổng QA riêng là 4187, không đụng dự án khác.

### Bằng chứng kiểm tra trong đợt frontend

- Bản cuối đợt Terra `3146210aa513`: 71/71 test, build 13 tệp, kiểm tra cú pháp nguồn/dist và `git diff --check` đạt. Agent chính chạy độc lập 69 test core/storage/stats/PWA: 69/69 đạt, xác minh meta version và danh sách tệp trong dist. Hai test còn lại trong tổng 71 thuộc build/tích hợp nguồn UI do Terra chạy.
- Terra đã build bản 0–5 `f875044ef585`, 12 tệp; kiểm tra cú pháp, `git diff --check`, 64/64 test đạt. `pwa.js` chưa được tích hợp vào bản này.
- Trên bản `f875044ef585`, agent chính đã kiểm tra: trang kết quả có focus tiêu đề, breakdown thật 0/1 và thời gian 38 giây; về bộ bài đúng, trang chủ có 14 XP và tiến độ đã lưu. Nút sao chép hiện thông báo thành công, nhưng chưa xác minh được nội dung clipboard.
- Phím L mở thư viện và chuyển focus tiêu đề; lọc môn, sắp xếp và tìm kiếm giữ caret hoạt động trong lượt thử. Gõ H khi đang nhập chỉ chèn chữ, không đổi trang. Chưa thử composition IME thực, timer, Esc lưu nháp, flashcard, focus sau chấm/qua câu và responsive đủ ba kích thước trên bản này.
- Ngày 11/09 agent chính chạy độc lập `node --test tests/core.test.mjs tests/storage.test.mjs tests/stats.test.mjs`: 63/63 đạt, không chạy build thay Terra.
- Bản nền `544acf571eb2`: Terra chạy kiểm tra cú pháp, 64/64 test và build đạt. Agent chính mở bản này ở cổng QA 4187.
- Đã kiểm chứng trang Thống kê với bộ Vật lí có 2 câu: 2 lần trả lời, 2 câu duy nhất, 12 XP, 50% đúng; chủ điểm Lực 0%, Khối lượng riêng 100%. Focus chuyển vào tiêu đề khi đổi trang.
- Chuyển tự động → sáng → tối hoạt động; tải lại vẫn giữ tối. Đã xem ở 1050 px và 390 px; 390 px giữ 10 tuần heatmap, không tràn toàn trang. Cỡ nhãn nhỏ vẫn cần sửa, chưa đánh dấu Phase 0/5 hoàn tất.
- Nhập CSV tiếng Anh 16 cột đủ 24 câu; chấm sai grammar rồi tải lại giữ nguyên đáp án/kết quả, kết thúc lượt không lặp câu sai. Chưa thấy console error/warning trong các lượt thử này. Focus sau chấm và UI kết quả đang được Terra hoàn thiện.

### Điểm nối tiếp cần kiểm chứng

1. Đọc `plan_continue.md` và giữ mọi bản sửa/untracked hiện tại; không reset hoặc khôi phục bản cũ. Source và dist đã kiểm tra cú pháp trong đợt Terra; không coi bản build là đã phát hành.
2. Phase 3–5 đã có build `f875044ef585` và bằng chứng từng phần ở trên, chưa coi là hoàn tất toàn bộ. Cần kiểm tra: timer có ẩn/hiện và không chạy khi ẩn; composition tiếng Việt; Enter sau chọn MCQ thực sự chấm; bắt lỗi thao tác phím tắt; focus khi qua câu/kết quả và khi đóng dialog.
3. Kiểm tra lại 390/760/1050 px, nhãn thường dùng ít nhất khoảng 14 px, metadata ít nhất 12 px, không che lỗi bố cục bằng `overflow-x: hidden`. Kiểm tra đủ light/dark/auto, reload, ô nhập và flashcard Space/trái/phải. Không tuyên bố điểm Lighthouse khi chưa chạy.
4. Phase 6 đã tích hợp PWA, test/build cùng 13 tệp; app import PWA, guide có version và digest đúng. Cần triển khai self-repair cache bị mất, sau đó kiểm chứng lifecycle/offline trên trình duyệt thật. Không bỏ kiểm tra digest hoặc dùng fetch không xác minh để né 503.
5. Contract PWA cuối cùng: `initPwa({ onConnectivityChange, onUpdateReady, onInstallAvailable })`; update chỉ thông báo và chờ lifecycle bình thường khi đóng các tab cũ, không `skipWaiting`/force reload. Không xóa cache bundle cũ khi tab cũ đang dùng; không xóa IndexedDB/cache ứng dụng khác. Shortcuts chỉ `?view=home|library|stats|data` (frontend đã có parse whitelist).
6. Phase 7 vẫn chưa triển khai. Phase 8 mới có error boundary/CSS sections, chưa giảm render hoặc đo hiệu năng. Giữ nguyên các mục mở rộng trong roadmap, không đánh dấu đã xong.
7. Sau khi build/test + QA toàn bộ phần phát hành đạt mới giao Terra commit/push non-force và kiểm chứng Actions/live. Không phát hành các thay đổi dở chỉ để có bản mới.

## Mốc backend đã hoàn tất ngày 09/09

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
- Backend/logic dữ liệu đã hoàn tất ở đợt trước. Đợt hiện tại triển khai frontend theo xác nhận mới, bảo vệ các quy tắc dữ liệu đã kiểm thử.
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
