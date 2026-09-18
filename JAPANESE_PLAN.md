# Kế hoạch mở rộng NẮM: Tiếng Nhật

Cập nhật: 18/09/2026. Trạng thái: **đề xuất để duyệt, chưa triển khai**.

Tài liệu này là kế hoạch sản phẩm, dữ liệu và kiểm thử; không phải thông báo tính năng đã có trên website. Người dùng yêu cầu lập plan trước, chưa build. Khi được duyệt triển khai, giao Terra Max sửa mã; agent chính rà soát và kiểm chứng.

## 1. Phạm vi đã chốt

- Thêm môn **Tiếng Nhật**, độc lập với Tiếng Anh, Hóa học, Vật lí và Sinh học đang có.
- Có 3 dạng Ngữ pháp, 3 dạng Từ vựng và 2 dạng Hán tự: tổng cộng **8 dạng bài**.
- Hán tự có chọn cách đọc và chọn chữ Hán đúng, theo xác nhận của người dùng.
- Từ vựng tiếng Nhật giữ SRS nhưng học bằng bài tập; **không có flashcard tiếng Nhật**. Flashcard và SRS tiếng Anh giữ nguyên.
- Có nút **bật/tắt furigana**, ghi nhớ lựa chọn trên thiết bị cho lần học sau, theo yêu cầu bổ sung của người dùng.
- Có quy tắc CSV tiếng Nhật riêng và file Markdown đưa cho AI khác tạo dữ liệu.
- Phân mục theo Bộ bài → Chương → Bài → Hán tự / Ngữ pháp / Từ vựng → Chủ điểm.
- Học sinh chọn bộ mình muốn học. Mặc định tối đa 30 câu mới/lượt; bộ 50 câu không sai sẽ học 30 + 20. Không bỏ sót biến thể cùng một từ.
- Giao diện tiếng Việt có dấu, chữ Nhật dễ đọc, ít chữ phụ; giữ phong cách hiện tại, không thiết kế lại toàn bộ website trong đợt này.

### Chưa nằm trong phạm vi

Đọc hiểu, nghe hiểu, bài ngữ pháp theo cả đoạn văn, đề thi JLPT đầy đủ/tính giờ, viết tay Kanji, nhận dạng ảnh/PDF, audio tiếng Nhật, AI sinh/chấm bài trực tiếp, tài khoản và đồng bộ đám mây. Không tự nhập nguyên đề tham khảo, không xóa dữ liệu hiện có, không công bố đề PDF lên GitHub.

Website vẫn là ứng dụng tĩnh trên GitHub Pages. Học sinh mở được trên máy khác, nhưng kho bài và tiến độ vẫn lưu riêng trong trình duyệt từng máy; chia sẻ CSV/link và sao lưu là cách chuyển dữ liệu hiện có. Kế hoạch này không biến GitHub Pages thành máy chủ lưu tài khoản.

## 2. Đối chiếu ảnh và đề N2 tham khảo

Đã đọc các phần liên quan trong file người dùng gửi: `Đề N2 T7-2023 (230710).pdf`, 36 trang. Số trang dưới đây là thứ tự trang PDF, bắt đầu từ 1. Đây là **tài liệu tham khảo do người dùng cung cấp**, không xác nhận nguồn phát hành hay đáp án chính thức.

| Mục | Dạng bài cần làm | Mã dữ liệu đề xuất | Tham khảo |
| --- | --- | --- | --- |
| Ngữ pháp 1 | Chọn đáp án điền vào một chỗ trống | `ja_grammar_choice` | Ảnh 1; PDF 問題7, trang 8–9 |
| Ngữ pháp 2 | Chọn mảnh câu nằm tại vị trí ★ trong bốn vị trí | `ja_grammar_star` | Ảnh 2; PDF 問題8, trang 10–11 |
| Ngữ pháp 3 | Sắp xếp toàn bộ mảnh thành câu hoàn chỉnh | `ja_grammar_order` | Ảnh 3; đây là dạng luyện thêm, không phải 問題9 trong PDF |
| Từ vựng 1 | Chọn từ hợp với một hoặc nhiều ngữ cảnh | `ja_vocab_context` | Ảnh 4; gần 問題4, trang 4; cấu tạo từ ở 問題3, trang 3 có thể dùng như biến thể |
| Từ vựng 2 | Chọn nghĩa gần nhất của từ được đánh dấu | `ja_vocab_paraphrase` | Ảnh 5; PDF 問題5, trang 5 |
| Từ vựng 3 | Chọn câu dùng từ đúng | `ja_vocab_usage` | Ảnh 6; PDF 問題6, trang 6 |
| Hán tự 1 | Chọn cách đọc của từ chứa chữ Hán | `ja_kanji_reading` | Xác nhận của người dùng; PDF 問題1, trang 1 |
| Hán tự 2 | Chọn cách viết chữ Hán cho từ được ghi bằng kana | `ja_kanji_writing` | Xác nhận của người dùng; PDF 問題2, trang 2 |

Điểm quan trọng từ trang 10: học sinh suy ra thứ tự bốn mảnh nhưng chỉ chọn đáp án ở ô ★. Không biến Ngữ pháp 2 thành ô gõ chữ hoặc bắt kéo cả bốn mảnh mới được chấm. Ngữ pháp 3 là một tương tác khác.

Ảnh tô viền hoặc tô màu một phương án không phải bằng chứng đáp án đúng. Không suy ra ý nghĩa các cột số màu trong ảnh cây danh mục vì ảnh không có nhãn. Dùng các nhãn tiến độ rõ ràng được định nghĩa ở phần 3.

PDF có thêm ngữ pháp theo đoạn ở trang 12–13, đọc hiểu ở trang 14–32 và phần nghe ở trang 33–36; chưa đưa vào đợt này. Ví dụ trong guide phải tự soạn theo topic, không yêu cầu AI chép đề hay điền cột `source`.

