# PLAN — Frontend Build & Feature Roadmap cho NẮM Học tập

> **Mục đích file này**: Đây là bản kế hoạch chi tiết để một model AI khác (ví dụ Terra Max hoặc tương đương) **thực thi từng phần**. Mỗi mục có mô tả rõ file cần sửa, logic cần implement, và tiêu chí hoàn tất.

> **Nguyên tắc**: Giữ nguyên kiến trúc vanilla JS hiện tại (không framework). Giữ nguyên GitHub Pages, không thêm backend/server. Tất cả dữ liệu vẫn nằm trên trình duyệt.

> **Phong cách thiết kế**: **Glassmorphism / Liquid Glass** lấy cảm hứng từ giao diện Claude AI — nền ấm cream, card kính mờ frosted glass, accent terracotta/cam ấm, bo tròn mềm, whitespace rộng rãi.

---

## Phase 0 — Design System: Glassmorphism + Warm Palette

**Ưu tiên: THỰC HIỆN ĐẦU TIÊN** — Phase này tạo nền tảng visual cho toàn bộ các phase sau.

### 0.1 Triết lý thiết kế

Phong cách "Calm Glassmorphism" lấy từ Claude AI:
- **Nền ấm** thay vì trắng lạnh — cream/beige thay cho pure white
- **Card kính mờ** (frosted glass) — `backdrop-filter: blur()` + nền bán trong suốt
- **Mesh gradient background** — các blob màu nhạt mờ tạo chiều sâu phía sau glass
- **Accent terracotta** — cam ấm thay cho xanh lá hiện tại làm primary
- **Bo tròn mềm** — 16px thay vì 9px hiện tại
- **Whitespace rộng** — "cảm giác trang vở" thay vì "dashboard chật"
- **Không dopamine UI** — animation nhẹ, functional, không phô trương

### 0.2 Color Tokens — Light Mode

**File**: `styles.css` — **thay toàn bộ `:root`** hiện tại

```css
:root {
  color-scheme: light;

  /* === NỀN & BỀ MẶT === */
  --page: #F4F3EE;              /* Cream chính — nền trang */
  --paper: #FFFFFF;              /* Trắng — nền card solid */
  --surface: #FAF9F6;            /* Cream nhạt — surface phụ */
  --ink: #2D2926;                /* Gần-đen ấm — text chính */
  --muted: #8A857D;              /* Xám ấm — text phụ */
  --line: #E6E4DD;               /* Viền nhẹ */

  /* === GLASS TOKENS === */
  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-border: rgba(255, 255, 255, 0.7);
  --glass-shadow: 0 8px 32px rgba(45, 41, 38, 0.08);
  --glass-blur: 16px;
  --glass-bg-hover: rgba(255, 255, 255, 0.72);

  /* === ACCENT CHÍNH — Terracotta/Cam ấm === */
  --accent: #C15F3C;             /* Primary button, link */
  --accent-hover: #A84E30;       /* Primary hover */
  --accent-light: #F7EDE8;       /* Accent background nhạt */
  --accent-text: #FFFFFF;        /* Text trên accent */

  /* === MÀU PHỤ TRỢ === */
  --green: #5B8C6A;              /* Success, progress, grammar card */
  --green-light: #EAF2EB;        /* Green background nhạt */
  --green-glass: rgba(91, 140, 106, 0.08);
  --peach: #D4956B;              /* Vocabulary, SRS */
  --peach-light: #FDF5EF;        /* Peach background nhạt */
  --peach-glass: rgba(212, 149, 107, 0.08);
  --red: #C0564F;                /* Error, danger */
  --red-light: #FDF0ED;          /* Error background */

  /* === MESH GRADIENT (nền trang) === */
  --mesh-1: rgba(212, 149, 107, 0.15);   /* Blob peach */
  --mesh-2: rgba(91, 140, 106, 0.12);    /* Blob xanh lá */
  --mesh-3: rgba(193, 95, 60, 0.08);     /* Blob terracotta */

  /* === TYPOGRAPHY === */
  --font: 'Inter', 'Segoe UI', 'Noto Sans', system-ui, sans-serif;
  --radius: 16px;                /* Bo tròn tiêu chuẩn */
  --radius-sm: 10px;             /* Bo tròn nhỏ */
  --radius-lg: 24px;             /* Bo tròn lớn */

  /* === MISC === */
  --selection: rgba(193, 95, 60, 0.15);
  --focus-ring: rgba(193, 95, 60, 0.4);
  --shadow-sm: 0 2px 8px rgba(45, 41, 38, 0.06);
  --shadow-md: 0 8px 32px rgba(45, 41, 38, 0.1);
  --shadow-lg: 0 20px 60px rgba(45, 41, 38, 0.12);

  font-family: var(--font);
  font-size: 18px; line-height: 1.55; font-weight: 400;
  color: var(--ink); background: var(--page);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
```

