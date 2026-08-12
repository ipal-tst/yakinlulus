package auth

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"

	"yakinlulus.id/backend/internal/importxlsx"
	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type AdminCreateUserReq struct {
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Password string    `json:"password"`
	FullName string    `json:"full_name"`
	Role     string    `json:"role"`
	Gender   *string   `json:"gender"`
	Phone    *string   `json:"phone"`
	SchoolID *uuid.UUID `json:"school_id"`
	GradeID  *uuid.UUID `json:"grade_id"`
	MajorID  *uuid.UUID `json:"major_id"`
	Status   string    `json:"status"`
}

type AdminUpdateUserReq struct {
	Email    *string    `json:"email,omitempty"`
	FullName *string    `json:"full_name,omitempty"`
	Role     *string    `json:"role,omitempty"`
	Status   *string    `json:"status,omitempty"`
	Gender   *string    `json:"gender,omitempty"`
	Phone    *string    `json:"phone,omitempty"`
	SchoolID *uuid.UUID `json:"school_id"`
	GradeID  *uuid.UUID `json:"grade_id"`
	MajorID  *uuid.UUID `json:"major_id"`
}

func (h *Handler) AdminCreateUser(c *fiber.Ctx) error {
	var req AdminCreateUserReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Email == "" || req.Password == "" || req.FullName == "" || req.Role == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "email, password, full_name, role required"))
	}
	if err := validatePassword(req.Password); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	if req.Role == middleware.RoleSuperAdmin {
		actorRole, _ := c.Locals("role").(string)
		if actorRole != middleware.RoleSuperAdmin {
			return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "Only SUPER_ADMIN can assign SUPER_ADMIN role"))
		}
	}
	existing, _ := h.svc.repo.FindByEmail(c.Context(), strings.ToLower(strings.TrimSpace(req.Email)))
	if existing != nil {
		return c.Status(409).JSON(shared.Error(shared.ErrConflict, "Email already registered"))
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to hash password"))
	}
	status := req.Status
	if status == "" {
		status = "ACTIVE"
	}
	user := &User{
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         req.Role,
		Status:       status,
		IsActive:     status == "ACTIVE",
		Gender:       req.Gender,
		Phone:        req.Phone,
	}
	academic := &AcademicUpsert{SchoolID: req.SchoolID, GradeID: req.GradeID, MajorID: req.MajorID}
	if err := h.svc.repo.Create(c.Context(), user, req.Role, academic); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create user"))
	}
	created, _ := h.svc.repo.FindByID(c.Context(), user.ID)
	return c.Status(201).JSON(shared.Success(created))
}

func (h *Handler) AdminGetUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	user, err := h.svc.repo.FindByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get user"))
	}
	if user == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "User not found"))
	}
	return c.JSON(shared.Success(user))
}

func (h *Handler) AdminUpdateUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	user, err := h.svc.repo.FindByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get user"))
	}
	if user == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "User not found"))
	}
	if user.Role == middleware.RoleSuperAdmin {
		actorRole, _ := c.Locals("role").(string)
		if actorRole != middleware.RoleSuperAdmin {
			return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "Cannot modify SUPER_ADMIN user"))
		}
	}
	var req AdminUpdateUserReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.Role != nil {
		if *req.Role == middleware.RoleSuperAdmin && user.Role != middleware.RoleSuperAdmin {
			actorRole, _ := c.Locals("role").(string)
			if actorRole != middleware.RoleSuperAdmin {
				return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "Only SUPER_ADMIN can assign SUPER_ADMIN role"))
			}
		}
		user.Role = *req.Role
	}
	if req.Status != nil {
		user.Status = *req.Status
		user.IsActive = *req.Status == "ACTIVE"
	}
	if req.Gender != nil {
		user.Gender = req.Gender
	}
	if req.Phone != nil {
		user.Phone = req.Phone
	}
	academic := &AcademicUpsert{SchoolID: req.SchoolID, GradeID: req.GradeID, MajorID: req.MajorID}
	if err := h.svc.repo.UpdateUser(c.Context(), user, academic); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update user"))
	}
	updated, _ := h.svc.repo.FindByID(c.Context(), id)
	return c.JSON(shared.Success(updated))
}