## 3. Cây nội dung và cách tính tiến độ

```text
Tiếng Nhật
└── Bộ bài: tên file CSV hoặc tên giáo viên đặt
    └── Chương 4
        └── Bài 2
            ├── Hán tự
            │   └── Nhóm chữ/từ → Hán tự 1, Hán tự 2
            ├── Ngữ pháp
            │   └── Mẫu ngữ pháp → Ngữ pháp 1, 2, 3
            └── Từ vựng
                └── Chủ điểm → Từ vựng 1, 2, 3
```

- Một CSV tạo một bộ Tiếng Nhật. Một bộ có thể chứa nhiều chương, bài, mục và trình độ; một dòng chỉ có một trình độ N5/N4/N3/N2/N1.
- `chapter` và `lesson` là số nguyên dương; sắp xếp theo số, không để Chương 10 đứng trước Chương 2. Số bài có phạm vi trong chương.
- `topic` là nhãn chủ điểm; cùng tên ở hai chương/bài không bị gộp. Khóa nhóm phải gồm bộ + chương + bài + mục + topic.
- Trình độ JLPT là bộ lọc, không bắt người dùng mở thêm một tầng cây. Không ép tiếng Nhật có `grade` lớp 6–9.
- Chỉ hiện nút/mục có dữ liệu; nhóm rỗng không có nút Bắt đầu. Bộ mới nhập không tự tạo nội dung mẫu.
- Có thể bắt đầu tại cả bộ, một chương, một bài, một mục hoặc một topic. Cấu hình lượt học lưu toàn bộ đường dẫn lọc và danh sách ID đã chọn.
- Desktop dùng cây thu gọn; điện thoại dùng danh sách mở dần và đường dẫn quay lại. Không mở tất cả chương/bài mặc định.

### Ba loại số liệu không được trộn

1. **Đã làm x/y câu**: số câu riêng biệt đã chấm ít nhất một lần trong luồng học thường, chia tổng câu trong phạm vi. Một câu sai rồi làm lại vẫn chỉ tính một câu.
2. **Cần luyện lại: n câu**: số câu từ vựng còn sai trong luồng luyện đến đúng. Không đồng nhất với số từ đến hạn.
3. **Đến hạn: n từ**: số `learning_key` từ vựng riêng biệt đến hạn trong phạm vi. Một từ có ba câu vẫn tính một từ.

Số từ đến hạn ở nhóm cha phải lấy hợp các key, không cộng máy móc các nhóm con có từ trùng nhau. Bộ lọc không được làm người học hiểu nhầm rằng đã hoàn thành toàn bộ CSV: hiện riêng tiến độ phạm vi chọn và toàn bộ bộ bài.

## 4. Luồng học và không lặp câu

### 4.1. Học câu chưa làm

1. Chọn Tiếng Nhật → chọn bộ → chọn phạm vi → Bắt đầu.
2. Mặc định lấy tối đa 30 câu **chưa từng chấm** trong phạm vi; giữ các mức 10/20/30 hiện có.
3. Không khử trùng bằng `learning_key` trong lượt học câu mới tiếng Nhật. Nếu một từ có ba dạng bài, cả ba dòng CSV đều phải có cơ hội xuất hiện.
4. Chấm xong Ngữ pháp/Hán tự thì ghi tiến độ dù đúng hay sai; không tự đưa lại vào lượt câu mới. Muốn làm lại dùng luồng Ôn câu sai riêng đã có.
5. Từ vựng sai được đưa lại cuối hàng đợi luyện đến đúng. Câu quay lại gắn nhãn “Luyện lại”, không tăng số câu mới hoặc số câu đã làm.
6. Tải lại/đóng tab giữ nguyên lượt, thứ tự lựa chọn, mảnh đã xếp, câu đã chấm và hàng đợi luyện lại. Không dùng shuffle mới khi phục hồi.
7. Hoàn thành phạm vi thì có nút trở về bộ hoặc học các câu còn lại. Hết câu chưa làm không tự đổi sang SRS, không âm thầm lấy lại câu cũ.

Ví dụ bắt buộc: bộ 50 câu, không lỗi trả lời → lượt 1 có 30 câu, lượt 2 có 20 câu, lượt 3 không có câu mới. Nếu có câu từ vựng sai, số thao tác có thể nhiều hơn 30 nhưng phải ghi rõ đó là lượt luyện lại, không phải câu mới.

Nếu người học chủ động kết thúc sớm, câu chưa trả lời vẫn chưa làm; câu đã chấm không quay lại như câu mới. Từ vựng còn sai phải được giữ trong danh sách cần luyện lại, kể cả khi lượt cũ bị đóng.

### 4.2. Ôn từ đến hạn

- Nút riêng “Ôn từ đến hạn”; có thể lọc bộ/chương/bài/topic.
- Mỗi lượt chọn tối đa 30 key đến hạn, một biến thể cho mỗi key; luân phiên các biến thể đã được chấm trong luồng học thường, thuộc phạm vi đang chọn, để không chỉ gặp mãi Từ vựng 1. Không lấy biến thể chưa học làm câu SRS; key chưa có biến thể đủ điều kiện trong phạm vi không tính vào bộ đếm đến hạn của phạm vi đó.
- Không lấy key thuộc tiếng Anh; không ép tất cả biến thể thành flashcard.
- Luồng này không làm tăng tiến độ bao phủ CSV của các câu chưa học. Không dùng việc đã nhớ một từ để đánh dấu toàn bộ câu của từ đó đã xong.
- Nếu không có từ đến hạn: thông báo ngắn, quay lại bộ; không lôi câu chưa làm vào thay thế.

### 4.3. Ôn câu sai và trộn bộ

