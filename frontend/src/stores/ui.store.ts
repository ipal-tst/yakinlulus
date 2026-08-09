import { create } from "zustand";

interface UIState {
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    collapsedGroups: string[];
    toggleGroup: (title: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
    collapsedGroups: [],
    toggleGroup: (title: string) =>
        set((state) => ({
            collapsedGroups: state.collapsedGroups.includes(title)
                ? state.collapsedGroups.filter((t) => t !== title)
                : [...state.collapsedGroups, title],
        })),
}));