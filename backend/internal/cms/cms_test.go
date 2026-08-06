package cms

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// testPool connects to the live DB via DB_URL and skips the test when the
// env var is absent (e.g. CI or offline).
func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping cms repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func TestCMSRepositoryLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	// Seed a real identity.user so author/editor FKs resolve.
	uid := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, uid, "cms_probe_"+uid.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() {
		if _, err := p.Exec(ctx, `DELETE FROM identity.user WHERE id=$1`, uid); err != nil {
			t.Errorf("cleanup user: %v", err)
		}
	})

	// ---- Pages: create -> slug -> version bump -> publish -> soft delete
	slug := "about-us-" + uid.String()[:8]
	pg, err := r.CreatePage(ctx, &Page{Slug: slug, Title: "About Us", PageType: "ABOUT", Status: "DRAFT", AuthorID: &uid}, nil)
	if err != nil {
		t.Fatalf("CreatePage: %v", err)
	}
	pageID := pg.ID

	// Draft page must NOT be visible via public slug read.
	if _, err := r.GetPageBySlug(ctx, slug); err != pgx.ErrNoRows {
		t.Fatalf("GetPageBySlug on DRAFT page: expected ErrNoRows, got %v", err)
	}

	// Version bump on update.
	if _, err := r.UpdatePage(ctx, &Page{ID: pageID, Slug: slug, Title: "About Us v2", PageType: "ABOUT", Visibility: "PUBLIC"}, &uid, nil, strPtr("hello")); err != nil {
		t.Fatalf("UpdatePage: %v", err)
	}
	vers, err := r.ListPageVersions(ctx, pageID)
	if err != nil {
		t.Fatalf("ListPageVersions: %v", err)
	}
	if len(vers) != 1 {
		t.Fatalf("expected 1 version after update, got %d", len(vers))
	}

	// Update on a non-existent page must 404-style ErrNoRows (previously
	// leaked a FK-constraint 500 by inserting a version for a missing page).
	if _, err := r.UpdatePage(ctx, &Page{ID: uuid.New(), Slug: "nope", Title: "x", PageType: "CUSTOM", Visibility: "PUBLIC"}, &uid, nil, strPtr("hi")); err != pgx.ErrNoRows {
		t.Fatalf("UpdatePage(nonexistent) err = %v, want pgx.ErrNoRows", err)
	}

	// Explicit version creation (version+1).
	v, err := r.CreatePageVersion(ctx, pageID, &uid, strPtr("About Us v2"), strPtr("by hand"))
	if err != nil {
		t.Fatalf("CreatePageVersion: %v", err)
	}
	if v != 2 {
		t.Fatalf("expected version 2, got %d", v)
	}

	// Publish -> published_at set.
	if err := r.PublishPage(ctx, pageID, uid); err != nil {
		t.Fatalf("PublishPage: %v", err)
	}
	pub, err := r.GetPageBySlug(ctx, slug)
	if err != nil {
		t.Fatalf("GetPageBySlug after publish: %v", err)
	}
	if pub == nil || pub.PublishedAt == nil {
		t.Fatalf("expected published page with published_at set, got %+v", pub)
	}

	// SEO upsert.
	if _, err := r.UpsertPageSEO(ctx, pageID, SaveSEORequest{MetaTitle: strPtr("About - YakinLulus")}); err != nil {
		t.Fatalf("UpsertPageSEO: %v", err)
	}

	// Soft delete -> filtered out of reads.
	if err := r.SoftDeletePage(ctx, pageID); err != nil {
		t.Fatalf("SoftDeletePage: %v", err)
	}
	if _, err := r.GetPageByID(ctx, pageID, false); err != pgx.ErrNoRows {
		t.Fatalf("expected ErrNoRows for deleted page, got %v", err)
	}

	// ---- post + category + tag
	cat, err := r.CreateCategory(ctx, &Category{Name: "Berita", Slug: "berita-" + uid.String()[:8], Active: true})
	if err != nil {
		t.Fatalf("CreateCategory: %v", err)
	}
	tag, err := r.CreateTag(ctx, &Tag{Name: "PTN", Slug: "ptn-" + uid.String()[:8], Color: strPtr("#333")})
	if err != nil {
		t.Fatalf("CreateTag: %v", err)
	}
	post, err := r.CreatePost(ctx, &Post{Slug: "post-1-" + uid.String()[:8], Title: "Post Satu", CategoryID: &cat.ID, AuthorID: &uid, Status: "PUBLISHED"}, []uuid.UUID{tag.ID})
	if err != nil {
		t.Fatalf("CreatePost: %v", err)
	}
	fetched, err := r.GetPostByID(ctx, post.ID)
	if err != nil {
		t.Fatalf("GetPostByID: %v", err)
	}
	if fetched.Category == nil || fetched.Category.ID != cat.ID {
		t.Fatalf("expected post category, got %+v", fetched.Category)
	}
	if len(fetched.Tags) != 1 || fetched.Tags[0].ID != tag.ID {
		t.Fatalf("expected 1 post tag, got %+v", fetched.Tags)
	}
	if _, err := r.GetPostBySlug(ctx, "post-1-"+uid.String()[:8]); err != nil {
		t.Fatalf("GetPostBySlug (PUBLISHED post): %v", err)
	}

	// soft delete post
	if err := r.SoftDeletePost(ctx, post.ID); err != nil {
		t.Fatalf("SoftDeletePost: %v", err)
	}
	if _, err := r.GetPostBySlug(ctx, "post-1-"+uid.String()[:8]); err != pgx.ErrNoRows {
		t.Fatalf("expected ErrNoRows for deleted post, got %v", err)
	}

	// ---- setting create/update/get
	settingKey := "site_name_" + uid.String()[:8]
	if _, err := r.UpsertSetting(ctx, settingKey, SaveSettingRequest{Value: strPtr("YakinLulus")}); err != nil {
		t.Fatalf("UpsertSetting create: %v", err)
	}
	if _, err := r.UpsertSetting(ctx, settingKey, SaveSettingRequest{Value: strPtr("YakinLulus.id")}); err != nil {
		t.Fatalf("UpsertSetting update: %v", err)
	}
	got, err := r.GetSetting(ctx, settingKey)
	if err != nil {
		t.Fatalf("GetSetting: %v", err)
	}
	if got.Value == nil || *got.Value != "YakinLulus.id" {
		t.Fatalf("unexpected setting value: %+v", got)
	}

	// ---- faq create/get
	faq, err := r.CreateFAQ(ctx, &FAQ{Question: "Apa itu YakinLulus?", Answer: strPtr("Platform bimbel"), Active: true})
	if err != nil {
		t.Fatalf("CreateFAQ: %v", err)
	}
	gf, err := r.GetFAQ(ctx, faq.ID)
	if err != nil {
		t.Fatalf("GetFAQ: %v", err)
	}
	if gf.Question != "Apa itu YakinLulus?" {
		t.Fatalf("unexpected faq content: %+v", gf)
	}

	// ---- cleanup via cascade: page cascades block/version/publish/seo;
	// post cascades post_version/post_tag; direct deletes for others.
	_, _ = p.Exec(ctx, `DELETE FROM cms.cms_page WHERE id=$1`, pageID)
	_, _ = p.Exec(ctx, `DELETE FROM cms.cms_post WHERE id=$1`, post.ID)
	_, _ = p.Exec(ctx, `DELETE FROM cms.cms_category WHERE id=$1`, cat.ID)
	_, _ = p.Exec(ctx, `DELETE FROM cms.cms_tag WHERE id=$1`, tag.ID)
	_, _ = p.Exec(ctx, `DELETE FROM cms.cms_setting WHERE setting_key=$1`, settingKey)
	_, _ = p.Exec(ctx, `DELETE FROM cms.cms_faq WHERE id=$1`, faq.ID)

	assertZeroResidue(t, p, ctx, pageID, post.ID, cat.ID, tag.ID, settingKey, faq.ID)
}