- Giữ “Ôn câu sai” riêng, tối đa 20 câu/lượt như hiện tại. Không đổi tiến độ học thường hoặc lịch SRS. Phân biệt rõ với lượt SRS và hàng đợi từ vựng sai trong một lượt học thường.
- Trộn nhiều bộ chỉ khi người học chọn rõ. Chỉ trộn cùng môn; trong lượt học câu mới, không bỏ câu tiếng Nhật trùng `learning_key` giữa các bộ.
- Trộn để ôn SRS được khử trùng theo key. Một câu trong kết quả phải biết chính xác thuộc bộ/chương/bài nào.
- Cần tách hai ý trong model session: mục đích (`study`/`review` hiện có) và chế độ chọn (`unseen`/`srs_due` cho tiếng Nhật), không nhét mọi lượt vào một cờ `dueOnly` rồi suy đoán về sau.
- Attempts tiếng Nhật cần lưu nguồn lâu dài, ví dụ `origin: ja_unseen | ja_retry | ja_srs | ja_mistakes`, để sau khi session kết thúc vẫn phân biệt bao phủ CSV, luyện lại và SRS. Attempts legacy không có field này giữ nguyên cách diễn giải cũ. Một lượt SRS đúng có thể gỡ cờ cần luyện lại của chính câu đã học, nhưng không tạo bao phủ cho câu chưa học; ôn sai riêng vẫn không đổi tiến độ thường.

## 5. Hợp đồng 8 dạng bài và cách chấm

Chi tiết cột CSV, giới hạn và ví dụ trong [JAPANESE_CSV_GUIDE.md](JAPANESE_CSV_GUIDE.md). Đây là contract đề xuất phải triển khai trước khi nhập được vào web.

### Nguyên tắc chung

- Bảy dạng chọn đáp án có đúng bốn phương án, một lựa chọn đúng. Ngữ pháp 3 có 2–12 mảnh.
- Phương án/mảnh có ID ổn định; đáp án là ID, không phải số thứ tự hiển thị hay văn bản đã nối. Đổi vị trí phương án không đổi kết quả.
- Dùng `NFC` cho văn bản hiển thị. Không lấy `normalizeText()` tiếng Anh làm bộ chấm tiếng Nhật: không tự đổi hiragana/katakana, bỏ っ/ゃ/ゅ/ょ, kéo dài âm hoặc xóa dấu câu.
- Chấm bằng dữ liệu đã kiểm tra trong CSV, không gọi AI hay mạng. Parser không thể chứng minh một câu tiếng Nhật tự nhiên hoặc chỉ có một đáp án đúng; guide yêu cầu người tạo dữ liệu kiểm tra nội dung.
- Khi chấm, lưu lựa chọn, kết quả và tiến độ bằng một giao dịch. Nhấp đôi, Enter lặp, refresh hoặc hai tab không được chấm hai lần cùng một bước.

### Ngữ pháp 1: `ja_grammar_choice`

- `context` có đúng một `{{gap}}`; bốn phương án.
- Người học chọn một phương án. So ID với `answer`.
- Sau chấm hiện câu hoàn chỉnh, đáp án và giải thích; lý thuyết mở được nhưng không chiếm toàn màn hình.

### Ngữ pháp 2: `ja_grammar_star`

- `context` có đúng một `{{slots}}`; renderer thay bằng bốn ô trống, đặt ★ tại `star_position` (1–4).
- CSV lưu bốn mảnh, một hoặc nhiều thứ tự hợp lệ trong `accepted_orders`, cùng `answer` là ID tại ★.
- Mỗi thứ tự phải chứa đủ bốn ID, không thiếu/lặp/thừa. Với mọi thứ tự hợp lệ, ID ở ★ phải giống `answer`; nếu khác nhau thì câu mơ hồ, từ chối nhập.
- Trước chấm chỉ cần chọn một phương án. Sau chấm hiển thị thứ tự hoàn chỉnh và tô vị trí ★.
- Không tính sai vì người học chưa tự kéo bốn mảnh; đây không phải Ngữ pháp 3.

### Ngữ pháp 3: `ja_grammar_order`

- Mỗi mảnh có ID riêng; lưu nháp dưới dạng danh sách ID. Ghép văn bản bằng chuỗi rỗng, không chèn khoảng trắng kiểu tiếng Anh.
- Bấm mảnh để đưa lên, bấm mảnh đã chọn để trả xuống; có Hoàn tác và Làm lại. Kéo thả là bổ sung, không phải cách thao tác duy nhất.
- Chưa dùng đủ mọi mảnh thì chưa cho chấm. So thứ tự với `accepted_orders`; không chỉ so câu sau khi xóa khoảng trắng.
- Nếu hai mảnh có cùng văn bản hiển thị và cùng furigana sau NFC, việc hoán đổi hai ID không được làm học sinh sai. Bộ chấm dùng nhóm mảnh tương đương; không gộp các mảnh khác cách đọc.
- Cho phép nhiều thứ tự đúng đã khai báo; nếu có nhiều trật tự tự nhiên mà dữ liệu chỉ chấp nhận một, đó là lỗi nội dung cần báo để sửa CSV.

### Từ vựng 1: `ja_vocab_context`

- Một hoặc nhiều dòng ngữ cảnh; mỗi dòng có một `{{gap}}`, cùng nhận một từ/cụm từ đáp án.
- Cả cụm ngữ cảnh là một câu hỏi, một lần chấm, một key SRS. Không tách thành nhiều câu để tăng số lượng.
- `target` là mục từ đúng, không hiện riêng trước khi chấm; phần chữ thường của phương án đúng phải trùng `target`.
- Cấu tạo từ/tiền tố/hậu tố giống 問題3 chỉ là biến thể của dạng này, không tự thêm dạng số 9.

### Từ vựng 2: `ja_vocab_paraphrase`

