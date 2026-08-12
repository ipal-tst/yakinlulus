"use client";

import { Trash2, Check, X, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onExport?: () => void;
  busy?: boolean;
}

export function BulkActionBar({
  count,
  onDelete,
  onActivate,
  onDeactivate,
  onExport,
  busy = false,
}: BulkActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card shadow-sm">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-6 py-3">
        <Badge variant="secondary" className="text-sm font-semibold">
          {count} terpilih
        </Badge>
        <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={busy}
        >
          <Trash2 className="size-4" />
          Hapus
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onActivate}
          disabled={busy}
        >
          <Check className="size-4" />
          Aktifkan
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeactivate}
          disabled={busy}
        >
          <X className="size-4" />
          Nonaktifkan
        </Button>
        {onExport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            disabled={busy}
          >
            <Download className="size-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
