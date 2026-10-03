# Hướng dẫn tạo CSV tiếng Nhật cho NẮM

Phiên bản chính thức: `ja-v1` · Cập nhật: 02/10/2026.

> Định dạng `ja-v1` hỗ trợ 8 dạng câu hỏi Tiếng Nhật. File CSV theo đặc tả này có thể kéo thả hoặc nhập để tạo bộ bài; bài tập không có lịch ôn SRS.

Tài liệu này tự đủ ngữ cảnh để gửi cho AI khác. Chỉ cần cung cấp trình độ, chương/bài, topic và số câu; không bắt buộc cung cấp giáo trình/PDF, không có cột `source`. AI tự soạn câu mới, không chép nguyên đề. Không dùng guide này thay cho `QUESTION_CSV_GUIDE.md` của các môn cũ.

## 1. Prompt dùng ngay cho AI

```text
Hãy tạo đúng một file CSV UTF-8 theo toàn bộ quy tắc trong JAPANESE_CSV_GUIDE.md tôi đính kèm.

Thông tin bộ bài:
- schema: ja-v1
- subject: japanese
- Trình độ: [N5/N4/N3/N2/N1]
- Chương: [4]
- Bài: [2]
- Chủ điểm ngữ pháp: [danh sách mẫu ngữ pháp]
- Từ vựng cần luyện: [danh sách từ/cách đọc/nghĩa hoặc chủ đề]
- Hán tự cần luyện: [danh sách từ chứa kanji]
- Số câu: [50]
- Phân bổ: [ví dụ G1=10, G2=8, G3=6, V1=8, V2=6, V3=6, K1=3, K2=3; tổng 50]
- Tên file: [japanese-n2-ch04-l02.csv]

Yêu cầu:
1. Xuất đúng 20 cột theo header quy định; không thêm hoặc đổi tên cột.
2. Chỉ tạo các dạng và chủ điểm được giao. Không có flashcard, đọc hiểu hay nghe hiểu.
3. Câu hỏi tiếng Nhật tự nhiên, vừa trình độ; hướng dẫn, lý thuyết và giải thích bằng tiếng Việt có dấu. ĐẶC BIỆT: Cột explanation khi chấm bài BẮT BUỘC phải có bản dịch toàn bộ câu/ngữ cảnh sang tiếng Việt (định dạng rõ ràng: "Dịch câu: ...") để học sinh nắm rõ nghĩa câu văn khi nộp bài, sau đó mới phân tích ngữ pháp hoặc giải nghĩa từ vựng.
4. Mỗi câu chọn đáp án có 4 phương án và đúng 1 phương án đúng. Dùng ID cho answer, không dùng số hiển thị hoặc chép văn bản đáp án.
5. Ngữ pháp ★: kiểm tra mọi accepted_orders và answer tại star_position. Sắp xếp cả câu là dạng riêng.
6. Mỗi dòng là một câu hỏi. Nếu một từ có 3 dạng thì tạo 3 dòng có id khác nhau, dùng chung learning_key chỉ khi cùng từ, cách đọc và nghĩa.
7. Viết tiếng Nhật thuần, không dùng furigana hoặc cú pháp `{漢字|かな}`. Không ghi đáp án vào prompt/hint. Phương án nhiễu hợp lí, không có hai đáp án đúng.
8. Dùng đúng quy tắc JSON trong ô CSV, dấu nháy kép và newline. Kiểm tra tổng câu, số cột, ID, key, order và đáp án trước khi xuất.
9. Không sinh HTML, JavaScript, công thức bảng tính, source, đường dẫn tải tài nguyên hoặc giải thích ngoài CSV.

Trả một file CSV hoàn chỉnh, không bọc Markdown và không thêm lời dẫn. Nếu chưa thể đính kèm file, trả nguyên nội dung CSV, bắt đầu bằng header.
```

G1/G2/G3/V1/V2/V3/K1/K2 chỉ là viết tắt trong yêu cầu phân bổ. Trong cột `type` phải dùng đầy đủ mã ở phần 4. Có thể chỉ yêu cầu một mục hoặc một dạng, không cần file nào cũng đủ 8 dạng. Bộ nhiều chương/bài ghi số tương ứng ở từng dòng.

