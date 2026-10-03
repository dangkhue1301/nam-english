# Hướng dẫn AI tạo CSV cho NẮM Học tập

Cập nhật: 02/10/2026. Tài liệu này đưa trực tiếp cho AI khác để tạo bộ câu hỏi. Website chấm trên trình duyệt; AI phải tự soạn và kiểm tra nội dung trước khi giao file.

## 1. Chọn đúng phần học

| Nội dung | subject | domain | Tiến độ |
|---|---|---|---|
| Flashcard tiếng Anh | english | vocabulary | SRS theo từ/nghĩa; Chưa nhớ sẽ học lại |
| Bài tập từ vựng tiếng Anh | english | vocabulary_practice | Theo từng câu; không SRS, sai chuyển Ôn câu sai |
| Bài tập ngữ pháp tiếng Anh | english | grammar | Theo từng câu; không SRS |
| Hóa, Lí, Sinh, Sử, Địa lớp 6–9 | chemistry / physics / biology / history / geography | practice | Theo từng câu; không SRS |

Một CSV tạo một bộ riêng và chỉ chứa một môn. Một bộ tiếng Anh có thể có cả ba domain, nhưng mỗi dòng phải khai báo đúng mục đích. Không gắn bài tập từ vựng vào grammar chỉ vì có trắc nghiệm. Tiếng Nhật dùng JAPANESE_CSV_GUIDE.md riêng.

Bài tập chấm xong đi tiếp dù đúng hay sai, tối đa 30 câu/lượt. Bộ 50 câu đi 30 + 20. Mỗi dòng khác ID đều phải được làm; không gộp bài tập theo từ. Flashcard là từ/cụm từ và nghĩa, không phải câu bài tập điền từ.

## 2. Prompt dùng ngay

Gửi cả tài liệu này cùng prompt sau; thay phần trong ngoặc vuông:

```text
Tạo đúng một file CSV UTF-8 theo QUESTION_CSV_GUIDE.md đính kèm.
- Môn: [english / chemistry / physics / biology / history / geography]
- Phần học/domain: [vocabulary / vocabulary_practice / grammar / practice]
- Trình độ tiếng Anh: [A1/A2/B1/B2/C1/C2/mixed]; hoặc lớp THCS: [6/7/8/9]
- Chủ điểm/danh sách từ: [...]
- Số dòng dữ liệu: [...]
- Phân bổ dạng bài: [...]; tổng phải bằng số dòng yêu cầu.
- Tên file: [...csv]
Tự soạn nội dung tự nhiên, đúng trình độ và có đáp án xác định. Chỉ tạo phần được giao.
Bài tập từ vựng cần kiểm tra nghĩa trong ngữ cảnh, collocation, phrasal verb, dạng từ,
đồng/trái nghĩa hoặc cách dùng. Không biến chúng thành flashcard.
Giải thích và lý thuyết bằng tiếng Việt có dấu. Lời giải tiếng Anh cần câu hoàn chỉnh,
bản dịch và lý do chọn đáp án; câu trắc nghiệm phải giải thích phương án nhiễu.
Hint chỉ là một câu nhẹ về cách suy nghĩ, tối đa 180 ký tự; không viết đáp án,
dịch câu đã điền, chỉ cách loại phương án hoặc nêu công thức gần như giải xong bài.
Kiểm tra dữ liệu bằng checklist cuối tài liệu. Trả file CSV 18 cột,
không thêm Markdown, lời dẫn, cột mới hay giải thích ngoài file.
```

Riêng flashcard: đặt type=fill_blank; prompt là từ/cụm từ + IPA + từ loại; context là một câu ví dụ tự nhiên; answer là nghĩa tiếng Việt; options trống; learning_key ổn định theo từ/từ loại/nghĩa. Không dùng prompt kiểu “Choose…” hoặc câu có chỗ trống.

## 3. Hợp đồng CSV

