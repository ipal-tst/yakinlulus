package question_bank

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
		t.Skip("DB_URL not set; skipping question_bank repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func TestQuestionBankRepositoryLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	// Seed a real identity.user so question.owner_id/created_by FKs resolve.
	owner := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, owner, "qb_probe_"+owner.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	q := &Question{
		SubjectID:    uuid.Nil, // academic catalog is empty; junction must be skipped
		Content:      "Berapa hasil 1 + 1?",
		Difficulty:   "MEDIUM",
		QuestionType: QuestionTypeSingleChoice,
		Language:     "id",
		Score:        2.0,
		Explanation:  "1 + 1 = 2",
		CreatedBy:    owner,
		Status:       "",
	}
	opts := []QuestionOption{
		{Label: "A", Content: "1", IsCorrect: false},
		{Label: "B", Content: "2", IsCorrect: true},
	}

	if err := r.Create(ctx, q, opts); err != nil {
		t.Fatalf("Create: %v", err)
	}

	var questionID = q.ID
	var versionID uuid.UUID
	var jobID uuid.UUID
	t.Cleanup(func() {
		// Residue-free: history first (question_id becomes NULL on cascade),
		// then question (cascades version/blocks/options/metadata/junctions).
		_, _ = p.Exec(ctx, `DELETE FROM question.question_history WHERE question_id = $1`, questionID)
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, questionID)
		if jobID != uuid.Nil {
			_, _ = p.Exec(ctx, `DELETE FROM question.question_import_row WHERE job_id = $1`, jobID)
			_, _ = p.Exec(ctx, `DELETE FROM question.question_import_job WHERE id = $1`, jobID)
		}
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, owner)
	})

	if q.Status != "DRAFT" {
		t.Errorf("Create: status = %q, want DRAFT (default)", q.Status)
	}
	if err := p.QueryRow(ctx, `SELECT current_version_id FROM question.question WHERE id = $1`, q.ID).Scan(&versionID); err != nil {
		t.Fatalf("read current_version_id: %v", err)
	}
	if versionID == uuid.Nil {
		t.Error("current_version_id not set after Create")
	}

	// FindByID round-trip
	got, err := r.FindByID(ctx, q.ID)
	if err != nil {
		t.Fatalf("FindByID: %v", err)
	}
	if got.Content != q.Content {
		t.Errorf("Content = %q, want %q", got.Content, q.Content)
	}
	if got.Difficulty != "MEDIUM" {
		t.Errorf("Difficulty = %q, want MEDIUM", got.Difficulty)
	}
	if got.Status != "DRAFT" {
		t.Errorf("Status = %q, want DRAFT", got.Status)
	}
	if got.Explanation != q.Explanation {
		t.Errorf("Explanation = %q, want %q", got.Explanation, q.Explanation)
	}
	if got.Score != 2.0 {
		t.Errorf("Score = %v, want 2.0", got.Score)
	}
	if len(got.Options) != 2 {
		t.Fatalf("options len = %d, want 2", len(got.Options))
	}
	if got.Options[0].Label != "A" || got.Options[0].Content != "1" || got.Options[0].IsCorrect {
		t.Errorf("option[0] = %+v, want label A content '1' not correct", got.Options[0])
	}
	if !got.Options[1].IsCorrect {
		t.Errorf("option[1] should be correct")
	}
	if got.Options[1].DisplayOrder != 1 {
		t.Errorf("option[1] display_order = %d, want 1", got.Options[1].DisplayOrder)
	}

	// List
	items, total, err := r.List(ctx, nil, nil, "", "DRAFT", "", 10, 0)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total < 1 {
		t.Errorf("List total = %d, want >= 1", total)
	}
	found := false
	for _, it := range items {
		if it.ID == q.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("List: created question not found")
	}

	// Replace options
	newOpts := []QuestionOption{{Label: "C", Content: "Benar", IsCorrect: true}}
	if err := r.ReplaceOptions(ctx, q.ID, newOpts); err != nil {
		t.Fatalf("ReplaceOptions: %v", err)
	}
	opts2, err := r.GetOptions(ctx, q.ID)
	if err != nil {
		t.Fatalf("GetOptions: %v", err)
	}
	if len(opts2) != 1 || opts2[0].Label != "C" || !opts2[0].IsCorrect {
		t.Errorf("after ReplaceOptions got %+v, want single correct option C", opts2)
	}

	// Score must survive ReplaceOptions (data-loss regression: correct option's
	// stored score IS the question score; a replace must not reset it to 1.0).
	afterReplace, err := r.FindByID(ctx, q.ID)
	if err != nil {
		t.Fatalf("FindByID after ReplaceOptions: %v", err)
	}
	if afterReplace.Score != 2.0 {
		t.Errorf("Score after ReplaceOptions = %v, want 2.0 (preserved)", afterReplace.Score)
	}

	// Non-owner (GURU) delete must be a no-op.
	other := uuid.New()
	if err := r.Delete(ctx, q.ID, other, false); err != pgx.ErrNoRows {
		t.Fatalf("Delete by non-owner err = %v, want pgx.ErrNoRows", err)
	}
	if _, err := r.FindByID(ctx, q.ID); err != nil {
		t.Fatalf("question should still exist after non-owner delete, got: %v", err)
	}

	// Owner delete soft-deletes and filters it out.
	if err := r.Delete(ctx, q.ID, owner, false); err != nil {
		t.Fatalf("Delete by owner: %v", err)
	}
	if _, err := r.FindByID(ctx, q.ID); err == nil {
		t.Error("FindByID after owner delete should return error (deleted_at filtered)")
	}

	// Import job/row probes
	jobID, err = r.CreateImportJob(ctx, "probe.json", 1, owner)
	if err != nil {
		t.Fatalf("CreateImportJob: %v", err)
	}
	if err := r.CreateImportRowLog(ctx, jobID, 1, []byte(`{}`), "IMPORTED", "", &q.ID); err != nil {
		t.Fatalf("CreateImportRowLog: %v", err)
	}
	if err := r.UpdateImportJob(ctx, jobID, 1, 0, "COMPLETED", ""); err != nil {
		t.Fatalf("UpdateImportJob: %v", err)
	}
	var jobStatus string
	if err := p.QueryRow(ctx, `SELECT status FROM question.question_import_job WHERE id = $1`, jobID).Scan(&jobStatus); err != nil {
		t.Fatalf("read job status: %v", err)
	}
	if jobStatus != "SUCCESS" {
		t.Errorf("job status = %q, want SUCCESS (COMPLETED mapped)", jobStatus)
	}
}

