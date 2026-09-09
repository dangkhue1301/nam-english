# Hướng dẫn tạo bộ CSV cho NẮM Học tập

NẮM là website tự luyện trên trình duyệt cho Tiếng Anh, Hóa học, Vật lí và Sinh học lớp 6–9. Mỗi file CSV tạo thành **một bộ riêng**; một file chỉ được chứa **một môn**. Website chấm bằng đáp án đã có trong CSV, không gửi câu hỏi lên AI hay máy chủ.

## Prompt dùng ngay

Gửi cả file hướng dẫn này cho AI tạo câu hỏi, rồi dùng một trong các prompt dưới đây. Thay phần trong ngoặc vuông.

### Tiếng Anh — grammar

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: english
- Phần học: grammar
- Trình độ: [A1/A2/B1/B2/mixed]
- Chủ điểm được giao: [ví dụ: Present perfect]
- Số câu: [50]
- Tên file: [english-present-perfect.csv]

Tự soạn câu mới chỉ theo chủ điểm được giao; không cần nguồn, tên sách hay số trang. Dùng đa dạng dạng bài phù hợp, mỗi câu có theory và explanation bằng tiếng Việt có dấu. Trả một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

### Tiếng Anh — vocabulary

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: english
- Phần học: vocabulary
- Trình độ: [A1/A2/B1/B2/mixed]
- Chủ đề hoặc danh sách từ: [điền ở đây]
- Số mục từ: [50]
- Tên file: [english-work-vocabulary.csv]

Mỗi mục phải có learning_key ổn định theo từ/cụm từ + từ loại + nghĩa. Cùng nghĩa dùng cùng key, nghĩa khác dùng key khác. Explanation và hint viết bằng tiếng Việt có dấu; theory có thể để trống. Trả một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

### Hóa học

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: chemistry
- Lớp: [6/7/8/9]
- Chủ điểm: [ví dụ: Công thức hóa học]
- Số câu: [30]
- Tên file: [chemistry-grade-8-formulas.csv]

Đặt subject=chemistry, grade đúng lớp đã giao và domain=practice cho mọi dòng. Viết prompt, context, explanation, theory, hint bằng tiếng Việt có dấu; dùng kiến thức cơ bản, đáp án xác định được bằng máy. Khi cần phân biệt CO với Co hoặc ký hiệu/đơn vị hoa-thường, thêm tags=case-sensitive. Trả một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

### Vật lí hoặc Sinh học

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: [physics hoặc biology]
- Lớp: [6/7/8/9]
- Chủ điểm: [điền ở đây]
- Số câu: [30]
- Tên file: [physics-or-biology-grade-x-topic.csv]

Đặt subject đúng môn, grade đúng lớp đã giao và domain=practice cho mọi dòng. Viết prompt, context, explanation, theory, hint bằng tiếng Việt có dấu; dùng kiến thức cơ bản và đáp án xác định được bằng máy. Với đáp án số, nêu đơn vị ngay trong đề rồi chỉ yêu cầu học sinh nhập số. Trả một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

## Hợp đồng dữ liệu CSV

- File `.csv` dùng UTF-8 (có hoặc không BOM), dấu phân cách là dấu phẩy `,`.
- Mỗi file nhận 1–2.000 câu, tối đa 5 MB; mỗi ô tối đa 10.000 ký tự.
- Dòng đầu phải đúng **18 cột**, đúng thứ tự sau:

```text
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
```

- Mỗi dòng dữ liệu phải có đúng 18 ô. Nên bọc mọi ô bằng dấu ngoặc kép thẳng `"`. Dấu `"` bên trong ô phải viết thành `""`; ô trống viết `""`.
- Không dùng dấu chấm phẩy để ngăn cột. Không dùng `||` như văn bản thông thường vì ký hiệu này phân tách lựa chọn/đáp án.
- ID phải duy nhất trong **file**, dùng chữ Latin, số, `.`, `_`, `-`. ID trùng ở hai file khác vẫn an toàn: mỗi file là một bộ riêng.
- Không trộn Hóa, Lí, Sinh và Tiếng Anh trong cùng một CSV. Nếu có nhiều môn, tách thành nhiều file/bộ.

