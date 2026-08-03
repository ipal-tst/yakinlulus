import { describe, it, expect } from "vitest";
import { emptyMaterialForm, mapMaterialToForm } from "./material-form-utils";

describe("emptyMaterialForm", () => {
  it("returns defaults", () => {
    const f = emptyMaterialForm();
    expect(f.content_format).toBe("MARKDOWN");
    expect(f.estimated_duration).toBe(15);
    expect(f.status).toBe("PUBLISHED");
    expect(f.title).toBe("");
  });
});

describe("mapMaterialToForm", () => {
  it("maps material body/content and both id naming conventions", () => {
    const m = {
      subjectId: "s1", chapterId: "c1", topicId: "t1",
      title: "Hukum Newton", contentFormat: "PDF",
      estimatedDuration: 30, body: "Isi materi", status: "DRAFT",
    };
    const f = mapMaterialToForm(m);
    expect(f.subject_id).toBe("s1");
    expect(f.chapter_id).toBe("c1");
    expect(f.topic_id).toBe("t1");
    expect(f.content_format).toBe("PDF");
    expect(f.estimated_duration).toBe(30);
    expect(f.content).toBe("Isi materi");
    expect(f.status).toBe("DRAFT");
  });

  it("falls back to snake_case fields", () => {
    const m = { subject_id: "s2", title: "X", content: "Y", content_format: "MARKDOWN" };
    const f = mapMaterialToForm(m);
    expect(f.subject_id).toBe("s2");
    expect(f.content).toBe("Y");
  });
});