## 2. Định dạng và header chính xác

Một file = một bộ Tiếng Nhật, không trộn các môn/profile khác. UTF-8, chấp nhận BOM; dấu phân cách là dấu phẩy. Dòng xuống hàng trong một ô phải nằm trong dấu nháy kép. Dấu nháy kép bên trong ô phải viết gấp đôi.

```csv
schema,subject,id,level,chapter,lesson,section,topic,type,prompt,context,target,options,answer,accepted_orders,star_position,explanation,theory,hint,learning_key
```

Có đúng **20 cột**, đúng thứ tự trên. Ô không áp dụng để trống, không ghi `null`, `N/A`, `-` hoặc `{}` thay cho ô trống. Phải giữ đủ cột trống cuối dòng.

| # | Cột | Quy tắc |
| --- | --- | --- |
| 1 | `schema` | Bắt buộc `ja-v1` ở mọi dòng. |
| 2 | `subject` | Bắt buộc `japanese`. |
| 3 | `id` | ID câu duy nhất trong file, 1–100 ký tự ASCII: chữ/số/dấu chấm/gạch dưới/gạch ngang; bắt đầu bằng chữ hoặc số. Ví dụ `c04-b02-g001`. |
| 4 | `level` | Một trong `N5`, `N4`, `N3`, `N2`, `N1`. Không ghi `mixed` ở dòng; file có thể có nhiều level. |
| 5 | `chapter` | Số nguyên 1–999, ví dụ `4`, không ghi chữ “Chương”. |
| 6 | `lesson` | Số nguyên 1–999 trong chương, ví dụ `2`, không ghi chữ “Bài”. |
| 7 | `section` | `grammar`, `vocabulary` hoặc `kanji`, phải khớp type. |
| 8 | `topic` | Chủ điểm/mẫu ngữ pháp/nhóm Hán tự, tối đa 200 ký tự. Các dòng cùng nhóm dùng nhãn giống nhau. |
| 9 | `type` | Một mã trong 8 mã ở phần 4. |
| 10 | `prompt` | Hướng dẫn ngắn cho câu hỏi, không tiết lộ đáp án. Bắt buộc, tối đa 1.000 ký tự. |
| 11 | `context` | Câu/ngữ cảnh hoặc nghĩa tiếng Việt cho dạng sắp xếp. Theo quy tắc từng dạng; không dùng HTML. |
| 12 | `target` | Từ đích theo từng dạng; bắt buộc với vocabulary/kanji, trống với grammar. Văn bản thuần, không markup/ruby. |
| 13 | `options` | JSON array các object chỉ có `id` và `text`; 4 lựa chọn hoặc 2–12 mảnh với G3. |
| 14 | `answer` | ID một lựa chọn đúng; bắt buộc trừ G3. G3 để trống. |
| 15 | `accepted_orders` | JSON array chứa các array ID thứ tự hợp lệ. Bắt buộc với G2/G3; các dạng khác để trống. |
| 16 | `star_position` | Số nguyên 1–4, chỉ dùng cho G2; các dạng khác để trống. |
| 17 | `explanation` | Bắt buộc. Tiếng Việt có dấu. BẮT BUỘC phải chứa bản dịch toàn bộ câu/ngữ cảnh sang tiếng Việt (định dạng: `Dịch câu: "..."`) để học sinh hiểu nghĩa câu khi chấm bài, kèm phân tích ngữ pháp, từ vựng hoặc cách đọc chữ Hán. Hỗ trợ xuống dòng trong ô CSV để tách rõ bản dịch và phần giải thích. |
| 18 | `theory` | Bắt buộc với 3 dạng grammar: nhắc quy tắc ngắn. Vocabulary/kanji có thể để trống. |
| 19 | `hint` | Tùy chọn: một câu nhẹ tối đa 180 ký tự; người học có thể mở trước chấm. Không chứa đáp án, cách đọc đang kiểm tra, bản dịch câu đã giải, thứ tự mảnh hay chỉ dẫn chọn/loại phương án. |
| 20 | `learning_key` | Vocabulary có thể để trống; key cũ được nhận để tương thích, không dùng lập lịch ôn. Grammar/kanji để trống. |