func TestCMSPagePostOwnership(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	// Seed identity.user rows so page/post author_id FKs resolve.
	author, other := uuid.New(), uuid.New()
	for _, u := range []uuid.UUID{author, other} {
		if _, err := p.Exec(ctx, `
			INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
			VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
			ON CONFLICT (id) DO NOTHING`, u, "own_probe_"+u.String()[:8]); err != nil {
			t.Fatalf("seed user: %v", err)
		}
	}
	t.Cleanup(func() {
		for _, u := range []uuid.UUID{author, other} {
			_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id=$1`, u)
		}
	})

	// Page authored by A: B (GURU) edit/delete denied; A allowed; staff any.
	slug := "own-page-" + author.String()[:8]
	pg, err := r.CreatePage(ctx, &Page{Slug: slug, Title: "Ownership", PageType: "CUSTOM", Status: "DRAFT", AuthorID: &author}, nil)
	if err != nil {
		t.Fatalf("CreatePage: %v", err)
	}
	fetched, err := r.GetPageByID(ctx, pg.ID, false)
	if err != nil {
		t.Fatalf("GetPageByID: %v", err)
	}
	if fetched.AuthorID == nil || *fetched.AuthorID != author {
		t.Fatalf("expected author %s got %v", author, fetched.AuthorID)
	}
	if allowedToMutate("GURU", &other, fetched.AuthorID) {
		t.Fatal("GURU B must NOT edit/delete A's page")
	}
	if !allowedToMutate("GURU", &author, fetched.AuthorID) {
		t.Fatal("GURU A must edit/delete own page")
	}
	if !allowedToMutate("SUPER_ADMIN", &other, fetched.AuthorID) {
		t.Fatal("SUPER_ADMIN must edit/delete any page")
	}
	if !allowedToMutate("STAFF", &other, fetched.AuthorID) {
		t.Fatal("STAFF must edit/delete any page")
	}

	// Post authored by A: same matrix.
	post, err := r.CreatePost(ctx, &Post{Slug: "own-post-" + author.String()[:8], Title: "Ownership Post", AuthorID: &author, Status: "DRAFT"}, nil)
	if err != nil {
		t.Fatalf("CreatePost: %v", err)
	}
	pf, err := r.GetPostByID(ctx, post.ID)
	if err != nil {
		t.Fatalf("GetPostByID: %v", err)
	}
	if pf.AuthorID == nil || *pf.AuthorID != author {
		t.Fatalf("expected author %s got %v", author, pf.AuthorID)
	}
	if allowedToMutate("GURU", &other, pf.AuthorID) {
		t.Fatal("GURU B must NOT edit/delete A's post")
	}
	if !allowedToMutate("GURU", &author, pf.AuthorID) {
		t.Fatal("GURU A must edit/delete own post")
	}
	if !allowedToMutate("SUPER_ADMIN", &other, pf.AuthorID) {
		t.Fatal("SUPER_ADMIN must edit/delete any post")
	}

	// Zero residue.
	_, _ = p.Exec(ctx, `DELETE FROM cms.cms_page WHERE id=$1`, pg.ID)
	_, _ = p.Exec(ctx, `DELETE FROM cms.cms_post WHERE id=$1`, post.ID)
	assertZeroResidue(t, p, ctx, pg.ID, post.ID, uuid.Nil, uuid.Nil, "", uuid.Nil)
}

func assertZeroResidue(t *testing.T, p *pgxpool.Pool, ctx context.Context, pageID, postID, catID, tagID uuid.UUID, settingKey string, faqID uuid.UUID) {
	t.Helper()
	queries := []struct {
		q   string
		id  uuid.UUID
		key string
	}{
		{q: `SELECT COUNT(*) FROM cms.cms_page WHERE id=$1`, id: pageID},
		{q: `SELECT COUNT(*) FROM cms.cms_page_block WHERE page_id=$1`, id: pageID},
		{q: `SELECT COUNT(*) FROM cms.cms_page_version WHERE page_id=$1`, id: pageID},
		{q: `SELECT COUNT(*) FROM cms.cms_page_publish WHERE page_id=$1`, id: pageID},
		{q: `SELECT COUNT(*) FROM cms.cms_page_seo WHERE page_id=$1`, id: pageID},
		{q: `SELECT COUNT(*) FROM cms.cms_post WHERE id=$1`, id: postID},
		{q: `SELECT COUNT(*) FROM cms.cms_post_version WHERE post_id=$1`, id: postID},
		{q: `SELECT COUNT(*) FROM cms.cms_post_tag WHERE post_id=$1`, id: postID},
		{q: `SELECT COUNT(*) FROM cms.cms_category WHERE id=$1`, id: catID},
		{q: `SELECT COUNT(*) FROM cms.cms_tag WHERE id=$1`, id: tagID},
		{q: `SELECT COUNT(*) FROM cms.cms_setting WHERE setting_key=$1`, key: settingKey},
		{q: `SELECT COUNT(*) FROM cms.cms_faq WHERE id=$1`, id: faqID},
	}
	for _, item := range queries {
		var n int
		var err error
		if item.key != "" {
			err = p.QueryRow(ctx, item.q, item.key).Scan(&n)
		} else {
			err = p.QueryRow(ctx, item.q, item.id).Scan(&n)
		}
		if err != nil {
			t.Fatalf("residue query %q: %v", item.q, err)
		}
		if n != 0 {
			t.Fatalf("zero residue violated: %q returned %d", item.q, n)
		}
	}
}