- Câu ngữ cảnh đầy đủ, đánh dấu đúng một lần xuất hiện của `target`; bốn cách diễn đạt/nghĩa gần nhất.
- Tránh dùng từ đồng nghĩa đúng nhưng sai sắc thái/ngữ cảnh làm đáp án thứ hai. Không bắt người học nhập nghĩa tiếng Việt.

### Từ vựng 3: `ja_vocab_usage`

- Hiện từ đích ở trên, bốn câu sử dụng từ đó ở dưới. Câu dài dùng một cột.
- Chỉ một câu có cách dùng đúng; lời giải giải thích cả ba cách dùng sai. Có thể dùng dạng biến đổi hợp lệ của động từ/tính từ, không yêu cầu khớp chuỗi cứng trong mọi phương án.

### Hán tự 1: `ja_kanji_reading`

- Đánh dấu `target` chứa chữ Hán trong một câu; bốn đáp án cách đọc bằng kana.
- Không có furigana cho từ đích trước khi chấm, kể cả trong thuộc tính hỗ trợ tiếp cận. Không phát âm từ đó để gợi đáp án.

### Hán tự 2: `ja_kanji_writing`

- Đánh dấu `target` bằng kana trong ngữ cảnh; bốn cách viết chứa chữ Hán.
- Không hiện cách viết đúng trong tiêu đề, breadcrumb, gợi ý hoặc đáp án mẫu trước chấm. Không thêm furigana vào bốn lựa chọn Hán tự.
- Hai dạng Hán tự học theo tiến độ câu; **chưa áp dụng SRS cho Hán tự** vì người dùng chỉ xác nhận SRS từ vựng.

## 6. SRS tiếng Nhật: theo từ, tiến độ CSV theo câu

### 6.1. Khóa và lịch

- Chỉ ba loại `ja_vocab_*` tham gia SRS. `learning_key` bắt buộc có tiền tố `ja:vocab:` và đại diện cho một mục từ + cách đọc + nghĩa.
- Có thể dùng lại cùng key giữa các biến thể/các bộ nếu thực sự cùng mục từ và nghĩa. Từ đồng âm, chữ khác hoặc nghĩa khác phải có key khác.
- Tiến độ câu luôn theo `setId + originalId`, không theo key. Nhập cùng file thành một bộ mới không tự sao chép tiến độ câu từ bộ cũ, dù có thể dùng chung lịch của từ.
- Giữ thuật toán lịch đang có: sai ôn lại sau 10 phút; đúng lần đầu 1 ngày, lần tiếp 6 ngày, các lần sau dựa trên khoảng cách và ease. Không tự thay SRS bằng thư viện/thuật toán mới.
- Giữ bản vá phân biệt “đến hạn theo ngày” và mốc lapse 10 phút. Không để từ vừa sai đến hạn ngay vì phép so ngày.

### 6.2. Một sự kiện đánh giá cho một key trong một lượt

Đây là thay đổi cần thiết, không chỉ đổi nhãn UI. Hiện `addAttempt()` cập nhật SRS ở mỗi lần trả lời; dùng nguyên trạng sẽ tăng/giảm lịch nhiều lần khi cùng từ có ba câu hoặc làm lại câu sai.

Đề xuất cho tiếng Nhật:

1. Tạo sự kiện có ID ổn định `sessionId + learning_key`, lưu các câu được chọn cho key đó và kết quả **lần trả lời đầu** của từng câu.
2. Lưu sự kiện đang dở cùng giao dịch ghi attempt. Trả lời lại một câu để luyện đến đúng không ghi thêm chất lượng SRS.
3. Khi đã có lần trả lời đầu của mọi câu được chọn cho key, kết luận: tất cả đúng → đạt; có ít nhất một câu sai → chưa đạt. Áp dụng lịch đúng một lần rồi đánh dấu sự kiện đã áp dụng.
4. Tạm dừng/đóng tab giữ sự kiện mở. Nếu chủ động kết thúc hoặc thay lượt, chốt trên các câu đã trả lời; câu chưa trả lời không bị tính sai. Lượt đã chốt không được phục hồi như lượt đang dở.
5. Ôn SRS chọn một biến thể/key nên sự kiện chốt ngay sau lần chấm đầu; làm lại đến đúng chỉ là luyện thêm.
6. Nếu học thêm biến thể đúng khi từ chưa đến hạn, không kéo dài lịch lần nữa. Nếu biến thể mới bị sai, cho vào lịch 10 phút; nếu đã đang trong cùng cửa sổ lapse chưa đến hạn thì không tăng lapse thêm và không đẩy hạn ra xa hơn.
7. Lúc chốt kiểm tra trạng thái review mới nhất trong giao dịch, không ghi đè từ baseline cũ nếu một tab khác đã cập nhật. Mọi sự kiện có `appliedAt` phải idempotent.

Ví dụ: ba câu cho từ A trong một lượt, đúng/sai/đúng → đã làm 3 câu, lịch A nhận một kết quả chưa đạt. Làm lại câu sai đến đúng không biến A thành đã ôn thành công ba lần.

### 6.3. Dữ liệu phụ cần bền vững

- Lưu sự kiện đang dở/đã áp dụng hoặc dấu vết tương đương có thể kiểm chứng từ attempts. Không chỉ để trong biến UI.
- Sao lưu, khôi phục và recovery phải mang đủ dữ liệu này để không áp dụng lịch hai lần hoặc bỏ mất lần sai.
- Với bản sao lưu không chứa phiên học đầy đủ: khi khôi phục, chốt sự kiện dở trên các câu đã có đáp án và đóng lượt mồ côi; không giả vờ khôi phục toàn bộ session. Thực hiện một lần trong giao dịch khôi phục.
- “Ôn câu sai” với `purpose: review` giữ nguyên quy tắc không đổi lịch; không gọi nhầm hàm cập nhật SRS tiếng Nhật.
- Từ có ba dạng nhưng chỉ có hai dạng trong phạm vi ôn: xoay vòng trong hai dạng đó. Chỉ dùng câu đang active, vẫn thuộc bộ tồn tại.

