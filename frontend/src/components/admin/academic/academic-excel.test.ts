import { describe, it, expect } from "vitest";
import { kindLabel } from "./academic-excel";

describe("kindLabel", () => {
  it("maps level to Jenjang", () => {
    expect(kindLabel("level")).toBe("Jenjang");
  });

  it("maps grade to Kelas", () => {
    expect(kindLabel("grade")).toBe("Kelas");
  });

  it("maps subject to Mata Pelajaran", () => {
    expect(kindLabel("subject")).toBe("Mata Pelajaran");
  });

  it("maps curriculum to Kurikulum", () => {
    expect(kindLabel("curriculum")).toBe("Kurikulum");
  });

  it("maps program to Program", () => {
    expect(kindLabel("program")).toBe("Program");
  });
});