Giới hạn đề xuất: tối đa 5 MB/file, 2.000 dòng câu hỏi, 10.000 đơn vị UTF-16/ô (cách đếm độ dài chuỗi JavaScript). Mỗi ID phương án dài 1–64 ký tự theo bộ ký tự ASCII của ID câu. `target` tối đa 200 ký tự; key tối đa 200. Tối đa 24 thứ tự trong `accepted_orders`; nếu cần quá nhiều, nên viết lại câu ít mơ hồ hơn.

### Options và thứ tự là JSON, không phải chuỗi ngăn bằng `||`

Ví dụ nội dung chưa escape của ô `options`:

```json
[{"id":"o1","text":"本"},{"id":"o2","text":"に"},{"id":"o3","text":"友達"},{"id":"o4","text":"もらった"}]
```

Trong CSV, ô đó phải thành:

```csv
"[{""id"":""o1"",""text"":""本""},{""id"":""o2"",""text"":""に""},{""id"":""o3"",""text"":""友達""},{""id"":""o4"",""text"":""もらった""}]"
```

`accepted_orders` chưa escape: `[["o3","o2","o4","o1"]]`. Mỗi order chứa tất cả ID option đúng một lần. Không viết JSON object, chuỗi câu hoàn chỉnh hoặc chỉ `["o3",...]` thiếu lớp array ngoài.

ID được giữ ổn định kể cả khi web đảo vị trí hiển thị. `answer=o4` không có nghĩa “đáp án số 4 trên màn hình”. Với bảy dạng chọn đáp án, cả ID và chữ hiển thị của lựa chọn phải khác nhau; không dùng hai lựa chọn nhìn giống nhau. G3 được có mảnh nhìn giống nhau nhưng vẫn cần ID riêng.

## 3. Cú pháp hiển thị tiếng Nhật

### Chỗ trống

- `{{gap}}`: một chỗ trống. G1 có đúng một; V1 có đúng một trên mỗi dòng ngữ cảnh không rỗng.
- `{{slots}}`: cả nhóm bốn ô, chỉ G2 dùng và chỉ xuất hiện một lần. Vị trí sao lấy từ `star_position`, không tự gõ ★ trong CSV.
- Không thay token bằng dấu gạch dưới, `( )` hoặc khoảng trắng; web cần token để render chính xác.
- G3 không dùng token chỗ trống: toàn câu đúng được ghép từ các mảnh, bao gồm dấu câu.

### Tiếng Nhật thuần và tương thích dữ liệu cũ

CSV mới không cần furigana: ghi chữ Hán/kana gốc, không dùng token chú âm `{漢字|かな}`, HTML hay cột furigana riêng. Website hiển thị chữ gốc ở đề, phương án, mảnh ghép và lời giải; không có nút bật/tắt furigana. Kana trong đáp án cách đọc hoặc lời giải vẫn là nội dung hợp lệ.

CSV cũ có token chú âm hợp lệ vẫn nhập được: chỉ phần chữ gốc được hiển thị. Target được đối chiếu theo chữ gốc. Token cũ phải đúng cú pháp và không lồng nhau; K1 không được có ruby phủ từ đang hỏi cách đọc, K1/K2 không dùng ruby trong options. Không đặt gap/slots trong token chú âm.

Gợi ý trước chấm chỉ hướng cách suy nghĩ. Ví dụ đạt: “Xét quan hệ giữa các thành phần của câu.” Không đạt: “Chọn o2”, “Dùng として”, câu đã ghép, bản dịch câu đã điền hoặc cách đọc của target. Website có bộ lọc và thay gợi ý nghi ngờ bằng câu chung; AI phải rà cả tiết lộ gián tiếp. Theory, topic và explanation chỉ hiển thị sau chấm; nghĩa tiếng Việt vốn là đề của G3 vẫn hiển thị.