## 7. CSV riêng và mô hình dữ liệu

Profile đề xuất: **`schema=ja-v1`, `subject=japanese`, 20 cột**, định nghĩa đầy đủ trong guide riêng. Giữ nguyên CSV cũ 16/18 cột và `QUESTION_CSV_GUIDE.md`, đặc biệt hướng dẫn vocabulary tiếng Anh.

Các quyết định chính:

- `section` trong CSV ánh xạ có chủ đích sang `domain` nội bộ: `grammar`, `vocabulary`, `kanji`. Không đổi hàng loạt tên field cũ.
- Thêm metadata chương/bài, `target`, `acceptedOrders`, `starPosition`, profile; không nhét JSON vào `subtopic` hoặc suy ra cấu trúc từ tên file.
- `options` là JSON gồm `{id, text}`. `answer` là ID với dạng chọn; `accepted_orders` là JSON danh sách các thứ tự cho hai dạng sắp xếp.
- Chỉ tiếng Nhật dùng kiểu option mới. Các consumer cũ không được nhận object rồi hiển thị `[object Object]`.
- Furigana dùng cú pháp hẹp `{漢字|かな}`, parser riêng tạo text/ruby an toàn. Không cho HTML tùy ý, `eval`, URL tài nguyên hoặc script trong CSV.
- `{{gap}}` và `{{slots}}` là token cấu trúc được kiểm tra theo type; không tái sử dụng dấu `||` của parser tiếng Anh.
- Bắt đầu bằng kiểm tra profile/header → parse CSV → parse JSON/token → validate nghiệp vụ → preview → xác nhận → ghi nguyên tử. Có lỗi ở một dòng thì không nhập một phần.
- Preview cho thấy tên bộ, trình độ, số chương/bài, số câu theo 8 dạng, số từ SRS riêng biệt và lỗi có dòng/cột. Khác biệt key/target, ID trùng, câu mơ hồ phải được phát hiện hoặc cảnh báo rõ.
- Quy tắc tái nhập giữ nguyên tinh thần hiện có: không tự merge/ghi đè bộ cũ. Nhận diện file/bộ tương tự và thông báo trước khi tạo bộ mới.

## 8. Backend/lưu trữ: vị trí phải sửa sau khi duyệt

Baseline đã đọc ngày 18/09/2026: nhánh `codex/study-refresh-20260908`, HEAD `f235fef`; worktree sạch trước khi thêm tài liệu này. Project: `C:/Users/DELL/Documents/Codex/2026-07-26/t-o/work/remote-live`. Khi triển khai phải đọc lại HEAD, không reset về baseline.

| Nơi hiện tại | Rủi ro nếu chỉ thêm nút Tiếng Nhật | Công việc cần làm |
| --- | --- | --- |
| `core.js`: SUBJECTS, QUESTION_TYPES, parser | Chỉ nhận bốn môn; môn không phải English bị ép lớp 6–9; chưa có 8 type Nhật | Registry theo môn/profile; validator tiếng Nhật; giữ nguyên đường legacy |
| `core.js`: `selectQuestions`, `learningKeyFor` | Vocabulary bị khử trùng key, bỏ sót biến thể | Tách chọn câu mới theo ID và chọn SRS theo key |
| `core.js`: chấm ordering/normalize | Tách/join bằng khoảng trắng và chuẩn hóa tiếng Anh | Bộ chấm riêng bằng ID, giữ nguyên chữ Nhật |
| `storage.js`: import, session, summary, attempts | Whitelist/type/answer mới không qua kiểm tra; có thể mất nháp | Validate đầy đủ profile, dạng answer, scope, option order và SRS events |
| `storage.js`: `validateBackup` | Hiện whitelist bốn môn; round-trip qua CSV cũ làm mất metadata | Dispatch serializer/validator đúng profile, kiểm tra tham chiếu key/ID, khôi phục nguyên tử |
| `storage.js`: `addAttempt`, `advance` | Mỗi attempt tăng lịch; retry lẫn tiến độ | Nhánh Nhật riêng, SRS một sự kiện/key/lượt, hàng đợi retry bền vững |
| `stats.js`: `questionsToCsv` | Hiện join option bằng `||`, không giữ object/ruby/order | Export theo profile; không làm thay đổi CSV legacy |
| `stats.js`: thống kê/tìm kiếm/báo cáo | Đếm câu như từ, gộp topic ở chương khác | Nhóm đủ path; số câu/từ tách biệt; index văn bản Nhật và reading |
| `app.js` | Grade/level và mode chỉ theo English/science; flashcard có thể nhận Nhật | Nhánh môn rõ ràng, loại flashcard Nhật ở cả UI và repository |
| `scripts/build.mjs`, PWA | File mới/guide mới không nằm trong manifest build | Thêm module/guide cần ship và kiểm tra precache/digest theo cơ chế hiện tại |

### Tổ chức mã đề xuất, không đổi framework

- Có thể tách `japanese.js` cho type/CSV/grade và `japanese-ui.js` cho renderer/ruby; để orchestration hiện tại gọi qua adapter. Nếu tách tiếp thì giải thích lợi ích, không viết lại toàn app.
- Tránh vòng import giữa core/stats/storage; serializer tiếng Nhật nên là hàm thuần dùng chung.
- Chặn flashcards với `subject=japanese` tại repository, restore session và backup validation; không chỉ ẩn nút.
- Không thêm server, database cloud, CDN, dịch vụ từ điển hoặc khóa API.

### Migration và bảo toàn dữ liệu

