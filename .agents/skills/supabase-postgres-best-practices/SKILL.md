---
description: PostgreSQL database design and query optimization for Supabase
---

# Supabase Postgres Best Practices

For Postgres within a Supabase context:
1. Optimize schema design with foreign keys, cascading deletes, and appropriate indexes.
2. Avoid N+1 queries by leveraging Postgres views and Supabase joins (`select('*, relation(*)')`).
3. Limit table privileges and rely on RLS policies to define user read/write boundaries.
4. Take advantage of built-in extensions (like `pg_trgm` for search) natively.