Không tự đổi hiragana ↔ katakana, bỏ dấu kéo dài `ー`, bỏ kana nhỏ hoặc biến `づ` thành `ず`. Không thêm khoảng trắng để web tách từ. Ghép chip tiếng Nhật không cần khoảng trắng kiểu tiếng Anh.

## 4. Quy tắc riêng của 8 dạng

### G1. Ngữ pháp chọn đáp án

- `section=grammar`, `type=ja_grammar_choice`.
- `context`: đúng một `{{gap}}`, có đủ ngữ cảnh xác định một lựa chọn đúng.
- `options`: 4; `answer`: ID đúng; `theory`: bắt buộc.
- `explanation`: bắt buộc có câu tiếng Nhật hoàn chỉnh sau khi điền và bản dịch tiếng Việt (`Dịch câu: "..."`), sau đó giải thích lý do chọn mẫu ngữ pháp.
- `target`, `accepted_orders`, `star_position`, `learning_key`: trống.

### G2. Ngữ pháp chọn mảnh tại ★

- `section=grammar`, `type=ja_grammar_star`.
- `context`: đúng một `{{slots}}`, có thể có phần đầu/cuối câu cố định.
- `options`: đúng 4 mảnh; `accepted_orders`: các hoán vị hoàn chỉnh hợp lệ; `star_position`: 1–4.
- `answer`: ID tại chỉ số `star_position - 1` trong **mọi** order hợp lệ. Nếu các order cho đáp án ★ khác nhau, câu không hợp lệ và phải viết lại.
- Học sinh chỉ chọn mảnh ở ★, không nhập toàn câu. Lời giải (`explanation`) bắt buộc phải có: thứ tự hoàn chỉnh, câu tiếng Nhật hoàn chỉnh, bản dịch nghĩa câu sang tiếng Việt (`Dịch câu: "..."`) và chỉ rõ mảnh tại vị trí ★.
- `theory`: bắt buộc; `target`, `learning_key`: trống.

Ví dụ: order `o3 → o2 → o4 → o1`, sao ở vị trí 3 → `answer=o4`.

### G3. Ngữ pháp sắp xếp câu (luyện thêm)

- `section=grammar`, `type=ja_grammar_order`.
- `context`: nghĩa/câu gợi ý bằng tiếng Việt; `options`: 2–12 mảnh của toàn câu Nhật.
- `accepted_orders`: mọi thứ tự đúng được chấp nhận. `answer` và `star_position` để trống.
- Mỗi order phải dùng đủ các ID, mỗi ID một lần. Đặt dấu câu vào đúng mảnh; không chèn khoảng trắng thừa trước/sau mảnh.
- Có thể có các mảnh giống hệt nhau; web cần coi việc đổi chỗ hai mảnh hoàn toàn giống nhau là tương đương. Không dùng ID trùng để biểu diễn hai mảnh.
- Câu tiếng Nhật có nhiều trật tự tự nhiên thì phải khai báo đủ hoặc viết lại thành câu ít mơ hồ. Không lấy một cách diễn đạt ưa thích làm lý do chấm sai cách khác vẫn đúng.
- `theory`: bắt buộc; `target`, `learning_key`: trống. Lời giải (`explanation`) ghi lại câu tiếng Nhật đúng, nhắc lại bản dịch tiếng Việt và quy tắc ghép câu.

### V1. Từ vựng theo ngữ cảnh

- `section=vocabulary`, `type=ja_vocab_context`.
- `context`: một hoặc nhiều dòng, mỗi dòng có một `{{gap}}`; tất cả nhận cùng một từ/cụm từ hoặc đơn vị từ vựng.
- `target`: từ đúng; sau khi bỏ ruby, chữ phương án `answer` phải trùng target.
- Cả nhóm ngữ cảnh tính là một câu hỏi. Nếu hai chỗ cần hai đáp án khác nhau, không được dùng dạng này.
- Có thể ra biến thể cấu tạo từ, tiền tố/hậu tố nếu cùng cơ chế chọn một đáp án. Không tự sinh type mới.
- `options`: 4; `answer`: ID đúng; `learning_key`: có thể trống, không dùng SRS.
- `explanation`: bắt buộc dịch nghĩa đầy đủ tất cả các dòng ngữ cảnh sang tiếng Việt (`Dịch ngữ cảnh: 1. "..." 2. "..."`) và giải nghĩa từ vựng.

