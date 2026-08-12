package auth

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"yakinlulus.id/backend/internal/shared"
)

type Role struct {
	ID          uuid.UUID  `json:"id"`
	Code        string     `json:"code"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	Priority    int        `json:"priority"`
	IsSystem    bool       `json:"is_system"`
	UserCount   int        `json:"user_count"`
	CreatedAt   time.Time  `json:"created_at"`
}

type PermissionItem struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Desc   string `json:"desc"`
	Allow  bool   `json:"allow"`
}

var PermissionCatalog = []PermissionItem{
	{ID: "academic.read", Label: "Academic — baca", Desc: "Lihat master akademik, sekolah, target"},
	{ID: "academic.write", Label: "Academic — tulis", Desc: "Ubah jenjang/kelas/mapel/kurikulum"},
	{ID: "content.read", Label: "Konten — baca", Desc: "Lihat materi, bank soal, ujian"},
	{ID: "content.write", Label: "Konten — tulis", Desc: "Authoring materi, soal, ujian"},
	{ID: "financial.read", Label: "Keuangan — baca", Desc: "Lihat laporan & transaksi"},
	{ID: "financial.write", Label: "Keuangan — tulis", Desc: "Kelola membership & pembayaran"},
	{ID: "users.read", Label: "Pengguna — baca", Desc: "Lihat daftar pengguna"},
	{ID: "users.write", Label: "Pengguna — tulis", Desc: "Kelola user & assign role"},
	{ID: "analytics.view", Label: "Analitik — lihat", Desc: "Akses laporan hasil belajar"},
}

var defaultRolePerms = map[string]map[string]bool{
	"SUPER_ADMIN": {"academic.read": true, "academic.write": true, "content.read": true, "content.write": true, "financial.read": true, "financial.write": true, "users.read": true, "users.write": true, "analytics.view": true},
	"STAFF":       {"academic.read": true, "academic.write": true, "content.read": true, "content.write": true, "users.read": true, "users.write": true, "analytics.view": true},
	"FINANCE":     {"financial.read": true, "financial.write": true, "analytics.view": true},
	"GURU":        {"academic.read": true, "content.read": true, "content.write": true},
	"INVESTOR":    {"financial.read": true, "analytics.view": true},
	"SUPER_SISWA": {"academic.read": true, "content.read": true, "analytics.view": true},
	"SISWA":       {"academic.read": true, "content.read": true},
}

func (r *Repository) ListRoles(ctx context.Context) ([]Role, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT r.id, r.code, r.name, r.description, r.priority, r.is_system, r.created_at,
		       (SELECT COUNT(*) FROM identity.user_role ur WHERE ur.role_id = r.id) AS user_count
		FROM identity.role r
		WHERE r.deleted_at IS NULL
		ORDER BY r.priority ASC, r.name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Role
	for rows.Next() {
		var rl Role
		if err := rows.Scan(&rl.ID, &rl.Code, &rl.Name, &rl.Description, &rl.Priority, &rl.IsSystem, &rl.CreatedAt, &rl.UserCount); err != nil {
			return nil, err
		}
		out = append(out, rl)
	}
	return out, nil
}

func (r *Repository) CreateRole(ctx context.Context, code, name string, description *string, priority int) (*Role, error) {
	id := uuid.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.role (id, code, name, description, priority, is_system)
		VALUES ($1, $2, $3, $4, $5, false)`,
		id, code, name, description, priority)
	if err != nil {
		return nil, err
	}
	return &Role{ID: id, Code: code, Name: name, Description: description, Priority: priority, IsSystem: false, CreatedAt: time.Now()}, nil
}