### 0.3 Color Tokens — Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --page: #131A16;
    --paper: #1C2520;
    --surface: #212B26;
    --ink: #E5EBE3;
    --muted: #8A9488;
    --line: #2E3B34;

    --glass-bg: rgba(30, 40, 35, 0.65);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    --glass-bg-hover: rgba(35, 48, 40, 0.8);

    --accent: #D4795A;
    --accent-hover: #E08B6A;
    --accent-light: #2A2320;
    --accent-text: #FFFFFF;

    --green: #6DAB7E;
    --green-light: #1A2E20;
    --green-glass: rgba(109, 171, 126, 0.1);
    --peach: #C8916E;
    --peach-light: #2A2118;
    --peach-glass: rgba(200, 145, 110, 0.1);
    --red: #D06660;
    --red-light: #2A1D1C;

    --mesh-1: rgba(200, 145, 110, 0.08);
    --mesh-2: rgba(109, 171, 126, 0.06);
    --mesh-3: rgba(210, 121, 90, 0.05);

    --selection: rgba(212, 121, 90, 0.2);
    --focus-ring: rgba(212, 121, 90, 0.4);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
    --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.4);
  }
}

/* Ép theme bằng attribute */
[data-theme="dark"] {
  /* copy y hệt block trên */
}
[data-theme="light"] {
  /* copy y hệt light `:root` */
}
```

### 0.4 Glass Mixins (CSS classes tái sử dụng)

```css
/* --- GLASS CARD --- */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  box-shadow: var(--glass-shadow);
  transition: background .2s, box-shadow .2s, transform .2s;
}
.glass:hover {
  background: var(--glass-bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* --- GLASS SUBTLE (ít nổi hơn, cho container) --- */
.glass-subtle {
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
}

/* --- GLASS HEADER (fixed, blur content phía dưới) --- */
.header {
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border-bottom: 1px solid var(--glass-border);
}

/* --- MESH GRADIENT BACKGROUND --- */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(ellipse 60% 50% at 15% 20%, var(--mesh-1), transparent),
    radial-gradient(ellipse 50% 60% at 80% 70%, var(--mesh-2), transparent),
    radial-gradient(ellipse 40% 40% at 50% 90%, var(--mesh-3), transparent),
    var(--page);
  pointer-events: none;
}
```

### 0.5 Áp dụng Glass vào components hiện tại

Thay đổi cần thực hiện trong `styles.css`:

| Component hiện tại | Class/selector | Thay đổi |
|---|---|---|
| Header | `.header` | `background: white` → glass header (blur + bán trong suốt) |
| Card bộ bài | `.set-card` | Thêm class `.glass`, bỏ `background: white` |
| Card mode | `.mode-card` | Dùng `.glass` + tint green/peach |
| Mode card Grammar | `.mode-card.grammar` | `background: var(--green-glass)` thay `var(--sage)` |
| Mode card Vocab | `.mode-card.vocabulary` | `background: var(--peach-glass)` thay `var(--peach)` |
| Question card | `.question-card` | Thêm `.glass` |
| Dialog | `dialog` | Dùng glass bg + blur |
| Empty card | `.empty-card` | Dùng `.glass` |
| Data panel | `.data-panel` | Dùng `.glass` |
| Set focus | `.set-focus` | Dùng `.glass-subtle` |
| Resume banner | `.resume-banner` | Dùng `.glass-subtle` + tint green |
| Toast | `.notice` | Glass dark: `rgba(45,41,38,.85)` + blur |
| Feedback success | `.feedback.success` | `var(--green-light)` + glass border |
| Feedback wrong | `.feedback.wrong` | `var(--accent-light)` + glass border |
| Result page stats | `.result-stats` | Dùng `.glass` |
| MCQ choices | `.choice` | Glass nhẹ, hover nổi bật hơn |
| Upload area | `.upload-area` | Glass dashed border |
| Buttons primary | `.button.primary` | `var(--accent)`, bỏ `var(--green)` |
| Buttons subtle | `.button.subtle` | Glass background |
| All `border-radius: 9px` | Nhiều selector | → `var(--radius-sm)` hoặc `var(--radius)` |
| All `border-radius: 14px` | Nhiều selector | → `var(--radius)` |
| All `border-radius: 18px` | `.empty-card` | → `var(--radius-lg)` |
| Brand symbol | `.brand-symbol` | `var(--accent)` thay `var(--green)` |
| Nav active | `.nav-link.active` | `var(--accent-light)` + `color: var(--accent)` |
| `.eyebrow` | `.eyebrow` | `color: var(--accent)` thay `var(--green)` |
| Progress track fill | `.progress-track > span` | `var(--green)` giữ nguyên hoặc dùng accent |
| Pill badge | `.pill` | Glass nhẹ |
| Focus ring | `:focus-visible` | `outline: 3px solid var(--focus-ring)` |
| Selection | `::selection` | `background: var(--selection)` |

### 0.6 Thay đổi trong `app.js`

**Buttons**: Thay tham chiếu nào đang dùng `class="button primary"` — giữ nguyên class name, chỉ CSS thay đổi.

**Header**: Header đã render bằng JS, thêm logic cho theme toggle (xem Phase 2 bên dưới).

**Các card mới (stats)**: Khi tạo HTML string cho glass card, dùng:
```js
`<div class="glass">...</div>`
```

### 0.7 Fallback cho trình duyệt không hỗ trợ backdrop-filter

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass, .glass-subtle, .header {
    background: var(--paper);
    opacity: .97;
  }
}
```

### 0.8 Sửa toàn bộ hardcoded colors

Quét `styles.css` và thay **mọi giá trị màu hardcode** bằng CSS variable. Không được để lại bất kỳ hex/rgb nào ngoài các variable definition trong `:root`. Danh sách cần rà:

- `background: white` → `var(--paper)`
- `background: rgba(255,255,255,.94)` → glass bg
- `color: #202d28` → `var(--ink)`
- `color: #626d66` → `var(--muted)`
- `#315d48` (green cũ) → `var(--green)` hoặc `var(--accent)`
- `#244a38` → `var(--accent-hover)` nếu dùng cho primary
- `#9a553a` (rust cũ) → `var(--peach)`
- `#a13732` (red cũ) → `var(--red)`
- `#dde3da` → `var(--line)`
- `#eaf0e5` (sage cũ) → `var(--green-light)`
- `#f7eee5` (peach bg cũ) → `var(--peach-light)`
- Tất cả shadow values → `var(--shadow-sm/md/lg)` hoặc `var(--glass-shadow)`
- Mọi giá trị `#xxx` trong media queries responsive → dùng biến

### Tiêu chí hoàn tất Phase 0
- [ ] `:root` chỉ chứa CSS variables, không còn hardcode màu ở selector nào
- [ ] Glass effect hoạt động: card có backdrop-blur nhìn xuyên qua mesh gradient
- [ ] Mesh gradient background hiện ở body, tạo chiều sâu
- [ ] Dark mode tự động theo OS, hoặc ép bằng `data-theme`
- [ ] Fallback cho trình duyệt cũ (không blur nhưng vẫn đọc được)
- [ ] Accent terracotta thay thế green ở buttons, brand, eyebrow
- [ ] Bo tròn 16px đồng nhất
- [ ] `npm test` + `npm run build` đạt
- [ ] Responsive vẫn đúng trên 390px, 760px, 1050px

---

## Tóm tắt hiện trạng

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Backend logic (core.js, storage.js) | ✅ Hoàn tất | 4 môn, CSV 18 cột, SRS, session, chấm bài |
| Stats & gamification (stats.js) | ✅ Logic sẵn | Streaks, XP, achievements, heatmap, accuracy — **chưa hiển thị trên UI** |
| Giao diện (app.js + styles.css) | ⚠️ Tối thiểu | Chức năng chạy được nhưng chưa có trang thống kê, dark mode, animation |
| Build (scripts/build.mjs) | ✅ | Copy + version hash, không dùng bundler |
| Tests | ✅ 64/64 | Node.js `--test`, fake-indexeddb |
| PWA | ⚠️ Tối thiểu | Có manifest + SW nhưng SW chỉ unregister cũ, chưa cache offline |

### Cấu trúc file hiện tại

```
index.html          ← Entry point, 33 dòng, gần như trống (SPA render bằng JS)
app.js (520 dòng)   ← Toàn bộ UI: render HTML string, event delegation, state
core.js (671 dòng)  ← CSV parser, chấm bài, chọn câu, SRS algorithm
storage.js (532)    ← IndexedDB + localStorage, repository pattern
stats.js (508)      ← Streak, XP, achievement, heatmap, topic mastery — CHƯA dùng
speech.js (85)      ← Web Speech API cho câu tiếng Anh
styles.css (232)    ← Responsive, light theme duy nhất, hệ thống biến CSS
scripts/build.mjs   ← Build script: copy + hash version
scripts/dev.mjs     ← Dev server
```

### Các hàm stats.js đã viết nhưng chưa có UI

- `computeStreaks()` → chuỗi ngày học, hôm nay đã học chưa
- `dailyActivity()` → biểu đồ hoạt động 14 ngày
- `heatmapWeeks()` → lưới heatmap kiểu GitHub (17 tuần)
- `heatmapLevel()` → mức 0-4 cho ô heatmap
- `xpFromAttempts()`, `levelInfo()`, `levelCost()` → hệ thống XP/level
- `accuracyByDomain()` → độ chính xác theo grammar/vocabulary/practice
- `topicMastery()` → coverage + accuracy theo topic
- `dueForecast()` → dự báo từ đến hạn ôn 7 ngày
- `lastAttemptByQuestion()`, `mistakeQuestions()` → câu sai gần nhất
- `buildAchievements()` → 14 huy hiệu (streak, correct, marathon, v.v.)
- `parseLearningKey()` → tách word/pos/sense từ learning key
- `formatDuration()`, `formatRelativeTime()` → format thời gian tiếng Việt

---

## Phase 1 — Trang Thống kê (Stats Dashboard)

**Ưu tiên: CAO** · Mọi logic đã có trong `stats.js`, chỉ cần nối UI.

### 1.1 Thêm view "stats" vào navigation

**File**: `app.js`

- Thêm `"stats"` vào mảng navigation trong hàm `header()` (dòng ~125):
  ```js
  [["home", "Luyện tập"], ["library", "Bộ bài"], ["stats", "Thống kê"], ["data", "Dữ liệu"]]
  ```
- Thêm route trong `render()` (dòng ~290):
  ```js
  state.view === "stats" ? statsMarkup() : ...
  ```
- Import các hàm cần thiết từ stats.js ở đầu app.js:
  ```js
  import { computeStreaks, dailyActivity, heatmapWeeks, heatmapLevel, xpFromAttempts, levelInfo, accuracyByDomain, topicMastery, dueForecast, buildAchievements, mistakeQuestions, collectVocabularyKeys, formatRelativeTime } from "./stats.js";
  ```

### 1.2 Hàm `statsMarkup()` — Layout trang thống kê

**File**: `app.js`

Tạo hàm mới `statsMarkup()` gồm các section sau, mỗi section là một card:

#### A. Overview bar (XP + Level + Streak)
```
Dữ liệu đầu vào:
  const attempts = state.data.attempts;
  const xp = xpFromAttempts(attempts);
  const level = levelInfo(xp);
  const streaks = computeStreaks(attempts);
```
- Hiển thị: Level badge, XP progress bar, chuỗi ngày hiện tại, tổng câu đã làm
- Dùng class `.stats-overview` với CSS grid 4 cột trên desktop, 2 cột trên mobile

#### B. Biểu đồ hoạt động 14 ngày (Daily Activity)
```
Dữ liệu: dailyActivity(attempts, 14)
```
- Render bar chart bằng HTML div (không cần thư viện):
  - Mỗi ngày là 1 cột `<div>`, chiều cao tỉ lệ với `count`
  - Hover tooltip hiện ngày + số câu + số đúng
  - Màu split: phần đúng là xanh `--green`, phần sai là nhạt hơn
  - Label trục X: dùng field `label` (dd/mm)
- Container class `.activity-chart`, max-height 200px

#### C. Heatmap kiểu GitHub (17 tuần)
```
Dữ liệu: heatmapWeeks(attempts, 17)
```
- Render grid 7 hàng × 17 cột bằng CSS grid
- Mỗi ô `<div>` có class `heat-0` đến `heat-4`, ô tương lai class `heat-future`
- CSS cho 5 mức: `heat-0: var(--page)`, `heat-1: #d0e8c5`, `heat-2: #8bbe7a`, `heat-3: #4a9b3f`, `heat-4: #2d6a20`
- Label ngày trong tuần bên trái: T2, T3... CN
- Label tháng bên trên khi `monthStart === true`
- Tooltip mỗi ô: "dd/mm: X câu"
- Responsive: ẩn bớt tuần cũ trên mobile (chỉ hiện 10 tuần)

#### D. Accuracy by Domain (Độ chính xác theo loại)
```
Dữ liệu: accuracyByDomain(state.data.snapshot.questions, attempts)
```
- 3 card nhỏ: Grammar, Vocabulary, Practice
- Mỗi card: biểu đồ tròn CSS (dùng `conic-gradient`) + số % + tổng câu
- Nếu chưa có dữ liệu (total === 0): hiện "Chưa có dữ liệu"

#### E. Topic Mastery (Tiến độ theo chủ điểm)
```
Dữ liệu: topicMastery(state.data.snapshot.questions, attempts)
```
- Bảng hoặc danh sách, mỗi hàng: tên topic, domain badge, coverage bar, accuracy %
- Sắp xếp theo `attempted` giảm dần (mặc định)
- Giới hạn hiện 10 topic, có nút "Xem thêm" để mở rộng
- Nếu trống: "Làm bài để thấy tiến độ theo chủ điểm."

#### F. Dự báo ôn từ vựng (Due Forecast)
```
Dữ liệu: dueForecast(reviews, collectVocabularyKeys(questions), 7)
```
- Bar chart nhỏ 7 cột, mỗi cột là 1 ngày
- Label: "Hôm nay", "+1", "+2"... "+6"
- Chỉ hiện khi có từ vựng (reviews.length > 0)

#### G. Achievements (Huy hiệu)
```
Dữ liệu: buildAchievements({ attempts, imports, reviews, questions })
```
- Grid 3-4 cột, mỗi achievement là 1 card:
  - Icon emoji lớn
  - Tên + mô tả
  - Progress bar nếu chưa unlocked (value/target)
  - Hiệu ứng sáng/đổ bóng nếu đã unlocked
- Unlocked xếp trước, chưa unlocked xếp sau (mờ hơn)

#### H. Câu sai gần nhất (Mistakes Review)
```
Dữ liệu: mistakeQuestions(questions, attempts).slice(0, 5)
```
- Danh sách 5 câu sai gần nhất
- Mỗi câu: prompt, đáp án đúng, domain badge
- Nút "Xem tất cả" nếu có nhiều hơn 5

### 1.3 CSS cho trang Stats

**File**: `styles.css`

Thêm các class mới (cuối file, trước media queries):

- `.stats-overview` — grid summary bar
- `.activity-chart` — daily activity container
- `.activity-bar` — từng cột bar chart
- `.heatmap` — grid container
- `.heat-cell`, `.heat-0` đến `.heat-4`, `.heat-future` — các ô
- `.domain-accuracy` — grid 3 card
- `.accuracy-ring` — conic-gradient donut
- `.mastery-list`, `.mastery-row` — topic mastery table
- `.forecast-chart` — due forecast bars
- `.achievements-grid`, `.achievement-card`, `.achievement-locked` — huy hiệu
- `.mistakes-list` — danh sách câu sai

Responsive:
- ≤ 760px: Stats overview 2 cột, achievement grid 2 cột, heatmap chỉ 10 tuần
- ≤ 480px: Stats overview 1 cột, achievement grid 1 cột hoặc horizontal scroll

### Tiêu chí hoàn tất Phase 1
- [ ] Trang Stats hiện đúng dữ liệu từ `stats.js`
- [ ] Tất cả biểu đồ render bằng HTML/CSS thuần, không thêm thư viện
- [ ] Responsive trên 390px, 760px, 1050px
- [ ] Không import thêm thư viện mới
- [ ] `npm test` vẫn đạt tất cả
- [ ] `npm run build` đạt, dist chứa đúng file

---

## Phase 2 — Dark Mode

**Ưu tiên: CAO**

### 2.1 CSS custom properties cho dark theme

**File**: `styles.css`

Thêm media query và class override ở đầu file (sau `:root` hiện tại):

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --page: #131a16; --paper: #1c2520; --ink: #e5ebe3;
    --muted: #98a49a; --line: #2e3b34; --green: #5daa7e;
    --green-dark: #4a9169; --sage: #1e2e24; --rust: #c8826a;
    --peach: #2a2320; --red: #d05f59;
  }
}
[data-theme="dark"] {
  color-scheme: dark;
  --page: #131a16; --paper: #1c2520; --ink: #e5ebe3;
  --muted: #98a49a; --line: #2e3b34; --green: #5daa7e;
  --green-dark: #4a9169; --sage: #1e2e24; --rust: #c8826a;
  --peach: #2a2320; --red: #d05f59;
}
```

### 2.2 Cần sửa các selector dùng màu hardcode

**File**: `styles.css`

Quét toàn bộ file tìm các giá trị màu hardcode (ví dụ `background: white`, `background: #f5f7f1`, `color: #626d66`) và thay bằng CSS variable tương ứng. Danh sách cần xử lý:

- `background: white` → `background: var(--paper)`
- `background: rgba(255,255,255,.94)` (header) → `background: rgba(var(--paper-rgb), .94)` — cần thêm biến `--paper-rgb`
- `#f5f7f1`, `#f6f8f3`, `#f4f5f1`, `#f0f3ed`, `#f0f3eb`, `#e8ece5` → `var(--page)` hoặc tạo biến `--surface`
- `#576a59`, `#738a74`, `#637561`, `#826551`, `#774731` → dùng `var(--muted)` hoặc tạo thêm biến
- `box-shadow: 0 6px 20px #20382a16` → cần biến `--shadow`
- `::selection { background: #dcebd9 }` → biến `--selection`
- `.notice` background hardcode → biến
- `.feedback.success`, `.feedback.wrong` background → biến
- `.choice.correct`, `.choice.incorrect` — biến
- `dialog::backdrop` — biến

**Lưu ý**: Tạo thêm các CSS variables cần thiết ở cả 2 nơi (light trong `:root` và dark trong `[data-theme="dark"]` + media query).

### 2.3 Theme toggle trong header

**File**: `app.js`

- Thêm icon `theme` vào object `icons`:
  ```js
  theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.73 12.73 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
  ```
- Thêm nút toggle theme trong `header()`, bên cạnh nút import:
  ```js
  button(icon("theme"), "toggle-theme", "icon-button", 'aria-label="Đổi giao diện sáng/tối"')
  ```
