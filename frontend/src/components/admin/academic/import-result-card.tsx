"use client";

import type { BulkResult } from "./academic-excel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ImportResultCardProps {
  result: BulkResult;
  title?: string;
}

export function ImportResultCard({
  result,
  title = "Hasil Import",
}: ImportResultCardProps) {
  const { processed, deleted, failed, errors } = result;
  const allEmpty = processed === 0 && deleted === 0 && failed === 0;

  if (allEmpty) {
    return (
      <Card className="rounded-2xl p-4 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Tidak ada data diproses.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl p-4 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <Badge variant="success" className="text-xs">
            Dibuat: {processed}
          </Badge>
          <Badge variant="warning" className="text-xs">
            Dilewati: {deleted}
          </Badge>
          <Badge variant="destructive" className="text-xs">
            Gagal: {failed}
          </Badge>
        </div>

        {errors.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
            <ul className="space-y-1">
              {errors.map((err) => (
                <li
                  key={`${err.row}-${err.message}`}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <span className="shrink-0 font-medium text-destructive">
                    #{err.row}
                  </span>
                  <span>{err.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