### V2. Từ vựng gần nghĩa

- `section=vocabulary`, `type=ja_vocab_paraphrase`.
- `context`: câu đầy đủ; `target` xuất hiện đúng một lần trong chữ hiển thị, web sẽ đánh dấu.
- `options`: 4 cách diễn đạt; `answer`: một cách gần nghĩa nhất trong chính ngữ cảnh này.
- Không dùng hai từ đồng nghĩa đều chấp nhận được làm hai phương án khác nhau.
- `learning_key`: có thể để trống; nếu giữ key cũ thì dùng key của từ đích, không phải của phương án đồng nghĩa. Key không tạo lịch SRS.
- `explanation`: bắt buộc dịch nghĩa toàn câu sang tiếng Việt (`Dịch câu: "..."`) và phân tích vì sao từ/cụm từ được chọn là gần nghĩa nhất trong ngữ cảnh đó.

### V3. Cách dùng từ vựng

- `section=vocabulary`, `type=ja_vocab_usage`.
- `target`: từ được hỏi, hiện riêng trên bốn lựa chọn. `context` có thể trống.
- `options`: 4 câu hoàn chỉnh, chỉ một câu dùng từ đúng. Có thể chia động từ/tính từ hợp lệ trong câu; không bắt mọi câu chứa nguyên văn dạng từ điển.
- `answer`: ID câu đúng.
- `learning_key`: có thể để trống; key cũ của từ đích vẫn được nhận và không tạo lịch SRS.
- `explanation`: bắt buộc dịch nghĩa câu đúng sang tiếng Việt (`Dịch câu đúng: "..."`), giải thích cách kết hợp từ và chỉ ra lỗi dùng từ của 3 câu còn lại.

### K1. Chọn cách đọc chữ Hán

- `section=kanji`, `type=ja_kanji_reading`.
- `context`: câu Nhật; `target` là một từ có chữ Hán, xuất hiện đúng một lần.
- `options`: 4 cách đọc bằng kana; `answer`: ID cách đọc đúng.
- Không ghi furigana; không lộ cách đọc của từ đích trong prompt/hint.
- `learning_key`: trống. Không tự áp SRS Hán tự hoặc tạo flashcard.
- `explanation`: bắt buộc dịch toàn bộ câu sang tiếng Việt (`Dịch câu: "..."`), nêu cách đọc kana đúng và ý nghĩa của từ chữ Hán đó.

### K2. Chọn chữ Hán đúng

- `section=kanji`, `type=ja_kanji_writing`.
- `context`: câu Nhật có từ đích bằng kana; `target` ghi đúng đoạn kana đó, xuất hiện đúng một lần.
- `options`: 4 cách viết có chữ Hán, có thể kèm okurigana; không kèm cách đọc/ruby.
- `answer`: ID cách viết đúng theo ngữ cảnh; tránh hai cách viết đều hợp lệ.
- `learning_key`: trống. Không tự áp SRS Hán tự hoặc tạo flashcard.
- `explanation`: bắt buộc dịch toàn bộ câu sang tiếng Việt (`Dịch câu: "..."`), chỉ ra chữ Hán đúng và nghĩa của từ.

Với V1/V2/V3/K1/K2: `accepted_orders` và `star_position` phải trống. Mọi dạng đều BẮT BUỘC phải có `explanation` chứa bản dịch câu sang tiếng Việt; theory chỉ bắt buộc với grammar.

## 5. Bộ CSV minh họa đủ 8 dạng

Các câu ngắn dưới đây minh họa định dạng, **không phải bản chép đề N2 hoặc bộ luyện N2 chuẩn hóa**. Trình độ ghi theo từng dòng; khi tạo bài thật phải theo trình độ giáo viên giao. Ba dòng V1/V2/V3 cùng một từ để trống key và có ID riêng; web vẫn giữ đủ ba câu độc lập.