- Xử lý action `toggle-theme`:
  - Đọc theme hiện tại từ `document.documentElement.dataset.theme` hoặc `localStorage.getItem("nam-theme")`
  - Cycle: auto → light → dark → auto
  - Set `data-theme` trên `<html>` và lưu vào `localStorage`
  - Toast thông báo: "Giao diện: Tự động / Sáng / Tối"

### 2.4 Lưu preference

- Khi khởi động (`start()`): đọc `localStorage.getItem("nam-theme")` và set `document.documentElement.dataset.theme` nếu có
- Không lưu vào IndexedDB (theme là preference cá nhân máy, không cần backup)

### Tiêu chí hoàn tất Phase 2
- [ ] Tự động theo `prefers-color-scheme` khi chưa chọn
- [ ] Người dùng có thể ép light/dark bằng nút toggle
- [ ] Mọi element đều đổi màu đúng, không có chữ/nền hardcode
- [ ] Dialog, toast, feedback đều đổi theme
- [ ] Preference lưu qua reload
- [ ] Không ảnh hưởng test (test không dùng DOM)

---

## Phase 3 — Micro-interactions & Animations

**Ưu tiên: TRUNG BÌNH**

### 3.1 CSS transitions cho navigation và state changes

**File**: `styles.css`

```css
/* Trang chuyển: fade-in nội dung khi render */
.main { animation: fadeIn .2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } }

/* Card hover lift */
.set-card, .mode-card, .achievement-card {
  transition: transform .15s, box-shadow .15s;
}
.set-card:hover, .mode-card:hover, .achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,.08);
}

/* Progress bar animated fill */
.progress-track > span { transition: width .4s ease-out; }

/* Feedback slide-in */
.feedback { animation: slideUp .25s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } }

/* Toast notification */
.notice.visible { animation: toastIn .2s ease-out; }
@keyframes toastIn { from { opacity: 0; transform: translate(-50%, 15px); } }

/* Achievement unlock glow */
.achievement-card.unlocked { animation: glowPulse .6s ease-out; }
@keyframes glowPulse {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 20px rgba(93,170,126,.35); }
}
```

