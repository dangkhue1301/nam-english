# PLAN CONTINUE — Bàn giao NẮM Học tập

Cập nhật: 11/09/2026.

> Đã chốt đợt Terra Max hiện tại: build `3146210aa513`, 13 tệp, 71/71 test đạt. Agent chính kiểm tra độc lập 69 test không chạy build: đều đạt. Chưa commit/push frontend, chưa QA trình duyệt bản cuối. Ưu tiên tiếp theo: cơ chế phục hồi cache PWA bị mất và checklist Phase 0–6, rồi mới triển khai Phase 7–8.

## 1. Yêu cầu dành cho model tiếp nhận

Tiếp tục dự án hiện có, không viết lại từ đầu. Người dùng yêu cầu model khác triển khai phần còn lại sau đợt Terra Max này. Đọc tài liệu này, `PLAN.md`, `FRONTEND_PLAN.md` và mã thực tế trước khi sửa.

- Giữ website tĩnh trên GitHub Pages, vanilla JavaScript, HTML và CSS.
- Giữ giao diện glassmorphism nhẹ: nền kem–cam đất, thẻ kính mờ, viền trong suốt, dark/light/auto, chữ tiếng Việt có dấu và dễ đọc.
- Hoàn thiện các phần còn thiếu theo thứ tự trong mục 7; mỗi phần phải có kiểm thử và mốc bàn giao riêng.
- Không tự chuyển sang Sites, React, Next.js, Supabase, máy chủ mới, CDN hoặc dịch vụ trả phí.
- Không xóa dữ liệu người dùng để giải quyết lỗi, không reset bản sửa đang có.
- Cập nhật `PLAN.md` khi có kết quả thật. Phân biệt rõ: đã viết mã, đã test, đã thử trên trình duyệt, đã phát hành.

Trong các lượt trước, agent chính chỉ lập kế hoạch/rà soát và Terra Max triển khai. Yêu cầu mới là bàn giao cho model khác implement nốt; model tiếp nhận không bắt buộc tiếp tục gọi Terra Max, trừ khi người dùng yêu cầu thêm.

## 2. Project, Git và cách chạy

### 2.1 Đúng thư mục cần làm

```text
C:\Users\DELL\Documents\Codex\2026-07-26\t-o\work\remote-live
```

Đây là worktree sản phẩm. Không làm nhầm vào checkout `github-pages` ở thư mục cha; checkout đó có trạng thái riêng, không được reset để đồng bộ.

Trạng thái nền lúc bắt đầu bàn giao:

- Branch: `codex/study-refresh-20260908`.
- HEAD trước đợt frontend: `f73e4001f44e7f4ec0ecaf662b694a039a679aff`.
- Repo: [dangkhue1301/nam-english](https://github.com/dangkhue1301/nam-english).
- Website: [NẮM Học tập](https://dangkhue1301.github.io/nam-english/).
- Frontend/PWA đang là bản sửa chưa commit tại thời điểm bàn giao. Luôn chạy `git status` lại; không giả định danh sách file không đổi.

Các file đã sửa so với HEAD: `app.js`, `index.html`, `styles.css`, `manifest.webmanifest`, `scripts/build.mjs`, `sw.js`, `tests/build.test.mjs`, `PLAN.md`. Các file mới chưa được Git theo dõi: `pwa.js`, `tests/pwa.test.mjs`, `FRONTEND_PLAN.md`, `plan_continue.md`. `core.js`, `storage.js`, `stats.js` và guide không đổi trong đợt frontend này. Không bỏ sót các file untracked khi tạo commit sau này.

Git trên máy có thể yêu cầu xác nhận đúng worktree bằng cấu hình cho riêng lệnh:

```powershell
Set-Location 'C:\Users\DELL\Documents\Codex\2026-07-26\t-o\work\remote-live'
git -c safe.directory=C:/Users/DELL/Documents/Codex/2026-07-26/t-o/work/remote-live status --short
git -c safe.directory=C:/Users/DELL/Documents/Codex/2026-07-26/t-o/work/remote-live log -5 --oneline
```

Không đổi cấu hình Git toàn cục, không `reset --hard`, không `checkout --`, không force-push. Giữ nguyên mọi thay đổi không thuộc nhiệm vụ.

### 2.2 Lệnh chạy và kiểm tra

Yêu cầu Node.js 22 trở lên. Dependency hiện tại chỉ có `fake-indexeddb` phục vụ kiểm thử; không thêm thư viện nếu chưa thật sự cần và chưa được duyệt.

```powershell
# Chỉ cần khi chưa có node_modules phù hợp với lockfile.
npm ci --ignore-scripts

# Bộ test đầy đủ; lưu ý build.test.mjs cũng chạy build và thay dist.
npm test

# Tạo bản tĩnh để mở kiểm tra.
npm run build

# Cổng kiểm tra riêng của NẮM.
$env:PORT = '4187'
npm run dev
```

Mở `http://127.0.0.1:4187/nam-english/`. Máy chủ dev phục vụ `dist`, không có HMR; sửa nguồn xong phải build rồi tải lại trang. Không chiếm hoặc dừng cổng 4173: cổng đó đã được dự án khác dùng. Nếu 4187 đang có máy chủ cũ, xác minh đúng tiến trình NẮM trước khi xử lý; không quét/kill hàng loạt.

Kiểm tra logic riêng, không chạy build:

```powershell
node --test tests/core.test.mjs tests/storage.test.mjs tests/stats.test.mjs
```

### 2.3 Lưu ý khi xuất bản

- Workflow `.github/workflows/pages.yml` chạy khi push `main`: cài dependency, test, build, deploy Pages.
- Tài khoản chủ repo là `dangkhue1301`. Trước đây Git chọn nhầm một tài khoản khác và bị 403; có thể dùng `-c credential.username=dangkhue1301` cho riêng lệnh Git cần xác thực.
- Không đăng xuất các tài khoản khác, xóa credential, in token hoặc đổi cấu hình xác thực lưu trên máy.
- Chỉ push sau khi rà soát, kiểm thử và được phép theo yêu cầu đang có. Đọc remote main trước, chỉ cập nhật fast-forward; nếu remote đã phân kỳ, dừng và báo rõ, không tự force hoặc ghi đè.
- Sau push phải kiểm tra GitHub Actions và bản live thực tế. Push thành công không đồng nghĩa deploy thành công.
- Hash build Windows có thể khác Linux vì CRLF/LF. Khi kiểm tra live, đối chiếu mã đã commit và tính nhất quán của các tài nguyên trên cùng bản; không kết luận lỗi chỉ vì hash khác bản working tree Windows.

## 3. Phạm vi và các quy tắc không được phá

Ứng dụng tự luyện cho Tiếng Anh, Hóa học, Vật lí và Sinh học lớp 6–9 Việt Nam. Giáo viên tạo CSV bằng AI khác; học sinh nhập file, chọn bộ và tự làm bài.

1. Mỗi CSV tạo một bộ độc lập và thuộc một môn. Trùng ID gốc giữa hai file không được ghi đè câu hoặc tiến độ.
2. Mặc định tối đa 30 câu/lượt. Bộ 50 câu phải làm 30 rồi 20; câu grammar và khoa học đã chấm không lặp trong lượt học thông thường, kể cả chấm sai.
3. Chọn bộ nào học bộ đó. Chỉ trộn bộ khi học sinh chủ động bật tính năng trộn trong tương lai.
4. Vocabulary sai quay về cuối lượt đến khi đúng. SRS dùng chung theo `learning_key`, nhưng hoàn thành lần học đầu được tính riêng theo bộ; học từ ở bộ A không tự hoàn thành từ đó ở bộ B.
5. Chấm dựa trên đáp án khai báo, không gọi AI trực tuyến. Giữ chuẩn hóa Unicode, các đáp án thay thế và tag `case-sensitive` cho `Co`/`CO`, đơn vị, ký hiệu cần phân biệt.
6. Lưu kết quả, nháp và bước trong lượt học an toàn. Submit lặp cùng bước chỉ tạo một attempt; lỗi ghi dữ liệu phải báo lỗi, không giả báo thành công.
7. Kho mặc định trống. Việc chuyển nội dung cũ vào bản phục hồi đã làm ở backend; không chạy lại thao tác làm trống trong mỗi lần mở web.
8. Dữ liệu cục bộ trên từng trình duyệt. Chưa có tài khoản, server, tự đồng bộ nhiều máy hoặc bảng điểm giáo viên tập trung. Học sinh máy khác dùng cùng URL, nhưng phải có CSV riêng hoặc nhập bộ được chia sẻ.
9. Xóa/thay kho có bản phục hồi. Xóa một bộ không xóa SRS của từ còn được dùng trong bộ khác.
10. Dữ liệu CSV, backup và fragment URL là dữ liệu không tin cậy. Kiểm tra trước khi ghi; escape khi render; không dùng `eval` hoặc render nội dung bài bằng HTML thô.

### CSV/guide hiện có — giữ nguyên nếu không có lý do bắt buộc

Guide: `QUESTION_CSV_GUIDE.md`. Bản tiện gửi AI nằm thêm ở thư mục `outputs` của workspace.

```csv
subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key
```

- CSV mới 18 cột; file Tiếng Anh cũ 16 cột vẫn nhận, mặc định `subject=english`.
- `subject`: `english`, `chemistry`, `physics`, `biology`.
- Hóa/Lí/Sinh: `grade` từ `6` đến `9`, `domain=practice`. Tiếng Anh: `grammar` hoặc `vocabulary`.
- Giới hạn nhập: 5 MB/file, 2.000 câu/file, 10.000 ký tự/ô. Một dòng lỗi thì không nhập một phần.
- Grammar chỉ cần tạo câu mới theo topic được giao; không yêu cầu source, tên sách hoặc số trang. Vocabulary giữ hướng dẫn SRS.
- Mẫu trong guide đã có test parser; không tự sửa header hoặc ví dụ mà không chạy lại test.
- Fixture thuộc `tests/fixtures`, không được đóng gói dữ liệu mẫu vào web công khai.

## 4. Bản đồ mã và các điểm dễ sửa nhầm

| File | Vai trò | Lưu ý |
| --- | --- | --- |
| `app.js` | UI, state, nhập CSV, làm bài, thống kê, sự kiện | Dữ liệu gốc ở `state.data.snapshot`; cần đọc API thực tế, không chép snippet roadmap nguyên xi. |
| `styles.css` | Token màu, glassmorphism, layout, responsive, motion | Giữ một file có các section rõ ràng; hỗ trợ không có backdrop-filter và reduced motion. |
| `index.html` | App root, dialog, live regions, theme khởi tạo | Đường dẫn tương đối để chạy trong `/nam-english/`. |
| `core.js` | Parser, validation CSV, chấm bài, SRS, chọn câu | Logic nền đã có test; thay đổi phải có hồi quy. |
| `storage.js` | Repository, transaction, session, backup/migration | Không chỉ sửa UI nếu tính năng làm thay đổi contract session/attempt. |
| `stats.js` | Hàm thuần tính thống kê, XP, streak, CSV | Phân biệt số lần trả lời với số câu duy nhất. |
| `pwa.js`, `sw.js` | Đăng ký PWA, cập nhật, offline, cache | Đọc trạng thái cuối đợt Terra ở mục 5 trước khi tiếp tục. |
| `scripts/build.mjs` | Build hash, rewrite URL và precache | Thêm tài nguyên phải cập nhật cả build và test/PWA, không để lệch danh sách. |
| `scripts/dev.mjs` | Máy chủ xem thử `dist` | Chỉ dùng cục bộ, không phải backend học sinh. |
| `tests/*.test.mjs` | Unit/integration/build tests | Các backend giả lập đều cần được thử. |

### 4.1 Cấu trúc lưu trữ hiện tại

- IndexedDB: `nam-english-local`, phiên bản 3, store `workspace`, bản ghi `current`.
- localStorage dự phòng: `nam-english:workspace-v5`.
- Snapshot: `questions`, `reviews`, `attempts`, `imports`, `revision`, `session`, `summary`, `selectedSetId`, `recovery`.
- Chỉ fallback sang localStorage khi IndexedDB không hỗ trợ; lỗi mở/quota không được âm thầm đổi sang kho trống.
- Backup hiện tại version 2 xuất bốn mảng dữ liệu; không xuất session đang làm hay summary. UI giới hạn file backup 50 MB; validator có giới hạn số bản ghi.
- Repository dùng transaction và cơ chế phối hợp nhiều tab. Dùng repository cho mọi thay đổi dữ liệu, không ghi riêng từ handler UI.

### 4.2 Contract phiên học cần đọc trước khi làm Phase 7

Các điểm nằm trong `storage.js`: `selection`, `validSession`, `validSummary`, `addAttempt`, `validateBackup`, `deleteSet`, `startSession`, `submit`, `advance`, `repairSession`, `readDashboard`.

- Mode hiện có: `grammar`, `practice`, `vocabulary`, `flashcards`; flashcards dùng domain vocabulary.
- Session hiện chỉ thuộc một `setId`, một domain; queue không trùng ID; `done + queue.length === target`; `target` từ 1 đến 30.
- `startSession` đã nhận `limit`, nhưng `session.filters` hiện chỉ lưu `level`, `topic`, `grade`. Chưa có type, mixed-set hay purpose ôn sai.
- `selection` dùng attempts để tính hoàn thành: mọi attempt khoa học/grammar đánh dấu đã làm; vocabulary chỉ lấy attempt đúng và khử trùng `learning_key` trong bộ.
- `addAttempt` nhận `extra.mode` và `extra.id`; submit dùng ID `${session.id}:${step}` để chống ghi trùng. Từ vựng hiện tự gọi `nextReview` trong `addAttempt`.
- `validateBackup` kiểm tra mode của attempt phù hợp domain. Thêm mode/purpose mới mà không cập nhật validator sẽ làm backup tự xuất ra nhưng không nhập lại được.
- `deleteSet` hiện chỉ kiểm tra `session.setId`. Nếu thêm `setIds` hoặc lượt ôn nhiều bộ, phải cập nhật cleanup và kiểm thử tab khác xóa bộ đang học.
- Chỉ giữ summary gần nhất; chưa có lịch sử từng phiên để so sánh “lần trước”. Không bịa so sánh hoặc suy ra phiên học từ timestamp một cách tùy tiện.

### 4.3 Contract thống kê

- `topicMastery(questions, attempts)` nhóm theo domain + topic, chưa tách subject ở bên trong. UI hiện gọi riêng theo môn để không gộp các chủ điểm trùng tên của Hóa/Lí/Sinh.
- `dueForecast(...)` trả mảng số lượng theo ngày, không phải mảng object.
- `mistakeQuestions(...)` lấy câu có lần trả lời gần nhất sai, không phải mọi câu từng sai trong lịch sử.
- Streak dùng ngày tại máy người học. Không tự đổi UTC rồi làm lệch ngày hiển thị.
- Dữ liệu không hợp lệ được UI lọc/bắt lỗi; vẫn cần test các collection rỗng, câu đã bị xóa và timestamp hỏng.

## 5. Những gì đã làm và bằng chứng

### 5.1 Backend đã phát hành

- Đã có backend logic cho bốn môn, CSV đa môn, bộ độc lập, 30 + 20, nháp, SRS, backup/phục hồi và xử lý session rỗng.
- Bản triển khai backend: `5afb003bc395b91229193555d2d0c4f720397cca`; HEAD tài liệu tiếp theo là `f73e400...`.
- GitHub Actions trước đợt frontend đã thành công; chưa có push frontend mới trong đợt này, website công khai vẫn là bản backend trước đợt frontend.
- Ngày 11/09 agent chính chạy độc lập 63 test core/storage/stats: 63 đạt, 0 lỗi.

### 5.2 Frontend đã có trong bản local

- Design system glassmorphism nhẹ, màu kem–cam đất, thẻ kính mờ, token dark/light/auto.
- Font hệ thống hỗ trợ tiếng Việt, body 18 px, nhãn điều hướng mobile đã tăng cỡ ở bản sửa sau.
- Trang Thống kê có XP/streak, số liệu thật, biểu đồ hoạt động, heatmap, accuracy theo loại, chủ điểm tách theo môn, lịch ôn, thành tích và câu sai; chi tiết phụ thu gọn.
- Lưu theme `nam-theme`, áp dụng theme sớm, cập nhật theme-color; không bắt buộc localStorage hoạt động.
- Home có XP/streak và nhắc từ đến hạn. Library có tìm bộ, lọc môn, sắp xếp và ngày học gần nhất.
- Lượt học có số câu, timer ẩn/hiện, lý thuyết, feedback focus/live announcement, nháp và phím tắt.
- Kết quả có breakdown thật, thời gian học, sao chép kết quả và xem lại câu sai lần đầu; không có so sánh giả với lượt trước.
- Hiệu ứng ngắn, skeleton hữu hạn, tôn trọng reduced motion. CSS có section và fallback không blur.

### 5.3 Kiểm tra trình duyệt đã thực hiện trước Phase 6

**Bản `544acf571eb2`:** đã kiểm tra thống kê với 2 câu Vật lí: 2 attempts, 2 câu duy nhất, 12 XP, accuracy 50%; Lực 0%, Khối lượng riêng 100%. Theme tự động → sáng → tối và tải lại giữ tối. Đã xem ở 1050/390 px; mobile heatmap 10 tuần. Đã nhập fixture tiếng Anh 16 cột, chấm sai grammar, tải lại giữ kết quả và kết thúc lượt không lặp câu sai. Không thấy console error/warning trong các lượt này.

**Bản `f875044ef585`:** 12 tệp, chưa gồm PWA; Terra báo 64/64 test và build đạt. Agent chính đã thấy trang kết quả focus vào tiêu đề, breakdown 0/1 và thời gian 38 giây; về bộ bài đúng, Home hiện 14 XP và tiến độ đã lưu. Phím L mở thư viện, input giữ caret, gõ H trong ô nhập không điều hướng. Lọc môn/sắp xếp hoạt động trong lượt thử.

Nút sao chép có toast thành công nhưng chưa xác minh được nội dung clipboard. Chưa được xem là hoàn tất QA tất cả luồng của bản này.

### 5.4 Kết quả cuối đợt Terra Max Phase 6

Terra đã bàn giao nguồn và build `3146210aa513`, 13 tệp:

- `npm test`: 71/71 đạt, gồm 63 test core/storage/stats, 6 test PWA và 2 test build/tích hợp nguồn UI.
- `node --check` nguồn và JS trong dist đạt; `git diff --check` đạt. Agent chính chạy độc lập 69 test core/storage/stats/PWA: 69/69 đạt, và đối chiếu meta build trong `dist/index.html` cùng danh sách 13 tệp.
- Có test trường hợp trình duyệt không hỗ trợ, đăng ký bị từ chối, callback lỗi, connectivity, install prompt, dispose/updatefound race, cache khác scope, bundle A/B, cache miss và precache lỗi.
- `app.js` import `pwa.js`; banner offline/update và nút cài đặt ở vùng DOM riêng, không render lại root khi có sự kiện PWA. Nút cài chỉ hiện khi có `beforeinstallprompt`; lỗi PWA không chặn mở repository.
- Worker chỉ đọc cache của đúng namespace/scope/version. Build tạo danh sách precache và SHA-256 của bytes cuối cùng cho mỗi asset, gồm cả guide. Worker kiểm tra toàn bộ asset trước khi ghi, từ chối nội dung không khớp khi server đổi bản trong lúc tải.
- Cài lại lỗi không xóa cache cùng version đã tồn tại. Activate chỉ dọn cache cũ của đúng scope NẮM; không đụng IndexedDB hoặc cache ứng dụng khác.
- Không gọi `skipWaiting`/`clients.claim`, không ép reload. Bản mới chờ lifecycle bình thường và UI nhắc đóng các tab NẮM rồi mở lại.
- Navigation app shell chỉ áp dụng root/index; guide versioned được mở/tải đúng nội dung guide, không bị thay bằng HTML app. Request asset cũ/sai version/cache miss trả 503 thay vì fetch mã không đúng phiên bản từ Pages.
- Enter sau feedback dùng chung action `next` để giữ scroll/focus; Enter trên summary/link/control khác giữ hành vi mặc định. Phần kiểm tra UI mới là kiểm tra mã nguồn, chưa phải browser test tương tác.
- Manifest có shortcuts Home/Library/Stats/Data; giữ sub-path tương đối. Chưa có screenshots thực hay kiểm tra cài trên điện thoại.
- Không sửa backend core/storage/stats hoặc CSV guide; không commit/push/deploy; không mở Phase 7–8.

**Lỗi/giới hạn ưu tiên cao trước phát hành:** nếu cache của worker active bị mất nhưng service worker trên server vẫn cùng phiên bản, root/index có thể tiếp tục trả 503 dù đã đóng/mở tab. Hiện chưa có self-repair an toàn; câu hướng dẫn đóng/mở trong phản hồi 503 chưa đủ cho trường hợp này. Không phát hành rồi yêu cầu học sinh xóa toàn bộ dữ liệu để khắc phục. Model tiếp nhận cần xử lý tại Đợt A và thêm test trước khi coi PWA sẵn sàng phát hành.

### 5.5 Giới hạn kiểm chứng phải giữ trung thực

- Công cụ điều khiển trình duyệt của lượt trước bị bộ duyệt tự động chặn do hạn mức. Đây không phải bằng chứng ứng dụng có lỗi. Không dùng công cụ khác để lách thao tác bị từ chối; chỉ tiếp tục khi điều kiện cho phép đã được giải quyết.
- Chưa thử IME composition thật, đủ luồng timer/Esc/flashcard/focus và responsive 390/760/1050 trên bản cuối.
- Chưa đo Lighthouse; không ghi Accessibility ≥ 95 khi chưa chạy.
- Chưa xác minh cài PWA trên điện thoại thật, cập nhật hai phiên bản bằng trình duyệt thật hoặc khởi động ngoại tuyến trên bản cuối.
- Lần truy cập mạng đầu tiên, trước khi service worker kiểm soát trang, chưa được bảo vệ hoàn toàn khỏi việc deploy đổi bản giữa lúc tải HTML và các mô-đun. Kiểm tra SHA-256 bảo vệ lượt precache sau đó, không chứng minh rằng lần tải ban đầu tuyệt đối không trộn bản; cần thử và có thông báo/phục hồi phù hợp nếu gặp lỗi.
- Không có ảnh chụp thật được xác nhận cho manifest. Không thêm ảnh giả và coi như đã hoàn thành screenshots/install prompt.

## 6. Việc cần chốt trước khi mở rộng

1. Xử lý phục hồi cache PWA bị mất như mục 5.4, không xóa dữ liệu học; giữ nguyên kiểm tra digest và không trộn bundle cũ/mới.
2. Kiểm tra status/diff, xác nhận không còn marker placeholder ngoài chỗ build cố ý thay thế; chạy đủ test và build từ cùng bộ nguồn.
3. Kiểm tra `dist/index.html`, imports JS, manifest, guide và SW dùng đúng bundle; không đóng gói test/fixture/CSV mẫu.
4. Rà lại lỗi runtime/console, lỗi nhập CSV và các hành vi keyboard đã sửa. Không coi test mock hoặc kiểm tra pattern nguồn là thay thế đầy đủ cho browser QA.
5. Chạy checklist UI/PWA ở mục 8 khi công cụ được phép dùng bình thường. Ghi rõ mục chưa thể chạy, không đánh dấu tất cả hoàn tất.
6. Giữ bản local ổn định làm mốc trước khi thay đổi schema/session trong Phase 7. Không phát hành một PWA đang trộn tài nguyên hoặc làm mất khả năng mở kho.

Lưu ý PWA bắt buộc: GitHub Pages không lưu bản tài nguyên cũ chỉ vì URL có `?v=...`. Cache miss của URL cũ không được âm thầm trả mã mới; không dùng `caches.match` toàn cục để lấy tùy cache. Chỉ dọn namespace đúng scope NẮM, không xóa IndexedDB hoặc cache ứng dụng khác, không ép `skipWaiting`/reload khi học sinh đang làm bài.

## 7. Các phần còn lại — triển khai theo từng đợt nhỏ

Không làm đồng thời toàn bộ các mục dưới đây trong một diff lớn. Mỗi đợt nên có: contract dữ liệu nếu có, implementation, test, kiểm tra UI, ghi lại kết quả. Giữ toàn bộ `FRONTEND_PLAN.md` để đối chiếu; mẫu code trong đó chỉ là gợi ý và có mẫu SW không an toàn, không chép nguyên văn.

### Đợt A — Hoàn thiện và kiểm chứng Phase 0–6

Ưu tiên lỗi ảnh hưởng làm bài/lưu dữ liệu, sau đó mới polish.

- Việc đầu tiên là self-repair khi cache active thiếu một phần hoặc mất hẳn. Có thể tải lại các bytes của cùng phiên bản nếu SHA-256 khớp rồi phục hồi cache; nếu server đã có bản khác thì đi qua cơ chế cập nhật an toàn, không giả tài nguyên mới thành phiên bản cũ. Nếu mạng không có hoặc digest sai, phản hồi rõ và không sửa IndexedDB. Thêm test cache mất + server cùng bản, cache mất + server bản mới, offline, quota/put lỗi và hai tab; không chỉ đổi 503 thành `fetch(request)` không kiểm chứng.
- Glassmorphism không được làm chữ mờ hoặc thiếu tương phản; có nền thay thế khi thiếu backdrop-filter.
- Nhãn chính thường dùng khoảng 14 px trở lên, metadata khoảng 12 px trở lên; kiểm tra thực tế các nhãn còn nhỏ thay vì chỉ tăng body.
- Không dùng `overflow-x: hidden` để che lỗi bố cục. Đặc biệt kiểm tra option dài, tên bộ dài, tiếng Việt, công thức và mobile.
- Focus sau Enter/nhấn nút qua câu phải thống nhất. Enter trên summary lý thuyết/link phải giữ hành vi mặc định, không vô tình chấm bài.
- Đóng dialog phải trả focus về phần tử hợp lý kể cả khi app đã render lại; kiểm tra phím Tab/Shift+Tab và Esc.
- Banner PWA phải không che nút chấm/tiếp theo, không lấy focus hoặc render mất nháp khi sự kiện online/offline/update phát sinh.
- Kiểm tra cập nhật an toàn, cache lỗi và khả năng mở offline. Cài đặt chỉ hiện khi trình duyệt có khả năng thật.
- Có thể bổ sung screenshots manifest bằng ảnh chụp thật từ bản hiện tại sau khi được phép QA; không tạo ảnh giả.

**Đạt khi:** các luồng cốt lõi hoạt động, test/build đạt, không console error trong các tình huống đã thử; mọi mục chưa thử được liệt kê trung thực.

### Đợt B — Lượt học tùy chọn trong một bộ

Làm phần ít rủi ro của Phase 7.4 trước:

- Cho chọn 10/20/30 câu, mặc định vẫn 30.
- Cho lọc loại bài nếu bộ có nhiều loại; không bày thêm control khi không cần.
- Chỉ lấy các câu chưa hoàn thành theo đúng quy tắc hiện tại. Nếu còn ít hơn số đã chọn thì lấy phần còn lại.
- Lưu lựa chọn trong session/summary để tải lại và “Học tiếp” không tự đổi về bộ lọc khác.
- Bổ sung type/limit validation; không chỉ thêm dropdown rồi bỏ qua ở repository.
- Giữ title/empty state rõ khi không còn câu phù hợp, không mở session queue rỗng.

**Test tối thiểu:** bộ 50 chia 10 + 10 + 30 hoặc 30 + 20; bộ chỉ còn 7 câu; chọn type chỉ lấy đúng type; reload giữ nháp/filter; bấm Học tiếp giữ cấu hình; hai tab không tạo lượt đè nhau; test cả IndexedDB và localStorage.

### Đợt C — Ôn riêng các câu sai, tối đa 20 câu/lượt

Phần Phase 7.1. Nút đặt gọn trên Stats hoặc Home, chỉ rõ đây là lượt ôn riêng.

- Nguồn lấy từ `mistakeQuestions`, tức câu có lần làm gần nhất sai, trên mọi bộ còn tồn tại, tối đa 20 câu.
- Không thay thế âm thầm lượt đang làm. Học sinh phải tiếp tục/kết thúc lượt hiện có trước khi mở lượt khác.
- Hỗ trợ nhiều môn nhưng vẫn hiện đúng tên môn/bộ cho từng câu; chấm bằng chính `evaluateAnswer`, không thêm AI trực tuyến.
- Lưu attempts để lịch sử và danh sách câu sai cập nhật sau ôn, nhưng không khiến tiến độ hoàn thành của chế độ thường tăng/giảm ngoài ý muốn.
- Cần tách “mục đích lượt học” khỏi domain/mode hiện tại. Có thể dùng field purpose với giá trị mặc định tương thích dữ liệu cũ; tên cụ thể do model thiết kế, phải được validation và backup round-trip bảo vệ.
- Không chỉ thêm `mode=review` rồi dùng lại toàn bộ hàm hiện tại: `selection`, `buildStats`, `validSession`, `validSummary`, `addAttempt`, `validateBackup`, delete/repair phải được rà đồng bộ.
- Quy ước đề xuất cho lượt ôn riêng: một lượt trả lời cho mỗi câu được chọn; câu vẫn sai tiếp tục nằm trong danh sách ôn sai cho lần sau. Không gọi `nextReview` hoặc thay lịch SRS từ lượt ôn riêng; luồng vocabulary/flashcards chuẩn vẫn giữ sai quay lại và cập nhật SRS như cũ.
- Field mới không hợp lệ phải bị từ chối hoặc sửa theo quy tắc rõ ràng, không biến mất im lặng sau export/import.

**Test tối thiểu:** chỉ câu sai gần nhất, không lấy câu đã bị xóa/tắt, tối đa 20, nhiều bộ trùng ID gốc không nhầm; submit idempotent; reload giữa đáp án/kết quả; trước/sau ôn số câu còn lại và SRS của chế độ thường không đổi; lần ôn đúng loại câu khỏi danh sách sai; backup giữ purpose và vẫn nhận backup cũ.

### Đợt D — Trộn nhiều bộ, chỉ khi người học chọn

Hoàn thiện phần còn lại của Phase 7.4 sau khi session contract đã ổn.

- Mặc định vẫn một bộ. Có lựa chọn rõ “Trộn nhiều bộ”, cho chọn bộ và xem số câu phù hợp trước khi bắt đầu.
- Để giữ đơn giản, trước tiên trộn các bộ cùng chế độ học/domain; không ép grammar, khoa học và flashcards vào một mode mơ hồ.
- Không dùng set ID giả để lách validator một bộ. Session phải khai báo các bộ/câu thật và validation kiểm tra tất cả quan hệ.
- Queue không trùng ID; vocabulary cùng `learning_key` cần quy tắc khử trùng và tiến độ theo từng bộ rõ ràng, không tự hoàn thành toàn bộ các bản sao ở những bộ chưa học.
- Chỉ câu thực sự làm mới ảnh hưởng tiến độ bộ gốc. Màn hình kết quả hiển thị breakdown theo bộ/môn thật.
- Xóa một bộ liên quan ở tab khác phải hủy/khôi phục lượt theo quy tắc an toàn đã test; không để câu mất gây lỗi `context`.
- Không tự đổi bộ đang chọn cho chế độ thường khi thoát lượt trộn, trừ lựa chọn rõ của người học.

**Test tối thiểu:** hai bộ cùng mode, ID gốc trùng, bộ đã hết câu, lọc type/grade, giới hạn 10/20/30, reload, xóa một bộ trong lượt, giữ các attempts đã chấm, backup cũ/mới, SRS key trùng ở nhiều bộ.

### Đợt E — Tìm câu hỏi và xuất báo cáo

Hai phần này chủ yếu là đọc dữ liệu; có thể triển khai thành hai commit nhỏ.

**Tìm câu — Phase 7.3:**

- Tách rõ tìm bộ và tìm câu; không làm Library quá nhiều control.
- Tìm trên prompt, context, đáp án đã hiển thị và topic. Không stringify object thành `[object Object]`.
- Kết quả có tên bộ, môn/domain, đoạn khớp; mọi nội dung phải escape, kể cả khi highlight.
- Click kết quả chọn bộ chứa câu, không tự ghi nhận câu đã học hoặc mở lại câu đã hoàn thành trong chế độ thường.
- Giới hạn/pagination kết quả khi kho lớn; giữ input/caret/IME khi gõ.

**Báo cáo — Phase 7.5:**

- Nút “Xuất báo cáo” ở Data; xuất Markdown/text trước để giữ đơn giản, có thể thêm CSV.
- Có ngày xuất, số câu duy nhất đã làm, tổng lần trả lời, đúng/sai, accuracy, streak, breakdown môn/topic và danh sách câu sai gần nhất.
- Ghi rõ các số là attempts hay câu duy nhất, nguồn dữ liệu chỉ trên thiết bị này; không giả thành bảng điểm cả lớp.
- Nhóm topic có cả subject/domain để không gộp sai các môn.
- Không xuất dữ liệu cá nhân không cần thiết, không gửi lên máy chủ.
- Nếu xuất CSV báo cáo, xử lý các ô có thể thành công thức spreadsheet. Không tự thêm tiền tố vào CSV câu hỏi khiến đáp án round-trip bị đổi.

**Test tối thiểu:** kho trống; bốn môn; topic trùng tên giữa môn; dấu tiếng Việt/ngoặc kép/xuống dòng; đáp án dạng mảng/object; text HTML độc hại; câu đã xóa; tìm không thay dữ liệu; nội dung báo cáo đối chiếu fixture bằng số chính xác.

### Đợt F — Chia sẻ bộ qua link, QR khi vừa kích thước

Phase 7.2, làm sau các luồng học chính.

- Nút chia sẻ cạnh các thao tác bộ hiện có; chỉ xuất nội dung bộ được chọn, không gồm attempts, SRS hoặc backup cả kho.
- Dùng `questionsToCsv` rồi mã hóa UTF-8/base64 vào fragment `#import=...`.
- Payload sau encode phải nhỏ hơn 50 KB; kiểm tra trước decode và cả giới hạn parser sau decode. Bộ quá lớn: chỉ cho tải CSV và giải thích ngắn.
- Mở link chỉ parse/preview, không tự ghi dữ liệu. Có hộp xác nhận tên bộ, môn, số câu; người học bấm xác nhận mới import qua repository.
- Base64 sai, UTF-8 sai, nội dung trộn môn, quá số câu/độ dài hoặc header sai phải bị từ chối mà không đổi kho.
- Xử lý fragment sau chấp nhận/hủy để tải lại không nhập lặp. Chống hai thao tác nhập đồng thời.
- Link chứa cả nội dung câu hỏi/đáp án; nói rõ là link chia sẻ nội dung, không phải mã mời bí mật.
- QR chỉ là cách hiển thị cùng link khi payload đủ nhỏ theo khả năng encoder. Không gửi dữ liệu bài đến dịch vụ tạo QR bên ngoài, không giả mã QR bằng họa tiết.
- Dùng encoder cục bộ đã kiểm chứng hoặc thuật toán có test; nếu chưa làm QR an toàn thì bàn giao link hoạt động trước và ghi QR còn thiếu. Không thêm dependency trái quy tắc chung.

**Test tối thiểu:** round-trip câu tiếng Việt/tiếng Anh/ký hiệu khoa học, đáp án mảng/object, dữ liệu dài nhiều byte, ranh giới 50 KB, link sai/quá dài, xác nhận/hủy, tải lại không lặp, ID trùng tạo bộ mới, escape preview, bộ quá lớn tải file vẫn dùng được.

### Đợt G — Performance và chất lượng mã, Phase 8

Chỉ tối ưu sau khi chức năng đã có test và đo baseline.

- Tách header/footer ít thay đổi; chỉ cập nhật vùng cần thiết. Đừng làm mất focus, caret, IME, trạng thái details hoặc handler khi giảm render.
- Khi chấm bài có thể cập nhật question card/feedback thay vì toàn bộ root; khi lọc chỉ cập nhật vùng liên quan.
- Library search đã cập nhật riêng danh sách; không coi đây là tối ưu toàn app đã hoàn tất.
- Stats chỉ tính khi cần; lazy heatmap bằng IntersectionObserver nếu có lợi, có fallback. Cache thành tích theo revision/attempts và các dependency thật, không giữ số liệu cũ sau import/delete/restore.
- CSS đã có section; không bắt buộc tách nhiều file. Nếu tách thì cập nhật build, imports, versioning và precache cùng lúc.
- Error boundary phải bao cả đường render/header và tính stats có thể ném lỗi; cho phép người dùng vào Data lấy backup khi một view lỗi.
- Dùng fixture tổng hợp cục bộ để đo trước/sau trên cùng máy và dữ liệu; không đưa benchmark data lên site hoặc vào kho thật của người dùng.

**Đạt khi:** có số đo so sánh cùng điều kiện, không hồi quy focus/nháp/keyboard, giao diện không crash với dữ liệu trống/hỏng trong các ca đã test; không tự tuyên bố “nhanh hơn” chỉ vì code ít dòng hơn.

## 8. Checklist QA bắt buộc trước phát hành

### UI và thao tác

- [ ] 390, 760, 1050 px; light/dark/auto; reload giữ theme; zoom 200%; tiếng Việt và nội dung dài không tràn/che nút.
- [ ] Kho trống có hành động thêm CSV rõ; không tự nạp nội dung mẫu.
- [ ] Nhập CSV đủ bốn môn; file tiếng Anh cũ; file lỗi không nhập một phần.
- [ ] Chọn bộ, môn, lớp, level, topic; filter/sort/search giữ kết quả và không nhảy caret.
- [ ] Thử IME composition thật; phím H/L/S/D/? không cướp ký tự đang nhập.
- [ ] MCQ 1–9 rồi Enter chấm; Enter sau feedback qua câu; Enter trên summary/link hoạt động đúng.
- [ ] Ô nhập chữ, multiple select, matching, ordering, flashcard; Space và hai phím mũi tên không gây submit sai.
- [ ] Timer ẩn mặc định, hiện/ẩn đúng, không chạy interval khi không dùng; không tính thời gian giả.
- [ ] Esc lưu nháp, tiếp tục đúng câu; reload trước/sau chấm; hoàn thành rồi reload không lỗi session rỗng.
- [ ] Focus khi đổi trang/chấm/qua câu/kết quả, mở/đóng dialog, Tab/Shift+Tab.
- [ ] Kết quả đúng số liệu, nút sao chép thực sự có nội dung; không so sánh “lần trước” giả.
- [ ] Reduced motion; không animation lặp vô hạn; no-blur fallback; tương phản và nhãn đọc được.
- [ ] Kiểm tra console/network; chạy Lighthouse nếu môi trường cho phép và ghi kết quả thật.

### Dữ liệu

- [ ] 50 grammar/khoa học chia 30 + 20, câu sai không lặp ở lượt thường.
- [ ] Từ sai quay lại, SRS dùng key chung, first pass theo bộ độc lập.
- [ ] Submit lặp idempotent, hai tab không ghi đè bước học.
- [ ] Xóa bộ/khôi phục/quota/database blocked/JSON hỏng không làm mất dữ liệu âm thầm.
- [ ] Backup cũ vẫn nhập được; mọi field mới export/import không mất ý nghĩa.
- [ ] Chế độ ôn riêng/tùy chọn/trộn bộ có test hồi quy đúng các quy tắc ở mục 7.

### PWA và phát hành

- [ ] App shell cùng phiên bản, guide offline có URL khớp cache, không cache fixture/test.
- [ ] Tải online lần đầu, chờ cài cache; đóng/mở offline vẫn thấy kho đã có, làm/chấm/lưu được.
- [ ] Mất mạng/online lại không mất nháp và không che thao tác chính.
- [ ] Dựng hai bản A/B: tab A đang học vẫn dùng bundle A; B chỉ thông báo chờ, không ép reload; đóng các tab cũ rồi mở dùng B.
- [ ] Install/cache thất bại giữ bản đang hoạt động; cache miss/sai version không trộn mã; chỉ dọn cache đúng scope.
- [ ] Cache active mất/mất một phần có đường phục hồi an toàn khi online; không bị kẹt 503 vĩnh viễn và không bắt xóa dữ liệu học.
- [ ] Cache ứng dụng khác và IndexedDB được giữ; kiểm tra cả khi app phục vụ dưới sub-path.
- [ ] Install prompt chỉ hiện khi được hỗ trợ, thử trên thiết bị thật nếu có; không báo đã cài nếu người dùng hủy.
- [ ] Test/build từ đúng commit; GitHub Actions success; mở live kiểm tra hash/console và một luồng học cơ bản.

## 9. Cách báo cáo và bàn giao tiếp

Sau mỗi đợt, ghi ngắn gọn:

1. Đã sửa file nào và giải quyết việc gì.
2. Test đã chạy, số đạt/thất bại; build hash và số tệp.
3. Đã thử browser gì, kích thước nào, kịch bản nào; cái gì chưa thử được và vì sao.
4. Dữ liệu/schema/backup có đổi hay không và cách bảo vệ dữ liệu cũ.
5. Commit/deploy đã có hay chưa; nếu có, đường dẫn Actions và bản live đã xác minh.
6. Phần tiếp theo cụ thể, không ghi chung chung “hoàn thiện UI”.

Không đánh dấu xong toàn bộ frontend chỉ vì có glassmorphism hoặc test logic đều xanh. Ngược lại, không viết lại các phần đã có chỉ vì chưa có đủ ảnh chụp QA. Tiếp tục từ mã hiện tại, sửa đúng điểm thiếu và giữ quá trình học của học sinh.

## 10. Prompt ngắn để gửi model khác

```text
Hãy tiếp tục dự án NẮM Học tập có sẵn theo plan_continue.md này.
Project: C:\Users\DELL\Documents\Codex\2026-07-26\t-o\work\remote-live.
Đọc PLAN.md, FRONTEND_PLAN.md, git status và mã thực tế trước khi sửa.
Giữ GitHub Pages, vanilla JS, glassmorphism kem–cam đất, tiếng Việt có dấu,
CSV đa môn, dữ liệu cục bộ, bộ 50 câu học 30 + 20 và SRS hiện có.
Chốt QA/lỗi còn lại của Phase 0–6 trước, sau đó triển khai từng đợt Phase 7–8
theo mục 7. Viết test cho mọi thay đổi session/storage/backup, không reset
nguồn hoặc dữ liệu, không thêm server/framework/dịch vụ ngoài phạm vi.
Cập nhật PLAN.md bằng kết quả thật. Chỉ công bố đã lên web sau khi test,
build, rà soát và xác minh deploy GitHub Pages thành công.
```
