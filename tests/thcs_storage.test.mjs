import assert from "node:assert/strict";
import test from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { createRepository, exportBackup, readDashboard, validateBackup } from "../storage.js";
import { practice, trueFalseQuestion, shortAnswerQuestion } from "./helpers.mjs";

async function setup(t, mode, seed = {}) {
  const descriptors = Object.fromEntries(
    ["indexedDB", "localStorage"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  );
  const values = new Map(Object.entries(seed)), repos = [];
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  if (mode === "IndexedDB") {
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: new IDBFactory() });
  } else {
    delete globalThis.indexedDB;
  }
  t.after(() => {
    repos.forEach((r) => r.close());
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const open = async () => {
    const r = await createRepository();
    repos.push(r);
    return r;
  };
  return { values, storage, open, repo: await open() };
}

for (const mode of ["localStorage", "IndexedDB"]) {
  test(`${mode}: THCS Đúng/Sai và Trả lời ngắn - lưu nháp, phục hồi nháp qua reload`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const tfQ = trueFalseQuestion({ subject: "chemistry", grade: "8", id: "c-tf-1" });
    const set = await repo.importQuestions([tfQ], "thcs-tf.csv", "Bộ Đúng/Sai");
    assert.equal(set.subject, "chemistry");

    const s = await repo.startSession({ setId: set.id, mode: "practice" });
    assert.equal(s.target, 1);

    // 1. Lưu nháp hợp lệ
    const draftTf = {
      text: "",
      selected: [],
      ordered: [],
      matches: {},
      trueFalse: ["true", "false", "", ""],
    };
    await repo.saveDraft(s.id, 0, draftTf);
    assert.deepEqual((await repo.snapshot()).session.draft, draftTf);

    // 2. Nháp không hợp lệ bị từ chối
    await assert.rejects(
      repo.saveDraft(s.id, 0, { ...draftTf, trueFalse: ["true", "invalid", "", ""] }),
      /Bản nháp không hợp lệ/
    );
    await assert.rejects(
      repo.saveDraft(s.id, 0, { ...draftTf, trueFalse: ["true", "false"] }),
      /Bản nháp không hợp lệ/
    );

    // 3. Tải lại giữ nguyên nháp
    const reloaded = await open();
    assert.deepEqual(
      (await reloaded.snapshot()).session.draft.trueFalse,
      ["true", "false", "", ""]
    );
  });

  test(`${mode}: THCS Đúng/Sai và Trả lời ngắn - kiểm tra payload nộp bài, không tạo review SRS`, async (t) => {
    const { repo } = await setup(t, mode);
    const tfQ = trueFalseQuestion({ subject: "history", grade: "7", id: "h-tf-1" });
    const tfSet = await repo.importQuestions([tfQ], "his-tf.csv", "Bộ Đúng Sai Sử");

    // 1. Session Đúng/Sai
    const s1 = await repo.startSession({ setId: tfSet.id, mode: "practice" });

    // Nộp Đúng/Sai chưa đủ 4 ý bị từ chối
    await assert.rejects(
      repo.submit(s1.id, 0, ["true", "false", "", ""]),
      /Câu trả lời Đúng\/Sai không hợp lệ/
    );
    await assert.rejects(
      repo.submit(s1.id, 0, ["true", "false"]),
      /Câu trả lời Đúng\/Sai không hợp lệ/
    );

    // Nộp Đúng/Sai đủ 4 ý hợp lệ
    const resTf = await repo.submit(s1.id, 0, ["true", "false", "true", "false"]);
    assert.equal(resTf.correct, true);
    assert.equal(resTf.expected, "a: Đúng · b: Sai · c: Đúng · d: Sai");
    assert.equal(resTf.dueAt, null);

    await repo.advance(s1.id, 0);

    // 2. Session Trả lời ngắn
    const saQ = shortAnswerQuestion({ subject: "chemistry", grade: "8", id: "c-sa-1" });
    const saSet = await repo.importQuestions([saQ], "chem-sa.csv", "Bộ Trả lời ngắn");
    const s2 = await repo.startSession({ setId: saSet.id, mode: "practice" });

    // Nộp Trả lời ngắn rỗng bị từ chối
    await assert.rejects(repo.submit(s2.id, 0, ""), /Câu trả lời ngắn không được để trống/);
    await assert.rejects(repo.submit(s2.id, 0, "   "), /Câu trả lời ngắn không được để trống/);

    // Nộp Trả lời ngắn hợp lệ
    const resSa = await repo.submit(s2.id, 0, "18");
    assert.equal(resSa.correct, true);
    assert.equal(resSa.expected, "18");
    assert.equal(resSa.dueAt, null);

    await repo.advance(s2.id, 0);

    // 3. Kiểm tra snapshot: không có review SRS, có đúng 2 attempts và summary hoàn tất
    const snap = await repo.snapshot();
    assert.equal(snap.session, null);
    assert.equal(snap.reviews.length, 0);
    assert.equal(snap.attempts.length, 2);
    assert.ok(snap.summary);
    assert.equal(snap.summary.correct, 1);
  });
}