### 3.2 Correct/Incorrect feedback animation

**File**: `styles.css` + `app.js`

- Khi chấm đúng: thêm class `correct-flash` vào `.question-card` → viền xanh nhấp nháy nhẹ
- Khi chấm sai: thêm class `wrong-shake` → rung nhẹ (translateX ±3px)
- Xóa class sau 600ms bằng `setTimeout`

### 3.3 Skeleton loading

**File**: `styles.css` + `app.js`

- Tạo class `.skeleton` với animation shimmer:
  ```css
  .skeleton {
    background: linear-gradient(90deg, var(--line) 25%, var(--page) 50%, var(--line) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  ```
- Dùng khi `state.busy === true` ở các vị trí loading (import CSV, chấm bài)

### 3.4 Tôn trọng `prefers-reduced-motion`

Đã có rule cuối file: `@media (prefers-reduced-motion: reduce) { * { animation: none !important; ... } }` — giữ nguyên, không cần sửa.

### Tiêu chí hoàn tất Phase 3
- [ ] Navigation chuyển trang có fade nhẹ
- [ ] Card hover có lift effect
- [ ] Feedback correct/wrong có animation
- [ ] Skeleton khi loading
- [ ] `prefers-reduced-motion` tắt mọi animation
- [ ] Không có animation chạy liên tục gây tốn pin

