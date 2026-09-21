# Hướng dẫn tạo bộ CSV cho NẮM Học tập

NẮM là website tự luyện trên trình duyệt cho **Tiếng Anh** và **5 môn THCS lớp 6–9: Hóa học, Vật lí, Sinh học, Lịch sử và Địa lí**. Mỗi file CSV tạo thành **một bộ riêng**; một file chỉ được chứa **một môn**. Website chấm bằng đáp án đã có trong CSV trên máy của học sinh, không cần tài khoản và không gửi câu hỏi lên AI hay máy chủ.

## Triết lý học tập của NẮM

1. **Tiếng Anh (Vocabulary & Grammar)**:
   - **Nạp từ vựng bằng Thẻ ghi nhớ (Flashcards)**: Học sinh học thuộc từ vựng (từ/cụm từ, phát âm, từ loại, câu ví dụ minh họa và nghĩa tiếng Việt) theo chu trình lặp lại ngắt quãng (SRS). Chưa nhớ thì thẻ sẽ quay lại ở cuối buổi học để ôn cho thuộc, không tính là bài tập sai.
   - **Áp dụng bằng Bài tập nhiều dạng (Grammar)**: Làm bài tập (trắc nghiệm, điền từ, sắp xếp câu, viết lại câu, tìm lỗi sai, ghép nối, dạng từ, chọn nhiều đáp án) để áp dụng vào câu hoàn chỉnh.

2. **Năm môn THCS lớp 6–9 (Hóa, Lí, Sinh, Sử, Địa)**:
   - Mượn cách trình bày câu hỏi hiện đại tương tự THPT nhưng **toàn bộ kiến thức thuộc chương trình THCS (lớp 6–9)**.
   - Năm môn THCS luôn dùng chế độ luyện tập (`domain: "practice"`), không dùng thẻ ghi nhớ hay chu trình SRS.
   - Ba dạng bài trọng tâm:
     - **Trắc nghiệm một đáp án (`mcq`)**: Chọn 1 trong 4 phương án A–D.
     - **Đúng/Sai 4 ý độc lập (`true_false`)**: 1 câu gồm 4 mệnh đề độc lập a, b, c, d. Hệ thống chấm chi tiết từng ý; câu được tính là đúng hoàn toàn khi học sinh trả lời đúng cả 4/4 ý.
     - **Trả lời ngắn (`short_answer`)**: Chỉ dành cho Hóa học, Vật lí và Sinh học; học sinh tự nhập số, công thức hoặc cụm từ ngắn với tập đáp án máy chấm xác định trước. Môn Lịch sử và Địa lí **không** có dạng trả lời ngắn.

---

## Prompt dùng ngay cho AI

Gửi cả file hướng dẫn này cho AI tạo câu hỏi, rồi dùng một trong các prompt dưới đây. Thay phần trong ngoặc vuông `[...]`.

### 1. Tiếng Anh — vocabulary (Thẻ ghi nhớ / Flashcards)

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

### 2. Tiếng Anh — grammar (Bài tập áp dụng nhiều dạng)

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

### 3. Hóa học, Vật lí hoặc Sinh học THCS (Lớp 6–9)

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: [chemistry / physics / biology]
- Lớp: [6/7/8/9]
- Chủ điểm: [ví dụ: Công thức hóa học / Lực và chuyển động / Quang hợp]
- Số câu: [30]
- Tên file: [mon-lop-chudiem.csv]

Định dạng bài tập THCS:
- Sử dụng 3 dạng bài hiện đại:
  1. mcq: Trắc nghiệm 4 lựa chọn A-D. Cột options gồm đúng 4 phương án phân cách bằng ||. Cột answer là đúng 1 phương án.
  2. true_false: Câu hỏi Đúng/Sai 4 ý. Cột options gồm đúng 4 mệnh đề độc lập phân cách bằng ||. Cột answer gồm đúng 4 giá trị true hoặc false phân cách bằng || (ví dụ: true||false||true||false).
  3. short_answer: Trả lời ngắn. Cột options bắt buộc để trống (""). Cột answer ghi đáp án ngắn gọn (số, công thức hoặc từ khóa, tối đa 200 ký tự mỗi đáp án để đồng bộ với ô nhập giao diện). Với đáp án số hoặc nhiều cách viết, phân tách bằng || (ví dụ: "1,5||1.5").