Khối sau có 8 bản ghi dữ liệu nhưng nhiều hơn 9 dòng văn bản vì context V1 chứa newline hợp lệ trong một ô CSV:

```csv
schema,subject,id,level,chapter,lesson,section,topic,type,prompt,context,target,options,answer,accepted_orders,star_position,explanation,theory,hint,learning_key
ja-v1,japanese,g001,N5,1,1,grammar,Thì quá khứ,ja_grammar_choice,Chọn đáp án đúng.,きのう、友達と映画を{{gap}}。,,"[{""id"":""o1"",""text"":""見ます""},{""id"":""o2"",""text"":""見ました""},{""id"":""o3"",""text"":""見る""},{""id"":""o4"",""text"":""見ません""}]",o2,,,"Câu hoàn chỉnh: きのう、友達と映画を見ました。
Dịch câu: ""Hôm qua tôi đã xem phim cùng bạn.""
Giải thích: きのう nghĩa là hôm qua. Trong câu kể này, 見ました diễn tả hành động đã xảy ra.",Động từ lịch sự ở quá khứ khẳng định dùng dạng ました.,,
ja-v1,japanese,g002,N4,1,1,grammar,Mệnh đề bổ nghĩa danh từ,ja_grammar_star,Chọn mảnh nằm ở vị trí ★.,これは{{slots}}です。,,"[{""id"":""o1"",""text"":""本""},{""id"":""o2"",""text"":""に""},{""id"":""o3"",""text"":""友達""},{""id"":""o4"",""text"":""もらった""}]",o4,"[[""o3"",""o2"",""o4"",""o1""]]",3,"Thứ tự đúng: 友達 (3) → に (2) → もらった (4) → 本 (1).
Câu hoàn chỉnh: これは友達にもらった本です。
Dịch câu: ""Đây là quyển sách tôi được bạn tặng.""
Vị trí ★: Mảnh ở vị trí số 3 là もらった.
Giải thích: Mệnh đề bổ nghĩa đứng trước danh từ. Người cho có thể được đánh dấu bằng に trong cấu trúc nhận một vật.",Mệnh đề bổ nghĩa đứng trước danh từ. Người cho có thể được đánh dấu bằng に trong cấu trúc nhận một vật.,,
ja-v1,japanese,g003,N5,1,1,grammar,Sở hữu với の,ja_grammar_order,Sắp xếp các mảnh thành câu hoàn chỉnh.,Đây là quyển sách của tôi.,,"[{""id"":""p1"",""text"":""本""},{""id"":""p2"",""text"":""です。""},{""id"":""p3"",""text"":""私の""},{""id"":""p4"",""text"":""これは""}]",,"[[""p4"",""p3"",""p1"",""p2""]]",,"Câu đúng: これは私の本です。Dịch câu: ""Đây là quyển sách của tôi."" 私の đứng trước 本 để diễn tả sở hữu.",Danh từ 1 + の + danh từ 2 diễn tả quan hệ sở hữu; AはBです dùng để xác định A là B.,,
ja-v1,japanese,v001,N4,1,1,vocabulary,Giao tiếp hằng ngày,ja_vocab_context,Chọn một từ phù hợp với cả hai câu.,"友達と{{gap}}をしました。
明日の{{gap}}を忘れないでください。",約束,"[{""id"":""o1"",""text"":""約束""},{""id"":""o2"",""text"":""天気""},{""id"":""o3"",""text"":""図書館""},{""id"":""o4"",""text"":""机""}]",o1,,,"Dịch ngữ cảnh: 1. ""Tôi đã hẹn với bạn."" 2. ""Xin đừng quên cuộc hẹn ngày mai."" 約束 nghĩa là lời hứa hoặc việc đã hẹn. 約束をする là hứa/hẹn; 明日の約束 là cuộc hẹn ngày mai. Ba từ còn lại không phù hợp với cả hai ngữ cảnh.",,,
ja-v1,japanese,v002,N4,1,1,vocabulary,Giao tiếp hằng ngày,ja_vocab_paraphrase,Chọn cách diễn đạt gần nghĩa nhất với từ được đánh dấu.,明日の約束を忘れないでください。,約束,"[{""id"":""o1"",""text"":""前もって決めたこと""},{""id"":""o2"",""text"":""まだ知らない場所""},{""id"":""o3"",""text"":""毎日使う道具""},{""id"":""o4"",""text"":""外の天気""}]",o1,,,"Dịch câu: ""Xin đừng quên cuộc hẹn ngày mai."" Trong câu này, 約束 là việc đã hẹn hoặc thống nhất trước. 前もって決めたこと gần nghĩa nhất; các đáp án còn lại nói về địa điểm, đồ dùng và thời tiết.",,,
ja-v1,japanese,v003,N4,1,1,vocabulary,Giao tiếp hằng ngày,ja_vocab_usage,Chọn câu dùng từ đúng.,,約束,"[{""id"":""o1"",""text"":""友達との約束を守りました。""},{""id"":""o2"",""text"":""電車が何時に出るか、駅員に約束しました。""},{""id"":""o3"",""text"":""知らない言葉を辞書で約束しました。""},{""id"":""o4"",""text"":""会議の内容を一枚の紙に約束しました。""}]",o1,,,"Dịch câu đúng: ""Tôi đã giữ đúng lời hứa với bạn bè."" 約束を守る là giữ lời hứa. Câu 2 cần động từ hỏi hoặc xác nhận; câu 3 cần 調べる; câu 4 cần まとめる. 約束 không thay được các động từ đó.",,,
ja-v1,japanese,k001,N5,1,1,kanji,Đồ vật và sinh hoạt,ja_kanji_reading,Chọn cách đọc của từ được đánh dấu.,毎朝、新聞を読みます。,新聞,"[{""id"":""o1"",""text"":""しんぶん""},{""id"":""o2"",""text"":""しんぷん""},{""id"":""o3"",""text"":""しんもん""},{""id"":""o4"",""text"":""しぶん""}]",o1,,,"Dịch câu: ""Mỗi buổi sáng, tôi đều đọc báo."" 新聞 đọc là しんぶん, nghĩa là báo. Các cách đọc còn lại không đúng với từ này.",,,
ja-v1,japanese,k002,N5,1,1,kanji,Đồ vật và sinh hoạt,ja_kanji_writing,Chọn cách viết chữ Hán đúng cho từ được đánh dấu.,あたらしい靴を買いました。,あたらしい,"[{""id"":""o1"",""text"":""新しい""},{""id"":""o2"",""text"":""親しい""},{""id"":""o3"",""text"":""近しい""},{""id"":""o4"",""text"":""楽しい""}]",o1,,,"Dịch câu: ""Tôi đã mua một đôi giày mới."" あたらしい được viết là 新しい, nghĩa là mới. 親しい là したしい, 近しい là ちかしい, 楽しい là たのしい.",,,
```

