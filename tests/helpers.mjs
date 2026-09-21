export function question(overrides = {}) {
  return {
    subject: "english", grade: "", id: "g-1", domain: "grammar", type: "fill_blank", level: "B1", topic: "Present simple",
    subtopic: "", prompt: "Complete the sentence.", context: "She ___ a teacher.", options: [],
    answer: ["is"], explanation: "She đi với is.", theory: "Hiện tại đơn của be: am/is/are.",
    hint: "", tags: [], difficulty: 1, learningKey: "", active: true, ...overrides,
  };
}
export function vocabulary(overrides = {}) {
  return question({ id: "v-1", domain: "vocabulary", topic: "Work", prompt: "Complete with RELY in the correct form.",
    context: "She is a ___ assistant.", type: "word_formation", answer: ["reliable"], explanation: "Reliable nghĩa là đáng tin cậy.",
    theory: "", learningKey: "vocab:reliable:adjective:dependable", ...overrides });
}

export function practice(overrides = {}) {
  return question({
    subject: "physics", grade: "8", id: "p-1", domain: "practice", type: "mcq", level: "mixed",
    topic: "Lực", prompt: "Đơn vị SI của lực là gì?", context: "", options: ["N", "J"], answer: ["N"],
    explanation: "Newton, kí hiệu N, là đơn vị SI của lực.", theory: "Lực được đo bằng newton, kí hiệu N.",
    hint: "Phân biệt lực với năng lượng.", tags: ["case-sensitive"], learningKey: "", ...overrides,
  });
}

export function trueFalseQuestion(overrides = {}) {
  return question({
    subject: "history", grade: "7", id: "h-tf-1", domain: "practice", type: "true_false", level: "mixed",
    topic: "Lý", prompt: "Xét tính đúng/sai:", context: "",
    options: ["Ý A", "Ý B", "Ý C", "Ý D"],
    answer: ["true", "false", "true", "false"],
    explanation: "Giải thích", theory: "Lý thuyết",
    learningKey: "", ...overrides,
  });
}

export function shortAnswerQuestion(overrides = {}) {
  return question({
    subject: "chemistry", grade: "8", id: "c-sa-1", domain: "practice", type: "short_answer", level: "mixed",
    topic: "Hóa", prompt: "Khối lượng mol H2O:", context: "",
    options: [],
    answer: ["18"],
    explanation: "Giải thích", theory: "Lý thuyết",
    learningKey: "", ...overrides,
  });
}