UTF-8, chấp nhận BOM; dấu phân cách là dấu phẩy. Từ 1–2.000 dòng, tối đa 5 MB/file và 10.000 ký tự/ô. Header đúng 18 cột và đúng thứ tự:

```text
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
```

Ô có dấu phẩy, dấu nháy hoặc xuống dòng phải bọc bằng nháy kép thẳng; nháy kép bên trong phải gấp đôi. Newline trong ô không phải câu mới. Không dùng dấu chấm phẩy để ngăn cột. Mọi dòng giữ đủ cột trống cuối dòng.

| Cột | Quy tắc |
|---|---|
| subject | Một môn như bảng trên; mọi dòng cùng môn. |
| grade | Tiếng Anh để trống; THCS dùng 6, 7, 8 hoặc 9. |
| id | Duy nhất trong file; chữ Latin/số/dấu chấm/gạch ngang/gạch dưới, bắt đầu bằng chữ hoặc số. |
| domain | Dùng đúng bảng ở mục 1. |
| type | Dùng đúng dạng theo mục 4; không tự tạo mã mới. |
| level | Tiếng Anh A1…C2 hoặc mixed; THCS dùng mixed. |
| topic | Chủ điểm nhất quán, bắt buộc. |
| subtopic | Trọng tâm nhỏ, có thể trống. |
| prompt | Hướng dẫn rõ cần chọn từ, điền cụm hay viết cả câu; bắt buộc. |
| context | Câu/đoạn ngữ cảnh, số liệu hoặc ví dụ của flashcard. |
| options | Theo từng dạng bên dưới; dùng || chỉ để phân tách mục. |
| answer | Đáp án máy chấm, theo từng dạng; không dùng A/B/C/D. |
| explanation | Bắt buộc; lời giải chi tiết, chỉ hiển thị sau chấm. |
| theory | Bắt buộc với grammar, vocabulary_practice, practice; quy tắc/cách dùng liên quan, chỉ hiển thị sau chấm. Flashcard có thể trống. |
| hint | Tùy chọn; một câu nhẹ tối đa 180 ký tự, hiển thị khi người học mở trước chấm. Không dùng lời giải rút gọn. |
| tags | Nhãn ngăn bằng ||; case-sensitive khi cần phân biệt CO với Co hoặc kí hiệu tương tự. |
| difficulty | Số nguyên 1–5; trống mặc định 2. |
| learning_key | Flashcard bắt buộc dạng vocab:word:pos:sense; bài tập để trống. |

CSV cũ khai báo grammar vẫn được giữ ở Grammar. Để nhập một bộ bài tập từ vựng vào mục mới, sửa domain của các dòng tương ứng thành vocabulary_practice và để learning_key trống; không đổi câu ngữ pháp thành bài từ vựng chỉ theo tên file. Nhập lại tạo bộ riêng, không tự chuyển tiến độ từ bộ cũ.

## 4. Quy cách dạng bài

Tiếng Anh nhận: mcq, multiple_select, fill_blank, error_correction, sentence_transformation, word_formation, ordering, matching. Bài tập từ vựng dùng các dạng này phù hợp mục tiêu; ngữ pháp dùng cùng mã nhưng domain=grammar.

