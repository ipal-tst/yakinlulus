# Yakinlulus.id Database Rebuild — Phase 20 (CMS)

## Status: Implemented & Applied

- Worktree: `yl-phase-20` (branch `phase-20`)
- Migrations: `200_cms_page` — `209_cms_form` (10 files, up + down)
- Domain tables: 31 (`cms` schema) — verified live: `cms=31`
- Migration history: `_migrations` total moved to **187**
- Other live domains at merge time: `integration=28`, `monitoring=28`

## Deliverables
- [x] Schema `cms` with 31 tables (enums via CHECK, RLS-ready, `gen_random_uuid` PK, `shared.set_updated_at` triggers for mutable tables, indexes on FK/status/slug)
- [x] Migration files (up + down) 200–209
- [x] Applied via `go run cmd/migrate/main.go up`
- [x] Independent verification of live DB (`cms=31`, `migrations=187`)

## Tables

| # | Table | Notes |
|---|-------|-------|
| 1 | `cms.cms_page` | pages, unique slug, status/page_type CHECK |
| 2 | `cms.cms_page_block` | page blocks, sort_order |
| 3 | `cms.cms_page_version` | page versioning, UNIQUE (page_id, version) |
| 4 | `cms.cms_page_publish` | publish workflow/approval |
| 5 | `cms.cms_page_seo` | per-page SEO, UNIQUE (page_id) |
| 6 | `cms.cms_post` | blog posts, unique slug, counters |
| 7 | `cms.cms_post_version` | post versioning |
| 8 | `cms.cms_category` | posts categories, self-referencing parent |
| 9 | `cms.cms_tag` | tags, unique slug |
| 10 | `cms.cms_post_tag` | post↔tag junction, PK (post_id, tag_id) |
| 11 | `cms.cms_comment` | comments, parent_comment self-ref, status CHECK |
| 12 | `cms.cms_media` | media assets, unique hash |
| 13 | `cms.cms_media_folder` | media folders, unique path |
| 14 | `cms.cms_banner` | banners, status CHECK |
| 15 | `cms.cms_widget` | widgets, config jsonb |
| 16 | `cms.cms_component` | components, UNIQUE (name, version) |
| 17 | `cms.cms_menu` | menu locations |
| 18 | `cms.cms_menu_item` | menu items, parent self-ref |
| 19 | `cms.cms_faq` | faq items |
| 20 | `cms.cms_testimonial` | testimonials, rating 1–5 CHECK |
| 21 | `cms.cms_partner` | partners |
| 22 | `cms.cms_event` | events, status CHECK |
| 23 | `cms.cms_news` | news, unique slug |
| 24 | `cms.cms_redirect` | redirects, redirect_type CHECK |
| 25 | `cms.cms_sitemap` | sitemap entries, unique url |
| 26 | `cms.cms_setting` | settings key/value, unique key |
| 27 | `cms.cms_language` | locales, unique code |
| 28 | `cms.cms_translation` | translations |
| 29 | `cms.cms_form` | forms, unique form_key |
| 30 | `cms.cms_contact` | contact messages, status CHECK |
| 31 | `cms.cms_subscriber` | newsletter subscribers, unique email |

## Verification evidence
```
cms=31
integration=28
monitoring=28
migrations= 187
```
(via `verify_main/main.go` against live Supabase, `PQURL` set)

## Next
- Merge `phase-20` → `main` after phases 18/19, resolve `progress.md` (git-ignored; `git rm --cached`), remove worktree, final full-domain verification.