func (r *Repository) UpdateRole(ctx context.Context, id uuid.UUID, name *string, description *string, priority *int) (*Role, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE identity.role SET
			name = COALESCE($2, name),
			description = CASE WHEN $3::text IS NULL THEN description ELSE $3 END,
			priority = COALESCE($4, priority),
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`, id, name, description, priority)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, fiber.NewError(fiber.StatusNotFound, "Role not found")
	}
	var rl Role
	err = r.pool.QueryRow(ctx, `
		SELECT id, code, name, description, priority, is_system, created_at,
		       (SELECT COUNT(*) FROM identity.user_role ur WHERE ur.role_id = r.id)
		FROM identity.role r WHERE r.id = $1 AND r.deleted_at IS NULL`, id).
		Scan(&rl.ID, &rl.Code, &rl.Name, &rl.Description, &rl.Priority, &rl.IsSystem, &rl.CreatedAt, &rl.UserCount)
	if err != nil {
		return nil, err
	}
	return &rl, nil
}

func (r *Repository) DeleteRole(ctx context.Context, id uuid.UUID) error {
	var isSystem bool
	var userCount int
	err := r.pool.QueryRow(ctx, `SELECT is_system, (SELECT COUNT(*) FROM identity.user_role ur WHERE ur.role_id = r.id) FROM identity.role r WHERE r.id = $1 AND r.deleted_at IS NULL`, id).
		Scan(&isSystem, &userCount)
	if err == pgx.ErrNoRows {
		return fiber.NewError(fiber.StatusNotFound, "Role not found")
	}
	if err != nil {
		return err
	}
	if isSystem {
		return fiber.NewError(fiber.StatusForbidden, "Cannot delete system role")
	}
	if userCount > 0 {
		return fiber.NewError(fiber.StatusConflict, "Role is assigned to users")
	}
	_, err = r.pool.Exec(ctx, `UPDATE identity.role SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *Repository) GetRolePermissions(ctx context.Context, roleID uuid.UUID) ([]PermissionItem, error) {
	var roleCode string
	err := r.pool.QueryRow(ctx, `SELECT code FROM identity.role WHERE id = $1 AND deleted_at IS NULL`, roleID).Scan(&roleCode)
	if err == pgx.ErrNoRows {
		return nil, fiber.NewError(fiber.StatusNotFound, "Role not found")
	}
	if err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT p.code, rp.allow
		FROM identity.role_permission rp
		JOIN identity.permission p ON p.id = rp.permission_id
		WHERE rp.role_id = $1`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	overrides := map[string]bool{}
	for rows.Next() {
		var code string
		var allow bool
		if err := rows.Scan(&code, &allow); err != nil {
			return nil, err
		}
		overrides[code] = allow
	}
	defaults := defaultRolePerms[roleCode]
	out := make([]PermissionItem, 0, len(PermissionCatalog))
	for _, p := range PermissionCatalog {
		allow, ok := overrides[p.ID]
		if !ok {
			allow = defaults[p.ID]
		}
		out = append(out, PermissionItem{ID: p.ID, Label: p.Label, Desc: p.Desc, Allow: allow})
	}
	return out, nil
}

func (r *Repository) UpsertRolePermissions(ctx context.Context, roleID uuid.UUID, perms []PermissionItem) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var roleCode string
	if err := tx.QueryRow(ctx, `SELECT code FROM identity.role WHERE id = $1 AND deleted_at IS NULL`, roleID).Scan(&roleCode); err == pgx.ErrNoRows {
		return fiber.NewError(fiber.StatusNotFound, "Role not found")
	} else if err != nil {
		return err
	}
	if roleCode == "SUPER_ADMIN" {
		return fiber.NewError(fiber.StatusForbidden, "SUPER_ADMIN permissions cannot be changed")
	}

	for _, p := range perms {
		// upsert module → resource → permission (lazy seed)
		if _, err := tx.Exec(ctx, `INSERT INTO identity.permission_module (code, name) VALUES ($1, $1) ON CONFLICT (code) DO NOTHING`, moduleOf(p.ID)); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO identity.permission_resource (module_id, code, name)
			SELECT id, $1, $1 FROM identity.permission_module WHERE code = $2
			ON CONFLICT (code) DO NOTHING`, resourceOf(p.ID), moduleOf(p.ID)); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO identity.permission (resource_id, code, name)
			SELECT pr.id, $1, $2 FROM identity.permission_resource pr WHERE pr.code = $3
			ON CONFLICT (code) DO NOTHING`, p.ID, p.Label, resourceOf(p.ID)); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO identity.role_permission (role_id, permission_id, allow)
			SELECT $1, id, $2 FROM identity.permission WHERE code = $3
			ON CONFLICT (role_id, permission_id) DO UPDATE SET allow = EXCLUDED.allow`, roleID, p.Allow, p.ID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func moduleOf(code string) string {
	parts := strings.Split(code, ".")
	if len(parts) == 0 {
		return code
	}
	return parts[0]
}

func resourceOf(code string) string {
	return moduleOf(code)
}

func (h *Handler) ListRoles(c *fiber.Ctx) error {
	roles, err := h.svc.repo.ListRoles(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list roles"))
	}
	return c.JSON(shared.Success(roles))
}

func (h *Handler) CreateRole(c *fiber.Ctx) error {
	var req struct {
		Code        string  `json:"code"`
		Name        string  `json:"name"`
		Description *string `json:"description"`
		Priority    int     `json:"priority"`
	}
	if err := c.BodyParser(&req); err != nil || strings.TrimSpace(req.Code) == "" || strings.TrimSpace(req.Name) == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "code and name required"))
	}
	if !isValidRoleCode(req.Code) {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "role code must be uppercase letters, digits, and underscore"))
	}
	role, err := h.svc.repo.CreateRole(c.Context(), strings.ToUpper(req.Code), req.Name, req.Description, req.Priority)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create role"))
	}
	return c.Status(201).JSON(shared.Success(role))
}

func (h *Handler) UpdateRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid role ID"))
	}
	var req struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Priority    *int    `json:"priority"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	role, err := h.svc.repo.UpdateRole(c.Context(), id, req.Name, req.Description, req.Priority)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update role"))
	}
	return c.JSON(shared.Success(role))
}

func (h *Handler) DeleteRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid role ID"))
	}
	if err := h.svc.repo.DeleteRole(c.Context(), id); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete role"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Role deleted"}))
}

func (h *Handler) GetRolePermissions(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid role ID"))
	}
	perms, err := h.svc.repo.GetRolePermissions(c.Context(), id)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get role permissions"))
	}
	return c.JSON(shared.Success(perms))
}

func (h *Handler) UpdateRolePermissions(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid role ID"))
	}
	var req struct {
		Permissions []PermissionItem `json:"permissions"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.Permissions) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "permissions required"))
	}
	if err := h.svc.repo.UpsertRolePermissions(c.Context(), id, req.Permissions); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update role permissions"))
	}
	perms, _ := h.svc.repo.GetRolePermissions(c.Context(), id)
	return c.JSON(shared.Success(perms))
}

func isValidRoleCode(code string) bool {
	if code == "" {
		return false
	}
	for _, c := range code {
		if !((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_') {
			return false
		}
	}
	return true
}
