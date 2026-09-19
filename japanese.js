/**
 * Japanese (ja-v1) Core Engine & Contract
 *
 * Implements pure constants, parser, validator, serializer, ruby renderer,
 * and grading engine according to JAPANESE_PLAN.md and JAPANESE_CSV_GUIDE.md.
 */

export const JA_SCHEMA = "ja-v1";
export const JA_SUBJECT = "japanese";

export const JA_CSV_HEADERS = [
  "schema",
  "subject",
  "id",
  "level",
  "chapter",
  "lesson",
  "section",
  "topic",
  "type",
  "prompt",
  "context",
  "target",
  "options",
  "answer",
  "accepted_orders",
  "star_position",
  "explanation",
  "theory",
  "hint",
  "learning_key",
];

export const JA_QUESTION_TYPES = [
  "ja_grammar_choice",
  "ja_grammar_star",
  "ja_grammar_order",
  "ja_vocab_context",
  "ja_vocab_paraphrase",
  "ja_vocab_usage",
  "ja_kanji_reading",
  "ja_kanji_writing",
];

export const JA_SECTIONS = [
  "kanji",
  "grammar",
  "vocabulary",
];

export const JA_LEVELS = [
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
];

export const JA_TYPE_LABELS = {
  ja_grammar_choice: "Chọn đáp án",
  ja_grammar_star: "Chọn vị trí ★",
  ja_grammar_order: "Sắp xếp câu",
  ja_vocab_context: "Từ vựng theo ngữ cảnh",
  ja_vocab_paraphrase: "Từ vựng gần nghĩa",
  ja_vocab_usage: "Cách dùng từ",
  ja_kanji_reading: "Cách đọc Hán tự",
  ja_kanji_writing: "Cách viết Hán tự",
};

export const JA_TYPE_SECTIONS = {
  ja_grammar_choice: "grammar",
  ja_grammar_star: "grammar",
  ja_grammar_order: "grammar",
  ja_vocab_context: "vocabulary",
  ja_vocab_paraphrase: "vocabulary",
  ja_vocab_usage: "vocabulary",
  ja_kanji_reading: "kanji",
  ja_kanji_writing: "kanji",
};

/**
 * Escapes characters for HTML output to prevent XSS.
 */
export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Parses {漢字|かな} syntax into an array of tokens:
 * - { type: "text", text: string }
 * - { type: "ruby", base: string, rt: string }
 *
 * Rules:
 * - No nested ruby tokens allowed.
 * - Non-empty base and rt required.
 * - No HTML allowed in ruby or input.
 * - {{gap}} and {{slots}} are preserved as text tokens.
 */
export function parseRubyTokens(text) {
  if (text == null || text === "") return [];
  const input = String(text);

  if (/<[a-zA-Z/!][^>]*>/.test(input)) {
    throw new Error("HTML không được phép trong nội dung tiếng Nhật.");
  }

  const tokens = [];
  let index = 0;
  let textBuf = "";

  function flushText() {
    if (textBuf) {
      tokens.push({ type: "text", text: textBuf });
      textBuf = "";
    }
  }

  while (index < input.length) {
    if (input.startsWith("{{gap}}", index)) {
      textBuf += "{{gap}}";
      index += "{{gap}}".length;
      continue;
    }
    if (input.startsWith("{{slots}}", index)) {
      textBuf += "{{slots}}";
      index += "{{slots}}".length;
      continue;
    }
    if (input.startsWith("{{", index)) {
      throw new Error(`Token không hợp lệ hoặc ngoặc lồng tại vị trí ${index}: "${input.slice(index, index + 10)}"`);
    }
    if (input[index] === "}") {
      throw new Error(`Dấu ngoặc nhọn đóng thừa '}' tại vị trí ${index}.`);
    }
    if (input[index] === "{") {
      const closeIdx = input.indexOf("}", index + 1);
      if (closeIdx === -1) {
        throw new Error(`Dấu ngoặc nhọn mở '{' chưa đóng tại vị trí ${index}.`);
      }
      const inside = input.slice(index + 1, closeIdx);
      if (inside.includes("{")) {
        throw new Error(`Không cho phép lồng token ruby tại vị trí ${index}.`);
      }
      if (inside.includes("{{gap}}") || inside.includes("{{slots}}")) {
        throw new Error("Không được đặt token chỗ trống trong ruby.");
      }
      const pipeIdx = inside.indexOf("|");
      if (pipeIdx === -1) {
        throw new Error(`Cú pháp ruby thiếu dấu '|': "{${inside}}".`);
      }
      if (inside.indexOf("|", pipeIdx + 1) !== -1) {
        throw new Error(`Cú pháp ruby có nhiều hơn một dấu '|': "{${inside}}".`);
      }
      const rawBase = inside.slice(0, pipeIdx);
      const rawRt = inside.slice(pipeIdx + 1);
      if (/[\r\n]/.test(rawBase) || /[\r\n]/.test(rawRt)) {
        throw new Error(`Ruby không được chứa ký tự xuống dòng: "{${inside}}".`);
      }
      const base = rawBase.trim();
      const rt = rawRt.trim();
      if (!base || !rt) {
        throw new Error(`Ruby không được để trống base hoặc rt: "{${inside}}".`);
      }
      flushText();
      tokens.push({ type: "ruby", base, rt });
      index = closeIdx + 1;
      continue;
    }
    textBuf += input[index];
    index += 1;
  }
  flushText();
  return tokens;
}

