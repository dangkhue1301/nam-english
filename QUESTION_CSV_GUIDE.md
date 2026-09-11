# Hướng dẫn tạo bộ CSV cho NẮM Học tập

NẮM là website tự luyện trên trình duyệt cho Tiếng Anh, Hóa học, Vật lí và Sinh học lớp 6–9. Mỗi file CSV tạo thành **một bộ riêng**; một file chỉ được chứa **một môn**. Website chấm bằng đáp án đã có trong CSV, không gửi câu hỏi lên AI hay máy chủ.

## Triết lý học tập của NẮM

1. **Bước 1 — Nạp từ vựng bằng Thẻ ghi nhớ (Flashcards)**:
   - Học sinh học thuộc từ vựng trước (từ/cụm từ, từ loại, phát âm, câu ví dụ ngữ cảnh minh họa và nghĩa tiếng Việt) theo chu trình lặp lại ngắt quãng (SRS).
   - Chưa nhớ thì thẻ sẽ quay lại ở cuối buổi học để ôn lại cho thuộc, **không tính là làm bài tập sai**.
2. **Bước 2 — Áp dụng bằng Bài tập nhiều dạng (Grammar & Practice)**:
   - Sau khi đã nắm từ vựng, học sinh làm **bài tập áp dụng nhiều dạng** (trắc nghiệm, điền từ, sắp xếp câu, viết lại câu, tìm lỗi sai, ghép nối, word formation, chọn nhiều đáp án) để áp dụng cấu trúc ngữ pháp và từ vựng vào ngữ cảnh câu hoàn chỉnh.

---

## Prompt dùng ngay cho AI

Gửi cả file hướng dẫn này cho AI tạo câu hỏi, rồi dùng một trong các prompt dưới đây. Thay phần trong ngoặc vuông.

### Tiếng Anh — vocabulary (Thẻ ghi nhớ / Flashcards)

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: english
- Phần học: vocabulary (thẻ ghi nhớ - flashcards)
- Trình độ: [A1/A2/B1/B2/mixed]
- Chủ đề hoặc danh sách từ: [ví dụ: Work & Employment]
- Số mục từ: [50]
- Tên file: [english-work-vocabulary.csv]

Mục tiêu là HỌC TỪ VỰNG BẰNG THẺ GHI NHỚ (FLASHCARDS):
- Mỗi dòng là MỘT MỤC TỪ VỰNG cần học thuộc trước khi áp dụng vào bài tập.
- Cột prompt: Ghi từ hoặc cụm từ tiếng Anh, kèm phiên âm IPA và từ loại trong ngoặc đơn, ví dụ: "allocate /ˈæləkeɪt/ (v)" hoặc "reliable /rɪˈlaɪəbl/ (adj)".
- Cột context: Bắt buộc viết MỘT CÂU VÍ DỤ tiếng Anh tự nhiên minh họa cách dùng từ đó trong ngữ cảnh.
- Cột type: Đặt là "fill_blank".
- Cột options: Để trống ("").
- Cột answer: Ghi nghĩa tiếng Việt ngắn gọn, súc tích (đây là mặt sau thẻ ghi nhớ).
- Cột explanation: Giải thích chi tiết, họ từ, cách dùng trong câu bằng tiếng Việt có dấu.
- Cột theory: Có thể để trống ("").
- Cột learning_key: Bắt buộc chuẩn "vocab:word:pos:sense" theo từ/cụm từ + từ loại + nghĩa, ví dụ "vocab:allocate:verb:set-aside".

Trả đúng một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

### Tiếng Anh — grammar (Bài tập áp dụng nhiều dạng)

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: english
- Phần học: grammar (bài tập áp dụng)
- Trình độ: [A1/A2/B1/B2/mixed]
- Chủ điểm được giao: [ví dụ: Present perfect]
- Số câu: [50]
- Tên file: [english-present-perfect.csv]

Mục tiêu là BÀI TẬP ÁP DỤNG NGỮ PHÁP:
- Tự soạn câu bài tập theo chủ điểm; dùng đa dạng các dạng bài phù hợp (mcq, fill_blank, error_correction, sentence_transformation, word_formation, ordering, matching, multiple_select).
- Mỗi câu phải có theory (nhắc lý thuyết ngắn gọn) và explanation (giải thích chi tiết vì sao đúng/sai) bằng tiếng Việt có dấu.

Trả đúng một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

### Hóa học

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: chemistry
- Lớp: [6/7/8/9]
- Chủ điểm: [ví dụ: Công thức hóa học]
- Số câu: [30]
- Tên file: [chemistry-grade-8-formulas.csv]

Đặt subject=chemistry, grade đúng lớp đã giao và domain=practice cho mọi dòng. Dùng đa dạng các dạng bài phù hợp; viết prompt, context, explanation, theory, hint bằng tiếng Việt có dấu; dùng kiến thức cơ bản, đáp án xác định được bằng máy. Khi cần phân biệt CO với Co hoặc ký hiệu/đơn vị hoa-thường, thêm tags=case-sensitive. Trả một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

