"use client";

import { useMemo, useState } from "react";
import {
    ColumnDef,
    SortingState,
    flexRender,
    createCoreRowModel,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    columnVisibilityFeature,
    globalFilteringFeature,
    rowPaginationFeature,
    rowSortingFeature,
    columnFilteringFeature,
    tableFeatures,
    useTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
    header: string;
    accessorKey: keyof T | ((row: T) => React.ReactNode);
    cell?: (row: T) => React.ReactNode;
    enableSorting?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchPlaceholder?: string;
    pageSize?: number;
    enableExport?: boolean;
}

export function toCSV<T>(rows: T[], keys: string[]): string {
    const escape = (v: unknown) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = keys.join(",");
    const body = rows.map((r) => keys.map((k) => escape((r as Record<string, unknown>)[k])).join(","));
    return [header, ...body].join("\n");
}

const features = tableFeatures({
    columnVisibilityFeature,
    columnFilteringFeature,
    globalFilteringFeature,
    rowPaginationFeature,
    rowSortingFeature,
    coreRowModel: createCoreRowModel(),
    filteredRowModel: createFilteredRowModel(),
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
});

export function DataTable<T extends Record<string, any>>({
    columns,
    data = [],
    searchPlaceholder = "Cari data...",
    pageSize = 10,
    enableExport = true,
}: DataTableProps<T>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);

    const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    const tableColumns = useMemo(() => {
        return columns.map((col, i) => ({
            id: typeof col.accessorKey === "function" ? `col-${i}` : String(col.accessorKey),
            header: col.header,
            accessorFn: (row: T) =>
                typeof col.accessorKey === "function" ? undefined : (row as Record<string, unknown>)[col.accessorKey as string],
            cell: (info: any) => {
                const row = info.row.original as T;
                if (col.cell) return col.cell(row);
                if (typeof col.accessorKey === "function") return col.accessorKey(row);
                return String((row as Record<string, unknown>)[col.accessorKey as string] ?? "");
            },
            enableSorting: col.enableSorting ?? true,
        }));
    }, [columns]);

    const table = useTable({
        features,
        columns: tableColumns,
        data: safeData,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize,
            },
        },
    });

    const rows = table.getRowModel()?.rows || [];

    const exportKeys = columns
        .map((c) => (typeof c.accessorKey === "string" ? c.accessorKey : undefined))
        .filter((k): k is string => Boolean(k));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {enableExport && exportKeys.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                            const rows = table.getCoreRowModel().rows.map((r) => r.original as T);
                            const csv = toCSV(rows, exportKeys);
                            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "export.csv";
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <Download className="h-4 w-4" /> Ekspor CSV
                    </Button>
                )}
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="max-h-[560px] overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-xs uppercase text-muted-foreground font-semibold border-b border-border z-10">
                            {table.getHeaderGroups().map((hg: any) => (
                                <tr key={hg.id}>
                                    {hg.headers.map((header: any) => (
                                        <th
                                            key={header.id}
                                            className={cn(
                                                "px-4 py-3.5 whitespace-nowrap select-none",
                                                header.column.getCanSort && header.column.getCanSort() && "cursor-pointer hover:text-foreground"
                                            )}
                                            onClick={header.column.getToggleSortingHandler && header.column.getToggleSortingHandler()}
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort && header.column.getCanSort() &&
                                                    (header.column.getIsSorted && header.column.getIsSorted() ? (
                                                        header.column.getIsSorted() === "asc" ? (
                                                            <ChevronsUpDown className="h-3 w-3 rotate-180" />
                                                        ) : (
                                                            <ChevronsUpDown className="h-3 w-3" />
                                                        )
                                                    ) : (
                                                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                                                    ))}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {rows.length > 0 ? (
                                rows.map((row: any) => (
                                    <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                                        {row.getVisibleCells ? row.getVisibleCells().map((cell: any) => (
                                            <td key={cell.id} className="px-4 py-3.5 align-middle">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        )) : (
                                            row.getAllCells?.().map((cell: any) => (
                                                <td key={cell.id} className="px-4 py-3.5 align-middle">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                <div>
                    Halaman <span className="font-semibold text-foreground">{table.state?.pagination?.pageIndex + 1}</span> dari{" "}
                    <span className="font-semibold text-foreground">{table.getPageCount?.() ?? 1}</span> ({table.getFilteredRowModel()?.rows?.length ?? 0} item)
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage?.()}
                        disabled={!table.getCanPreviousPage?.()}
                        className="rounded-lg h-8 px-3"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage?.()}
                        disabled={!table.getCanNextPage?.()}
                        className="rounded-lg h-8 px-3"
                    >
                        Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
