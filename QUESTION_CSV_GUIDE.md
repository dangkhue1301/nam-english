# Hướng dẫn tạo CSV câu hỏi cho NẮM English

Tài liệu này dùng để gửi cho ChatGPT, Claude, Gemini hoặc AI khác tạo ngân hàng
câu hỏi tương thích với website NẮM English.

## 1. Yêu cầu đầu ra

- Xuất đúng **một file CSV mã hóa UTF-8**.
- Dòng đầu tiên phải là header bên dưới, đúng tên và đúng thứ tự.
- File thật không có dấu ``` và không kèm lời giải thích ngoài CSV.
- Mỗi lần tối đa 2.000 câu, dung lượng tối đa 5 MB.
- Nội dung câu hỏi, ngữ cảnh, lựa chọn và đáp án viết bằng tiếng Anh.
- `theory`, `hint`, `explanation` viết bằng tiếng Việt có dấu, ngắn và rõ.
- Câu hỏi phải do AI tự soạn, không sao chép nguyên văn bài tập trong sách.

Header bắt buộc:

```csv
id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
```

## 2. Ý nghĩa từng cột

| Cột | Quy tắc |
|---|---|
| `id` | ID duy nhất và ổn định. Chỉ dùng chữ, số, `.`, `_`, `-`. Ví dụ `g-b1-present-001`. |
| `domain` | Chỉ nhận `grammar` hoặc `vocabulary`. |
| `type` | Một trong 8 loại ở mục 3. |
| `level` | Nên dùng `A1`, `A2`, `B1`, `B2`, `C1`, `C2` hoặc `mixed`. |
| `topic` | Tên chủ điểm chính, viết thống nhất giữa các câu. |
| `subtopic` | Chủ điểm nhỏ; có thể để trống. |
| `prompt` | Yêu cầu ngắn bằng tiếng Anh. |
| `context` | Câu, đoạn ngắn hoặc ngữ cảnh cần xử lý; có thể để trống. |
| `options` | Các lựa chọn/từ/cặp, phân cách bằng `||`. Quy tắc tùy `type`. |
| `answer` | Đáp án máy chấm. Nhiều đáp án dùng `||`. |
| `explanation` | Vì sao đáp án đúng, viết tiếng Việt có dấu; nên dưới 500 ký tự. |
| `theory` | Bắt buộc với grammar: lý thuyết cốt lõi, viết tiếng Việt có dấu; nên dưới 350 ký tự. |
| `hint` | Gợi ý không lộ toàn bộ đáp án; nên dưới 160 ký tự. |
| `tags` | Tag phân cách bằng `||`, ví dụ `present-perfect||experience`. |
| `difficulty` | Số nguyên từ `1` đến `5`. |
| `learning_key` | Bắt buộc với vocabulary; để trống với grammar. Xem mục 4. |

Nếu một ô chứa dấu phẩy, dấu ngoặc kép hoặc xuống dòng, phải bọc ô bằng dấu
ngoặc kép theo chuẩn CSV. Dấu `"` bên trong ô phải viết thành `""`.

## 3. Tám loại bài tập

### `mcq`

- Một đáp án đúng.
- `options`: ít nhất 2 lựa chọn, phân cách bằng `||`.
- `answer`: đúng chính tả như một lựa chọn trong `options`.

Ví dụ:

```csv
"g-b1-001","grammar","mcq","B1","Present simple & continuous","","Choose the correct option.","Mia ___ a lesson right now.","takes||is taking||took||has taken","is taking","Cụm right now cho biết hành động đang diễn ra.","Hiện tại tiếp diễn: am/is/are + V-ing.","Chú ý cụm chỉ thời gian.","present-continuous||time-marker","1",""
```

### `multiple_select`

- Có từ 2 đáp án đúng trở lên.
- `options`: toàn bộ lựa chọn, phân cách bằng `||`.
- `answer`: chỉ các lựa chọn đúng, cũng phân cách bằng `||`.
- Thứ tự các đáp án đúng không ảnh hưởng kết quả chấm.

### `fill_blank`

- Dùng `___` trong `context` để đánh dấu phần thiếu.
- `options` để trống.
- `answer`: câu trả lời cần nhập. Nếu chấp nhận nhiều cách viết, phân cách
  bằng `||`.
- Nếu có nhiều chỗ trống, người học nhập cả cụm đáp án theo đúng thứ tự.

### `error_correction`

- `context`: câu có lỗi.
- `options` để trống.
- `answer`: toàn bộ câu đã sửa. Các phương án tương đương phân cách bằng `||`.