/**
 * Converts text with ruby syntax to safe HTML.
 * - showRuby: true -> renders <ruby>base<rt>rt</rt></ruby>
 * - showRuby: false -> renders base
 * - hideTarget: if specified and matches ruby base, suppresses <rt>
 */
export function renderRubyHtml(text, { showRuby = true, hideTarget = null } = {}) {
  const tokens = parseRubyTokens(text);
  const hide = hideTarget ? String(hideTarget).normalize("NFC") : null;
  return tokens
    .map((token) => {
      if (token.type === "text") {
        return escapeHtml(token.text);
      }
      if (token.type === "ruby") {
        const baseNorm = token.base.normalize("NFC");
        const isHidden = hide && (baseNorm === hide || baseNorm.includes(hide));
        if (showRuby && !isHidden) {
          return `<ruby>${escapeHtml(token.base)}<rt>${escapeHtml(token.rt)}</rt></ruby>`;
        }
        return escapeHtml(token.base);
      }
      return "";
    })
    .join("");
}

/**
 * Strips ruby annotations, returning pure text.
 */
export function stripRuby(text) {
  const tokens = parseRubyTokens(text);
  return tokens.map((token) => (token.type === "ruby" ? token.base : token.text)).join("");
}

/**
 * RFC 4180 compliant CSV parser with support for quotes, newlines, and BOM.
 */