---

## Phase 4 — UI Polish & UX Improvements

**Ưu tiên: TRUNG BÌNH**

### 4.1 Cải thiện trang Home khi đã có bộ bài

**File**: `app.js` hàm `homeMarkup()`

- Thêm mini-streak badge (🔥 3 ngày) bên cạnh date note nếu `streaks.current > 0`
- Thêm XP bar nhỏ dưới header (chỉ hiện trên home): "Level 5 · 320/350 XP"
- Thêm hàng "Gợi ý hôm nay" nếu có từ vựng đến hạn ôn:
  ```
  📋 Bạn có 12 từ đến hạn ôn. [Ôn ngay →]
  ```

### 4.2 Cải thiện trang Library

**File**: `app.js` hàm `libraryMarkup()`

- Thêm sort: sắp xếp theo tên / ngày nhập / tiến độ
- Thêm filter theo môn (dropdown như trang home)
- Set card hiện thêm: ngày học gần nhất (từ attempts), subject badge màu

### 4.3 Cải thiện Study view

**File**: `app.js` hàm `sessionMarkup()`

- Thêm số thứ tự câu: "Câu 3/30"
- Thêm timer tùy chọn: hiện thời gian đã học (tính từ lúc bắt đầu session)
- Cải thiện sidebar trên mobile: hiện theory trong expandable panel dưới câu hỏi

### 4.4 Cải thiện Result page

**File**: `app.js` hàm `resultMarkup()`

- Thêm accuracy breakdown: "Grammar: 8/10 · Vocab: 4/5"
- Thêm comparison với lượt trước (nếu có): "Tốt hơn lượt trước 10%"
- Thêm icon animation cho kết quả (confetti nhẹ khi > 80% đúng bằng CSS pseudo-elements)
- Share result: nút copy text kết quả dạng "NẮM · Grammar 8/10 · 90% · 5 phút"

### 4.5 Empty states có illustration

**File**: `app.js` + `styles.css`

- Trang stats trống: hiện illustration + "Bắt đầu học để thấy thống kê"
- Library trống (đã có): giữ nguyên
- Data page: cải thiện mô tả

### Tiêu chí hoàn tất Phase 4
- [ ] Streak badge hiện trên home
- [ ] Library có sort/filter
- [ ] Study view có số thứ tự câu
- [ ] Result page có breakdown + share
- [ ] Empty states thân thiện

---

## Phase 5 — Keyboard Shortcuts & Accessibility

**Ưu tiên: TRUNG BÌNH-CAO**

### 5.1 Keyboard shortcuts panel

**File**: `app.js`

Đã có:
- `Enter` để chấm hoặc next
- `1-9` để chọn đáp án MCQ

Thêm:
- `Escape` trong study → pause (lưu draft, về home)
- `H` → home, `L` → library, `S` → stats, `D` → data (khi không focus input)
- `?` → hiện modal danh sách shortcuts
- `Space` trong flashcard → flip
- `←` `→` trong flashcard → "Chưa nhớ" / "Đã nhớ"

