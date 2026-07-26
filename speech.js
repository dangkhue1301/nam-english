// Phát âm tiếng Anh bằng Web Speech API. Không có gì để lưu trữ:
// trình duyệt tự chọn giọng tốt nhất có sẵn trên thiết bị.

let cachedVoice = null;
let voicesReady = false;

export function speechAvailable() {
  return (
    typeof globalThis.speechSynthesis !== "undefined" &&
    typeof globalThis.SpeechSynthesisUtterance !== "undefined"
  );
}

function scoreVoice(voice) {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (voice.lang === "en-US" || voice.lang === "en-GB") score += 4;
  else if (voice.lang?.startsWith("en")) score += 2;
  else return -1;
  if (name.includes("natural") || name.includes("neural")) score += 3;
  if (name.includes("google") || name.includes("microsoft")) score += 1;
  if (voice.localService) score += 1;
  return score;
}

function pickVoice() {
  if (!speechAvailable()) return null;
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  let best = null;
  let bestScore = -1;
  voices.forEach((voice) => {
    const score = scoreVoice(voice);
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  });
  return bestScore >= 0 ? best : null;
}

function ensureVoices() {
  if (voicesReady || !speechAvailable()) return;
  cachedVoice = pickVoice();
  if (cachedVoice) {
    voicesReady = true;
    return;
  }
  speechSynthesis.addEventListener(
    "voiceschanged",
    () => {
      cachedVoice = pickVoice();
      voicesReady = true;
    },
    { once: true },
  );
}

export function speakEnglish(text, { rate = 0.95 } = {}) {
  if (!speechAvailable()) return false;
  const cleaned = String(text ?? "")
    .replace(/_{2,}/g, " blank ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return false;

  ensureVoices();
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = cachedVoice?.lang ?? "en-US";
  if (cachedVoice) utterance.voice = cachedVoice;
  utterance.rate = Math.min(1.4, Math.max(0.5, rate));
  speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (speechAvailable()) speechSynthesis.cancel();
}

// Gọi sớm khi khởi động để danh sách giọng kịp tải (Chrome tải bất đồng bộ).
export function warmUpSpeech() {
  ensureVoices();
}