- Đặt subject đúng môn (chemistry, physics, biology), grade đúng lớp (6, 7, 8, 9) và domain=practice cho mọi dòng.
- Viết prompt, context, explanation, theory, hint bằng tiếng Việt có dấu; dùng kiến thức cơ bản trong chương trình THCS, đáp án xác định được bằng máy.
- Khi cần phân biệt ký hiệu viết hoa/thường (ví dụ CO và Co), thêm tags=case-sensitive.

Trả đúng một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

### 4. Lịch sử hoặc Địa lí THCS (Lớp 6–9)

```text
Hãy tạo đúng một file CSV UTF-8 để nhập vào NẮM Học tập theo hướng dẫn tôi đính kèm.

- Môn: [history hoặc geography]
- Lớp: [6/7/8/9]
- Chủ điểm: [ví dụ: Đại Việt thời Lý / Trái Đất trong hệ Mặt Trời]
- Số câu: [30]
- Tên file: [su-hoac-dia-lop-chudiem.csv]

Định dạng bài tập THCS:
- Chỉ dùng 2 dạng bài:
  1. mcq: Trắc nghiệm 4 lựa chọn. Cột options bắt buộc có đúng 4 phương án phân cách bằng ||. Cột answer là đúng 1 phương án.
  2. true_false: Câu hỏi Đúng/Sai 4 ý. Cột options bắt buộc có đúng 4 mệnh đề độc lập phân cách bằng ||. Cột answer bắt buộc có đúng 4 giá trị true hoặc false phân cách bằng || (ví dụ: true||true||false||true).
- TUYỆT ĐỐI KHÔNG dùng dạng short_answer hay tự luận.
- Đặt subject đúng môn (history hoặc geography), grade đúng lớp (6, 7, 8, 9) và domain=practice cho mọi dòng.
- Viết prompt, context, explanation, theory, hint bằng tiếng Việt có dấu; dùng kiến thức chuẩn trong sách giáo khoa THCS.

Trả đúng một file CSV 18 cột, không thêm Markdown, lời dẫn hay cột khác.
```

---

## Hợp đồng dữ liệu CSV

- File `.csv` dùng UTF-8 (có hoặc không BOM), dấu phân cách là dấu phẩy `,`.
- Mỗi file nhận 1–2.000 câu, tối đa 5 MB; mỗi ô tối đa 10.000 ký tự.
- Dòng đầu phải đúng **18 cột**, đúng thứ tự sau:

```text
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
```

- Mỗi dòng dữ liệu phải có đúng 18 ô. Bọc các ô chứa dấu phẩy, dấu nháy kép hoặc xuống dòng bằng dấu ngoặc kép thẳng `"`. Dấu `"` bên trong ô phải viết thành `""`; ô trống viết `""`.
- Không dùng dấu chấm phẩy để ngăn cột. Không dùng `||` như văn bản thông thường vì ký hiệu này phân tách lựa chọn/đáp án.
- ID phải duy nhất trong **file**, dùng chữ Latin, số, `.`, `_`, `-`. ID trùng ở hai file khác vẫn an toàn vì mỗi file là một bộ riêng.
- Mỗi file CSV chỉ chứa **một môn duy nhất**. Không trộn Tiếng Anh với các môn khác hoặc trộn giữa các môn THCS với nhau.