### 5.2 ARIA improvements

**File**: `app.js`

- Thêm `aria-label` cho các biểu đồ stats
- Thêm `role="tablist"` cho nav
- Đảm bảo mọi interactive element có `aria-label` hoặc visible text
- Screen reader announcement khi chấm xong: sử dụng `aria-live="assertive"` region

### 5.3 Focus management

- Khi chuyển view: focus vào heading chính (`h1`)
- Khi chấm xong: focus vào feedback region
- Khi mở modal: focus vào nút đóng hoặc nội dung đầu tiên
- Focus trap trong modal (đã có dialog element, nhưng kiểm tra lại)

### Tiêu chí hoàn tất Phase 5
- [ ] Mọi tương tác đều dùng được bằng keyboard
- [ ] `?` hiện bảng phím tắt
- [ ] Tab order hợp lý trong study view
- [ ] ARIA labels đầy đủ
- [ ] Chạy Lighthouse Accessibility ≥ 95

---

## Phase 6 — Offline PWA

**Ưu tiên: THẤP-TRUNG BÌNH**

### 6.1 Service Worker caching

**File**: `sw.js` (viết lại)

Hiện tại SW chỉ unregister bản cũ. Chuyển sang precache strategy:

```js
const CACHE_NAME = "nam-v__VERSION__";  // __VERSION__ replaced by build
const ASSETS = [
  "./", "./index.html", "./styles.css", "./app.js",
  "./core.js", "./storage.js", "./stats.js", "./speech.js",
  "./favicon.svg", "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});
```

### 6.2 Build script update

**File**: `scripts/build.mjs`

- Inject `version` vào SW khi build (thay placeholder `__VERSION__`)
- SW cũng cần version hash

### 6.3 Offline indicator

**File**: `app.js` + `styles.css`

- Listen `online`/`offline` events
- Hiện banner nhỏ "Bạn đang offline. Dữ liệu đã lưu vẫn dùng được." khi mất mạng

### 6.4 Manifest cải thiện

**File**: `manifest.webmanifest`

- Thêm `screenshots` cho install prompt
- Thêm `shortcuts` cho quick actions
- Kiểm tra `start_url`, `scope`, `display` đúng cho GitHub Pages sub-path

### Tiêu chí hoàn tất Phase 6
- [ ] App hoạt động offline sau lần tải đầu
- [ ] SW cache đúng version, tự xóa cache cũ
- [ ] Offline banner hiện khi mất mạng
- [ ] Install prompt hoạt động trên mobile
- [ ] Build tự inject version vào SW

---

## Phase 7 — Tính năng mới

**Ưu tiên: THẤP** (sau khi hoàn tất Phase 1-5)

### 7.1 Chế độ ôn lại câu sai (Mistake Review Mode)

**File**: `app.js` + `storage.js`

- Thêm nút "Ôn lại câu sai" trên trang Home hoặc Stats
- Tạo session đặc biệt chỉ gồm các câu sai gần nhất (`mistakeQuestions()`)
- Giới hạn 20 câu/lượt, lấy từ tất cả bộ bài
- Logic chấm giống session thường, nhưng không thay đổi practice progress
- Lưu kết quả vào attempts như bình thường

### 7.2 Chia sẻ bộ bài qua link/QR

**File**: `app.js`

- Nút "Chia sẻ bộ bài" trong set menu (bên cạnh Đổi tên, Tải CSV, Xóa)
- Export bộ bài thành CSV → encode base64 → tạo URL fragment:
  `https://dangkhue1301.github.io/nam-english/#import=<base64>`
- Giới hạn: chỉ với bộ bài nhỏ (< 50KB sau encode). Bộ lớn: tải CSV thay vì link
- Thêm QR code render bằng thuật toán nhẹ (hoặc dùng Canvas API) cho URL đó
- Khi mở website với hash `#import=...`: tự parse và hiện dialog confirm nhập

**Lưu ý**: Bộ bài lớn sẽ vượt quá giới hạn URL. Cần validate kích thước trước khi tạo link. Nếu quá lớn, chỉ hiện nút "Tải CSV" và "Gửi file cho bạn bè".

### 7.3 Tìm kiếm câu hỏi (Cross-set search)

**File**: `app.js`

- Thanh tìm kiếm trên trang Library hoặc Stats
- Tìm theo prompt, context, answer, topic
- Hiện kết quả kèm tên bộ bài, domain badge
- Click vào kết quả → chọn bộ bài đó

### 7.4 Custom study session

**File**: `app.js` + `storage.js`

- Cho phép chọn số câu (10/20/30) trước khi bắt đầu
- Cho phép chọn loại bài (MCQ, fill blank...) nếu bộ bài có nhiều loại
- Cho phép trộn câu từ nhiều bộ bài (cross-set session)

### 7.5 Xuất báo cáo cho giáo viên

**File**: `stats.js` + `app.js`

- Nút "Xuất báo cáo" trên trang Data
- Tạo file text/markdown hoặc CSV tổng hợp:
  - Tổng câu đã làm, đúng/sai, accuracy %
  - Breakdown theo môn, topic
  - Chuỗi ngày học
  - Danh sách câu sai
