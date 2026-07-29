"""Batch wire admin pages with TanStack Query hooks."""
from hermes_tools import patch

BASE = "D:/Project/EdTech/Yakinlulus.id/depan akhir/app/(portal)/admin"

pages = [
    # (path, hook_import, old_data_pattern, new_data_pattern)
    # Each tuple: (file, import_add, old_text, new_text)
]

# ===== 1. admin/page.tsx (dashboard) =====
pages.append((f"{BASE}/page.tsx",
    """import { useAdminDashboard } from "@/lib/api";""",
    """import { apiClient } from "@/lib/api-client";
import {""",
    """import {""",
))
# More complex - need to read the full file first. Let me use a different approach.

print("Starting page wiring...")