- **mcq:** khuyến nghị 4 lựa chọn khác nhau trong options, ngăn bằng ||; answer là nguyên văn đúng một lựa chọn. Mỗi câu có đúng một đáp án phù hợp ngữ cảnh.
- **multiple_select:** options có các lựa chọn khác nhau; answer có ít nhất hai lựa chọn đúng khác nhau ngăn bằng ||. Phải yêu cầu chọn tất cả; chọn thừa hoặc thiếu đều sai.
- **fill_blank:** options trống; answer là từ/cụm cần điền. Nếu nhiều chỗ trống, prompt phải nói rõ nhập tất cả phần thiếu theo thứ tự, ngăn bằng khoảng trắng; không thêm những từ đã có sẵn trong context vào answer. Tốt nhất dùng một chỗ trống/câu.
- **word_formation:** cho từ gốc trong prompt/context; options trống; answer là dạng từ cần điền. Đáp án phải xác định được từ cấu trúc và nghĩa.
- **error_correction:** cho câu có lỗi rõ ràng; yêu cầu viết lại cả câu; options trống, answer là câu đã sửa hoàn chỉnh.
- **sentence_transformation:** nêu yêu cầu và từ/cấu trúc bắt buộc; options trống; answer là câu viết lại đầy đủ, giữ nghĩa gốc.
- **ordering:** options là mảnh nguyên vẹn ngăn bằng ||, tối đa 30 mảnh; answer là câu tạo bằng hoán vị toàn bộ mảnh, mỗi mảnh đúng một lần. Không đảo từ bên trong một mảnh. Đáp án khác hợp lệ ngăn bằng ||. Gắn dấu câu vào mảnh phù hợp.
- **matching:** options là ít nhất hai cặp left=>right ngăn bằng ||; không trùng vế trái hoặc phải sau chuẩn hóa. answer để trống: hệ thống lấy các cặp làm đáp án. Không dùng => hoặc || trong văn bản của cặp.

Với đáp án nhập văn bản, các cách viết được chấp nhận phải liệt kê rõ trong answer, ngăn bằng ||. Hệ thống chuẩn hóa Unicode, khoảng trắng, hoa/thường và dấu kết câu .!?; không chấm theo ý nghĩa bằng AI. Không kê các đáp án mơ hồ chỉ để tăng số phương án. Không có đánh giá một phần cho multiple_select hoặc matching.

THCS:

| Môn | Dạng bài |
|---|---|
| chemistry, physics, biology | mcq, true_false, short_answer; ưu tiên các dạng này cho dữ liệu mới |
| history, geography | Chỉ mcq và true_false; mcq phải có đúng 4 lựa chọn |

- **true_false:** options có đúng 4 mệnh đề độc lập không rỗng ngăn bằng ||; answer có đúng 4 giá trị true/false theo cùng thứ tự. Chỉ đúng toàn câu khi đúng 4/4 ý.
- **short_answer:** chỉ Hóa/Lí/Sinh; options trống; answer là số, công thức hoặc cụm ngắn, mỗi đáp án tối đa 200 ký tự. Các cách viết như 1,5||1.5 cần khai báo tường minh. Máy giữ số và dấu câu, chỉ chuẩn hóa chữ/khoảng trắng; thêm case-sensitive khi cần.

## 5. Gợi ý và lời giải

Gợi ý tốt: “Đối chiếu ý nghĩa của cả câu và cách kết hợp từ.” / “Xác định vai trò của chỗ trống trong câu.”

Gợi ý không đạt: “Chọn voyage vì đây là đi bằng tàu.” / “Đáp án B.” / “Loại A và C.” / “Dùng will have rồi thêm finished.” / bản dịch câu đã điền.

Không viết công thức hay từ đồng nghĩa chỉ ra duy nhất đáp án vào hint. Nội dung đó thuộc theory/explanation sau chấm. Website có bộ lọc phát hiện gợi ý quá dài, chứa đáp án hoặc chỉ dẫn phương án, nhưng AI vẫn phải kiểm tra việc tiết lộ gián tiếp. Gợi ý bị chặn được thay bằng gợi ý chung; dữ liệu gốc được giữ.

## 6. Ví dụ hợp lệ