func TestQuestionBankRepositoryUpdate(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	owner := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, owner, "qb_probe_"+owner.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	q := &Question{
		SubjectID:    uuid.Nil,
		Content:      "versi awal",
		Difficulty:   "EASY",
		QuestionType: QuestionTypeSingleChoice,
		Language:     "id",
		Score:        2.0,
		Explanation:  "penjelasan awal",
		CreatedBy:    owner,
		Status:       "",
	}
	opts := []QuestionOption{
		{Label: "A", Content: "salah", IsCorrect: false},
		{Label: "B", Content: "benar", IsCorrect: true},
	}
	if err := r.Create(ctx, q, opts); err != nil {
		t.Fatalf("Create: %v", err)
	}
	questionID := q.ID
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM question.question_history WHERE question_id = $1`, questionID)
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, questionID)
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, owner)
	})

	// Capture the original (v1) version id before updating.
	var oldVer uuid.UUID
	if err := p.QueryRow(ctx, `SELECT current_version_id FROM question.question WHERE id = $1`, questionID).Scan(&oldVer); err != nil {
		t.Fatalf("read v1 current_version_id: %v", err)
	}

	upd := &Question{
		ID:           questionID,
		SubjectID:    uuid.Nil,
		Content:      "versi kedua",
		Difficulty:   "HARD",
		QuestionType: QuestionTypeSingleChoice,
		Language:     "id",
		Score:        0, // no explicit change; repo must preserve existing 2.0
		Explanation:  "penjelasan baru",
		CreatedBy:    owner,
	}
	updOpts := []QuestionOption{
		{Label: "A", Content: "jawaban salah 2", IsCorrect: false},
		{Label: "B", Content: "jawaban benar 2", IsCorrect: true},
	}
	if err := r.Update(ctx, upd, updOpts, owner); err != nil {
		t.Fatalf("Update: %v", err)
	}

	// New version created with version_no=2 and is_current=true.
	var newVer uuid.UUID
	var newNo int
	var newCurrent bool
	if err := p.QueryRow(ctx, `
		SELECT id, version_no, is_current FROM question.question_version
		WHERE question_id = $1 ORDER BY version_no DESC LIMIT 1`, questionID).Scan(&newVer, &newNo, &newCurrent); err != nil {
		t.Fatalf("read v2: %v", err)
	}
	if newNo != 2 {
		t.Errorf("new version_no = %d, want 2", newNo)
	}
	if !newCurrent {
		t.Errorf("new version is_current = %v, want true", newCurrent)
	}

	// Old version flipped to is_current=false.
	var oldCurrent bool
	if err := p.QueryRow(ctx, `SELECT is_current FROM question.question_version WHERE id = $1`, oldVer).Scan(&oldCurrent); err != nil {
		t.Fatalf("read v1 is_current: %v", err)
	}
	if oldCurrent {
		t.Error("old version is_current = true, want false after update")
	}

	// question.current_version_id flipped to the new version.
	var curVer uuid.UUID
	if err := p.QueryRow(ctx, `SELECT current_version_id FROM question.question WHERE id = $1`, questionID).Scan(&curVer); err != nil {
		t.Fatalf("read current_version_id: %v", err)
	}
	if curVer != newVer {
		t.Errorf("current_version_id = %v, want %v (flipped to v2)", curVer, newVer)
	}

	// Options copied into the new version with scores intact (2.0 on correct).
	var optCount int
	var correctScore float64
	if err := p.QueryRow(ctx, `
		SELECT count(*), COALESCE((SELECT MAX(score) FROM question.question_option
			WHERE question_version_id = $1 AND is_correct), 0) FROM question.question_option
		WHERE question_version_id = $1`, newVer).Scan(&optCount, &correctScore); err != nil {
		t.Fatalf("read v2 options: %v", err)
	}
	if optCount != 2 {
		t.Errorf("v2 option count = %d, want 2", optCount)
	}
	if correctScore != 2.0 {
		t.Errorf("v2 correct option score = %v, want 2.0 (preserved)", correctScore)
	}

	// FindByID reflects updated content/difficulty and preserved score.
	got, err := r.FindByID(ctx, questionID)
	if err != nil {
		t.Fatalf("FindByID after Update: %v", err)
	}
	if got.Content != "versi kedua" {
		t.Errorf("Content = %q, want versi kedua", got.Content)
	}
	if got.Difficulty != "HARD" {
		t.Errorf("Difficulty = %q, want HARD", got.Difficulty)
	}
	if got.Score != 2.0 {
		t.Errorf("Score = %v, want 2.0", got.Score)
	}
	if got.Explanation != "penjelasan baru" {
		t.Errorf("Explanation = %q, want penjelasan baru", got.Explanation)
	}
	if len(got.Options) != 2 {
		t.Fatalf("options len = %d, want 2", len(got.Options))
	}
	if !got.Options[1].IsCorrect || got.Options[1].Content != "jawaban benar 2" {
		t.Errorf("option[1] = %+v, want correct 'jawaban benar 2'", got.Options[1])
	}

	// History row written atomically for the update.
	var hCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM question.question_history WHERE question_id = $1 AND action = 'UPDATE'`, questionID).Scan(&hCount); err != nil {
		t.Fatalf("count history: %v", err)
	}
	if hCount != 1 {
		t.Errorf("UPDATE history rows = %d, want 1", hCount)
	}
}

