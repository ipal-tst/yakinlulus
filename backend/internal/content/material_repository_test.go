package content

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping content material/progress integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func seedUser(t *testing.T, p *pgxpool.Pool, ctx context.Context, prefix string) uuid.UUID {
	t.Helper()
	u := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, u, prefix+"_"+u.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	// Register cleanup here so an early test failure never leaks the probe user.
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u)
	})
	return u
}

func TestMaterialRepositoryLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	owner := seedUser(t, p, ctx, "mat_owner")
	student := seedUser(t, p, ctx, "mat_student")

	base := &Content{
		ContentType: ContentTypeMaterial,
		GradeID:     uuid.Nil,
		SubjectID:   uuid.Nil, // academic catalog empty; junctions skipped
		Title:       "Pengenalan Trigonometri",
		Body:        "Sin, cos, tan adalah dasar trigonometri.",
		Status:      StatusDraft,
		CreatedBy:   owner,
	}
	// material.go Service.Create sets content_format into metadata before CreateContent.
	base.Metadata = map[string]interface{}{"content_format": string(MaterialFormatText)}

	if err := r.CreateContent(ctx, base); err != nil {
		t.Fatalf("CreateContent(MATERIAL): %v", err)
	}
	var materialID = base.ID
	if materialID == uuid.Nil {
		t.Fatal("CreateContent did not set Content.ID")
	}

	m := &Material{
		ContentID:         materialID,
		ContentFormat:     MaterialFormatText,
		EstimatedDuration: intPtr(15),
		ReadCount:         0,
		IsPreview:         false,
		Prerequisites:     []uuid.UUID{},
	}
	if err := r.CreateMaterial(ctx, m); err != nil {
		t.Fatalf("CreateMaterial: %v", err)
	}

	expDur := 15
	t.Cleanup(func() {
		// Residue-free: history first (material_id becomes NULL on SET NULL),
		// then progress, then material (cascades version/blocks/metadata/stats/junctions).
		_, _ = p.Exec(ctx, `DELETE FROM content.material_history WHERE material_id = $1`, materialID)
		_, _ = p.Exec(ctx, `DELETE FROM content.learning_progress WHERE material_id = $1`, materialID)
		_, _ = p.Exec(ctx, `DELETE FROM content.material WHERE id = $1`, materialID)
		for _, u := range []uuid.UUID{owner, student} {
			_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u)
		}
		// Zero-residue assertion across all probe tables.
		assertResidueZero(t, p, owner, student, materialID)
	})

	// Master + version + block + metadata + statistics rows created.
	var vCount, bCount, mdCount, stCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM content.material WHERE id=$1`, materialID).Scan(&mdCount); err != nil {
		t.Fatalf("count material: %v", err)
	}
	if mdCount != 1 {
		t.Errorf("material rows = %d, want 1", mdCount)
	}
	if err := p.QueryRow(ctx, `SELECT count(*) FROM content.material_version WHERE material_id=$1`, materialID).Scan(&vCount); err != nil {
		t.Fatalf("count version: %v", err)
	}
	if vCount != 1 {
		t.Errorf("version rows = %d, want 1", vCount)
	}
	if err := p.QueryRow(ctx, `
		SELECT count(*) FROM content.material_block b JOIN content.material_version mv ON mv.id = b.material_version_id
		WHERE mv.material_id=$1`, materialID).Scan(&bCount); err != nil {
		t.Fatalf("count block: %v", err)
	}
	if bCount != 1 {
		t.Errorf("block rows = %d, want 1", bCount)
	}
	if err := p.QueryRow(ctx, `SELECT count(*) FROM content.material_metadata WHERE material_id=$1`, materialID).Scan(&stCount); err != nil {
		t.Fatalf("count metadata: %v", err)
	}
	if stCount != 1 {
		t.Errorf("metadata rows = %d, want 1", stCount)
	}
	if err := p.QueryRow(ctx, `SELECT count(*) FROM content.material_statistics WHERE material_id=$1`, materialID).Scan(&stCount); err != nil {
		t.Fatalf("count statistics: %v", err)
	}
	if stCount != 1 {
		t.Errorf("statistics rows = %d, want 1", stCount)
	}

	// GetMaterial round-trip.
	got, err := r.GetMaterial(ctx, materialID)
	if err != nil {
		t.Fatalf("GetMaterial: %v", err)
	}
	if got.Content.Title != "Pengenalan Trigonometri" {
		t.Errorf("Title = %q, want Pengenalan Trigonometri", got.Content.Title)
	}
	if got.Content.Body != base.Body {
		t.Errorf("Body = %q, want %q", got.Content.Body, base.Body)
	}
	if got.Content.Status != StatusDraft {
		t.Errorf("Status = %q, want DRAFT", got.Content.Status)
	}
	if got.Material.ContentFormat != MaterialFormatText {
		t.Errorf("ContentFormat = %q, want TEXT", got.Material.ContentFormat)
	}
	if got.Material.EstimatedDuration == nil || *got.Material.EstimatedDuration != expDur {
		t.Errorf("EstimatedDuration = %v, want %d", got.Material.EstimatedDuration, expDur)
	}
	if got.ReadCount != 0 {
		t.Errorf("ReadCount = %d, want 0", got.ReadCount)
	}
	if got.Content.SubjectID != uuid.Nil {
		t.Errorf("SubjectID = %v, want Nil (empty academic)", got.Content.SubjectID)
	}

	// List finds it.
	items, total, err := r.ListMaterials(ctx, MaterialFilter{
		ContentFilter: ContentFilter{Limit: 20, Offset: 0},
	})
	if err != nil {
		t.Fatalf("ListMaterials: %v", err)
	}
	if total < 1 {
		t.Errorf("ListMaterials total = %d, want >= 1", total)
	}
	found := false
	for _, it := range items {
		if it.Content.ID == materialID {
			found = true
			break
		}
	}
	if !found {
		t.Error("ListMaterials did not return the created material")
	}

	// UpdateMaterial → version_no=2, old is_current=false, current_version_id flipped.
	if err := r.UpdateContent(ctx, materialID, UpdateContentReq{
		Title: strPtr("Trigonometri Dasar"),
		Body:  strPtr("Sekarang kita belajar sinus dan cosinus."),
	}); err != nil {
		t.Fatalf("UpdateContent(material): %v", err)
	}
	var oldVer uuid.UUID
	if err := p.QueryRow(ctx, `SELECT current_version_id FROM content.material WHERE id=$1`, materialID).Scan(&oldVer); err != nil {
		t.Fatalf("read v1 current_version_id: %v", err)
	}
	upd := &Material{ContentID: materialID, ContentFormat: MaterialFormatText, EstimatedDuration: &expDur, IsPreview: false}
	if err := r.UpdateMaterial(ctx, materialID, upd); err != nil {
		t.Fatalf("UpdateMaterial: %v", err)
	}

	var newVer uuid.UUID
	var newNo int
	var newCurrent bool
	if err := p.QueryRow(ctx, `
		SELECT id, version_no, is_current FROM content.material_version
		WHERE material_id=$1 ORDER BY version_no DESC LIMIT 1`, materialID).Scan(&newVer, &newNo, &newCurrent); err != nil {
		t.Fatalf("read v2: %v", err)
	}
	if newNo != 2 {
		t.Errorf("new version_no = %d, want 2", newNo)
	}
	if !newCurrent {
		t.Errorf("new version is_current = %v, want true", newCurrent)
	}
	var oldCurrent bool
	if err := p.QueryRow(ctx, `SELECT is_current FROM content.material_version WHERE id=$1`, oldVer).Scan(&oldCurrent); err != nil {
		t.Fatalf("read v1 is_current: %v", err)
	}
	if oldCurrent {
		t.Error("old version is_current = true, want false")
	}
	var curVer uuid.UUID
	if err := p.QueryRow(ctx, `SELECT current_version_id FROM content.material WHERE id=$1`, materialID).Scan(&curVer); err != nil {
		t.Fatalf("read current_version_id: %v", err)
	}
	if curVer != newVer {
		t.Errorf("current_version_id not flipped to v2")
	}
	// Updated body round-trips through the new version block.
	after, err := r.GetMaterial(ctx, materialID)
	if err != nil {
		t.Fatalf("GetMaterial after update: %v", err)
	}
	if after.Content.Body != "Sekarang kita belajar sinus dan cosinus." {
		t.Errorf("Body after update = %q, want new body", after.Content.Body)
	}

	// IncrementReadCount bumps view_count.
	if err := r.IncrementReadCount(ctx, materialID); err != nil {
		t.Fatalf("IncrementReadCount: %v", err)
	}
	var vc int
	if err := p.QueryRow(ctx, `SELECT view_count FROM content.material_statistics WHERE material_id=$1`, materialID).Scan(&vc); err != nil {
		t.Fatalf("read view_count: %v", err)
	}
	if vc != 1 {
		t.Errorf("view_count = %d, want 1", vc)
	}

	// Learning progress upsert twice (upsert path).
	lp1 := &LearningProgress{UserID: student, MaterialID: materialID, Progress: 30, LastPosition: strPtr("7")}
	if err := r.UpsertProgress(ctx, lp1); err != nil {
		t.Fatalf("UpsertProgress #1: %v", err)
	}
	if lp1.ID == uuid.Nil {
		t.Error("UpsertProgress did not set ID")
	}
	// Second upsert with higher progress + completed.
	lp2 := &LearningProgress{UserID: student, MaterialID: materialID, Progress: 100, LastPosition: strPtr("30"), Completed: true}
	if err := r.UpsertProgress(ctx, lp2); err != nil {
		t.Fatalf("UpsertProgress #2: %v", err)
	}
	var lpCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM content.learning_progress WHERE student_id=$1 AND material_id=$2`, student, materialID).Scan(&lpCount); err != nil {
		t.Fatalf("count progress: %v", err)
	}
	if lpCount != 1 {
		t.Errorf("learning_progress rows = %d, want 1 (upserted)", lpCount)
	}
	var pp float64
	var lp int
	var comp bool
	var completedAt *time.Time
	if err := p.QueryRow(ctx, `
		SELECT progress_percent, last_position, completed, completed_at
		FROM content.learning_progress WHERE student_id=$1 AND material_id=$2`, student, materialID).Scan(&pp, &lp, &comp, &completedAt); err != nil {
		t.Fatalf("read progress: %v", err)
	}
	if pp != 100 {
		t.Errorf("progress_percent = %v, want 100", pp)
	}
	if lp != 30 {
		t.Errorf("last_position = %d, want 30", lp)
	}
	if !comp {
		t.Error("completed = false, want true")
	}
	if completedAt == nil {
		t.Error("completed_at not set after completed upsert")
	}

	// GetProgress + ListProgressByUser round-trip the *string last_position.
	gotLP, err := r.GetProgress(ctx, student, materialID)
	if err != nil {
		t.Fatalf("GetProgress: %v", err)
	}
	if gotLP.Progress != 100 {
		t.Errorf("GetProgress.Progress = %v, want 100", gotLP.Progress)
	}
	if gotLP.LastPosition == nil || *gotLP.LastPosition != "30" {
		t.Errorf("GetProgress.LastPosition = %v, want '30'", gotLP.LastPosition)
	}
	if !gotLP.Completed {
		t.Error("GetProgress.Completed = false, want true")
	}
	lps, lTotal, err := r.ListProgressByUser(ctx, student, 20, 0)
	if err != nil {
		t.Fatalf("ListProgressByUser: %v", err)
	}
	if lTotal != 1 || len(lps) != 1 {
		t.Errorf("ListProgressByUser total=%d len=%d, want 1/1", lTotal, len(lps))
	}

	// DeleteMaterial soft-deletes + history.
	if err := r.DeleteMaterial(ctx, materialID); err != nil {
		t.Fatalf("DeleteMaterial: %v", err)
	}
	if _, err := r.GetMaterial(ctx, materialID); err == nil {
		t.Error("GetMaterial after DeleteMaterial should error (deleted_at filtered)")
	}
	var deletedAt *time.Time
	if err := p.QueryRow(ctx, `SELECT deleted_at FROM content.material WHERE id=$1`, materialID).Scan(&deletedAt); err != nil {
		t.Fatalf("read deleted_at: %v", err)
	}
	if deletedAt == nil {
		t.Error("deleted_at not set on soft delete")
	}
}