| Cột | Cách điền |
|---|---|
| `subject` | Bắt buộc: `english`, `chemistry`, `physics`, hoặc `biology`. Mọi dòng trong một file phải cùng giá trị. |
| `grade` | Tiếng Anh để trống. Hóa/Lí/Sinh bắt buộc là đúng một trong `6`, `7`, `8`, `9`. |
| `id` | Bắt buộc, duy nhất trong file; ví dụ `c-formula-001`. |
| `domain` | Tiếng Anh: `grammar` hoặc `vocabulary`. Hóa/Lí/Sinh: luôn là `practice`. |
| `type` | Một trong 8 dạng ở bảng bên dưới. |
| `level` | Hữu ích cho Tiếng Anh (`A1`…`C2`, `mixed`); có thể để `mixed` cho khoa học. |
| `topic` | Bắt buộc; tên chủ điểm nhất quán để lọc. |
| `subtopic` | Trọng tâm nhỏ; có thể trống. |
| `prompt` | Bắt buộc; yêu cầu rõ ràng. Khoa học dùng tiếng Việt có dấu. |
| `context` | Câu, số liệu hoặc đoạn cần xử lý; có thể trống nếu prompt đã đủ ngữ cảnh. |
| `options` | Lựa chọn/từ/cặp ghép, ngăn bằng `||`; cách dùng theo `type`. |
| `answer` | Đáp án; các cách viết tương đương được chấp nhận ngăn bằng `||`. Riêng `matching` để trống. |
| `explanation` | Bắt buộc; giải thích đáp án bằng tiếng Việt có dấu. |
| `theory` | Bắt buộc với `grammar` và `practice`; nhắc lý thuyết ngắn bằng tiếng Việt có dấu. `vocabulary` có thể trống. |
| `hint` | Gợi ý ngắn không lộ đáp án; có thể trống. |
| `tags` | Nhãn ngăn bằng `||`; dùng chính xác `case-sensitive` khi cần phân biệt hoa/thường. |
| `difficulty` | Số nguyên `1`–`5`; để trống thì mặc định `2`. |
| `learning_key` | Bắt buộc với `vocabulary`; các domain khác để trống. |

### Tương thích file Tiếng Anh cũ

File Tiếng Anh 16 cột cũ vẫn nhập được nếu header đúng thứ tự dưới đây. Website tự hiểu `subject=english` và `grade` trống. File mới nên luôn dùng 18 cột.

```text
id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
```

## Tám dạng bài và cách chấm

| `type` | `options` | `answer` |
|---|---|---|
| `mcq` | 2–30 lựa chọn khác nhau | Đúng 1 lựa chọn, ghi nguyên nội dung, không ghi A/B/C/D. |
| `multiple_select` | 2–30 lựa chọn khác nhau | Ít nhất 2 đáp án đúng khác nhau, ngăn bằng `||`; phải chọn đúng đủ. |
| `fill_blank` | Để trống | Từ, cụm từ hoặc số cần điền. |
| `error_correction` | Để trống | Toàn bộ câu đã sửa; chỉ tạo lỗi có một đáp án rõ ràng. |
| `sentence_transformation` | Để trống | Toàn bộ câu viết lại; cung cấp từ khóa/ràng buộc để đáp án không mơ hồ. |
| `word_formation` | Để trống | Dạng từ cần điền; nêu từ gốc trong prompt/context. |
| `ordering` | 2–30 từ/cụm ngăn bằng `||` | Câu hoàn chỉnh phải dùng đúng toàn bộ token, đúng số lần, không thêm bớt. |
| `matching` | 2–30 cặp `left=>right`, ngăn bằng `||` | Để trống; đáp án lấy từ chính các cặp, không trùng vế trái/vế phải. |

Máy chấm chuẩn hóa Unicode, khoảng trắng thừa, nháy cong/thẳng và dấu `.`, `!`, `?` cuối câu. Mặc định không phân biệt hoa/thường. Khi `tags` có `case-sensitive`, máy giữ nguyên hoa/thường ở cả options, đáp án, ordering và chấm nhập chữ. Ví dụ `CO` (carbon monoxide) và `Co` (cobalt) phải có tag này.

Máy **không** tự hiểu từ đồng nghĩa, lỗi chính tả, đáp án gần đúng hay bài tự luận. Với nhập chữ, `answer="is not||isn't"` nghĩa là chấp nhận một trong hai cách viết. Với bài số, nêu đơn vị trong prompt/context, ví dụ “đơn vị g/cm³ đã cho sẵn”, và để `answer` chỉ là số như `2`; không dùng dung sai hoặc chấm bằng AI.

## Ví dụ từng môn

Các khối dưới đây là file riêng, hợp lệ để kiểm tra định dạng; chúng không phải kho bài mặc định.