func TestQuestionBankStatusTransitions(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	owner := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, owner, "qb_probe_"+owner.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	q := &Question{
		Content:      "soal transisi status",
		Difficulty:   "EASY",
		QuestionType: QuestionTypeSingleChoice,
		CreatedBy:    owner,
		Status:       "DRAFT",
	}
	if err := r.Create(ctx, q, nil); err != nil {
		t.Fatalf("Create: %v", err)
	}
	questionID := q.ID
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM question.question_history WHERE question_id = $1`, questionID)
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, questionID)
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, owner)
	})

	getStatus := func() string {
		var out string
		if err := p.QueryRow(ctx, `
			SELECT COALESCE(st.code, '') FROM question.question q
			LEFT JOIN question.question_status st ON st.id = q.status_id
			WHERE q.id = $1`, questionID).Scan(&out); err != nil {
			t.Fatalf("read status: %v", err)
		}
		return out
	}

	// Publish (DRAFT -> PUBLISHED). Must not error, status flips, published_at set.
	if err := r.Publish(ctx, questionID, owner); err != nil {
		t.Fatalf("Publish: %v", err)
	}
	if s := getStatus(); s != "PUBLISHED" {
		t.Fatalf("after Publish status = %q, want PUBLISHED", s)
	}
	if got, _ := r.FindByID(ctx, questionID); got.PublishedAt == nil {
		t.Error("after Publish, published_at should be set")
	}

	// Archive (PUBLISHED -> ARCHIVED). Must not error.
	if err := r.ArchiveQuestion(ctx, questionID, owner); err != nil {
		t.Fatalf("ArchiveQuestion: %v", err)
	}
	if s := getStatus(); s != "ARCHIVED" {
		t.Fatalf("after Archive status = %q, want ARCHIVED", s)
	}
	// published_at should now be nil (not PUBLISHED).
	if got, _ := r.FindByID(ctx, questionID); got.PublishedAt != nil {
		t.Error("after Archive, published_at should be nil")
	}

	// Restore (ARCHIVED -> DRAFT). Must not error (was the Critical bug).
	if err := r.RestoreQuestion(ctx, questionID, owner); err != nil {
		t.Fatalf("RestoreQuestion: %v", err)
	}
	if s := getStatus(); s != "DRAFT" {
		t.Fatalf("after Restore status = %q, want DRAFT", s)
	}

	// Publish again then Unpublish (PUBLISHED -> DRAFT). Must not error.
	if err := r.Publish(ctx, questionID, owner); err != nil {
		t.Fatalf("Publish (2nd): %v", err)
	}
	if err := r.UnpublishQuestion(ctx, questionID, owner); err != nil {
		t.Fatalf("UnpublishQuestion: %v", err)
	}
	if s := getStatus(); s != "DRAFT" {
		t.Fatalf("after Unpublish status = %q, want DRAFT", s)
	}
	if got, _ := r.FindByID(ctx, questionID); got.PublishedAt != nil {
		t.Error("after Unpublish, published_at should be nil")
	}

	// Wrong-state publish must be a no-op (no history row written).
	historyCount := func() int {
		var n int
		if err := p.QueryRow(ctx, `SELECT count(*) FROM question.question_history WHERE question_id = $1`, questionID).Scan(&n); err != nil {
			t.Fatalf("read history count: %v", err)
		}
		return n
	}
	// Bring it to PUBLISHED, then attempt a second publish (DRAFT precondition unmet).
	if err := r.Publish(ctx, questionID, owner); err != nil {
		t.Fatalf("Publish (setup): %v", err)
	}
	if s := getStatus(); s != "PUBLISHED" {
		t.Fatalf("setup publish status = %q, want PUBLISHED", s)
	}
	before := historyCount()
	if err := r.Publish(ctx, questionID, owner); err != nil {
		t.Fatalf("Publish (wrong state, already PUBLISHED): %v", err)
	}
	if s := getStatus(); s != "PUBLISHED" {
		t.Fatalf("wrong-state publish changed status to %q, want PUBLISHED unchanged", s)
	}
	if after := historyCount(); after != before {
		t.Errorf("wrong-state publish wrote history: before=%d after=%d, want unchanged", before, after)
	}
}

func TestQuestionBankCreateWithBlocks(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	owner := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, owner, "qb_blocks_"+owner.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	qWithBlocks := &Question{
		SubjectID:    uuid.Nil,
		Content:      "",
		Difficulty:   "MEDIUM",
		QuestionType: QuestionTypeSingleChoice,
		Language:     "id",
		Score:        1.0,
		CreatedBy:    owner,
		Status:       "",
		Blocks: []QuestionBlock{
			{BlockType: "PARAGRAPH", Content: "Stimulus teks"},
			{BlockType: "IMAGE", Content: "asset-abc-123"},
			{BlockType: "PARAGRAPH", Content: "Pertanyaan inti"},
		},
	}
	qLegacy := &Question{
		SubjectID:    uuid.Nil,
		Content:      "Soal tanpa blok eksplisit",
		Difficulty:   "EASY",
		QuestionType: QuestionTypeTrueFalse,
		Language:     "id",
		Score:        1.0,
		CreatedBy:    owner,
		Status:       "",
	}

	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM question.question_history WHERE question_id = $1`, qWithBlocks.ID)
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, qWithBlocks.ID)
		_, _ = p.Exec(ctx, `DELETE FROM question.question_history WHERE question_id = $1`, qLegacy.ID)
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, qLegacy.ID)
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, owner)
	})

	if err := r.Create(ctx, qWithBlocks, nil); err != nil {
		t.Fatalf("Create (blocks): %v", err)
	}

	blockRows := func(qid uuid.UUID) []struct {
		order    int
		bt       string
		content  string
		assetNil bool
	} {
		rows, err := p.Query(ctx, `
			SELECT qb.block_order, qb.block_type, qb.content, qb.asset_id IS NULL
			FROM question.question_block qb
			JOIN question.question_version v ON v.id = qb.question_version_id
			JOIN question.question q ON q.current_version_id = v.id
			WHERE q.id = $1
			ORDER BY qb.block_order ASC`, qid)
		if err != nil {
			t.Fatalf("read blocks: %v", err)
		}
		defer rows.Close()
		var out []struct {
			order    int
			bt       string
			content  string
			assetNil bool
		}
		for rows.Next() {
			var r0 struct {
				order    int
				bt       string
				content  string
				assetNil bool
			}
			if err := rows.Scan(&r0.order, &r0.bt, &r0.content, &r0.assetNil); err != nil {
				t.Fatalf("scan block: %v", err)
			}
			out = append(out, r0)
		}
		return out
	}

	got := blockRows(qWithBlocks.ID)
	if len(got) != 3 {
		t.Fatalf("blocks len = %d, want 3", len(got))
	}
	want := []struct {
		bt      string
		content string
	}{
		{"PARAGRAPH", "Stimulus teks"},
		{"IMAGE", "asset-abc-123"},
		{"PARAGRAPH", "Pertanyaan inti"},
	}
	for i, w := range want {
		if got[i].bt != w.bt || got[i].content != w.content {
			t.Errorf("block[%d] = (%s, %q), want (%s, %q)", i, got[i].bt, got[i].content, w.bt, w.content)
		}
	}

	// Legacy path: Content only must still write a single PARAGRAPH block.
	if err := r.Create(ctx, qLegacy, nil); err != nil {
		t.Fatalf("Create (legacy): %v", err)
	}
	lg := blockRows(qLegacy.ID)
	if len(lg) != 1 || lg[0].bt != "PARAGRAPH" || lg[0].content != "Soal tanpa blok eksplisit" {
		t.Errorf("legacy blocks = %+v, want single PARAGRAPH block with content", lg)
	}
}
