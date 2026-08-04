Untuk **YakinLulus.id**, saya tidak menyarankan CMS hanya berupa tabel `pages` dan `posts`. Sebagai platform EdTech berskala besar, CMS harus menjadi **Content Management Platform** yang mengelola seluruh konten non-akademik, halaman website, landing page, blog, banner, SEO, media, FAQ, kebijakan, menu, hingga campaign marketing.

CMS ini berbeda dengan **Learning Material Domain**. Learning Material digunakan untuk materi pembelajaran siswa, sedangkan CMS digunakan untuk website dan kebutuhan pemasaran.

---

# CMS Domain Architecture

```text
CMS

├── Pages
├── Blog
├── Categories
├── Tags
├── Media Library
├── Menu Management
├── Banner
├── Hero Section
├── Landing Page
├── Widgets
├── Components
├── FAQ
├── Testimonials
├── Partners
├── Team
├── Events
├── News
├── SEO
├── Redirect
├── File Management
├── Versioning
├── Workflow
├── Publishing
├── Comment
├── Audit Log
└── Settings
```

---

# Domain Responsibility

CMS bertanggung jawab mengelola:

* Website yakinlulus.id
* Landing Page
* Blog
* News
* Event
* FAQ
* About Us
* Contact
* Privacy Policy
* Terms & Conditions
* Banner
* Promo
* Homepage
* Footer
* Navbar
* SEO
* Sitemap
* Robots
* Media Asset

---

# High Level ERD

```text
cms_pages
     │
     ├──────── cms_page_versions
     │
     ├──────── cms_page_blocks
     │
     ├──────── cms_page_seo
     │
     └──────── cms_page_publish

cms_posts
     │
     ├──────── cms_categories
     ├──────── cms_tags
     ├──────── cms_comments
     └──────── cms_post_versions

cms_media

cms_banners

cms_widgets

cms_components

cms_menus

cms_menu_items

cms_faq

cms_testimonials

cms_partners

cms_events

cms_news

cms_redirects

cms_settings

cms_audit_logs
```

---

# 1 cms_pages

Halaman website.

```text
id UUID PK

slug

title

subtitle

description

page_type

template

status

visibility

cover_image

thumbnail

author_id

editor_id

published_at

created_at

updated_at

deleted_at
```

Page Type

```text
HOME

ABOUT

CONTACT

FAQ

PRIVACY

TERM

LANDING

CUSTOM

```

---

# 2 cms_page_blocks

Builder halaman.

```text
id

page_id

component_type

component_name

sort_order

config JSONB

active

created_at
```

Contoh

```text
Hero

Feature

Pricing

FAQ

CTA

Gallery

Video

Statistic

Partner

Testimonial

Footer

```

---

# 3 cms_page_versions

Version control.

```text
id

page_id

version

title

content

editor_id

published

created_at
```

---

# 4 cms_page_publish

Workflow publish.

```text
id

page_id

status

approved_by

approved_at

scheduled_publish

published_at
```

Status

```text
DRAFT

REVIEW

APPROVED

PUBLISHED

ARCHIVED

```

---

# 5 cms_page_seo

SEO halaman.

```text
id

page_id

meta_title

meta_description

meta_keyword

canonical_url

robots

og_title

og_description

og_image

schema_json JSONB

updated_at
```

---

# 6 cms_posts

Blog.

```text
id

slug

title

excerpt

content

cover_image

category_id

author_id

status

published_at

reading_time

view_count

like_count

share_count

created_at

updated_at
```

---

# 7 cms_post_versions

Riwayat artikel.

```text
id

post_id

version

content

editor_id

created_at
```

---

# 8 cms_categories

Kategori.

```text
id

parent_id

name

slug

description

icon

sort_order

active
```

---

# 9 cms_tags

Tag.

```text
id

name

slug

color
```

---

# 10 cms_post_tags

Many-to-many.

```text
post_id

tag_id
```

---

# 11 cms_comments

Komentar blog.

```text
id

post_id

user_id

parent_comment

content

status

created_at
```

---

# 12 cms_media

Media library.

```text
id

uuid

filename

original_name

mime_type

extension

size

width

height

duration

storage_provider

storage_path

public_url

thumbnail_url

hash

uploaded_by

folder_id

created_at
```

Storage

* Supabase Storage
* S3
* MinIO

---

# 13 cms_media_folders

Folder media.

```text
id

parent_id

name

path

created_by
```

---

# 14 cms_banners

Banner.

```text
id

title

subtitle

image

mobile_image

button_text

button_link

position

priority

start_date

end_date

status
```

---

# 15 cms_widgets