### Tiếng Anh

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"english","","g-ptc-001","grammar","mcq","B1","Present continuous","","Choose the correct option.","Mia ___ a lesson right now.","takes||is taking||took||has taken","is taking","Cụm right now cho biết hành động đang diễn ra, nên dùng is taking.","Hiện tại tiếp diễn: S + am/is/are + V-ing.","Chú ý cụm chỉ thời gian.","present-continuous","1",""
"english","","v-work-001","vocabulary","word_formation","B1","Work","","Use the correct form of RELY.","We need a ___ assistant.","","reliable","Trước assistant cần tính từ reliable, nghĩa là đáng tin cậy.","","Cần một tính từ.","adjectives","2","vocab:reliable:adjective:dependable"
```

### Hóa học lớp 8

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"chemistry","8","c-formula-001","practice","mcq","mixed","Công thức hóa học","Phân biệt kí hiệu","Công thức nào là carbon monoxide (cacbon monoxit)?","","CO||Co||CO2","CO","CO là công thức của carbon monoxide; Co là kí hiệu nguyên tố cobalt.","Kí hiệu hóa học phân biệt chữ hoa và chữ thường; công thức cho biết thành phần chất.","So sánh số chữ cái viết hoa.","case-sensitive","1",""
"chemistry","8","c-molar-002","practice","fill_blank","mixed","Khối lượng mol","","Điền số; đơn vị g/mol đã cho sẵn.","Khối lượng mol của H2O là ___ g/mol.","","18","H2O gồm 2 H (2 g/mol) và 1 O (16 g/mol), tổng là 18 g/mol.","Khối lượng mol bằng tổng nguyên tử khối của các nguyên tử trong công thức.","Cộng 2 × 1 và 16.","","2",""
```

### Vật lí lớp 8

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"physics","8","p-force-001","practice","mcq","mixed","Lực","Đơn vị đo","Đơn vị SI của lực là gì?","","N||J||W","N","Newton, kí hiệu N, là đơn vị SI của lực.","Lực được đo bằng newton, kí hiệu N.","Phân biệt lực với năng lượng và công suất.","case-sensitive","1",""
"physics","8","p-density-002","practice","fill_blank","mixed","Khối lượng riêng","Tính toán","Điền số; đơn vị g/cm³ đã cho sẵn.","Một vật có khối lượng 200 g và thể tích 100 cm³. Khối lượng riêng là ___ g/cm³.","","2","Khối lượng riêng bằng 200 chia 100, bằng 2 g/cm³.","Khối lượng riêng D = m / V.","Lấy khối lượng chia thể tích.","","2",""
```

### Sinh học lớp 7

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"biology","7","b-photo-001","practice","mcq","mixed","Quang hợp","Cơ quan thực hiện","Bộ phận nào của cây xanh thực hiện quang hợp chủ yếu?","","Rễ||Lá||Hoa||Hạt","Lá","Lá chứa nhiều lục lạp nên là cơ quan quang hợp chủ yếu.","Quang hợp chủ yếu diễn ra ở lá, nơi có lục lạp chứa diệp lục.","Nghĩ về bộ phận nhận nhiều ánh sáng.","","1",""
"biology","7","b-cell-002","practice","fill_blank","mixed","Tế bào","Đơn vị cơ bản","Điền cụm từ thích hợp.","Tế bào là đơn vị cấu tạo và chức năng cơ bản của ___ .","","cơ thể sống","Tế bào tạo nên cơ thể sống và thực hiện các chức năng sống cơ bản.","Tế bào là đơn vị cấu tạo và chức năng của cơ thể sống.","Đây là khái niệm nền tảng của sinh học.","","1",""
```

## Vocabulary và lịch ôn

Mỗi `learning_key` đại diện cho một từ/cụm từ + từ loại + nghĩa cụ thể, ví dụ `vocab:record:noun:stored-information`. Cùng key có thể có nhiều câu biến thể, nhưng website chỉ chọn một biến thể trong một lượt.

- Lần học đầu được tính riêng theo từng bộ.
- Lịch ôn theo `learning_key` dùng chung giữa các bộ.
- Trả lời sai vocabulary/thẻ ghi nhớ sẽ quay lại cuối lượt đến khi đúng.
- Đúng lần đầu hẹn ôn sau 1 ngày, lần hai sau 6 ngày, rồi giãn dần; sai hẹn lại sau 10 phút.
- `grammar` và `practice` không dùng SRS: câu đã chấm, đúng hay sai, sẽ không lặp trong bộ.

## Kiểm tra và nhập file

Trước khi giao CSV, tự kiểm tra header, 18 ô mỗi dòng, UTF-8, ngoặc kép, ID, subject/grade/domain, type, options, đáp án và theory/explanation bắt buộc. Một dòng lỗi khiến website từ chối toàn bộ file, không nhập một phần.

Mở [NẮM Học tập](https://dangkhue1301.github.io/nam-english/) → **Thêm bộ CSV** → chọn file → xem kết quả kiểm tra → đặt tên bộ → **Thêm vào kho**. Chọn môn/bộ/lớp rồi bắt đầu lượt học. Mỗi lượt tối đa 30 câu; bộ grammar hoặc practice 50 câu sẽ chia thành 30 rồi 20, không lặp câu đã chấm.

Dữ liệu nằm trên trình duyệt từng thiết bị. Không có máy chủ, tài khoản học sinh, đồng bộ tự động hay bảng điểm tập trung. Dùng **Dữ liệu → Tải sao lưu** và khôi phục JSON để chuyển cả tiến độ sang máy khác.