### Flashcard tiếng Anh

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
english,,card-01,vocabulary,fill_blank,B1,Present simple,,reliable /rɪˈlaɪəbl/ (adj),A reliable colleague keeps promises.,,đáng tin cậy,Reliable là tính từ chỉ người/vật có thể tin tưởng.,,,,1,vocab:reliable:adjective:trusted
```

### Tám dạng bài tập từ vựng tiếng Anh

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
english,,vp-01,vocabulary_practice,mcq,B1,Work,,Complete the sentence.,A ___ colleague keeps promises.,reliable||scarce||remote||brief,reliable,Dịch câu: Một đồng nghiệp đáng tin cậy giữ lời hứa. Reliable phù hợp với keeps promises.,Từ được chọn phải phù hợp ngữ cảnh và cấu trúc câu.,Xét quan hệ giữa các từ trong ngữ cảnh.,,1,
english,,vp-02,vocabulary_practice,multiple_select,B1,Work,,Select all words that describe dependable people.,,reliable||trustworthy||careless||unreliable,reliable||trustworthy,Reliable và trustworthy diễn tả sự đáng tin cậy; hai từ còn lại không phù hợp.,Từ được chọn phải phù hợp ngữ cảnh và cấu trúc câu.,Xét quan hệ giữa các từ trong ngữ cảnh.,,1,
english,,vp-03,vocabulary_practice,fill_blank,B1,Work,,Complete with one suitable word.,We must meet the project ___ by Friday.,,deadline,Dịch câu: Chúng ta phải đáp ứng hạn chót của dự án trước thứ Sáu. Meet a deadline là hoàn thành đúng hạn.,Từ được chọn phải phù hợp ngữ cảnh và cấu trúc câu.,Xét quan hệ giữa các từ trong ngữ cảnh.,,1,
english,,vp-04,vocabulary_practice,word_formation,B1,Work,,Complete with the correct form of RELY.,She is a ___ assistant.,,reliable,Chỗ trống trước assistant cần tính từ reliable: đáng tin cậy.,Từ được chọn phải phù hợp ngữ cảnh và cấu trúc câu.,Xét quan hệ giữa các từ trong ngữ cảnh.,,1,
english,,vp-05,vocabulary_practice,error_correction,B1,Work,,Correct the word choice. Write the complete sentence.,Please make attention to the safety instructions.,,Please pay attention to the safety instructions.,Dịch câu: Hãy chú ý các hướng dẫn an toàn. Collocation đúng là pay attention to.,Từ được chọn phải phù hợp ngữ cảnh và cấu trúc câu.,Xét quan hệ giữa các từ trong ngữ cảnh.,,1,
english,,vp-06,vocabulary_practice,sentence_transformation,B1,Work,,Rewrite using PUT OFF without changing the meaning.,They postponed the meeting.,,They put off the meeting.,Dịch câu: Họ hoãn cuộc họp. Put off đồng nghĩa với postpone trong ngữ cảnh này.,Từ được chọn phải phù hợp ngữ cảnh và cấu trúc câu.,Xét quan hệ giữa các từ trong ngữ cảnh.,,1,
english,,vp-07,vocabulary_practice,ordering,B1,Work,,Put all the chips in the correct order.,,the deadline||We||met,We met the deadline,Dịch câu: Chúng tôi đã hoàn thành đúng hạn. Thứ tự: We + met + the deadline.,Từ được chọn phải phù hợp ngữ cảnh và cấu trúc câu.,Xét quan hệ giữa các từ trong ngữ cảnh.,,1,
english,,vp-08,vocabulary_practice,matching,B1,Work,,Match each expression with its meaning.,,put off=>postpone||carry out=>perform,,Put off nghĩa là hoãn; carry out nghĩa là thực hiện.,Từ được chọn phải phù hợp ngữ cảnh và cấu trúc câu.,Xét quan hệ giữa các từ trong ngữ cảnh.,,1,
```