test("THCS: sao lưu và khôi phục bảo toàn môn Lịch sử và Địa lí", async (t) => {
  const { repo } = await setup(t, "localStorage");
  const hisSet = await repo.importQuestions([trueFalseQuestion()], "lich-su.csv", "Bộ Lịch sử");
  const geoSet = await repo.importQuestions(
    [practice({ subject: "geography", grade: "6", id: "g1", options: ["A", "B", "C", "D"], answer: ["A"] })],
    "dia-li.csv",
    "Bộ Địa lí"
  );

  const backup = exportBackup(await repo.snapshot());
  assert.equal(backup.version, 3);

  const restored = validateBackup(backup);
  assert.equal(restored.imports.length, 2);
  assert.equal(restored.imports.find((s) => s.id === hisSet.id).subject, "history");
  assert.equal(restored.imports.find((s) => s.id === geoSet.id).subject, "geography");

  // Từ chối backup có môn không hợp lệ
  const badBackup = structuredClone(backup);
  badBackup.snapshot.imports[0].subject = "literature";
  assert.throws(() => validateBackup(badBackup), /Môn học của bộ trong sao lưu không hợp lệ/);
});

for (const mode of ["localStorage", "IndexedDB"]) {
  test(`${mode}: validateBackup từ chối nghiêm ngặt attempts Đúng/Sai và Trả lời ngắn không hợp lệ`, async (t) => {
    const { repo } = await setup(t, mode);
    const tfQ = trueFalseQuestion({ id: "tf-1", subject: "chemistry", grade: "8" });
    const saQ = shortAnswerQuestion({ id: "sa-1", subject: "chemistry", grade: "8", answer: ["18"] });
    const set = await repo.importQuestions([tfQ, saQ], "test.csv", "Bộ Test");

    const validSnap = await repo.snapshot();
    const baseBackup = exportBackup(validSnap);
    const qTf = validSnap.questions.find((q) => q.type === "true_false");
    const qSa = validSnap.questions.find((q) => q.type === "short_answer");

    // 1. Câu Đúng/Sai: chỉ có ["true"] -> từ chối
    const b1 = structuredClone(baseBackup);
    b1.snapshot.attempts = [{
      id: "att-1", questionId: qTf.id, setId: set.id,
      answer: ["true"], correct: false, attemptedAt: Date.now(),
    }];
    assert.throws(() => validateBackup(b1), /Lịch sử trong sao lưu không hợp lệ/);

    // 2. Câu Đúng/Sai: chứa "yes"/"no" -> từ chối
    const b2 = structuredClone(baseBackup);
    b2.snapshot.attempts = [{
      id: "att-2", questionId: qTf.id, setId: set.id,
      answer: ["yes", "no", "yes", "no"], correct: false, attemptedAt: Date.now(),
    }];
    assert.throws(() => validateBackup(b2), /Lịch sử trong sao lưu không hợp lệ/);

    // 3. Câu Đúng/Sai: đúng 3/4 ý nhưng cố tình gán correct: true -> từ chối đối chiếu
    const b3 = structuredClone(baseBackup);
    b3.snapshot.attempts = [{
      id: "att-3", questionId: qTf.id, setId: set.id,
      answer: ["true", "false", "true", "true"], // sai ý d
      correct: true, // gian lận correct: true
      attemptedAt: Date.now(),
    }];
    assert.throws(() => validateBackup(b3), /Lịch sử trong sao lưu không hợp lệ/);

    // 4. Trả lời ngắn: answer rỗng -> từ chối
    const b4 = structuredClone(baseBackup);
    b4.snapshot.attempts = [{
      id: "att-4", questionId: qSa.id, setId: set.id,
      answer: "   ", correct: false, attemptedAt: Date.now(),
    }];
    assert.throws(() => validateBackup(b4), /Lịch sử trong sao lưu không hợp lệ/);

    // 5. Trả lời ngắn: trả lời sai nhưng gán correct: true -> từ chối đối chiếu
    const b5 = structuredClone(baseBackup);
    b5.snapshot.attempts = [{
      id: "att-5", questionId: qSa.id, setId: set.id,
      answer: "999", correct: true, attemptedAt: Date.now(),
    }];
    assert.throws(() => validateBackup(b5), /Lịch sử trong sao lưu không hợp lệ/);

    // 6. Attempts hợp lệ: Đúng/Sai đúng 4/4 và Trả lời ngắn đúng -> khôi phục thành công
    const validB = structuredClone(baseBackup);
    validB.snapshot.attempts = [
      {
        id: "att-tf", questionId: qTf.id, setId: set.id,
        answer: ["true", "false", "true", "false"], correct: true, attemptedAt: Date.now(),
      },
      {
        id: "att-sa", questionId: qSa.id, setId: set.id,
        answer: "18", correct: true, attemptedAt: Date.now(),
      },
    ];
    const restored = validateBackup(validB);
    assert.equal(restored.attempts.length, 2);
    assert.equal(restored.attempts[0].correct, true);
    assert.equal(restored.attempts[1].correct, true);
  });
}

