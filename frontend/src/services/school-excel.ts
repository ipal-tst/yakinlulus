// src/services/school-excel.ts — helper murni untuk export/download xlsx.

export interface BulkResult {
    processed: number;
    deleted: number;
    failed: number;
    errors: { row: number; message: string }[];
}

export interface ImportResult {
    total_rows: number;
    success_count: number;
    failed_count: number;
    errors?: string[];
}

/** Unduh blob sebagai file (anchor + revoke). */
export function downloadBlob(blob: Blob, filename: string): void {
    const objUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objUrl);
}

/** Nama file ekspor: `<prefix>-<yyyy-mm-dd>.xlsx`. */
export function exportFilename(prefix: string): string {
    return `${prefix}-${new Date().toISOString().slice(0, 10)}.xlsx`;
}