export function parseCsv(text) {
  const content = String(text ?? "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let closedQuote = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else if (inQuotes) {
        inQuotes = false;
        closedQuote = true;
      } else if (!field && !closedQuote) {
        inQuotes = true;
      } else {
        throw new Error('CSV có dấu ngoặc kép sai vị trí. Dấu " trong ô phải viết thành "" và bọc cả ô bằng ngoặc kép.');
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      closedQuote = false;
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      closedQuote = false;
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else {
      if (closedQuote && !inQuotes) throw new Error("CSV có ký tự thừa sau dấu ngoặc kép đóng.");
      field += char;
    }
  }

  if (inQuotes) throw new Error("CSV có dấu ngoặc kép chưa đóng.");
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

/**
 * Escapes a single cell value for CSV serialization following RFC 4180.
 */
export function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

/**
 * Parses and validates a Japanese CSV file (ja-v1 profile).
 * Returns { filename, rows, questions, errors }.
 */
export function parseJapaneseCsv(text, filename = "japanese.csv") {
  const content = String(text ?? "").replace(/^\uFEFF/, "");
  if (new TextEncoder().encode(content).length > 5 * 1024 * 1024) {
    return { filename, rows: [], questions: [], errors: ["File vượt quá 5 MB."] };
  }
  if (content.includes("\uFFFD")) {
    return {
      filename,
      rows: [],
      questions: [],
      errors: ["File có ký tự lỗi mã hóa. Hãy lưu lại dưới dạng CSV UTF-8 rồi thử lại."],
    };
  }

  let matrix;
  try {
    matrix = parseCsv(content);
  } catch (error) {
    return { filename, rows: [], questions: [], errors: [error.message] };
  }

  if (matrix.length < 2) {
    return { filename, rows: [], questions: [], errors: ["File chưa có dòng dữ liệu."] };
  }

  const headers = matrix[0].map((header) => header.trim());
  if (new Set(headers).size !== headers.length) {
    return { filename, rows: [], questions: [], errors: ["Header có cột bị trùng."] };
  }

  const headerMatches =
    headers.length === JA_CSV_HEADERS.length &&
    JA_CSV_HEADERS.every((header, index) => headers[index] === header);

  if (!headerMatches) {
    return {
      filename,
      rows: [],
      questions: [],
      errors: [`Header phải có đúng 20 cột theo thứ tự: ${JA_CSV_HEADERS.join(",")}`],
    };
  }

  if (matrix.length - 1 > 2000) {
    return {
      filename,
      rows: [],
      questions: [],
      errors: ["Mỗi file nhận tối đa 2.000 câu."],
    };
  }

  const rows = [];
  const errors = [];
  const ids = new Set();

  matrix.slice(1).forEach((cells, index) => {
    const rowNum = index + 2;
    try {
      if (cells.length !== headers.length) {
        throw new Error(`có ${cells.length} cột, cần đúng ${headers.length}; hãy kiểm tra dấu phẩy và ngoặc kép`);
      }
      if (cells.some((cell) => cell.length > 10000)) {
        throw new Error("mỗi ô chỉ được chứa tối đa 10.000 ký tự");
      }

      const raw = Object.fromEntries(
        headers.map((header, colIdx) => [header, (cells[colIdx] ?? "").trim()]),
      );

      // 1. schema & subject
      if (raw.schema !== JA_SCHEMA) {
        throw new Error(`schema phải là ${JA_SCHEMA}`);
      }
      if (raw.subject !== JA_SUBJECT) {
        throw new Error(`subject phải là ${JA_SUBJECT}`);
      }

      // 2. id
      const id = raw.id;
      if (!id) {
        throw new Error("thiếu id");
      }
      if (ids.has(id)) {
        throw new Error(`id bị trùng: ${id}`);
      }
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(id)) {
        throw new Error("id chỉ dùng 1-100 ký tự chữ, số, dấu chấm, gạch ngang hoặc gạch dưới; bắt đầu bằng chữ hoặc số");
      }

      // 3. level
      if (!JA_LEVELS.includes(raw.level)) {
        throw new Error(`level phải là một trong: ${JA_LEVELS.join(", ")}`);
      }

      // 4. chapter & lesson
      if (!/^[1-9]\d{0,2}$/.test(raw.chapter)) {
        throw new Error("chapter phải là số nguyên từ 1 đến 999");
      }
      if (!/^[1-9]\d{0,2}$/.test(raw.lesson)) {
        throw new Error("lesson phải là số nguyên từ 1 đến 999");
      }
      const chapter = parseInt(raw.chapter, 10);
      const lesson = parseInt(raw.lesson, 10);

      // 5. type & section
      if (!JA_QUESTION_TYPES.includes(raw.type)) {
        throw new Error(`type không hỗ trợ: ${raw.type}`);
      }
      const expectedSection = JA_TYPE_SECTIONS[raw.type];
      if (raw.section !== expectedSection) {
        throw new Error(`section "${raw.section}" không khớp với type "${raw.type}" (cần "${expectedSection}")`);
      }

      // 6. topic & prompt
      if (!raw.topic) {
        throw new Error("thiếu topic");
      }
      if (raw.topic.length > 200) {
        throw new Error("topic không được vượt quá 200 ký tự");
      }
      if (!raw.prompt) {
        throw new Error("thiếu prompt");
      }
      if (raw.prompt.length > 1000) {
        throw new Error("prompt không được vượt quá 1.000 ký tự");
      }
      parseRubyTokens(raw.prompt);

      // 7. explanation & theory & hint
      if (!raw.explanation) {
        throw new Error("thiếu explanation (giải thích đáp án)");
      }
      parseRubyTokens(raw.explanation);

      if (["ja_grammar_choice", "ja_grammar_star", "ja_grammar_order"].includes(raw.type)) {
        if (!raw.theory) {
          throw new Error(`${raw.type} cần theory nhắc quy tắc ngữ pháp`);
        }
      }
      if (raw.theory) parseRubyTokens(raw.theory);
      if (raw.hint) parseRubyTokens(raw.hint);

      // 8. learning_key
      const isVocab = ["ja_vocab_context", "ja_vocab_paraphrase", "ja_vocab_usage"].includes(raw.type);
      if (isVocab) {
        if (!raw.learning_key) {
          throw new Error(`${raw.type} cần learning_key`);
        }
        if (!/^ja:vocab:[a-z0-9][a-z0-9:_-]*$/.test(raw.learning_key) || raw.learning_key.length > 200) {
          throw new Error(`learning_key phải bắt đầu bằng ja:vocab: và đúng định dạng ASCII (tối đa 200 ký tự): "${raw.learning_key}"`);
        }
      } else {
        if (raw.learning_key) {
          throw new Error(`${raw.type} phải để trống learning_key`);
        }
      }

      // 9. options
      if (!raw.options) {
        throw new Error("thiếu options");
      }
      let optionItems;
      try {
        optionItems = JSON.parse(raw.options);
      } catch {
        throw new Error('options phải là JSON array hợp lệ (ví dụ: [{"id":"o1","text":"..."}])');
      }
      if (!Array.isArray(optionItems)) {
        throw new Error("options phải là JSON array");
      }

      const isOrder = raw.type === "ja_grammar_order";
      if (!isOrder && optionItems.length !== 4) {
        throw new Error(`${raw.type} cần đúng 4 options`);
      }
      if (isOrder && (optionItems.length < 2 || optionItems.length > 12)) {
        throw new Error("ja_grammar_order cần từ 2 đến 12 mảnh options");
      }

      const optIds = new Set();
      for (const opt of optionItems) {
        if (!opt || typeof opt !== "object" || typeof opt.id !== "string" || typeof opt.text !== "string") {
          throw new Error("mỗi option phải là object có id và text kiểu chuỗi");
        }
        const optKeys = Object.keys(opt);
        if (optKeys.length !== 2 || !optKeys.includes("id") || !optKeys.includes("text")) {
          throw new Error("option chỉ được chứa 2 thuộc tính: id và text");
        }
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(opt.id)) {
          throw new Error(`option id không hợp lệ: "${opt.id}" (1-64 ký tự ASCII)`);
        }
        if (optIds.has(opt.id)) {
          throw new Error(`option id bị trùng: "${opt.id}"`);
        }
        optIds.add(opt.id);
        if (!opt.text.trim()) {
          throw new Error(`option "${opt.id}" có text rỗng`);
        }
        parseRubyTokens(opt.text);
      }

      // K1 / K2 options must not contain ruby
      if (raw.type === "ja_kanji_reading" || raw.type === "ja_kanji_writing") {
        for (const opt of optionItems) {
          const optTokens = parseRubyTokens(opt.text);
          if (optTokens.some((t) => t.type === "ruby")) {
            throw new Error(`${raw.type} không được có ruby trong options trước khi chấm`);
          }
        }
      }

      // 7 choice types: display texts cannot be duplicate
      if (!isOrder) {
        const displayTexts = optionItems.map((opt) =>
          stripRuby(opt.text).normalize("NFC").trim(),
        );
        if (new Set(displayTexts).size !== 4) {
          throw new Error("4 phương án lựa chọn không được có chữ hiển thị trùng nhau sau khi chuẩn hóa");
        }
      }

      // 10. answer
      if (isOrder) {
        if (raw.answer) {
          throw new Error("ja_grammar_order phải để trống answer");
        }
      } else {
        if (!raw.answer) {
          throw new Error(`${raw.type} cần answer`);
        }
        if (!optIds.has(raw.answer)) {
          throw new Error(`answer "${raw.answer}" không tồn tại trong danh sách options`);
        }
      }

      // 11. star_position
      let starPosition = null;
      if (raw.type === "ja_grammar_star") {
        if (!/^[1-4]$/.test(raw.star_position)) {
          throw new Error("ja_grammar_star cần star_position là số nguyên từ 1 đến 4");
        }
        starPosition = parseInt(raw.star_position, 10);
      } else {
        if (raw.star_position) {
          throw new Error(`${raw.type} phải để trống star_position`);
        }
      }

      // 12. accepted_orders
      let acceptedOrders = null;
      if (raw.type === "ja_grammar_star" || raw.type === "ja_grammar_order") {
        if (!raw.accepted_orders) {
          throw new Error(`${raw.type} cần accepted_orders`);
        }
        try {
          acceptedOrders = JSON.parse(raw.accepted_orders);
        } catch {
          throw new Error("accepted_orders phải là JSON array hợp lệ");
        }
        if (!Array.isArray(acceptedOrders) || acceptedOrders.length === 0 || !acceptedOrders.every(Array.isArray)) {
          throw new Error("accepted_orders phải là mảng chứa ít nhất một mảng thứ tự ID");
        }
        if (acceptedOrders.length > 24) {
          throw new Error("accepted_orders nhận tối đa 24 thứ tự hợp lệ");
        }

        const requiredLen = optionItems.length;
        for (let oIdx = 0; oIdx < acceptedOrders.length; oIdx++) {
          const order = acceptedOrders[oIdx];
          if (order.length !== requiredLen) {
            throw new Error(`accepted_orders[${oIdx}] phải chứa đủ ${requiredLen} mảnh ID`);
          }
          if (new Set(order).size !== requiredLen || !order.every((id) => optIds.has(id))) {
            throw new Error(`accepted_orders[${oIdx}] phải dùng đủ mọi option ID đúng một lần`);
          }
        }

        // G2 check: star_position must point to answer in EVERY accepted order
        if (raw.type === "ja_grammar_star") {
          for (let oIdx = 0; oIdx < acceptedOrders.length; oIdx++) {
            const order = acceptedOrders[oIdx];
            const starOptionId = order[starPosition - 1];
            if (starOptionId !== raw.answer) {
              throw new Error(
                `Câu mơ hồ: tại vị trí star_position ${starPosition}, thứ tự accepted_orders[${oIdx}] có ID "${starOptionId}" khác với answer "${raw.answer}".`,
              );
            }
          }
        }
      } else {
        if (raw.accepted_orders) {
          throw new Error(`${raw.type} phải để trống accepted_orders`);
        }
      }

      // 13. target
      const isGrammar = ["ja_grammar_choice", "ja_grammar_star", "ja_grammar_order"].includes(raw.type);
      if (isGrammar) {
        if (raw.target) {
          throw new Error(`${raw.type} phải để trống target`);
        }
      } else {
        if (!raw.target) {
          throw new Error(`${raw.type} cần target`);
        }
        if (raw.target.length > 200) {
          throw new Error("target không được vượt quá 200 ký tự");
        }
        if (raw.target.includes("{") || raw.target.includes("|") || raw.target.includes("}")) {
          throw new Error("target phải là văn bản thuần, không chứa ký tự ruby");
        }
      }

      // 14. context validation
      if (raw.context) {
        parseRubyTokens(raw.context);
      }

      if (raw.type === "ja_grammar_choice") {
        const gapMatches = (raw.context.match(/\{\{gap\}\}/g) || []).length;
        if (gapMatches !== 1) {
          throw new Error(`ja_grammar_choice: context phải có đúng 1 {{gap}} (hiện có ${gapMatches})`);
        }
        if (raw.context.includes("{{slots}}")) {
          throw new Error("ja_grammar_choice không được chứa {{slots}}");
        }
      } else if (raw.type === "ja_grammar_star") {
        const slotMatches = (raw.context.match(/\{\{slots\}\}/g) || []).length;
        if (slotMatches !== 1) {
          throw new Error(`ja_grammar_star: context phải có đúng 1 {{slots}} (hiện có ${slotMatches})`);
        }
        if (raw.context.includes("{{gap}}")) {
          throw new Error("ja_grammar_star không được chứa {{gap}}");
        }
      } else if (raw.type === "ja_grammar_order") {
        if (raw.context.includes("{{gap}}") || raw.context.includes("{{slots}}")) {
          throw new Error("ja_grammar_order không được chứa {{gap}} hoặc {{slots}}");
        }
        if (!raw.context.trim()) {
          throw new Error("ja_grammar_order cần context (nghĩa hoặc gợi ý tiếng Việt)");
        }
      } else if (raw.type === "ja_vocab_context") {
        if (raw.context.includes("{{slots}}")) {
          throw new Error("ja_vocab_context không được chứa {{slots}}");
        }
        const lines = raw.context.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          throw new Error("ja_vocab_context cần ít nhất 1 dòng ngữ cảnh");
        }
        for (let lIdx = 0; lIdx < lines.length; lIdx++) {
          const line = lines[lIdx];
          const lineGaps = (line.match(/\{\{gap\}\}/g) || []).length;
          if (lineGaps !== 1) {
            throw new Error(`ja_vocab_context: dòng ${lIdx + 1} của context phải có đúng 1 {{gap}} (hiện có ${lineGaps})`);
          }
        }
        // Check: option matching answer must match target after stripping ruby
        const answerOpt = optionItems.find((o) => o.id === raw.answer);
        if (answerOpt) {
          const answerTextPlain = stripRuby(answerOpt.text).normalize("NFC").trim();
          const targetPlain = raw.target.normalize("NFC").trim();
          if (answerTextPlain !== targetPlain) {
            throw new Error(`ja_vocab_context: chữ phương án answer "${raw.answer}" (${answerTextPlain}) phải trùng target "${raw.target}"`);
          }
        }
      } else if (raw.type === "ja_vocab_paraphrase" || raw.type === "ja_kanji_reading" || raw.type === "ja_kanji_writing") {
        if (raw.context.includes("{{gap}}") || raw.context.includes("{{slots}}")) {
          throw new Error(`${raw.type} không được chứa {{gap}} hoặc {{slots}}`);
        }
        const strippedContext = stripRuby(raw.context).normalize("NFC");
        const targetNorm = raw.target.normalize("NFC");
        const occurrences = strippedContext.split(targetNorm).length - 1;
        if (occurrences === 0) {
          throw new Error(`${raw.type}: target "${raw.target}" không xuất hiện trong context`);
        }
        if (occurrences > 1) {
          throw new Error(`${raw.type}: target "${raw.target}" xuất hiện ${occurrences} lần trong context (chỉ được xuất hiện đúng 1 lần)`);
        }

        const contextTokens = parseRubyTokens(raw.context);
        const inSingleToken = contextTokens.some((t) => {
          const tText = (t.type === "ruby" ? t.base : t.text).normalize("NFC");
          return tText.includes(targetNorm);
        });
        if (!inSingleToken) {
          throw new Error(`${raw.type}: target "${raw.target}" không được khớp xuyên ranh giới hai ruby hoặc token`);
        }

        // K1 specific: target must not have ruby covering it in context
        if (raw.type === "ja_kanji_reading") {
          const rubyCoversTarget = contextTokens.some((t) => {
            if (t.type !== "ruby") return false;
            const bNorm = t.base.normalize("NFC");
            return bNorm.includes(targetNorm);
          });
          if (rubyCoversTarget) {
            throw new Error(`ja_kanji_reading: context không được có ruby che phủ target "${raw.target}"`);
          }
        }
      } else if (raw.type === "ja_vocab_usage") {
        if (raw.context.includes("{{gap}}") || raw.context.includes("{{slots}}")) {
          throw new Error("ja_vocab_usage không được chứa {{gap}} hoặc {{slots}}");
        }
      }

      ids.add(id);
      rows.push({
        schema: JA_SCHEMA,
        subject: JA_SUBJECT,
        id,
        level: raw.level,
        chapter,
        lesson,
        section: raw.section,
        domain: raw.section,
        topic: raw.topic,
        type: raw.type,
        prompt: raw.prompt,
        context: raw.context,
        target: raw.target || "",
        options: optionItems,
        answer: raw.answer || "",
        accepted_orders: acceptedOrders,
        acceptedOrders: acceptedOrders,
        star_position: starPosition,
        starPosition: starPosition,
        explanation: raw.explanation,
        theory: raw.theory || "",
        hint: raw.hint || "",
        learning_key: raw.learning_key || "",
        learningKey: raw.learning_key || "",
        active: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "dữ liệu không hợp lệ";
      if (errors.length < 24) errors.push(`Dòng ${rowNum}: ${message}`);
    }
  });

  return {
    filename,
    rows: errors.length ? [] : rows,
    questions: errors.length ? [] : rows,
    errors,
  };
}