func (h *Handler) AdminDeleteUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	user, err := h.svc.repo.FindByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get user"))
	}
	if user == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "User not found"))
	}
	if user.Role == middleware.RoleSuperAdmin {
		actorRole, _ := c.Locals("role").(string)
		if actorRole != middleware.RoleSuperAdmin {
			return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "Cannot delete SUPER_ADMIN user"))
		}
	}
	if err := h.svc.repo.SoftDelete(c.Context(), id); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, err.Error()))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "User deleted"}))
}

func (h *Handler) BulkDeleteUsers(c *fiber.Ctx) error {
	var req struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "ids required"))
	}
	type bulkResult struct {
		Processed int      `json:"processed"`
		Deleted   int      `json:"deleted"`
		Failed    int      `json:"failed"`
		Errors    []string `json:"errors,omitempty"`
	}
	res := &bulkResult{Processed: len(req.IDs)}
	actorRole, _ := c.Locals("role").(string)
	for _, id := range req.IDs {
		u, err := h.svc.repo.FindByID(c.Context(), id)
		if err != nil || u == nil {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("%s: user not found", id))
			continue
		}
		if u.Role == middleware.RoleSuperAdmin && actorRole != middleware.RoleSuperAdmin {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("%s: cannot delete SUPER_ADMIN user", id))
			continue
		}
		if err := h.svc.repo.SoftDelete(c.Context(), id); err != nil {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("%s: %v", id, err))
			continue
		}
		res.Deleted++
	}
	return c.JSON(shared.Success(res))
}

func (h *Handler) BulkStatusUsers(c *fiber.Ctx) error {
	var req struct {
		IDs      []uuid.UUID `json:"ids"`
		IsActive bool        `json:"is_active"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "ids required"))
	}
	type bulkResult struct {
		Processed int      `json:"processed"`
		Updated   int      `json:"updated"`
		Failed    int      `json:"failed"`
		Errors    []string `json:"errors,omitempty"`
	}
	res := &bulkResult{Processed: len(req.IDs)}
	actorRole, _ := c.Locals("role").(string)
	for _, id := range req.IDs {
		u, err := h.svc.repo.FindByID(c.Context(), id)
		if err != nil || u == nil {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("%s: user not found", id))
			continue
		}
		if u.Role == middleware.RoleSuperAdmin && actorRole != middleware.RoleSuperAdmin {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("%s: cannot modify SUPER_ADMIN user", id))
			continue
		}
		if err := h.svc.repo.SetActive(c.Context(), id, req.IsActive); err != nil {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("%s: %v", id, err))
			continue
		}
		res.Updated++
	}
	return c.JSON(shared.Success(res))
}

var userExportHeader = []string{"USERNAME", "EMAIL", "FULL_NAME", "ROLE", "STATUS", "GENDER", "PHONE", "SCHOOL"}

var userImportTemplateHeader = []string{"USERNAME", "EMAIL", "PASSWORD", "FULL_NAME", "ROLE", "STATUS", "GENDER", "PHONE", "SCHOOL"}

func usersTemplateWorkbook() ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()
	sheetName := "Users"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")
	for i, h := range userImportTemplateHeader {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}
	example := []interface{}{"ahmad", "ahmad@yakinlulus.id", "Contoh123!", "Ahmad Rizki", "SISWA", "ACTIVE", "L", "08123456789", "SMA Negeri 1 Jakarta"}
	for i, v := range example {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheetName, cell, v)
	}
	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (h *Handler) UsersImportTemplate(c *fiber.Ctx) error {
	b, err := usersTemplateWorkbook()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to build template"))
	}
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", `attachment; filename="template_import_pengguna.xlsx"`)
	return c.Send(b)
}

func (h *Handler) ExportUsersXlsx(c *fiber.Ctx) error {
	f := UserListFilter{Page: 1, Limit: 10000, Q: c.Query("q", ""), Role: c.Query("role", ""), Status: c.Query("status", ""), EducationLevel: c.Query("education_level", "")}
	var req struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if c.Method() == "POST" {
		_ = c.BodyParser(&req)
	}
	var users []User
	if len(req.IDs) > 0 {
		for _, id := range req.IDs {
			u, err := h.svc.repo.FindByID(c.Context(), id)
			if err != nil || u == nil {
				continue
			}
			users = append(users, *u)
		}
	} else {
		all, _, err := h.svc.repo.FindAll(c.Context(), f)
		if err != nil {
			return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export users"))
		}
		users = all
	}
	file := excelize.NewFile()
	defer file.Close()
	sheetName := "Users"
	index, err := file.NewSheet(sheetName)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export users"))
	}
	file.SetActiveSheet(index)
	file.DeleteSheet("Sheet1")
	for i, h := range userExportHeader {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		file.SetCellValue(sheetName, cell, h)
	}
	rowIdx := 2
	for _, u := range users {
		vals := []interface{}{u.Username, u.Email, u.FullName, u.Role, u.Status, derefOrEmpty(u.Gender), derefOrEmpty(u.Phone), derefOrEmpty(u.SchoolName)}
		for i, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(i+1, rowIdx)
			file.SetCellValue(sheetName, cell, v)
		}
		rowIdx++
	}
	buf, err := file.WriteToBuffer()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export users"))
	}
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="pengguna-%s.xlsx"`, time.Now().Format("2006-01-02")))
	return c.Send(buf.Bytes())
}