| Cột | Cách điền |
|---|---|
| `subject` | Bắt buộc: `english`, `chemistry`, `physics`, `biology`, `history`, hoặc `geography`. Mọi dòng trong một file phải cùng giá trị. |
| `grade` | Tiếng Anh để trống `""`. Năm môn THCS (Hóa, Lí, Sinh, Sử, Địa) bắt buộc là đúng một trong `6`, `7`, `8`, `9`. |
| `id` | Bắt buộc, duy nhất trong file; ví dụ `h-ly-001` hoặc `c-formula-001`. |
| `domain` | Tiếng Anh: `vocabulary` (thẻ từ vựng) hoặc `grammar` (bài tập). Năm môn THCS: luôn là `practice`. |
| `type` | Một trong các dạng bài hợp lệ theo môn (xem bảng quy định dạng bài bên dưới). |
| `level` | Tiếng Anh (`A1`…`C2`, `mixed`); các môn THCS để `mixed`. |
| `topic` | Bắt buộc; tên chủ điểm nhất quán để lọc. |
| `subtopic` | Trọng tâm nhỏ; có thể để trống. |
| `prompt` | Bắt buộc. Yêu cầu câu hỏi hoặc mục từ vựng. |
| `context` | Đoạn văn, số liệu, ngữ cảnh câu hỏi hoặc câu ví dụ minh họa từ vựng. |
| `options` | Lựa chọn/mệnh đề ngăn bằng `||`; với `short_answer` hoặc `vocabulary` để trống `""`. |
| `answer` | Đáp án đúng; với `vocabulary` là nghĩa tiếng Việt (mặt sau thẻ). |
| `explanation` | Bắt buộc; giải thích chi tiết vì sao đúng/sai bằng tiếng Việt có dấu. |
| `theory` | Bắt buộc với `grammar` và `practice`; nhắc lý thuyết ngắn bằng tiếng Việt có dấu. `vocabulary` có thể trống. |
| `hint` | Gợi ý ngắn không lộ đáp án; có thể để trống. |
| `tags` | Nhãn ngăn bằng `||`; dùng `case-sensitive` khi cần phân biệt hoa/thường (ví dụ `CO` vs `Co`). |
| `difficulty` | Số nguyên `1`–`5`; để trống thì mặc định `2`. |
| `learning_key` | Bắt buộc với Tiếng Anh `vocabulary` theo cú pháp `vocab:word:pos:sense`; các môn và domain khác để trống `""`. |

---

## Bảng quy định dạng bài theo Môn học

| Môn học | `subject` | Dạng bài được phép | Quy định đặc thù |
|---|---|---|---|
| **Tiếng Anh** | `english` | `mcq`, `multiple_select`, `fill_blank`, `error_correction`, `sentence_transformation`, `word_formation`, `ordering`, `matching` | Không hỗ trợ `true_false` và `short_answer`. Thẻ từ vựng dùng `type: "fill_blank"` và `domain: "vocabulary"`. |
| **Hóa học** | `chemistry` | `mcq`, `true_false`, `short_answer` | Khuyến nghị 4 phương án cho `mcq`. Hỗ trợ các dạng cũ của bộ bài trước. |
| **Vật lí** | `physics` | `mcq`, `true_false`, `short_answer` | Khuyến nghị 4 phương án cho `mcq`. Hỗ trợ các dạng cũ của bộ bài trước. |
| **Sinh học** | `biology` | `mcq`, `true_false`, `short_answer` | Khuyến nghị 4 phương án cho `mcq`. Hỗ trợ các dạng cũ của bộ bài trước. |
| **Lịch sử** | `history` | `mcq`, `true_false` | **Chỉ nhận `mcq` (bắt buộc đúng 4 phương án) và `true_false` (4 ý)**. Không có trả lời ngắn. |
| **Địa lí** | `geography` | `mcq`, `true_false` | **Chỉ nhận `mcq` (bắt buộc đúng 4 phương án) và `true_false` (4 ý)**. Không có trả lời ngắn. |

### Quy cách 3 dạng bài hiện đại cho THCS:

1. **Trắc nghiệm một đáp án (`mcq`)**:
   - `options`: 4 lựa chọn phân cách bằng `||`. Với Sử và Địa bắt buộc đúng 4 lựa chọn; với Hóa, Lí, Sinh khuyến nghị 4 lựa chọn.
   - `answer`: Ghi nguyên văn đúng 1 lựa chọn (không ghi A/B/C/D).

2. **Đúng/Sai 4 ý độc lập (`true_false`)**:
   - `options`: Đúng **4 mệnh đề** không rỗng phân cách bằng `||` (tương ứng với 4 ý a, b, c, d).
   - `answer`: Đúng **4 giá trị `true` hoặc `false`** phân cách bằng `||` (ví dụ: `true||false||true||false`).
   - Đánh giá: Hệ thống lưu 1 attempt duy nhất; hiển thị số ý đúng (ví dụ: *Đúng 3/4 ý*), câu chỉ đạt khi học sinh chọn đúng toàn bộ 4/4 ý.

