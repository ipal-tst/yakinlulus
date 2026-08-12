"use client";

import { useCallback, useMemo, useState } from "react";
import {
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
    header: string;
    accessorKey: keyof T | ((row: T) => React.ReactNode);
    cell?: (row: T) => React.ReactNode;
    enableSorting?: boolean;
}

interface TableColumn<T> {
    id: string;
    header: string | ((ctx: { table: { getRowModel: () => { rows: { original: T }[] } } }) => React.ReactNode);
    accessorFn?: (row: T) => unknown;
    cell?: (info: { row: { original: T } }) => React.ReactNode;
    enableSorting?: boolean;
    size?: number;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchPlaceholder?: string;
    pageSize?: number;
    enableExport?: boolean;
    selectable?: boolean;
    selectedRowIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    getRowId?: (row: T) => string;
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

export function DataTable<T extends object>({
    columns,
    data = [],
    searchPlaceholder = "Cari data...",
    pageSize = 10,
    enableExport = true,
    selectable = false,
    selectedRowIds,
    onSelectionChange,
    getRowId,
}: DataTableProps<T>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);

    const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    const resolveId = useMemo(() => {
        return (row: T) => (getRowId ? getRowId(row) : String((row as Record<string, unknown>).id ?? ""));
    }, [getRowId]);

    const selection = useMemo(
        () => (selectable ? selectedRowIds ?? new Set<string>() : undefined),
        [selectable, selectedRowIds]
    );

    const toggleRow = useCallback(
        (row: T, checked: boolean) => {
            if (!onSelectionChange) return;
            const id = resolveId(row);
            const next = new Set(selection);
            if (checked) next.add(id);
            else next.delete(id);
            onSelectionChange(next);
        },
        [onSelectionChange, resolveId, selection]
    );

    const tableColumns = useMemo<TableColumn<T>[]>(() => {
        const cols: TableColumn<T>[] = columns.map((col, i) => ({
            id: typeof col.accessorKey === "function" ? `col-${i}` : String(col.accessorKey),
            header: col.header,
            accessorFn: (row: T) =>
                typeof col.accessorKey === "function" ? undefined : (row as Record<string, unknown>)[col.accessorKey as string],
            cell: (info: { row: { original: T } }) => {
                const row = info.row.original;
                if (col.cell) return col.cell(row);
                if (typeof col.accessorKey === "function") return col.accessorKey(row);
                return String((row as Record<string, unknown>)[col.accessorKey as string] ?? "");
            },
            enableSorting: col.enableSorting ?? true,
        }));
        if (!selectable) return cols;
        return [
            {
                id: "__select__",
                header: (ctx: { table: { getRowModel: () => { rows: { original: T }[] } } }) => {
                    const t = ctx.table;
                    const pageIds = t.getRowModel().rows.map((r) => resolveId(r.original));
                    const allSelected = pageIds.length > 0 && pageIds.every((id: string) => selection?.has(id));
                    const someSelected = !allSelected && pageIds.some((id: string) => selection?.has(id));
                    return (
                        <Checkbox
                            aria-label="Pilih semua"
                            checked={allSelected}
                            indeterminate={someSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                if (!onSelectionChange) return;
                                const next = new Set(selection);
                                for (const id of pageIds) {
                                    if (checked) next.add(id);
                                    else next.delete(id);
                                }
                                onSelectionChange(next);
                            }}
                        />
                    );
                },
                cell: (info: { row: { original: T } }) => {
                    const row = info.row.original;
                    const id = resolveId(row);
                    return (
                        <Checkbox
                            aria-label="Pilih baris"
                            checked={selection?.has(id) ?? false}
                            onChange={(e) => toggleRow(row, e.target.checked)}
                        />
                    );
                },
                enableSorting: false,
                size: 40,
            },
            ...cols,
        ];
    }, [columns, selectable, selection, resolveId, toggleRow, onSelectionChange]);

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
        .map((c) => (typeof c.accessorKey === "string" ? (c.accessorKey as string) : undefined))
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
                            {table.getHeaderGroups().map((hg) => (
                                <tr key={hg.id}>
                                    {hg.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={cn(
                                                "px-4 py-3.5 whitespace-nowrap select-none",
                                                header.column.id === "__select__" &&
                                                    "sticky left-0 z-20 w-10 px-3 bg-muted/90 backdrop-blur-xs",
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
                                rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                                        {row.getVisibleCells ? row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={cn(
                                                    "px-4 py-3.5 align-middle",
                                                    cell.column.id === "__select__" && "sticky left-0 z-10 w-10 px-3 bg-card"
                                                )}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        )) : (
                                            row.getAllCells?.().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className={cn(
                                                        "px-4 py-3.5 align-middle",
                                                        cell.column.id === "__select__" && "sticky left-0 z-10 w-10 px-3 bg-card"
                                                    )}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length + (selectable ? 1 : 0)}
                                        className="h-32 text-center text-muted-foreground text-sm"
                                    >
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    {selectable && selection && selection.size > 0 && (
                        <span className="font-medium text-primary">
                            {selection.size} terpilih
                            {onSelectionChange && (
                                <button
                                    type="button"
                                    onClick={() => onSelectionChange(new Set())}
                                    className="ml-2 text-xs underline underline-offset-2 hover:text-foreground"
                                >
                                    Bersihkan
                                </button>
                            )}
                        </span>
                    )}
                    <span>
                        Halaman <span className="font-semibold text-foreground">{table.state?.pagination?.pageIndex + 1}</span> dari{" "}
                        <span className="font-semibold text-foreground">{table.getPageCount?.() ?? 1}</span> ({table.getFilteredRowModel()?.rows?.length ?? 0} item)
                    </span>
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
