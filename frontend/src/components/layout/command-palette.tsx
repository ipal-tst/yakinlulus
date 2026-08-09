"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { getAdminNav, flattenNav } from "@/config/admin-nav";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => (user ? flattenNav(getAdminNav(user.role)) : []), [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return items;
    return items.filter((it) => it.title.toLocaleLowerCase().includes(q) || it.href.toLocaleLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(0);
    setQuery("");
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const navigate = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Cari halaman</DialogTitle>
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Tab") {
                if (filtered.length > 0) {
                  e.preventDefault();
                  setIndex((i) => (i + 1) % filtered.length);
                }
              } else if (e.key === "Enter") {
                if (filtered[index]) navigate(filtered[index].href);
              }
            }}
            placeholder="Cari halaman admin…"
            className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm"
          />
        </div>
        <ul className="max-h-80 overflow-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada hasil untuk “{query}”</li>
          )}
          {filtered.map((it, i) => {
            const Icon = it.icon;
            return (
              <li key={it.href}>
                <button
                  type="button"
                  onMouseMove={() => setIndex(i)}
                  onClick={() => navigate(it.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left",
                    i === index ? "bg-primary/10 text-primary" : "text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{it.title}</span>
                  <span className="text-[10px] text-muted-foreground">{it.href}</span>
                  {i === index && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}