3. **Trả lời ngắn (`short_answer`)**:
   - Chỉ áp dụng cho Hóa học, Vật lí và Sinh học.
   - `options`: Bắt buộc để trống `""` (parser sẽ báo lỗi nếu điền dữ liệu vào cột này).
   - `answer`: Một hoặc nhiều đáp án máy chấm chấp nhận, phân cách bằng `||` (tối đa 200 ký tự mỗi đáp án, đồng bộ với giới hạn nhập 200 ký tự của giao diện). Ví dụ: `18` hoặc `1,5||1.5`. Hệ thống chuẩn hóa khoảng trắng thừa và ký tự tương đương nhưng **giữ nguyên số và dấu câu**. Thêm tag `case-sensitive` khi cần phân biệt chữ hoa/thường.

---

## Ví dụ CSV chuẩn cho từng môn

### 1. Tiếng Anh

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"english","","v-work-001","vocabulary","fill_blank","B1","Work","","reliable /ˈrɪlaɪəbl/ (adj)","A reliable colleague always keeps promises and finishes tasks on time.","","đáng tin cậy","reliable (tính từ): có thể tin tưởng được để hoàn thành công việc tốt. Trái nghĩa: unreliable. Danh từ: reliability.","","","","1","vocab:reliable:adjective:trusted"
"english","","g-ptc-001","grammar","mcq","B1","Present continuous","","Choose the correct option.","Mia ___ a lesson right now.","takes||is taking||took||has taken","is taking","Cụm right now cho biết hành động đang diễn ra, nên dùng is taking.","Hiện tại tiếp diễn: S + am/is/are + V-ing.","Chú ý cụm chỉ thời gian.","present-continuous","1",""
```

### 2. Hóa học lớp 8

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"chemistry","8","c-formula-001","practice","mcq","mixed","Công thức hóa học","Phân biệt kí hiệu","Công thức nào là carbon monoxide (cacbon monoxit)?","","CO||Co||CO2||C","CO","CO là công thức của carbon monoxide; Co là kí hiệu nguyên tố cobalt.","Kí hiệu hóa học phân biệt chữ hoa và chữ thường; công thức cho biết thành phần chất.","So sánh số chữ cái viết hoa.","case-sensitive","1",""
"chemistry","8","c-tf-002","practice","true_false","mixed","Chất tinh khiết và hỗn hợp","Nhận biết","Xét tính đúng/sai của các mệnh đề sau về nước biển và nước cất:","","Nước cất là chất tinh khiết||Nước biển là một hỗn hợp đồng nhất||Nước cất có nhiệt độ sôi không đổi ở 100 °C (1 atm)||Nước biển không chứa muối ăn hòa tan","true||true||true||false","Nước cất chỉ gồm H2O nên là chất tinh khiết có nhiệt độ sôi xác định 100 °C. Nước biển chứa nhiều muối tan (đặc biệt NaCl) nên là hỗn hợp.","Chất tinh khiết có thành phần và tính chất xác định; hỗn hợp gồm nhiều chất trộn lẫn.","Nước biển có vị mặn vì chứa muối.","","2",""
"chemistry","8","c-sa-003","practice","short_answer","mixed","Khối lượng mol","Tính toán","Khối lượng mol phân tử của nước (H2O) bằng bao nhiêu g/mol? (Nhập số)","","","18","M(H2O) = 2 × 1 + 16 = 18 g/mol.","Khối lượng mol phân tử bằng tổng khối lượng các nguyên tử trong phân tử.","H = 1, O = 16.","","2",""
```

