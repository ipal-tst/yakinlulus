import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { htmlToStagingRows, uploadDataUriImages } from "./docx-to-rows";

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

  it("mendeteksi gambar bersarang di dalam <p> dan tidak membuat baris hantu", () => {
    const html = `
      <p>1. Perhatikan grafik:</p>
      <p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="grafik"/></p>
      <p>A. 1</p>
      <p>B. 2</p>
      <p>2. Soal kedua tanpa gambar</p>
      <p>A. 3</p>
      <p>B. 4</p>
    `;
    const rows = htmlToStagingRows(html, defaults);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.has_image).toBe(true);
    expect(rows[0]!.content).toContain("![grafik](data:image/png;base64,");
    expect(rows[0]!.content).toContain("Perhatikan grafik:");
    expect(rows[0]!.content).not.toMatch(/Soal\s+1/);
    expect(rows[1]!.has_image).toBe(false);
    expect(rows[1]!.content).toContain("Soal kedua tanpa gambar");
  });
});

describe("uploadDataUriImages", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["x"], { type: "image/png" }),
      json: async () => ({ success: true, data: { url: "https://supabase/media/abc.png" } }),
    }) as any;
    localStorage.setItem("token", "test-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengupload data URI dan mengganti dengan URL Supabase", async () => {
    const content = "Perhatikan:\n\n![gambar](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==)";
    const result = await uploadDataUriImages(content);
    expect(result).toContain("![gambar](https://supabase/media/abc.png)");
    expect(result).not.toContain("data:image");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/media/upload",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
      })
    );
    const formData = (fetch as any).mock.calls.find((c: any[]) => c[0] === "/api/v1/media/upload")[1].body;
    expect(formData.get("entity_type")).toBe("QUESTION");
    expect(formData.get("file")).toBeInstanceOf(Blob);
  });

  it("tidak menyentuh konten tanpa data URI", async () => {
    const content = "Teks biasa tanpa gambar";
    const result = await uploadDataUriImages(content);
    expect(result).toBe(content);
    expect(fetch).not.toHaveBeenCalled();
  });
});