func derefOrEmpty(p *string) interface{} {
	if p == nil {
		return ""
	}
	return *p
}

type userImportResult struct {
	JobID        uuid.UUID `json:"job_id"`
	TotalRows    int       `json:"total_rows"`
	SuccessCount int       `json:"success_count"`
	FailedCount  int       `json:"failed_count"`
	Errors       []string  `json:"errors,omitempty"`
}

func (h *Handler) ImportUsersXlsx(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "file required"))
	}
	f, err := fileHeader.Open()
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "cannot open file"))
	}
	defer f.Close()

	rows, err := importxlsx.Parse(f, "Users")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	jobID, err := importxlsx.Job(c.Context(), h.svc.repo.pool, "IDENTITY", "import-users", fileHeader.Filename)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create import job"))
	}
	res := &userImportResult{JobID: jobID, TotalRows: len(rows)}

	validRoles := map[string]bool{middleware.RoleSuperAdmin: true, middleware.RoleStaff: true, middleware.RoleFinance: true, middleware.RoleGuru: true, middleware.RoleSiswa: true, middleware.RoleSuperSiswa: true, middleware.RoleInvestor: true}

	for _, row := range rows {
		email := row.Cells["EMAIL"]
		password := row.Cells["PASSWORD"]
		fullName := row.Cells["FULL_NAME"]
		role := row.Cells["ROLE"]
		schoolName := row.Cells["SCHOOL"]

		if email == "" || password == "" || fullName == "" || role == "" {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "EMAIL, PASSWORD, FULL_NAME, ROLE required")
			res.FailedCount++
			continue
		}
		if !strings.Contains(email, "@") {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "invalid email")
			res.FailedCount++
			continue
		}
		if !validRoles[role] {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid role: %s", role))
			res.FailedCount++
			continue
		}
		if role == middleware.RoleSuperAdmin {
			actorRole, _ := c.Locals("role").(string)
			if actorRole != middleware.RoleSuperAdmin {
				importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "only SUPER_ADMIN can import SUPER_ADMIN users")
				res.FailedCount++
				continue
			}
		}
		if err := validatePassword(password); err != nil {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, err.Error())
			res.FailedCount++
			continue
		}
		existing, _ := h.svc.repo.FindByEmail(c.Context(), strings.ToLower(strings.TrimSpace(email)))
		if existing != nil {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "duplicate email")
			res.FailedCount++
			continue
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "hash failed")
			res.FailedCount++
			continue
		}
		var schoolID *uuid.UUID
		if schoolName != "" {
			sid, ok, err := importxlsx.ResolveByNameOrCode(c.Context(), h.svc.repo.pool, "academic.school", "", schoolName)
			if err != nil {
				importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, fmt.Sprintf("resolve school: %v", err))
				res.FailedCount++
				continue
			}
			if !ok {
				importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, fmt.Sprintf("school not found: %s", schoolName))
				res.FailedCount++
				continue
			}
			schoolID = &sid
		}
		user := &User{
			Email:        strings.ToLower(strings.TrimSpace(email)),
			PasswordHash: string(hash),
			FullName:     fullName,
			Role:         role,
			Status:       "ACTIVE",
			IsActive:     true,
		}
		if err := h.svc.repo.Create(c.Context(), user, role, &AcademicUpsert{SchoolID: schoolID}); err != nil {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, fmt.Sprintf("create failed: %v", err))
			res.FailedCount++
			continue
		}
		res.SuccessCount++
	}
	importxlsx.CompleteJob(c.Context(), h.svc.repo.pool, jobID, res.FailedCount > 0)
	return c.JSON(shared.Success(res))
}