### Vật lí hoặc Sinh học

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: [physics hoặc biology]
- Lớp: [6/7/8/9]
- Chủ điểm: [điền ở đây]
- Số câu: [30]
- Tên file: [physics-or-biology-grade-x-topic.csv]

Đặt subject đúng môn, grade đúng lớp đã giao và domain=practice cho mọi dòng. Dùng đa dạng các dạng bài phù hợp; viết prompt, context, explanation, theory, hint bằng tiếng Việt có dấu; dùng kiến thức cơ bản và đáp án xác định được bằng máy. Với đáp án số, nêu đơn vị ngay trong đề rồi chỉ yêu cầu học sinh nhập số. Trả một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

---

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
| `id` | Bắt buộc, duy nhất trong file; ví dụ `c-formula-001` hoặc `v-work-001`. |
| `domain` | Tiếng Anh: `vocabulary` (thẻ từ vựng) hoặc `grammar` (bài tập ngữ pháp). Hóa/Lí/Sinh: luôn là `practice`. |
| `type` | Một trong 8 dạng ở bảng bên dưới. Với `vocabulary`, đặt `fill_blank`. |
| `level` | Hữu ích cho Tiếng Anh (`A1`…`C2`, `mixed`); có thể để `mixed` cho khoa học. |
| `topic` | Bắt buộc; tên chủ điểm nhất quán để lọc. |
| `subtopic` | Trọng tâm nhỏ; có thể trống. |
| `prompt` | Bắt buộc. Với `vocabulary`: từ/cụm từ tiếng Anh kèm phát âm/từ loại. Với `grammar`/`practice`: yêu cầu câu hỏi. |
| `context` | Với `vocabulary`: câu ví dụ minh họa ngữ cảnh. Với các môn khác: đoạn văn/số liệu câu hỏi. |
| `options` | Lựa chọn/từ/cặp ghép, ngăn bằng `||`; với `vocabulary` để trống `""`. |
| `answer` | Đáp án; với `vocabulary` là nghĩa tiếng Việt (mặt sau thẻ flashcard). |
| `explanation` | Bắt buộc; giải thích nghĩa/cách dùng từ vựng hoặc lý do đáp án đúng bằng tiếng Việt có dấu. |
| `theory` | Bắt buộc với `grammar` và `practice`; nhắc lý thuyết ngắn bằng tiếng Việt có dấu. `vocabulary` có thể trống. |
| `hint` | Gợi ý ngắn không lộ đáp án; có thể trống. |
| `tags` | Nhãn ngăn bằng `||`; dùng chính xác `case-sensitive` khi cần phân biệt hoa/thường. |
| `difficulty` | Số nguyên `1`–`5`; để trống thì mặc định `2`. |
| `learning_key` | Bắt buộc với `vocabulary` theo cú pháp `vocab:word:pos:sense`; các domain khác để trống. |

---

## Tám dạng bài áp dụng (Grammar & Practice)

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

---

## Ví dụ từng môn

### Tiếng Anh

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"english","","v-work-001","vocabulary","fill_blank","B1","Work","","reliable /rɪˈlaɪəbl/ (adj)","A reliable colleague always keeps promises and finishes tasks on time.","","đáng tin cậy","reliable (tính từ): có thể tin tưởng được để hoàn thành công việc tốt. Trái nghĩa: unreliable. Danh từ: reliability.","","","","1","vocab:reliable:adjective:trusted"
"english","","g-ptc-001","grammar","mcq","B1","Present continuous","","Choose the correct option.","Mia ___ a lesson right now.","takes||is taking||took||has taken","is taking","Cụm right now cho biết hành động đang diễn ra, nên dùng is taking.","Hiện tại tiếp diễn: S + am/is/are + V-ing.","Chú ý cụm chỉ thời gian.","present-continuous","1",""
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

---

## Cơ chế lặp lại ngắt quãng (SRS) cho Từ vựng

Mỗi `learning_key` đại diện cho một từ/cụm từ + từ loại + nghĩa cụ thể, ví dụ `vocab:record:noun:stored-information`.
- Học sinh học từ vựng bằng **Thẻ ghi nhớ**: Lật thẻ xem nghĩa rồi chọn **Đã nhớ** hoặc **Chưa nhớ**.
- **Chưa nhớ thì học lại chứ không phải sai**: Thẻ chưa nhớ sẽ xuất hiện lại ở cuối lượt học để ôn tiếp đến khi thuộc, đồng thời hệ thống hẹn ôn lại sau 10 phút.
- **Đã nhớ**: Thẻ được giãn dần theo chu kỳ khoa học: lần 1 sau 1 ngày, lần 2 sau 6 ngày, rồi giãn xa hơn.
- Khi đã nhớ từ vựng, học sinh chuyển sang **Grammar** để làm bài tập áp dụng vào câu thực tế!