### 3. Vật lí lớp 8

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"physics","8","p-force-001","practice","mcq","mixed","Lực","Đơn vị đo","Đơn vị SI của lực là gì?","","N||J||W||Pa","N","Newton, kí hiệu N, là đơn vị SI của lực. J là đơn vị công, W là công suất, Pa là áp suất.","Lực được đo bằng newton, kí hiệu N trong hệ đo lường quốc tế SI.","Nhớ đến nhà bác học Newton.","case-sensitive","1",""
"physics","8","p-tf-002","practice","true_false","mixed","Áp suất","Đặc điểm","Xét tính đúng/sai của các mệnh đề sau về áp suất chất lỏng:","","Chất lỏng gây áp suất theo mọi phương lên đáy bình, thành bình và các vật trong lòng nó||Áp suất chất lỏng giảm dần khi độ sâu tăng lên||Tại cùng một độ sâu trong một chất lỏng, áp suất là như nhau theo mọi hướng||Công thức tính áp suất chất lỏng là p = d.h","true||false||true||true","Áp suất chất lỏng tăng dần theo độ sâu theo công thức p = d.h, không giảm dần.","Áp suất chất lỏng tác dụng theo mọi phương và phụ thuộc vào trọng lượng riêng d cùng độ sâu h.","Càng lặn sâu thì áp suất càng lớn.","","2",""
"physics","8","p-sa-003","practice","short_answer","mixed","Vận tốc","Tính toán","Một ô tô đi được quãng đường 120 km trong thời gian 2 giờ. Vận tốc của ô tô là bao nhiêu km/h? (Chỉ nhập số)","","","60","Vận tốc v = s / t = 120 / 2 = 60 km/h.","Công thức tính vận tốc: v = s / t.","Lấy quãng đường chia thời gian.","","1",""
```

### 4. Sinh học lớp 7

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"biology","7","b-photo-001","practice","mcq","mixed","Quang hợp","Cơ quan thực hiện","Bộ phận nào của cây xanh thực hiện quang hợp chủ yếu?","","Rễ||Lá||Hoa||Hạt","Lá","Lá chứa nhiều lục lạp nên là cơ quan quang hợp chủ yếu của cây xanh.","Quang hợp chủ yếu diễn ra ở lá, nơi tế bào chứa bào quan lục lạp mang diệp lục.","Nghĩ về bộ phận có màu xanh và nhận nhiều ánh sáng nhất.","","1",""
"biology","7","b-tf-002","practice","true_false","mixed","Quang hợp ở thực vật","Quá trình và ý nghĩa","Xét tính đúng/sai của các phát biểu sau về quá trình quang hợp:","","Quang hợp hấp thụ khí carbon dioxide và giải phóng khí oxygen||Ánh sáng mặt trời là nguồn năng lượng cho quang hợp||Quang hợp chỉ diễn ra vào ban đêm ở hầu hết thực vật||Nước là một trong các nguyên liệu của quang hợp","true||true||false||true","Quang hợp chỉ diễn ra khi có ánh sáng (ban ngày), ban đêm không có ánh sáng mặt trời nên hầu hết thực vật không quang hợp.","Phương trình quang hợp: Nước + Carbon dioxide + Ánh sáng -> Glucose + Oxygen.","Quang hợp cần năng lượng ánh sáng.","","2",""
"biology","7","b-sa-003","practice","short_answer","mixed","Tế bào","Cấu tạo tế bào","Bào quan nào chứa chất diệp lục và là nơi diễn ra quá trình quang hợp ở tế bào thực vật?","","","lục lạp","Lục lạp là bào quan chứa sắc tố diệp lục, có chức năng hấp thụ năng lượng ánh sáng để quang hợp.","Tế bào thực vật quang hợp nhờ bào quan lục lạp.","Tên bào quan mang màu lục của lá.","","1",""
```

