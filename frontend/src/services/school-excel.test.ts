import { describe, it, expect } from "vitest";
import { exportFilename } from "./school-excel";

describe("exportFilename", () => {
    it("prefix + tanggal", () => {
        expect(exportFilename("sekolah")).toMatch(/^sekolah-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
});
