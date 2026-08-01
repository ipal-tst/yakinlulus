import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { nextOptionLabel, addOption, removeOption, StagingQuestionCard } from "./StagingQuestionCard";

const baseOpt = (label: string, content = "", is_correct = false): any => ({ label, content, is_correct });

describe("StagingQuestionCard preview", () => {
  it("menampilkan preview soal + opsi + badge kunci setelah expand", () => {
    const row = {
      rowNum: 3,
      content: "Berapa hasil 2 + 2?",
      difficulty: "MEDIUM",
      question_type: "SINGLE_CHOICE",
      subject_id: "s",
      explanation: "2 + 2 = 4",
      options: [
        { label: "A", content: "3", is_correct: false },
        { label: "B", content: "4", is_correct: true },
      ],
    };
    const { container, getByLabelText } = render(
      <StagingQuestionCard
        row={row as any}
        index={0}
        onChange={() => {}}
        onDelete={() => {}}
      />
    );
    expect(container.textContent).not.toContain("Pratinjau Tampilan Ujian");
    fireEvent.click(getByLabelText("Perluas"));
    expect(container.textContent).toContain("Pratinjau Tampilan Ujian");
    expect(container.textContent).toContain("Berapa hasil 2 + 2?");
    expect(container.textContent).toContain("Kunci");
  });
});

describe("nextOptionLabel", () => {
  it("mengembalikan huruf berikutnya setelah label terakhir", () => {
    expect(nextOptionLabel(["A", "B", "C"])).toBe("D");
  });
  it("mendukung lanjutan setelah E (F, G, ...)", () => {
    expect(nextOptionLabel(["A", "B", "C", "D", "E"])).toBe("F");
  });
  it("throw bila melewati Z", () => {
    expect(() => nextOptionLabel(["Z"])).toThrow();
  });
});

describe("addOption", () => {
  it("menambahkan opsi kosong dengan label berikutnya", () => {
    const opts = [baseOpt("A"), baseOpt("B")];
    const result = addOption(opts);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ label: "C", content: "", is_correct: false });
  });
  it("tidak mengubah opsi lama", () => {
    const opts = [baseOpt("A", "x", true), baseOpt("B")];
    const result = addOption(opts);
    expect(result[0]).toEqual(opts[0]);
    expect(result[1]).toEqual(opts[1]);
  });
});

describe("removeOption", () => {
  it("menghapus opsi di index tertentu", () => {
    const opts = [baseOpt("A"), baseOpt("B"), baseOpt("C")];
    expect(removeOption(opts, 1)).toHaveLength(2);
  });
  it("menolak penghapusan jika sisa kurang dari 2", () => {
    const opts = [baseOpt("A"), baseOpt("B")];
    expect(removeOption(opts, 1)).toEqual(opts);
  });
  it("memindahkan kunci ke opsi pertama jika opsi benar dihapus", () => {
    const opts = [baseOpt("A"), baseOpt("B"), baseOpt("C", "", true)];
    const result = removeOption(opts, 2);
    expect(result).toHaveLength(2);
    expect(result[0]!.is_correct).toBe(true);
  });
  it("tidak menyentuh kunci jika opsi salah yang dihapus", () => {
    const opts = [baseOpt("A", "", true), baseOpt("B"), baseOpt("C")];
    const result = removeOption(opts, 2);
    expect(result[0]!.is_correct).toBe(true);
  });
});