### 5. Lịch sử lớp 7

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"history","7","h-dai-viet-001","practice","mcq","mixed","Đại Việt thời Lý","Chiến thắng Bạch Đằng","Năm 1077, quân dân nhà Lý dưới sự chỉ huy của Lý Thường Kiệt đã đánh bại quân xâm lược nào trên phòng tuyến sông Như Nguyệt?","","Quân Tống||Quân Mông Cổ||Quân Minh||Quân Nam Hán","Quân Tống","Chiến thắng trên sông Như Nguyệt năm 1077 đập tan hoàn toàn cuộc xâm lược của quân Tống do Quách Quỳ chỉ huy.","Kháng chiến chống Tống giai đoạn 1075–1077 gắn liền với Lý Thường Kiệt và phòng tuyến sông Như Nguyệt.","Nhớ lại bài thơ thần 'Nam quốc sơn hà'.","","2",""
"history","7","h-tf-002","practice","true_false","mixed","Ba lần kháng chiến chống Mông - Nguyên","Thời Trần","Xét tính đúng/sai của các sự kiện sau về ba lần kháng chiến chống Mông - Nguyên của nhà Trần:","","Đạo thủy binh giặc trong trận Bạch Đằng năm 1288 do Thoát Hoan trực tiếp chỉ huy||Hội nghị Diên Hồng là nơi vua Trần hỏi ý kiến các bô lão về việc đánh hay hàng||Trần Hưng Đạo được phong làm Quốc công Tiết chế thống lĩnh toàn quân trong cả ba lần kháng chiến||Nhà Trần đã ba lần thực hiện kế sách 'Vườn không nhà trống' để đánh bại giặc","false||true||false||true","Ý a sai vì đạo thủy binh do Ô Mã Nhi và Phàn Tiếp chỉ huy; Thoát Hoan chỉ huy cánh bộ binh tháo chạy theo đường bộ. Ý b đúng vì Hội nghị Diên Hồng năm 1285 trưng cầu ý kiến các bô lão. Ý c sai vì Trần Hưng Đạo được phong Quốc công Tiết chế thống lĩnh toàn quân ở lần 2 (1285) và lần 3 (1287–1288); lần 1 (1258) do vua Trần Thái Tông và Lê Phụ Trần trực tiếp chỉ huy phản công tại Đông Bộ Đầu. Ý d đúng vì cả 3 lần nhà Trần đều chủ động rút khỏi kinh thành để thực hiện 'Vườn không nhà trống'.","Nhà Trần đại thắng Mông - Nguyên nhờ tinh thần đoàn kết toàn dân, kế sách 'Vườn không nhà trống' và nghệ thuật quân sự độc đáo.","Nhớ lại người chỉ huy thủy quân giặc ở Bạch Đằng và thời điểm Trần Hưng Đạo được cử làm Tiết chế.","","2",""
```

### 6. Địa lí lớp 6

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"geography","6","g-earth-001","practice","mcq","mixed","Trái Đất trong hệ Mặt Trời","Vị trí và hình dạng","Trái Đất đứng ở vị trí thứ mấy theo thứ tự xa dần Mặt Trời?","","Thứ nhất||Thứ hai||Thứ ba||Thứ tư","Thứ ba","Theo thứ tự từ Mặt Trời ra xa: Thủy tinh, Kim tinh, Trái Đất, Hỏa tinh, Mộc tinh, Thổ tinh, Thiên Vương tinh, Hải Vương tinh.","Trái Đất là hành tinh thứ ba tính từ Mặt Trời trong Hệ Mặt Trời.","Nằm giữa Kim tinh và Hỏa tinh.","","1",""
"geography","6","g-tf-002","practice","true_false","mixed","Chuyển động của Trái Đất","Hệ quả","Xét tính đúng/sai của các nhận định sau về sự chuyển động tự quay quanh trục của Trái Đất:","","Trái Đất tự quay quanh trục theo hướng từ tây sang đông||Thời gian Trái Đất tự quay một vòng quanh trục là khoảng 24 giờ (một ngày đêm)||Hiện tượng ngày đêm luân phiên là hệ quả của chuyển động tự quay của Trái Đất||Sự lệch hướng chuyển động của các vật thể ở hai bán cầu không phụ thuộc vào chuyển động tự quay","true||true||true||false","Lực Coriolis làm lệch hướng chuyển động của các vật thể ở hai bán cầu là hệ quả trực tiếp sinh ra từ chuyển động tự quay quanh trục của Trái Đất.","Trái Đất tự quay quanh trục sinh ra: ngày đêm luân phiên, giờ trên Trái Đất và lực Coriolis làm lệch hướng vật chuyển động.","Lực Coriolis sinh ra do Trái Đất tự quay.","","2",""
```
