"use client";

let workerConfigured = false;

function configureWorker() {
    if (workerConfigured) return;
    workerConfigured = true;
    import("pdfjs-dist").then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    });
}

/**
 * Renders each page of a PDF to a JPEG data-URL using pdf.js.
 * Returns at most `maxPages` pages.
 */
export async function renderPdfToPages(file: File, maxPages = 30): Promise<string[]> {
    configureWorker();
    const pdfjs = await import("pdfjs-dist");

    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;

    const pages: string[] = [];
    const count = Math.min(pdf.numPages, maxPages);
    for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvas, viewport }).promise;
        pages.push(canvas.toDataURL("image/jpeg", 0.85));
    }
    return pages;
}