## 6. Ví dụ nhiều thứ tự đúng và lỗi phải tránh

Nhiều thứ tự đúng dùng cùng cấu trúc JSON:

```json
[["p1","p2","p3","p4"],["p2","p1","p3","p4"]]
```

Đây chỉ là ví dụ cấu trúc; chỉ thêm thứ tự thứ hai nếu câu Nhật tương ứng thực sự đúng. Không bịa thêm để đủ số order.

Các lỗi cần tự kiểm:

- `answer=2` trong khi ID lựa chọn là `o1`…`o4`.
- G2 sao vị trí 3 nhưng answer lấy ở vị trí 2; hoặc order thiếu một mảnh.
- G3 vừa có answer dạng văn bản vừa có accepted_orders; contract yêu cầu answer trống.
- Dùng `||` để phân cách mảnh, làm lẫn với dấu `|` của furigana.
- `target` xuất hiện hai lần hoặc chỉ xuất hiện trong cách đọc ruby, không có ở chữ gốc.
- K1 viết `新聞` cho chính từ đang hỏi cách đọc.
- V1 có hai ngữ cảnh nhưng một từ chỉ khớp một ngữ cảnh.
- V3 có hai câu đều dùng đúng hoặc câu sai chỉ do lỗi chính tả không liên quan từ đang kiểm tra.
- Hai câu dùng cùng `id`; hai từ khác nghĩa dùng cùng key; ba biến thể cùng từ bị gộp thành một dòng.
- Cột `explanation` chỉ ghi đáp án hoặc số thứ tự cộc lốc mà KHÔNG dịch nghĩa toàn bộ câu sang tiếng Việt. Khi học sinh bấm chấm câu sẽ không hiểu được ý nghĩa trọn vẹn của câu hỏi/ngữ cảnh.
- Dùng nhãn level `B1` hoặc grade `8` cho tiếng Nhật.
- Thêm cột `source`, `furigana`, `chapter_title` ngoài contract vì thấy tiện. Chưa có các cột đó trong `ja-v1`.

