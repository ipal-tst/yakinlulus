import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";

describe("MathKaTeXPreview", () => {
    it("renders markdown image inline", () => {
        render(<MathKaTeXPreview content={"Perhatikan grafik:\n\n![grafik](https://cdn.x.id/g.png)\n\nJika x=2..."} />);
        const img = document.querySelector("img") as HTMLImageElement;
        expect(img).not.toBeNull();
        expect(img.getAttribute("src")).toBe("https://cdn.x.id/g.png");
        expect(img.getAttribute("alt")).toBe("grafik");
    });

    it("renders markdown text + image in order", () => {
        const { container } = render(<MathKaTeXPreview content={"teks awal\n\n![g](https://cdn.x.id/g.png)\n\nteks akhir"} />);
        const p = container.querySelectorAll("p");
        expect(p[0]?.textContent).toContain("teks awal");
        expect(p[2]?.textContent).toContain("teks akhir");
    });

    it("renders inline and block LaTeX via KaTeX", () => {
        const { container } = render(<MathKaTeXPreview content={"Jika $x^2 + y^2 = r^2$ dan $$E=mc^2$$ maka..."} />);
        expect(container.querySelector(".katex")).not.toBeNull();
        expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(2);
    });

    it("does not render raw HTML (XSS-safe)", () => {
        render(<MathKaTeXPreview content={"teks <img src=x onerror=alert(1)> <script>alert(1)</script>"} />);
        expect(document.querySelector("img")).toBeNull();
        expect(document.querySelector("script")).toBeNull();
    });

    it("does not render img with empty src", () => {
        render(<MathKaTeXPreview content={"teks\n\n![](  )\n\n![x]()\n\nisi"} />);
        expect(document.querySelector("img")).toBeNull();
    });
});