- Giáo viên có thể yêu cầu học sinh gửi file này

### Tiêu chí hoàn tất Phase 7
- [ ] Ôn câu sai hoạt động
- [ ] Share link hoạt động với bộ nhỏ
- [ ] Tìm kiếm câu hỏi hoạt động
- [ ] Custom session hoạt động
- [ ] Xuất báo cáo tạo file đúng

---

## Phase 8 — Performance & Code Quality

**Ưu tiên: THẤP** (chạy song song hoặc sau cùng)

### 8.1 Giảm full re-render

**File**: `app.js`

Hiện tại `render()` set `innerHTML` toàn bộ `#app`. Cải thiện:

- Tách các vùng ít thay đổi: header, footer
- Chỉ re-render vùng content khi chuyển view
- Khi chấm bài: chỉ thay nội dung `.question-card` thay vì toàn trang
- Khi thay đổi filter: chỉ thay `.mode-grid`

### 8.2 Lazy render

- Stats page: chỉ tính toán khi user vào trang stats (đã đúng nếu dùng hàm)
- Heatmap: chỉ render khi visible (IntersectionObserver)
- Achievements: cache kết quả `buildAchievements()` và chỉ tính lại khi attempts thay đổi

### 8.3 CSS cleanup

**File**: `styles.css`

- Tách thành nhiều file nếu quá dài (hiện 232 dòng nhưng rất dày, minified):
  - `base.css` — reset, variables, typography
  - `layout.css` — header, footer, main, grid
  - `components.css` — buttons, cards, modals, forms
  - `views.css` — study, stats, library
- Hoặc giữ 1 file nhưng thêm comment sections rõ ràng
- Nếu tách file → cập nhật `index.html` thêm `<link>` và `scripts/build.mjs` thêm vào mảng `files`

### 8.4 Error boundaries

**File**: `app.js`

- Bọc `render()` trong try-catch, hiện thông báo thân thiện nếu crash
- Bọc stats calculations trong try-catch (data corruption có thể gây lỗi)

### Tiêu chí hoàn tất Phase 8
- [ ] Re-render nhanh hơn (có thể đo bằng console.time)
- [ ] Không lỗi khi data corrupted
- [ ] CSS có structure rõ ràng

---

## Quy tắc chung cho người thực thi

1. **Không thêm framework** — giữ vanilla JS, HTML string rendering
2. **Không thêm thư viện** — biểu đồ, animation đều bằng HTML/CSS
3. **Giữ nguyên GitHub Pages** — tất cả tĩnh, không backend
4. **Không sửa core.js, storage.js** (trừ khi Phase 7 yêu cầu) — logic đã ổn, chỉ nối UI
5. **Test phải đạt** — chạy `npm test` sau mỗi thay đổi
6. **Build phải đạt** — chạy `npm run build`, kiểm tra dist/
7. **Responsive bắt buộc** — kiểm tra 390px, 760px, 1050px
8. **Tiếng Việt có dấu** — mọi label, text, toast
9. **`prefers-reduced-motion`** — tôn trọng, đã có rule sẵn
10. **Commit message** — tiếng Việt, mô tả rõ thay đổi

---

## Thứ tự thực hiện đề xuất

```
Phase 0 (Design System)        ← BẮT BUỘC ĐẦU TIÊN — nền tảng visual
    ↓
Phase 1 (Stats Dashboard)     ← Giá trị cao nhất, dùng glass cards
    ↓
Phase 2 (Dark Mode toggle)    ← Theme toggle UI (tokens đã có từ Phase 0)
    ↓
Phase 3 (Animations)           ← Polish sau khi có đủ UI
    ↓
Phase 5 (Accessibility)        ← Quan trọng, song song với Phase 3-4
    ↓
Phase 4 (UX Improvements)      ← Fine-tune
    ↓
Phase 6 (Offline PWA)          ← Nice-to-have
    ↓
Phase 7 (New Features)         ← Mở rộng
    ↓
Phase 8 (Performance)          ← Optimize cuối cùng
```

---

## Tham chiếu file

| File | Dòng quan trọng | Vai trò |
|---|---|---|
| `app.js` L1-4 | Import declarations | Thêm import từ stats.js ở đây |
| `app.js` L9 | State object | Thêm state cho stats view |
| `app.js` L125 | `header()` | Thêm nav link "Thống kê" |
| `app.js` L289-290 | `render()` | Thêm route cho stats view |
| `app.js` L350-431 | `action()` | Thêm handler cho actions mới |
| `app.js` L483-496 | Keyboard handler | Thêm phím tắt mới |
| `app.js` L506-518 | `start()` | Thêm theme init ở đây |
| `styles.css` L2-11 | `:root` variables | Thêm dark theme variables |
| `styles.css` L195-231 | Media queries | Thêm responsive cho stats |
| `stats.js` (toàn bộ) | Logic sẵn | Chỉ import, không sửa |
| `sw.js` | Service worker | Viết lại cho Phase 6 |
| `scripts/build.mjs` L15-27 | File list | Thêm file mới nếu tách CSS |