## 7. Tiến độ bài tập và key cũ

Bài tập từ vựng không có lịch SRS. Mỗi dòng khác id là một câu độc lập; chấm xong đi tiếp dù đúng hay sai. Sai chuyển Ôn câu sai, làm lại đúng thì được loại khỏi danh sách sai. Bộ 50 câu đi 30 + 20; không gộp các dòng cùng từ hoặc key.

Vocabulary có thể để learning_key trống. Nếu giữ key của CSV cũ, key phải đúng dạng ja:vocab:yakusoku:promise (chữ thường ASCII, số, dấu hai chấm, gạch ngang/gạch dưới; tối đa 200 ký tự). Grammar/kanji để trống. Key được bảo toàn khi xuất CSV và sao lưu nhưng không tạo ngày ôn, ease hay repetition. Không thêm cột mới và không đổi schema ja-v1.

## 8. Kiểm tra trước khi giao file

1. Đúng UTF-8, header 20 cột, đúng số câu yêu cầu; newline trong ô không bị tính nhầm thành câu mới.
2. Mọi dòng có schema/subject đúng; id duy nhất, chapter/lesson/level/section/type hợp lệ.
3. JSON của options và accepted_orders parse được; không có key thừa, ID trùng, reference thiếu.
4. Đủ bốn lựa chọn cho các dạng chọn; G3 đủ 2–12 mảnh. Với dạng chọn, chữ hiển thị không trùng nhau.
5. Answer là ID có thật. G2 kiểm tra ★ với mọi order; G3 dùng đủ mảnh và không có answer.
6. Token gap/slots và target đúng quy tắc; tiếng Nhật thuần; không lộ đáp án Hán tự.
7. Mỗi câu chỉ có một đáp án chọn đúng; G3 khai báo đủ các thứ tự được chấp nhận. Từ đồng nghĩa/cách dùng/cách đọc đã kiểm tra theo ngữ cảnh.
8. Lý thuyết grammar và giải thích tiếng Việt có dấu, ngắn gọn, đúng nội dung. BẮT BUỘC có phần dịch nghĩa toàn bộ câu tiếng Nhật sang tiếng Việt trong cột explanation (định dạng rõ ràng: `Dịch câu: "..."` hoặc `Dịch ngữ cảnh: "..."`) để học sinh đối chiếu kiến thức khi chấm bài. Không dựa vào màu đánh dấu của ảnh tham khảo để lấy đáp án.
9. Vocabulary có thể để key trống; mỗi dòng có ID riêng, không gộp câu theo từ/key.
10. Không có HTML/script, công thức bảng tính, nguồn ngoài bắt buộc, flashcard, bài đọc/nghe hoặc type tự chế.

Khi nhập file CSV, hãy kiểm tra tại màn hình Xem trước (Preview) cây Chương/Bài, số câu theo từng dạng và cảnh báo gợi ý. Parser xác minh cấu trúc 20 cột, tính duy nhất của ID, tính hợp lệ của JSON và định dạng token; giáo viên/AI tạo đề chịu trách nhiệm về độ tự nhiên của câu văn, độ khó và tính duy nhất của đáp án.
