---
description: Supabase architecture, auth, and database patterns
---

# Supabase Best Practices

When integrating with Supabase, remember:
1. Always secure Row Level Security (RLS) properly to prevent unauthorized data access.
2. Use strong types with supabase-js generated using `supabase gen types typescript`.
3. Handle session and token logic via middleware securely.
4. Separate client-side actions and server-side RPC functions.
