import { describe, it, expect } from "vitest";
import { emptyQuestionForm, mapQuestionToForm, buildQuestionPayload } from "./question-form-utils";

describe("emptyQuestionForm", () => {
  it("returns 5 options with A correct and defaults", () => {
    const f = emptyQuestionForm();
    expect(f.question_type).toBe("SINGLE_CHOICE");
    expect(f.difficulty).toBe("MEDIUM");
    expect(f.options).toHaveLength(5);
    expect(f.options[0]).toEqual({ label: "A", content: "", correct: true });
    expect(f.options[4]).toEqual({ label: "E", content: "", correct: false });
  });
});

describe("mapQuestionToForm", () => {
  it("maps question options and resolves level from grade", () => {
    const q = {
      grade_id: "g1", subject_id: "s1", chapter_id: "c1",
      difficulty: "HARD", question_type: "TRUE_FALSE",
      content: "soal", explanation: "pembahasan", score: 2, negative_score: 0.5,
      options: [
        { label: "A", content: "Benar", is_correct: false },
        { label: "B", content: "Salah", is_correct: true },
      ],
    };
    const gradesList = [{ id: "g1", education_level_id: "lv1" }];
    const f = mapQuestionToForm(q, gradesList);
    expect(f.level_id).toBe("lv1");
    expect(f.grade_id).toBe("g1");
    expect(f.options).toEqual([
      { label: "A", content: "Benar", correct: false },
      { label: "B", content: "Salah", correct: true },
    ]);
  });

  it("returns empty form defaults when no options / grade", () => {
    const f = mapQuestionToForm({}, []);
    expect(f.options).toHaveLength(5);
    expect(f.level_id).toBe("");
  });
});

describe("buildQuestionPayload", () => {
  it("filters empty options and converts undefined chapter to omitted", () => {
    const f = emptyQuestionForm();
    f.subject_id = "s1";
    f.content = "Berapa 2+2?";
    f.options = [
      { label: "A", content: "3", correct: false },
      { label: "B", content: "4", correct: true },
      { label: "C", content: "", correct: false },
    ];
    const payload = buildQuestionPayload(f);
    expect(payload.options).toHaveLength(2);
    expect(payload.chapter_id).toBeUndefined();
    expect(payload.score).toBe(1);
    expect(payload.options[1]?.content).toBe("4");
  });
});