### `sentence_transformation`

- `context`: câu gốc và từ khóa nếu có.
- `answer`: toàn bộ câu viết lại. Liệt kê rõ mọi phương án được chấp nhận.
- Không dùng biểu thức chính quy, mã JavaScript hoặc đáp án mơ hồ.

### `word_formation`

- Nêu từ gốc bằng chữ in hoa trong `prompt` hoặc `context`.
- `answer`: dạng từ chính xác cần điền.

### `ordering`

- `options`: các từ/cụm từ đã xáo trộn, phân cách bằng `||`.
- `answer`: câu hoàn chỉnh đúng thứ tự.
- Giữ dấu câu gắn với token liên quan, ví dụ `earlier,` hoặc `time.`.

### `matching`

- `options`: mỗi cặp viết theo dạng `vế trái=>vế phải`.
- Nhiều cặp phân cách bằng `||`.
- `answer` để trống; website tự tạo đáp án từ các cặp và xáo trộn vế phải.

Ví dụ:

```text
who=>people||which=>things||where=>places||whose=>possession
```

## 4. Quy tắc riêng cho vocabulary và spaced repetition

- `learning_key` là bắt buộc với mọi câu `domain=vocabulary`.
- Một `learning_key` đại diện cho **một từ/cụm từ + từ loại + một nghĩa**.
- Các dạng bài khác nhau của cùng một nghĩa phải dùng chung `learning_key`.
- Hai nghĩa khác nhau hoặc hai từ loại khác nhau phải dùng key khác nhau.

Mẫu khuyên dùng:

```text
vocab:<từ-hoặc-cụm-từ>:<từ-loại>:<nghĩa-ngắn>
```

Ví dụ:

```text
vocab:allocate:verb:set-aside
vocab:record:noun:stored-information
vocab:record:verb:store-information
```

Website chỉ đưa một biến thể của cùng `learning_key` vào một lượt ôn. Nếu làm
sai, câu đó quay lại cuối hàng đợi. Nếu làm đúng, lịch ôn được giãn dần.

Vocabulary có thể ở level bất kỳ và chủ đề tự do. Nên trộn:

- nghĩa từ và chọn định nghĩa;
- từ đồng nghĩa/trái nghĩa;
- collocation;
- phrasal verb;
- word formation;
- điền từ theo ngữ cảnh;
- ghép từ với nghĩa;
- sắp xếp thành câu tự nhiên.

## 5. Quy tắc riêng cho grammar

Mỗi câu grammar bắt buộc có `theory` và nên có:

- một mục tiêu ngữ pháp rõ ràng;
- `theory` nhắc đúng một quy tắc cốt lõi;
- `explanation` giải thích vì sao đáp án đúng trong ngữ cảnh cụ thể;
- `hint` giúp nhớ dấu hiệu nhưng không đọc thẳng đáp án;
- distractor hợp lý, không đánh đố bằng lỗi chính tả vô nghĩa.

Nên phân phối đều 8 dạng bài, không tạo toàn bộ dưới dạng trắc nghiệm.

Người dùng có thể chọn topic từ danh sách dưới đây hoặc cung cấp một topic
grammar tương đương. AI phải giữ nguyên topic được giao và tự soạn nội dung mới:

### Cambridge Grammar for IELTS

- Unit 1: Present tenses
- Unit 2: Past tenses 1
- Unit 3: Past tenses 2
- Unit 4: Present perfect
- Unit 5: Future forms 1
- Unit 6: Future forms 2
- Unit 7: Countable and uncountable nouns
- Unit 8: Referring to nouns / determiners and articles
- Unit 9: Pronouns and referencing
- Unit 10: Adjectives and adverbs
- Unit 11: Comparatives and comparisons
- Unit 12: The noun phrase
- Unit 13: Modal verbs 1
- Unit 14: Modal verbs 2
- Unit 15: Reported speech
- Unit 16: Conditionals
- Unit 17: The passive
- Unit 18: Relative clauses
- Unit 19: Linking ideas
- Unit 20: Giving reasons and results
- Unit 21: Verb + to-infinitive or -ing
- Unit 22: Verbs and prepositions
- Unit 23: Phrasal verbs
- Unit 24: The subjunctive
- Unit 25: Word order

### Destination B1

