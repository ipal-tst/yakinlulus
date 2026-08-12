import { describe, it, expect } from "vitest";
import { USER_EXPORT_HEADERS, userImportRowToPayload, userRowToCells } from "./user-excel";

describe("user-excel", () => {
    it("memetakan baris user ke sel", () => {
        const cells = userRowToCells({
            username: "ahmad",
            email: "ahmad@x.id",
            full_name: "Ahmad",
            role: "SISWA",
            status: "ACTIVE",
            gender: "L",
            phone: "0812",
            school_name: "SMA 1",
        });
        expect(cells).toEqual(["ahmad", "ahmad@x.id", "Ahmad", "SISWA", "ACTIVE", "L", "0812", "SMA 1"]);
    });

    it("header berisi 8 kolom", () => {
        expect(USER_EXPORT_HEADERS).toHaveLength(8);
    });

    it("membaca baris import", () => {
        const p = userImportRowToPayload({ EMAIL: "siti@x.id", FULL_NAME: "Siti", ROLE: "SISWA" });
        expect(p.email).toBe("siti@x.id");
        expect(p.role).toBe("SISWA");
        expect(p.phone).toBeUndefined();
    });
});