/**
 * Serializes an array of Japanese question objects to a 20-column ja-v1 CSV string.
 * Output has UTF-8 BOM, RFC 4180 escaping, and proper JSON serialization.
 */
export function japaneseQuestionsToCsv(questions) {
  const lines = [JA_CSV_HEADERS.join(",")];
  (questions ?? []).forEach((q) => {
    const optionsStr = typeof q.options === "string" ? q.options : JSON.stringify(q.options ?? []);
    const ordersVal = q.accepted_orders ?? q.acceptedOrders ?? null;
    const ordersStr = ordersVal ? (typeof ordersVal === "string" ? ordersVal : JSON.stringify(ordersVal)) : "";
    const starPosVal = q.star_position ?? q.starPosition ?? null;
    const starPosStr = starPosVal != null ? String(starPosVal) : "";

    const row = {
      schema: q.schema || JA_SCHEMA,
      subject: q.subject || JA_SUBJECT,
      id: q.originalId || q.id,
      level: q.level || "",
      chapter: q.chapter != null ? String(q.chapter) : "",
      lesson: q.lesson != null ? String(q.lesson) : "",
      section: q.section || q.domain || "",
      topic: q.topic || "",
      type: q.type,
      prompt: q.prompt || "",
      context: q.context || "",
      target: q.target || "",
      options: optionsStr,
      answer: q.answer || "",
      accepted_orders: ordersStr,
      star_position: starPosStr,
      explanation: q.explanation || "",
      theory: q.theory || "",
      hint: q.hint || "",
      learning_key: q.learning_key || q.learningKey || "",
    };

    lines.push(
      JA_CSV_HEADERS.map((header) => escapeCsvCell(row[header])).join(","),
    );
  });
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/**
 * Evaluates student answer for a Japanese question.
 * - Choice types: matches option ID (handles string or object with id/answer/selected).
 * - ja_grammar_order: matches against accepted_orders array.
 *   Interchangeable fragments (same NFC text and ruby) are considered equivalent.
 *   Japanese text concatenation uses empty string "" without spaces.
 */
export function evaluateJapaneseAnswer(question, received) {
  if (!question || typeof question !== "object" || !question.type) {
    return false;
  }

  // ja_grammar_order
  if (question.type === "ja_grammar_order") {
    let submittedIds = null;
    if (Array.isArray(received)) {
      submittedIds = received.map((item) =>
        item && typeof item === "object" ? String(item.id ?? "").trim() : String(item ?? "").trim(),
      );
    } else if (received && typeof received === "object") {
      if (Array.isArray(received.order)) {
        submittedIds = received.order.map((item) =>
          item && typeof item === "object" ? String(item.id ?? "").trim() : String(item ?? "").trim(),
        );
      } else if (Array.isArray(received.accepted_orders)) {
        submittedIds = received.accepted_orders.map((item) => String(item ?? "").trim());
      } else if (Array.isArray(received.answers)) {
        submittedIds = received.answers.map((item) => String(item ?? "").trim());
      }
    }
    if (!submittedIds) return false;

    const options = question.options ?? [];
    if (!Array.isArray(options) || options.length === 0) return false;
    if (submittedIds.length !== options.length) return false;

    const validOptionIds = new Set(options.map((opt) => opt.id));
    if (submittedIds.some((id) => !validOptionIds.has(id))) return false;
    if (new Set(submittedIds).size !== options.length) return false;

    const acceptedOrders = question.accepted_orders ?? question.acceptedOrders ?? [];
    if (!Array.isArray(acceptedOrders) || acceptedOrders.length === 0) return false;

    // Equivalence map: each option ID maps to its NFC-normalized text (and ruby)
    const idToNormalizedText = new Map();
    for (const opt of options) {
      idToNormalizedText.set(opt.id, String(opt.text ?? "").normalize("NFC"));
    }

    const submittedTexts = submittedIds.map((id) => idToNormalizedText.get(id));

    return acceptedOrders.some((targetOrder) => {
      if (!Array.isArray(targetOrder) || targetOrder.length !== options.length) return false;
      const targetTexts = targetOrder.map((id) => idToNormalizedText.get(id));
      return submittedTexts.every((text, idx) => text === targetTexts[idx]);
    });
  }

  // 7 choice types
  let candidate = "";
  if (typeof received === "string") {
    candidate = received.trim();
  } else if (typeof received === "number") {
    candidate = String(received);
  } else if (received && typeof received === "object") {
    candidate = String(received.id ?? received.answer ?? received.selected ?? "").trim();
  }

  if (!candidate || !question.answer) return false;
  return candidate === String(question.answer).trim();
}

/**
 * Helper to join options in order into a Japanese sentence without inserting spaces.
 */
export function formatJapaneseSentence(options, order) {
  const optMap = new Map((options ?? []).map((o) => [o.id, o.text]));
  return (order ?? []).map((id) => optMap.get(id) ?? "").join("");
}