- Unit 1: Present simple, present continuous and stative verbs
- Unit 2: Past simple, past continuous and used to
- Unit 4: Present perfect simple and present perfect continuous
- Unit 5: Past perfect simple and past perfect continuous
- Unit 7: Future time
- Unit 8: Prepositions of time and place
- Unit 10: Passive voice 1
- Unit 11: Passive voice 2
- Unit 13: Countable and uncountable nouns
- Unit 14: Articles
- Unit 16: Pronouns and possessive determiners
- Unit 17: Relative clauses
- Unit 19: Modals: ability, permission and advice
- Unit 20: Modals: obligation, probability and possibility
- Unit 22: Modal perfect
- Unit 23: Questions, question tags and indirect questions
- Unit 25: So/such and too/enough
- Unit 26: Comparatives and superlatives
- Unit 28: Zero, first and second conditionals
- Unit 29: Third conditional
- Unit 31: Reported speech
- Unit 32: Reported questions, orders and requests
- Unit 34: Direct and indirect objects
- Unit 35: Wish
- Unit 37: -ing forms and infinitives
- Unit 38: Both/either/neither and so/nor
- Unit 40: Connectives
- Unit 41: Causative

### Destination B2

- Unit 1: Present time
- Unit 3: Past time
- Unit 5: Future time; present tenses in time clauses; prepositions of time/place
- Unit 7: Articles; countable/uncountable nouns; quantifiers
- Unit 9: Zero, first, second, third, mixed and inverted conditionals
- Unit 11: Comparatives/superlatives; so/such; enough/too
- Unit 13: Modal verbs
- Unit 15: Passive; causative; direct and indirect objects
- Unit 17: -ing forms and infinitives; prefer/would rather/had better
- Unit 19: Questions, question tags and indirect questions
- Unit 21: Reported speech, reported questions and reporting verbs
- Unit 23: Relative clauses and participles
- Unit 25: Unreal past, wishes and contrast
- Unit 27: Inversions and possessives

Đây là danh sách topic gợi ý để người dùng lựa chọn. Khi người dùng đã cung cấp
topic, AI chỉ cần tự soạn câu hỏi mới bám đúng topic đó. Dùng trọng tâm nhỏ hơn
trong `subtopic`; không cần đọc lại PDF hoặc đối chiếu vị trí trong sách.

## 6. Checklist trước khi trả file

- Header đúng 16 cột và đúng thứ tự.
- Tất cả `id` là duy nhất.
- Mọi dòng có `domain`, `type`, `level`, `topic`, `prompt`, `answer` phù hợp.
- `mcq` có đúng 1 đáp án và đáp án nằm trong `options`.
- `multiple_select` chỉ liệt kê đáp án có trong `options`.
- `matching` có ít nhất 2 cặp đúng cú pháp `left=>right`.
- `ordering` có token đã xáo trộn và câu hoàn chỉnh trong `answer`.
- Mọi vocabulary có `learning_key`.
- Cùng một nghĩa từ dùng cùng `learning_key`.
- Tiếng Việt có dấu đầy đủ trong `theory`, `hint`, `explanation`.
- Không dùng HTML, script, regex, công thức bảng tính hoặc Markdown phức tạp.
- Câu hỏi và ví dụ phải do AI tự soạn, không sao chép nguyên văn bài tập có bản quyền.

## 7. Prompt sẵn để gửi cho AI khác

Sao chép nguyên khối dưới đây, đính kèm tài liệu này và thay các phần trong
ngoặc vuông:

```text
Hãy tạo [SỐ LƯỢNG] câu hỏi cho website NẮM English theo đúng file
QUESTION_CSV_GUIDE.md tôi đính kèm.

Phạm vi:
- Domain: [grammar / vocabulary / cả hai]
- Level: [A2 / B1 / B2 / mixed]
- Topic: [DANH SÁCH TOPIC]
- Tỷ lệ loại bài: phân phối đa dạng giữa mcq, multiple_select, fill_blank,
  error_correction, sentence_transformation, word_formation, ordering, matching.

Yêu cầu nội dung:
- Câu hỏi, context, options và answer viết bằng tiếng Anh.
- Theory, hint và explanation viết bằng tiếng Việt có dấu đầy đủ.
- Với grammar, bám đúng topic người dùng cung cấp, tự soạn ví dụ mới và điền
  `theory` cho từng câu.
- Với vocabulary, mọi dòng phải có learning_key đúng quy tắc; các biến thể của
  cùng một nghĩa dùng chung learning_key.
- Không sao chép nguyên văn bài tập trong sách.
- Kiểm tra đáp án, ID, số cột và dấu ngoặc kép trước khi xuất.

Chỉ trả nội dung CSV UTF-8 hoàn chỉnh, bắt đầu bằng đúng header 16 cột.
Không đặt CSV trong Markdown code fence và không viết thêm lời giải thích.
```