### Ngữ pháp tiếng Anh

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
english,,g-01,grammar,mcq,B1,Present simple,,Complete the sentence.,Mia ___ a lesson right now.,takes||is taking||took||has taken,is taking,"Dịch câu: Mia đang học ngay lúc này. Right now cho thấy hành động đang diễn ra, dùng is taking.",Hiện tại tiếp diễn: S + am/is/are + V-ing.,Chú ý mốc thời gian của hành động.,,1,
```

### Hóa học

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"chemistry","8","c-formula-001","practice","mcq","mixed","Công thức hóa học","Phân biệt kí hiệu","Công thức nào là carbon monoxide (cacbon monoxit)?","","CO||Co||CO2||C","CO","CO là công thức của carbon monoxide; Co là kí hiệu nguyên tố cobalt.","Kí hiệu hóa học phân biệt chữ hoa và chữ thường; công thức cho biết thành phần chất.","So sánh số chữ cái viết hoa.","case-sensitive","1",""
"chemistry","8","c-tf-002","practice","true_false","mixed","Chất tinh khiết và hỗn hợp","Nhận biết","Xét tính đúng/sai của các mệnh đề sau về nước biển và nước cất:","","Nước cất là chất tinh khiết||Nước biển là một hỗn hợp đồng nhất||Nước cất có nhiệt độ sôi không đổi ở 100 °C (1 atm)||Nước biển không chứa muối ăn hòa tan","true||true||true||false","Nước cất chỉ gồm H2O nên là chất tinh khiết có nhiệt độ sôi xác định 100 °C. Nước biển chứa nhiều muối tan (đặc biệt NaCl) nên là hỗn hợp.","Chất tinh khiết có thành phần và tính chất xác định; hỗn hợp gồm nhiều chất trộn lẫn.","Nước biển có vị mặn vì chứa muối.","","2",""
"chemistry","8","c-sa-003","practice","short_answer","mixed","Khối lượng mol","Tính toán","Khối lượng mol phân tử của nước (H2O) bằng bao nhiêu g/mol? (Nhập số)","","","18","M(H2O) = 2 × 1 + 16 = 18 g/mol.","Khối lượng mol phân tử bằng tổng khối lượng các nguyên tử trong phân tử.","H = 1, O = 16.","","2",""
```

### Vật lí

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"physics","8","p-force-001","practice","mcq","mixed","Lực","Đơn vị đo","Đơn vị SI của lực là gì?","","N||J||W||Pa","N","Newton, kí hiệu N, là đơn vị SI của lực. J là đơn vị công, W là công suất, Pa là áp suất.","Lực được đo bằng newton, kí hiệu N trong hệ đo lường quốc tế SI.","Nhớ đến nhà bác học Newton.","case-sensitive","1",""
"physics","8","p-tf-002","practice","true_false","mixed","Áp suất","Đặc điểm","Xét tính đúng/sai của các mệnh đề sau về áp suất chất lỏng:","","Chất lỏng gây áp suất theo mọi phương lên đáy bình, thành bình và các vật trong lòng nó||Áp suất chất lỏng giảm dần khi độ sâu tăng lên||Tại cùng một độ sâu trong một chất lỏng, áp suất là như nhau theo mọi hướng||Công thức tính áp suất chất lỏng là p = d.h","true||false||true||true","Áp suất chất lỏng tăng dần theo độ sâu theo công thức p = d.h, không giảm dần.","Áp suất chất lỏng tác dụng theo mọi phương và phụ thuộc vào trọng lượng riêng d cùng độ sâu h.","Càng lặn sâu thì áp suất càng lớn.","","2",""
"physics","8","p-sa-003","practice","short_answer","mixed","Vận tốc","Tính toán","Một ô tô đi được quãng đường 120 km trong thời gian 2 giờ. Vận tốc của ô tô là bao nhiêu km/h? (Chỉ nhập số)","","","60","Vận tốc v = s / t = 120 / 2 = 60 km/h.","Công thức tính vận tốc: v = s / t.","Lấy quãng đường chia thời gian.","","1",""
```

### Sinh học

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"biology","7","b-photo-001","practice","mcq","mixed","Quang hợp","Cơ quan thực hiện","Bộ phận nào của cây xanh thực hiện quang hợp chủ yếu?","","Rễ||Lá||Hoa||Hạt","Lá","Lá chứa nhiều lục lạp nên là cơ quan quang hợp chủ yếu của cây xanh.","Quang hợp chủ yếu diễn ra ở lá, nơi tế bào chứa bào quan lục lạp mang diệp lục.","Nghĩ về bộ phận có màu xanh và nhận nhiều ánh sáng nhất.","","1",""
"biology","7","b-tf-002","practice","true_false","mixed","Quang hợp ở thực vật","Quá trình và ý nghĩa","Xét tính đúng/sai của các phát biểu sau về quá trình quang hợp:","","Quang hợp hấp thụ khí carbon dioxide và giải phóng khí oxygen||Ánh sáng mặt trời là nguồn năng lượng cho quang hợp||Quang hợp chỉ diễn ra vào ban đêm ở hầu hết thực vật||Nước là một trong các nguyên liệu của quang hợp","true||true||false||true","Quang hợp chỉ diễn ra khi có ánh sáng (ban ngày), ban đêm không có ánh sáng mặt trời nên hầu hết thực vật không quang hợp.","Phương trình quang hợp: Nước + Carbon dioxide + Ánh sáng -> Glucose + Oxygen.","Quang hợp cần năng lượng ánh sáng.","","2",""
"biology","7","b-sa-003","practice","short_answer","mixed","Tế bào","Cấu tạo tế bào","Bào quan nào chứa chất diệp lục và là nơi diễn ra quá trình quang hợp ở tế bào thực vật?","","","lục lạp","Lục lạp là bào quan chứa sắc tố diệp lục, có chức năng hấp thụ năng lượng ánh sáng để quang hợp.","Tế bào thực vật quang hợp nhờ bào quan lục lạp.","Tên bào quan mang màu lục của lá.","","1",""
```

