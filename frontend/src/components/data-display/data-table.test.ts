import { describe, it, expect } from "vitest";
import { toCSV } from "./data-table";

describe("toCSV", () => {
  it("escapes commas and quotes", () => {
    const rows = [{ name: 'A, "B"', score: 10 }];
    const csv = toCSV(rows, ["name", "score"]);
    expect(csv).toContain('"A, ""B"""');
  });
  it("includes header row", () => {
    const csv = toCSV([{ a: 1 }], ["a"]);
    expect(csv.split("\n")[0]).toBe("a");
  });
});