- Hiện dữ liệu nằm trong workspace IndexedDB, có localStorage fallback; backup export phiên bản 2. Không đổi tên DB hoặc xóa store để migration.
- Thêm dữ liệu tiếng Nhật theo kiểu additive; bản cũ không có profile/metadata mới vẫn đọc đúng và không bị suy thành tiếng Nhật.
- Đề xuất backup phiên bản 3 nếu thêm SRS events vào snapshot; vẫn nhập được v2. Bản tương lai không hỗ trợ phải báo rõ, không âm thầm bỏ field quan trọng.
- Chỉ tăng IndexedDB version nếu thực sự thay object store/index; thêm property của workspace không tự buộc đổi version.
- Backup/restore phải bảo toàn options có ID, mọi accepted order, furigana, thứ tự chương/bài, key, attempts và các sự kiện SRS. Validate tất cả trước khi thay workspace, lỗi thì giữ bản cũ.
- Xóa một bộ chỉ xóa câu/tiến độ thuộc bộ đó. Review theo key còn bộ khác tham chiếu không được mất. Lượt đang dùng bộ bị xóa ở tab khác phải kết thúc an toàn.
- Giữ snapshot phục hồi trước thao tác thay thế lớn. Không xem việc xóa kho dữ liệu là cách sửa lỗi parse/render.
- Test riêng IndexedDB và localStorage fallback, quota lỗi, giao dịch lỗi và xung đột revision giữa hai tab.

## 9. Frontend tối thiểu để dùng được đúng

### Nội dung và thao tác

- Bộ chọn môn thêm “Tiếng Nhật”. Ba mục hiển thị đúng “Hán tự”, “Ngữ pháp”, “Từ vựng”; không gắn nhãn “Flashcards” cho từ vựng Nhật.
- Trang làm bài ưu tiên câu hỏi, lựa chọn và nút chấm. Câu ngắn có thể dùng 2×2; câu dài và điện thoại dùng một cột.
- Chưa chọn đủ đáp án thì nút chấm vô hiệu; feedback đúng/sai có chữ/icon, không chỉ màu. Sau chấm mới hiện lời giải, lý thuyết và nút tiếp.
- Giữ bản vá chống lộ đáp án qua `subtopic`/sidebar theory. Trong lượt làm bài không hiển thị topic đích, target ẩn, hint, lý thuyết hoặc breadcrumb chứa đáp án; thư viện và chế độ xem lý thuyết riêng được hiển thị chủ điểm.
- Không thể chống học sinh đọc answer trong mã dữ liệu client: đây là công cụ tự luyện, không phải hệ thống thi chống gian lận. Mục tiêu là không vô tình gợi đáp án trên UI.
- Một khu vực “Xem lý thuyết” trước khi bắt đầu hoặc sau chấm đáp ứng nhu cầu nhắc lại ngữ pháp; không tự mở trên câu đang kiểm tra.

### Chữ Nhật, tiếng Việt và khả năng tiếp cận

- Văn bản tiếng Nhật dùng font fallback hỗ trợ Nhật trên hệ điều hành, `lang="ja"`; giao diện và lời giải `lang="vi"`. Không tự tải font từ CDN.
- Mục tiêu chữ câu Nhật khoảng 22–26 px trên desktop, ít nhất khoảng 20 px trên điện thoại; lựa chọn không nhỏ hơn 18 px. Tôn trọng cài đặt tăng cỡ chữ hiện có.
- Furigana có line-height đủ cao, không bị cắt bởi overflow/fixed height. Không áp dụng letter-spacing Latin rộng cho tiếng Nhật.
- Ruby chỉ bật theo dữ liệu được cho phép, không tự thêm cách đọc vào câu kiểm tra Hán tự. “Hiện/ẩn furigana” không được vượt qua quy tắc chống lộ đáp án.
- Phím 1–4 chọn phương án theo vị trí hiển thị; Enter chấm/tiếp đúng trạng thái. Tab/Space dùng được với chip. Không bắt phím khi đang nhập hoặc composition IME.
- ★ có mô tả hỗ trợ tiếp cận “Vị trí số 3 trong 4 vị trí”, không đọc ra đáp án. Chip có số thứ tự và nút chuyển lên/xuống/trả lại cho người không kéo thả.
- Test màn hình nhỏ, zoom 200%, light/dark/auto, reduced motion và fallback không blur. Không che tràn ngang bằng `overflow-x: hidden`.

### Nút bật/tắt furigana

- Một công tắc ngắn “Furigana” ngay trong thanh công cụ làm bài, có trạng thái bật/tắt rõ ràng và thao tác được bằng bàn phím. Không giấu trong phần cài đặt sâu.
- Đề xuất mặc định bật ở lần đầu; sau đó luôn dùng lựa chọn đã lưu. Thiết lập dùng chung cho phần Tiếng Nhật trên thiết bị, độc lập với môn, bộ bài, đáp án và lịch SRS.
- Khi bật, hiện cách đọc được cung cấp bằng `{漢字|かな}` trong câu hỏi, phương án, chip và phần giải thích. Khi tắt, chỉ render phần chữ gốc; không cần người tạo CSV làm hai phiên bản có/không furigana.
- Không tự đoán hoặc gọi dịch vụ ngoài để bổ sung cách đọc. Nếu một đoạn không có dữ liệu furigana, bật công tắc không làm phát sinh cách đọc cho đoạn đó. Guide yêu cầu AI cung cấp chú âm cho các phần cần hỗ trợ.
- Thay đổi ngay trên câu đang làm nhưng phải giữ lựa chọn, thứ tự chip, focus, thời gian và nháp. Không khởi động lại session, chấm lại hoặc gọi cập nhật SRS.
- Quy tắc chống lộ đáp án có ưu tiên cao hơn công tắc: target của Hán tự 1 và lựa chọn Hán tự 1/2 không hiện furigana trước chấm. Lời giải sau chấm được có cách đọc. Không để screen reader đọc phần đã bị ẩn.
- Lưu thiết lập qua cơ chế preferences hiện có. Nếu ghi preferences lỗi, vẫn cho bật/tắt trong phiên hiện tại và thông báo nhẹ; không chặn bài làm.

