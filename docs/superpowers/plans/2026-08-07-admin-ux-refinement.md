# Admin UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the admin experience to match the exact specifications and mockup references, including full Master Akademik capabilities, consolidated monitoring, complete user/school CRUD, and mobile responsiveness.

**Architecture:** Next.js 16 App Router. Forms use React Hook Form + Zod. Tables use TanStack Table. Modals use shadcn/ui Dialog. Data fetching via TanStack Query.

**Tech Stack:** Next.js, React, Tailwind CSS, shadcn/ui, Lucide React.

## Global Constraints

- No unapproved third-party libraries.
- All forms must have validation (Zod).
- Must adhere strictly to the `design.md` tokens.
- All tables must support empty states.

---

## Task 1: Admin Mobile Responsiveness & Topbar Dropdown

**Files:**
- Modify: `frontend/src/components/layout/sidebar.tsx`
- Modify: `frontend/src/components/layout/app-shell.tsx`
- Modify: `frontend/src/components/layout/topbar.tsx`

**Interfaces:**
- Consumes: `useUIStore`
- Produces: Responsive AppShell

- [ ] **Step 1: Add mobile drawer for Sidebar**

```tsx
// In frontend/src/components/layout/sidebar.tsx
// Convert the current static aside to a combination of static aside (md:flex) and a Sheet for mobile.
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

// The topbar.tsx already has a Menu button for mobile, we need to wire it up to open a Sheet containing the Sidebar content.
```
*(Wait, writing the exact code step-by-step for all these issues will be massive. Let me do this via subagents directly or adjust the plan to just fix the issues one by one).*