### Lịch sử

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"history","7","h-dai-viet-001","practice","mcq","mixed","Đại Việt thời Lý","Chiến thắng Bạch Đằng","Năm 1077, quân dân nhà Lý dưới sự chỉ huy của Lý Thường Kiệt đã đánh bại quân xâm lược nào trên phòng tuyến sông Như Nguyệt?","","Quân Tống||Quân Mông Cổ||Quân Minh||Quân Nam Hán","Quân Tống","Chiến thắng trên sông Như Nguyệt năm 1077 đập tan hoàn toàn cuộc xâm lược của quân Tống do Quách Quỳ chỉ huy.","Kháng chiến chống Tống giai đoạn 1075–1077 gắn liền với Lý Thường Kiệt và phòng tuyến sông Như Nguyệt.","Nhớ lại bài thơ thần 'Nam quốc sơn hà'.","","2",""
"history","7","h-tf-002","practice","true_false","mixed","Ba lần kháng chiến chống Mông - Nguyên","Thời Trần","Xét tính đúng/sai của các sự kiện sau về ba lần kháng chiến chống Mông - Nguyên của nhà Trần:","","Đạo thủy binh giặc trong trận Bạch Đằng năm 1288 do Thoát Hoan trực tiếp chỉ huy||Hội nghị Diên Hồng là nơi vua Trần hỏi ý kiến các bô lão về việc đánh hay hàng||Trần Hưng Đạo được phong làm Quốc công Tiết chế thống lĩnh toàn quân trong cả ba lần kháng chiến||Nhà Trần đã ba lần thực hiện kế sách 'Vườn không nhà trống' để đánh bại giặc","false||true||false||true","Ý a sai vì đạo thủy binh do Ô Mã Nhi và Phàn Tiếp chỉ huy; Thoát Hoan chỉ huy cánh bộ binh tháo chạy theo đường bộ. Ý b đúng vì Hội nghị Diên Hồng năm 1285 trưng cầu ý kiến các bô lão. Ý c sai vì Trần Hưng Đạo được phong Quốc công Tiết chế thống lĩnh toàn quân ở lần 2 (1285) và lần 3 (1287–1288); lần 1 (1258) do vua Trần Thái Tông và Lê Phụ Trần trực tiếp chỉ huy phản công tại Đông Bộ Đầu. Ý d đúng vì cả 3 lần nhà Trần đều chủ động rút khỏi kinh thành để thực hiện 'Vườn không nhà trống'.","Nhà Trần đại thắng Mông - Nguyên nhờ tinh thần đoàn kết toàn dân, kế sách 'Vườn không nhà trống' và nghệ thuật quân sự độc đáo.","Nhớ lại người chỉ huy thủy quân giặc ở Bạch Đằng và thời điểm Trần Hưng Đạo được cử làm Tiết chế.","","2",""
```

### Địa lí

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
"geography","6","g-earth-001","practice","mcq","mixed","Trái Đất trong hệ Mặt Trời","Vị trí và hình dạng","Trái Đất đứng ở vị trí thứ mấy theo thứ tự xa dần Mặt Trời?","","Thứ nhất||Thứ hai||Thứ ba||Thứ tư","Thứ ba","Theo thứ tự từ Mặt Trời ra xa: Thủy tinh, Kim tinh, Trái Đất, Hỏa tinh, Mộc tinh, Thổ tinh, Thiên Vương tinh, Hải Vương tinh.","Trái Đất là hành tinh thứ ba tính từ Mặt Trời trong Hệ Mặt Trời.","Nằm giữa Kim tinh và Hỏa tinh.","","1",""
"geography","6","g-tf-002","practice","true_false","mixed","Chuyển động của Trái Đất","Hệ quả","Xét tính đúng/sai của các nhận định sau về sự chuyển động tự quay quanh trục của Trái Đất:","","Trái Đất tự quay quanh trục theo hướng từ tây sang đông||Thời gian Trái Đất tự quay một vòng quanh trục là khoảng 24 giờ (một ngày đêm)||Hiện tượng ngày đêm luân phiên là hệ quả của chuyển động tự quay của Trái Đất||Sự lệch hướng chuyển động của các vật thể ở hai bán cầu không phụ thuộc vào chuyển động tự quay","true||true||true||false","Lực Coriolis làm lệch hướng chuyển động của các vật thể ở hai bán cầu là hệ quả trực tiếp sinh ra từ chuyển động tự quay quanh trục của Trái Đất.","Trái Đất tự quay quanh trục sinh ra: ngày đêm luân phiên, giờ trên Trái Đất và lực Coriolis làm lệch hướng vật chuyển động.","Lực Coriolis sinh ra do Trái Đất tự quay.","","2",""
```

## 7. Checklist trước khi giao

1. Đủ số câu, đúng 18 cột mỗi dòng, đúng UTF-8 và escape; một file chỉ một môn.
2. ID duy nhất; domain đúng mục tiêu; grade/level/type phù hợp.
3. Đáp án đúng có trong lựa chọn; nhiễu hợp lí và không có hai đáp án đúng ngoài yêu cầu multiple_select.
4. Mảnh ordering ghép được nguyên vẹn, dùng đủ mảnh; matching không trùng vế; prompt nói rõ kiểu trả lời.
5. Đủ các biến thể hợp lệ cho đáp án gõ; không dùng máy chấm theo ý nghĩa hay giải tự luận dài.
6. Mọi câu có explanation; bài tập có theory; tiếng Việt có dấu, dịch câu và phân tích rõ sau chấm.
7. Hint không lộ đáp án trực tiếp hoặc gián tiếp; prompt/context không vô tình chứa lời giải.
8. Flashcard có key ổn định, bài tập không có lịch ôn; không dùng lại ID cho các câu khác về cùng từ.
9. Không HTML/script, công thức bảng tính, type/cột tự chế hay lời dẫn ngoài CSV.