## 10. Các đường tích hợp không được bỏ sót

1. Tìm câu: tìm được kanji/kana, đọc được phần ruby; không sửa chuỗi gốc để phục vụ tìm kiếm.
2. Kết quả và lịch sử: giải mã option ID thành chữ đã chọn, không in `o2`/`[object Object]`; giữ thứ tự chip đã làm và đáp án chuẩn.
3. Thống kê: lọc Tiếng Nhật, chapter/lesson/section/type; số câu và số từ có nhãn riêng. Không dùng độ chính xác ba biến thể như ba lần SRS.
4. Xuất CSV: xuất đúng `ja-v1` khi bộ Nhật; không ép vào header 18 cột. Không xuất một CSV trộn nhiều profile.
5. Chia sẻ link: giữ giới hạn kích thước hiện có, luôn preview/xác nhận; metadata/ruby/order phải round-trip. Bộ quá lớn hướng người dùng xuất CSV, không hứa mọi bộ đều vừa link/QR.
6. Báo cáo giáo viên: nhãn Unicode đúng, không mất cấu trúc, chống formula injection. Báo cáo CSV khác với file câu hỏi dùng để tái nhập.
7. SRS reminder: hiện số từ đến hạn tiếng Nhật với nhãn môn; không đưa chúng vào luồng flashcard. Giữ cách tính lapse 10 phút vừa được sửa.
8. Offline/PWA: học, chấm, lưu, mở guide được khi offline sau khi tài nguyên đã cache; giữ nguyên digest/self-repair và cache theo scope. Không xóa dữ liệu học khi cập nhật.

## 11. Trình tự triển khai sau khi được duyệt

Tất cả ô dưới đây đều **chưa triển khai**. Không dùng các mốc frontend cũ trong `PLAN.md` làm bằng chứng rằng Tiếng Nhật đã xong.

### A. Contract và fixture

- [ ] Đọc HEAD mới, giữ thay đổi người dùng và xác nhận nhánh làm việc; không reset checkout.
- [ ] Chốt `ja-v1` theo guide, thêm type registry và fixture hợp lệ đủ 8 dạng.
- [ ] Fixture lỗi: sai header/JSON, order, ★, target, furigana, key, profile trộn, câu trùng ID.
- [ ] Thêm test bảo toàn CSV 16/18 cột và vocabulary tiếng Anh trước khi nối luồng mới.

Điều kiện xong: test parser/validator/serializer Nhật độc lập đạt; không đụng UI để che lỗi backend.

### B. Backend và lưu trữ trước

- [ ] Bộ chấm bằng ID, thứ tự chip và ★; hỗ trợ các thứ tự chấp nhận.
- [ ] Chọn câu theo path + question ID; tách câu mới/SRS/retry/ôn sai.
- [ ] SRS events idempotent, không tăng lịch khi luyện sớm/nhấp đôi/làm lại.
- [ ] Session/summary/backup/recovery/deletion/multi-tab hoạt động, không mất metadata.
- [ ] Thống kê/export/share/report và dữ liệu cũ không hồi quy.

Điều kiện xong: chứng minh bộ 50 dòng được làm đủ 30 + 20, kể cả nhiều dòng cùng key; kiểm chứng restore bằng cả hai storage adapter.

### C. Frontend cần thiết

- [ ] Chọn môn, cây chương/bài/mục, bộ lọc và progress có nhãn.
- [ ] Renderer 8 dạng, ruby/target an toàn, giải thích/lý thuyết sau chấm.
- [ ] Công tắc furigana đổi ngay, nhớ lựa chọn sau reload và không lộ đáp án Hán tự.
- [ ] Chip dùng được bằng chuột, cảm ứng và bàn phím; nháp/IME/focus không lỗi.
- [ ] Từ vựng chỉ có bài tập và SRS; không còn đường vòng mở flashcard Nhật.
- [ ] Preview import/download guide/kết quả/trạng thái rỗng/lỗi được nối đầy đủ.

Điều kiện xong: browser QA thật với dữ liệu, không dữ liệu, dark/light và mobile; không chỉ so ảnh tĩnh.

### D. Kiểm thử hồi quy và phát hành khi được phép

- [ ] Chạy suite hiện có và test Nhật; ghi số test thực tế, không sao chép con số từ tài liệu cũ.
- [ ] Một tiến trình build mỗi lần; kiểm tra resource list, base path `/nam-english/`, SHA-256 và guide.
- [ ] QA trên bản build, thử reload/offline/service worker cũ → mới, không mất IndexedDB.
- [ ] Agent chính review diff và các bất biến; sửa các lỗi phát hiện trước khi báo hoàn tất.
- [ ] Khi người dùng cho phép phát hành: commit/push non-force, kiểm tra Actions và live. Bản build local không đồng nghĩa đã lên website.

## 12. Bộ nghiệm thu bắt buộc

### Dữ liệu và bảo mật

- [ ] Nhập UTF-8 có/không BOM, dấu phẩy/dấu nháy/newline trong ô; tiếng Việt và Nhật không bị lỗi font/encoding.
- [ ] Dữ liệu đủ 8 dạng đi qua import → export CSV → import và backup → restore mà không mất field.
- [ ] Lỗi dòng 17/cột options báo đúng vị trí, không nhập 16 dòng đầu rồi dừng.
- [ ] HTML/script, prototype keys, JSON lồng sâu, chuỗi quá dài và schema chưa hỗ trợ đều được chặn/hiển thị an toàn.
- [ ] Guide/CSV tiếng Anh cũ không đổi nghĩa; Hóa/Lí/Sinh vẫn lọc lớp 6–9.
- [ ] ID giống nhau ở hai bộ không đè nhau; học một bộ không hoàn thành bộ kia.