Widget reusable.

```text
id

name

widget_type

config JSONB

active
```

---

# 16 cms_components

Komponen reusable.

```text
id

component_name

component_type

component_schema JSONB

version

active
```

---

# 17 cms_menus

Master menu.

```text
id

name

location

active
```

Lokasi

```text
HEADER

FOOTER

SIDEBAR

MOBILE

```

---

# 18 cms_menu_items

Item menu.

```text
id

menu_id

parent_id

title

url

icon

sort_order

target

active
```

---

# 19 cms_faq

FAQ.

```text
id

category

question

answer

sort_order

active
```

---

# 20 cms_testimonials

Testimoni.

```text
id

name

photo

school

city

rating

content

active
```

---

# 21 cms_partners

Partner.

```text
id

name

logo

website

priority

active
```

---

# 22 cms_events

Event.

```text
id

title

description

banner

start_time

end_time

location

registration_url

status
```

---

# 23 cms_news

Berita.

```text
id

title

slug

content

cover

category

status

published_at
```

---

# 24 cms_redirects

SEO Redirect.

```text
id

from_url

to_url

redirect_type

active
```

301 / 302

---

# 25 cms_sitemap

Sitemap.

```text
id

url

priority

change_frequency

last_modified
```

---

# 26 cms_settings

Konfigurasi CMS.

```text
id

setting_key

setting_value

description
```

Contoh

```text
site_name

site_logo

favicon

maintenance_mode

google_analytics

facebook_pixel

google_tag_manager

```

---

# 27 cms_languages

Multi bahasa.

```text
id

code

name

default

active
```

---

# 28 cms_translations

Terjemahan.

```text
id

language_id

table_name

record_id

field_name

translated_text
```

---

# 29 cms_forms

Form Builder.

```text
id

title

slug

success_message

email_receiver

active
```

---

# 30 cms_form_submissions

Hasil form.

```text
id

form_id

payload JSONB

ip_address

created_at
```

---

# 31 cms_audit_logs

Audit.

```text
id

actor_id

action

table_name

record_id

old_data JSONB

new_data JSONB

ip_address

created_at
```

---

# Workflow CMS

```text
Author

   │

Create Draft

   │

Editor Review

   │

Approval

   │

Schedule Publish

   │

Published

   │

Archived

```

---

# Index Strategy

## cms_pages

* slug UNIQUE
* status
* page_type
* published_at DESC

## cms_posts

* slug UNIQUE
* category_id
* status
* published_at DESC

## cms_media

* hash UNIQUE
* filename
* uploaded_by
* mime_type

## cms_comments

* post_id
* status

---

# Integrasi dengan Domain Lain

CMS menjadi domain yang menyuplai seluruh konten publik dan pemasaran YakinLulus.id serta terintegrasi dengan:

* **Notification**: publikasi artikel, event, banner, dan pengumuman dapat memicu push notification, email, atau broadcast.
* **Finance & Membership**: landing page paket premium, halaman promo, voucher, pricing, dan kampanye pemasaran.
* **Analytics**: pencatatan page view, CTR banner, performa landing page, konversi CTA, dan engagement artikel.
* **User & RBAC**: workflow author–editor–approver, hak akses CMS, dan audit perubahan konten.
* **Media Storage**: seluruh aset gambar, video, PDF, dan dokumen menggunakan media library terpusat sehingga dapat dipakai ulang oleh CMS maupun domain lain seperti Learning Material.

## Rekomendasi Tambahan untuk YakinLulus.id

Untuk platform EdTech enterprise, saya juga merekomendasikan beberapa tabel tambahan yang sering dibutuhkan tetapi sering terlupakan:

| Tabel                   | Fungsi                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `cms_landing_pages`     | Landing page khusus campaign atau iklan dengan konfigurasi mandiri.              |
| `cms_ab_tests`          | A/B testing untuk banner, CTA, dan landing page.                                 |
| `cms_popups`            | Popup promo, webinar, atau pengumuman berdasarkan aturan tertentu.               |
| `cms_content_schedules` | Penjadwalan publikasi dan pencabutan konten otomatis.                            |
| `cms_content_relations` | Relasi antar konten (misalnya artikel terkait, event terkait, atau FAQ terkait). |
| `cms_search_index`      | Indeks pencarian internal untuk mempercepat pencarian konten.                    |

Dengan struktur ini, CMS YakinLulus.id siap mendukung website perusahaan, blog, pemasaran digital, SEO, landing page, dan workflow editorial tanpa bercampur dengan domain akademik seperti Bank Soal, Learning Material, atau CBT Engine.
