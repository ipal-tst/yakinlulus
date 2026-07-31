import { describe, it, expect } from "vitest";
import { htmlToStagingRows } from "./docx-to-rows";

const defaults = { source: "UTBK", subject_id: "subj-1", chapter_id: "" };

describe("htmlToStagingRows", () => {
  it("memecah soal berdasarkan nomor dan mendeteksi opsi A-E", () => {
    const html = `
      <h1>Bank Soal Matematika</h1>
      <p>1. Berapakah hasil dari 2 + 3?</p>
      <p>A. 5</p>
      <p>B. 6</p>
      <p>C. 7</p>
      <p>D. 8</p>
      <p>2. Manakah bilangan prima?</p>
      <p>A. 4</p>
      <p>B. 7</p>
    `;
    const rows = htmlToStagingRows(html, defaults);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.content).toContain("Berapakah hasil dari 2 + 3?");
    expect(rows[0]!.options.map(o => o.label)).toEqual(["A", "B", "C", "D"]);
    expect(rows[0]!.options.every(o => !o.is_correct)).toBe(true);
    expect(rows[0]!.has_image).toBe(false);
  });

  it("mengkonversi tabel menjadi markdown table", () => {
    const html = `
      <p>1. Perhatikan tabel berikut!</p>
      <table>
        <tr><td>x</td><td>1</td><td>2</td></tr>
        <tr><td>y</td><td>3</td><td>5</td></tr>
      </table>
      <p>A. 3</p>
      <p>B. 5</p>
    `;
    const rows = htmlToStagingRows(html, defaults);
    expect(rows[0]!.content).toContain("| x | 1 | 2 |");
  });

  it("menyisipkan data URI gambar sebagai placeholder markdown", () => {
    const html = `
      <p>1. Perhatikan grafik:</p>
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="grafik" />
      <p>A. 1</p>
      <p>B. 2</p>
    `;
    const rows = htmlToStagingRows(html, defaults);
    expect(rows[0]!.content).toContain("![grafik](data:image/png;base64,");
    expect(rows[0]!.has_image).toBe(true);
  });
});