### Chấm bài

- [ ] MCQ giữ đáp án đúng khi đảo lựa chọn, refresh và dùng phím 1–4.
- [ ] ★ ở đủ bốn vị trí; chỉ cần chọn mảnh tại ★; order và answer bất nhất bị từ chối nhập.
- [ ] Ordering hỗ trợ nhiều thứ tự đúng, mảnh giống nhau, chữ kana nhỏ và dấu câu; không chèn space vào câu Nhật.
- [ ] Chưa đủ mảnh/chưa chọn đáp án thì không chấm; nhấp đôi không ghi hai attempt.
- [ ] Từ vựng nhiều ngữ cảnh chỉ tạo một attempt và một đơn vị câu hỏi.
- [ ] Kanji reading không có furigana của target; kanji writing không lộ chữ đúng trong header/hint/ARIA.

### Tiến độ và SRS

- [ ] 50 câu → 30 + 20; lần sau 0 câu mới. Ba biến thể cùng key không bị mất hai câu.
- [ ] Đã làm hết phạm vi nhỏ không hiện nhầm đã xong cả CSV.
- [ ] Câu sai từ vựng quay lại với nhãn luyện lại; không tăng tổng câu mới/unique count.
- [ ] Ba biến thể đúng/sai/đúng → một sự kiện SRS chưa đạt; retry đúng không tăng repetition.
- [ ] Đúng sớm trước hạn không kéo dài lịch; sai được đưa về 10 phút, không lùi hạn thêm vì lặp sai trong cùng cửa sổ.
- [ ] SRS xoay biến thể, không trộn tiếng Anh, không tự đánh dấu các câu chưa học đã xong.
- [ ] Pending event qua refresh/đóng tab/kết thúc sớm/backup-restore chỉ được áp dụng một lần.
- [ ] Ôn câu sai không đổi SRS hoặc tiến độ học thường; key chung nhiều bộ được đếm đúng.
- [ ] Xóa một bộ vẫn giữ review key được bộ khác dùng, xử lý session của tab khác an toàn.

### UI và vận hành

- [ ] 390/760/1050 px và zoom 200%; chữ Việt/Japan/ruby không cắt, không tràn ngang.
- [ ] Touch/keyboard/IME/light/dark/auto và cài đặt cỡ chữ hiện có đều dùng được.
- [ ] Bật/tắt furigana giữa lúc làm G2/G3 vẫn giữ đáp án/thứ tự chip; reload và sang bộ khác giữ thiết lập, không đổi tiến độ/SRS. Đoạn thiếu cách đọc vẫn hiển thị chữ gốc.
- [ ] Khi bật furigana toàn cục, target Hán tự 1 và lựa chọn Hán tự 1/2 vẫn không lộ cách đọc trước chấm; khi tắt không bị đọc ngầm qua ARIA/screen reader.
- [ ] Nhật không thể mở flashcard qua nút, link, session restore hoặc gọi repository.
- [ ] Hai máy mở được web; giải thích rõ mỗi máy có dữ liệu riêng, nhập CSV/chia sẻ/backup dùng đúng.
- [ ] Offline/PWA không kẹt vì thiếu module Nhật, không xóa cache ứng dụng khác hoặc kho bài.

## 13. Prompt bàn giao cho Terra Max sau khi duyệt

```text
Triển khai phần Tiếng Nhật cho NẮM theo JAPANESE_PLAN.md và JAPANESE_CSV_GUIDE.md trong work/remote-live. Đọc HEAD và trạng thái Git hiện tại, giữ mọi thay đổi có sẵn; không reset về commit ghi trong plan.

Ưu tiên backend theo các đợt A rồi B, sau đó mới C và D. Bảo toàn Tiếng Anh, Hóa, Lí, Sinh; không sửa nội dung hướng dẫn vocabulary tiếng Anh. Có 8 dạng Nhật, không flashcard Nhật, có SRS từ vựng và công tắc furigana ghi nhớ lựa chọn nhưng không lộ đáp án Hán tự. Tiến độ CSV theo câu, SRS theo key, không bỏ biến thể, không tăng lịch nhiều lần trong một lượt.

Đọc contract CSV, thực hiện validator/serializer/grading/storage trước UI. Thêm test cho 50 câu → 30 + 20, ★, chip lặp, ruby/target, pending SRS, CSV/backup round-trip và dữ liệu legacy. Không dùng xóa DB để chữa lỗi. Không thêm server/framework/CDN. Báo rõ test và browser QA nào thực sự đã chạy. Chỉ phát hành khi được người dùng cho phép.
```

## 14. Trạng thái thực tế của đợt lập kế hoạch này

- Đã đối chiếu ảnh, kiểm tra trực quan các trang liên quan của PDF và đọc các đường parser/chấm/lưu/SRS/CSV export hiện tại.
- Đã ghi đủ các quyết định người dùng xác nhận; các lựa chọn schema, key, event SRS và migration trong tài liệu là **đề xuất kỹ thuật để duyệt**.
- Đã kiểm tra các ví dụ trong guide: 8 bản ghi/20 cột/8 type, JSON và hoán vị đúng cấu trúc, answer tại ★ nhất quán, context nhiều dòng và CSV round-trip không mất dữ liệu. Liên kết Markdown và encoding đạt. Đây là kiểm tra tài liệu, không phải test tính năng Nhật đã triển khai.
- Chỉ tạo/cập nhật Markdown. Chưa thêm type Nhật vào mã, chưa tạo kho câu hỏi, chưa chạy build hay phát hành, chưa xác nhận tính năng Nhật trên website live.
- Guide tiếng Nhật là contract tương lai; đưa thẳng CSV `ja-v1` vào bản web hiện tại sẽ chưa dùng được.