// assertResidueZero asserts the probe rows are fully removed.
func assertResidueZero(t *testing.T, p *pgxpool.Pool, owner, student, materialID uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	queries := map[string]string{
		"material_history":  "SELECT count(*) FROM content.material_history WHERE material_id = $1",
		"material":          "SELECT count(*) FROM content.material WHERE id = $1",
		"material_version":  "SELECT count(*) FROM content.material_version WHERE material_id = $1",
		"material_block":    "SELECT count(*) FROM content.material_block WHERE material_version_id IN (SELECT id FROM content.material_version WHERE material_id = $1)",
		"material_metadata": "SELECT count(*) FROM content.material_metadata WHERE material_id = $1",
		"material_stats":    "SELECT count(*) FROM content.material_statistics WHERE material_id = $1",
		"learning_progress": "SELECT count(*) FROM content.learning_progress WHERE material_id = $1",
		"user_owner":        "SELECT count(*) FROM identity.user WHERE id = $1",
		"user_student":      "SELECT count(*) FROM identity.user WHERE id = $1",
	}
	for name, q := range queries {
		var n int
		id := materialID
		if name == "user_owner" {
			id = owner
		}
		if name == "user_student" {
			id = student
		}
		if err := p.QueryRow(ctx, q, id).Scan(&n); err == nil && n != 0 {
			t.Errorf("residue: %s has %d rows, want 0", name, n)
		}
	}
}

func strPtr(s string) *string {
	return &s
}

func intPtr(v int) *int {
	return &v
}