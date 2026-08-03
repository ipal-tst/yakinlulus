# Edit Data Diri Lengkap Siswa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perluas halaman profil siswa agar bisa mengedit data diri lengkap: nama, jenis kelamin, kelas (grade), No HP, sekolah, foto profil, dan jurusan khusus siswa SMA/SMK.

**Architecture:** Perluas endpoint `PUT /auth/profile` yang sudah ada (backend `internal/auth/auth.go`) dengan kolom baru `gender`, `phone`, `major` di tabel `users` (migration 043). `grade_id` sudah ada di tabel — ikutkan dalam `UpdateProfile`. Frontend memperluas `EditProfileDialog` di `frontend/app/(portal)/student/profile/page.tsx` dengan dropdown grade (dari `GET /academic/grades`) dan jurusan (muncul hanya saat grade SMA/SMK).

**Tech Stack:** Go 1.26 (backend, fiber, pgx, testify), Next.js App Router + TanStack Query + TypeScript (frontend), PostgreSQL (Supabase).

## Global Constraints

- Semua field baru nullable — tidak menghambat akses siswa.
- `gender` hanya `L` / `P`. `major` hanya `IPA` / `IPS` / `BAHASA` / `OLAHRAGA`.
- Nilai kosong string (`""`) untuk field opsional = hapus → diset `NULL` di DB.
- Email tidak bisa diubah dari endpoint ini.
- `phone` maksimum 20 karakter.
- `grade_id` bila diisi harus UUID valid yang merujuk ke baris `grades`.
- Windows PowerShell 5.1: semua perintah `npm`/`npx` wajib via `cmd /c`. ESLint tidak terkonfigurasi — skip lint, pakai type-check + vitest.
- Jangan commit `frontend/tsconfig.tsbuildinfo` (build artifact yang tracked; restore dengan `git checkout -- frontend/tsconfig.tsbuildinfo` setelah tsc).
- Migrasi live: `go run ./cmd/migrate up` dari `backend/` (idempotent per-file). DB Supabase saat ini di migration **42**.
- Login API dibungkus `{success, message, data}`; token tersimpan di `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\{token,admin_token}.txt`.
- CRLF warning saat git aman.

---

### Task 1: Migration 043 — kolom data diri di users

**Files:**
- Create: `backend/migrations/043_student_profile_fields.up.sql`
- Create: `backend/migrations/043_student_profile_fields.down.sql`

**Interfaces:**
- Consumes: tabel `users` existing (migration 001, 021, 040).
- Produces: kolom `users.gender VARCHAR(10)`, `users.phone VARCHAR(20)`, `users.major VARCHAR(30)` (semua nullable dengan CHECK constraint).

- [ ] **Step 1: Tulis migration up**

Create `backend/migrations/043_student_profile_fields.up.sql`:

```sql
-- Migration 043: Student identity fields for the profile edit feature
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('L','P'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS major VARCHAR(30) CHECK (major IN ('IPA','IPS','BAHASA','OLAHRAGA'));
```

- [ ] **Step 2: Tulis migration down**

Create `backend/migrations/043_student_profile_fields.down.sql`:

```sql
-- Down migration for 043 removes the student identity fields
ALTER TABLE users DROP COLUMN IF EXISTS gender;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
ALTER TABLE users DROP COLUMN IF EXISTS major;
```

- [ ] **Step 3: Terapkan migration ke DB live**

Run dari `backend/`:
```
go run ./cmd/migrate up
```
Expected: `INFO Migration applied name=043_student_profile_fields.up.sql` dan `All migrations applied total=43`.

- [ ] **Step 4: Verifikasi kolom ada**

Run:
```
go run ./cmd/migrate status
```
Expected: 043 terpasang, total 43. (Jika perintah `status` tidak ada, cek log dari Step 3 sudah cukup.)

- [ ] **Step 5: Commit**

```bash
git add backend/migrations/043_student_profile_fields.up.sql backend/migrations/043_student_profile_fields.down.sql
git commit -m "feat(db): add student identity columns gender, phone, major"
```

---

### Task 2: Backend — perluas UpdateProfileRequest + validasi

**Files:**
- Modify: `backend/internal/auth/auth.go:49-53` (struct UpdateProfileRequest)
- Modify: `backend/internal/auth/auth.go:424-429` (Service.UpdateProfile)
- Modify: `backend/internal/auth/auth.go:113-139` (Repository.UpdateProfile)
- Modify: `backend/internal/auth/auth.go:23-35` (struct User)
- Modify: `backend/internal/auth/auth.go:76,91` (SELECT FindByEmail/FindByID)
- Modify: `backend/internal/auth/auth.go:226-227,297-298` (SELECT FindAll/Search scans)
- Modify: `backend/internal/auth/auth.go:900` (dekat validatePassword — tambah validateProfileRequest)
- Test: `backend/internal/auth/auth_test.go`

**Interfaces:**
- Consumes: `UpdateProfileRequest` dari Task 2 (didefinisikan di task ini), migration 043.
- Produces: `Repository.GradeExists(ctx, id uuid.UUID) (bool, error)`; `validateProfileRequest(req UpdateProfileRequest) error`; `User` struct kini berisi `Gender`, `Phone`, `Major` (*string); `UpdateProfile` menerima `req` berisi `GradeID *string`.

- [ ] **Step 1: Tulis failing test**

Append ke `backend/internal/auth/auth_test.go`:

```go
func TestValidateProfileRequest(t *testing.T) {
	g := "L"
	m := "IPA"
	phone := "08123456789012345678901" // 23 chars > 20
	badG := "X"
	badM := "AGAMA"
	gid := "not-a-uuid"

	okReq := UpdateProfileRequest{Gender: &g, Major: &m}
	assert.NoError(t, validateProfileRequest(okReq))

	badGender := UpdateProfileRequest{Gender: &badG}
	assert.Error(t, validateProfileRequest(badGender))

	badMajor := UpdateProfileRequest{Major: &badM}
	assert.Error(t, validateProfileRequest(badMajor))

	longPhone := UpdateProfileRequest{Phone: &phone}
	assert.Error(t, validateProfileRequest(longPhone))

	badGrade := UpdateProfileRequest{GradeID: &gid}
	assert.Error(t, validateProfileRequest(badGrade))

	nilReq := UpdateProfileRequest{}
	assert.NoError(t, validateProfileRequest(nilReq))
}
```

- [ ] **Step 2: Run test untuk verifikasi gagal**

Run dari `backend/`:
```
go test ./internal/auth/ -run TestValidateProfileRequest -v
```
Expected: FAIL — `undefined: validateProfileRequest`.

- [ ] **Step 3: Perluas struct UpdateProfileRequest**

Edit `backend/internal/auth/auth.go:49-53` menjadi:

```go
type UpdateProfileRequest struct {
	FullName   *string `json:"full_name,omitempty"`
	AvatarURL  *string `json:"avatar_url,omitempty"`
	SchoolName *string `json:"school_name,omitempty"`
	Gender     *string `json:"gender,omitempty"`
	Phone      *string `json:"phone,omitempty"`
	Major      *string `json:"major,omitempty"`
	GradeID    *string `json:"grade_id,omitempty"`
}
```

- [ ] **Step 4: Tambah validasi validateProfileRequest**

Tambahkan fungsi baru tepat di bawah `validatePassword` (baris ~900). Tambahkan import `slices` dan `github.com/google/uuid` (uuid sudah di-import).

```go
func validateProfileRequest(req UpdateProfileRequest) error {
	if req.Gender != nil && *req.Gender != "L" && *req.Gender != "P" {
		return fiber.NewError(fiber.StatusBadRequest, "gender must be L or P")
	}
	if req.Major != nil && !slices.Contains([]string{"IPA", "IPS", "BAHASA", "OLAHRAGA"}, *req.Major) {
		return fiber.NewError(fiber.StatusBadRequest, "major must be IPA, IPS, BAHASA, or OLAHRAGA")
	}
	if req.Phone != nil && len(*req.Phone) > 20 {
		return fiber.NewError(fiber.StatusBadRequest, "phone must not exceed 20 characters")
	}
	if req.GradeID != nil && *req.GradeID != "" {
		if _, err := uuid.Parse(*req.GradeID); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "grade_id must be a valid UUID")
		}
	}
	return nil
}
```

- [ ] **Step 5: Run test untuk verifikasi lulus**

Run dari `backend/`:
```
go test ./internal/auth/ -run TestValidateProfileRequest -v
```
Expected: PASS.

- [ ] **Step 6: Tambah GradeExists ke Repository**

Tambahkan method setelah `UpdateProfile` (baris ~139):

```go
func (r *Repository) GradeExists(ctx context.Context, gradeID uuid.UUID) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM grades WHERE id = $1)`, gradeID).Scan(&ok)
	return ok, err
}
```

- [ ] **Step 7: Perluas Repository.UpdateProfile**

Ganti `backend/internal/auth/auth.go:113-139` dengan:

```go
func (r *Repository) UpdateProfile(ctx context.Context, id uuid.UUID, req UpdateProfileRequest) error {
	query := "UPDATE users SET updated_at = NOW()"
	args := []interface{}{}
	argN := 1

	if req.FullName != nil {
		query += fmt.Sprintf(", full_name = $%d", argN)
		args = append(args, *req.FullName)
		argN++
	}
	if req.AvatarURL != nil {
		query += fmt.Sprintf(", avatar_url = $%d", argN)
		args = append(args, nilString(req.AvatarURL))
		argN++
	}
	if req.SchoolName != nil {
		query += fmt.Sprintf(", school_name = $%d", argN)
		args = append(args, nilString(req.SchoolName))
		argN++
	}
	if req.Gender != nil {
		query += fmt.Sprintf(", gender = $%d", argN)
		args = append(args, nilString(req.Gender))
		argN++
	}
	if req.Phone != nil {
		query += fmt.Sprintf(", phone = $%d", argN)
		args = append(args, nilString(req.Phone))
		argN++
	}
	if req.Major != nil {
		query += fmt.Sprintf(", major = $%d", argN)
		args = append(args, nilString(req.Major))
		argN++
	}
	if req.GradeID != nil {
		query += fmt.Sprintf(", grade_id = $%d", argN)
		if *req.GradeID == "" {
			args = append(args, nil)
		} else {
			gid, err := uuid.Parse(*req.GradeID)
			if err != nil {
				return err
			}
			args = append(args, gid)
		}
		argN++
	}

	query += fmt.Sprintf(" WHERE id = $%d", argN)
	args = append(args, id)

	_, err := r.pool.Exec(ctx, query, args...)
	return err
}

func nilString(p *string) interface{} {
	if p == nil || *p == "" {
		return nil
	}
	return *p
}
```

- [ ] **Step 8: Perluas Service.UpdateProfile dengan validasi + grade existence**

Ganti `backend/internal/auth/auth.go:424-429` dengan:

```go
func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, req UpdateProfileRequest) (*User, error) {
	if err := validateProfileRequest(req); err != nil {
		return nil, err
	}
	if req.GradeID != nil && *req.GradeID != "" {
		gid, _ := uuid.Parse(*req.GradeID)
		exists, err := s.repo.GradeExists(ctx, gid)
		if err != nil {
			return nil, fiber.NewError(fiber.StatusInternalServerError, "Failed to validate grade")
		}
		if !exists {
			return nil, fiber.NewError(fiber.StatusBadRequest, "grade not found")
		}
	}
	if err := s.repo.UpdateProfile(ctx, userID, req); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Failed to update profile")
	}
	return s.repo.FindByID(ctx, userID)
}
```

- [ ] **Step 9: Perluas struct User + query scans**

Edit `backend/internal/auth/auth.go:23-35` — tambahkan field setelah `SchoolName`:

```go
	Gender     *string    `json:"gender,omitempty"`
	Phone      *string    `json:"phone,omitempty"`
	Major      *string    `json:"major,omitempty"`
```

Edit SELECT di `FindByEmail` (baris 76) dan `FindByID` (baris 91) menjadi:

```sql
SELECT id, email, password_hash, full_name, role, grade_id, is_active, avatar_url, school_name, gender, phone, major, created_at, updated_at
```

Dan update Scan di keduanya (baris 78 dan 93) untuk menambahkan `&u.Gender, &u.Phone, &u.Major` sebelum `&u.CreatedAt`.

Edit SELECT di `FindAll` (baris 216) dan `Search` (baris 286) menjadi:

```sql
SELECT id, email, password_hash, full_name, role, is_active, avatar_url, school_name, gender, phone, major, created_at, updated_at
```

Dan update Scan di keduanya (baris 227 dan 298) menambahkan `&u.Gender, &u.Phone, &u.Major`.

- [ ] **Step 10: Run seluruh test + build + vet**

Run dari `backend/`:
```
go test ./... 
go build ./...
go vet ./...
```
Expected: semua `ok`, BUILD OK, VET OK.

- [ ] **Step 11: Commit**

```bash
git add backend/internal/auth/auth.go backend/internal/auth/auth_test.go
git commit -m "feat(backend): extend profile update with gender, phone, major, grade_id"
```

---

### Task 3: Frontend — perluas User type + useUpdateProfile + EditProfileDialog

**Files:**
- Modify: `frontend/providers/AuthProvider.tsx:6-14` (interface User)
- Modify: `frontend/lib/api.ts:178-185` (useUpdateProfile payload)
- Modify: `frontend/app/(portal)/student/profile/page.tsx` (EditProfileDialog + kartu identitas)
- Modify: `frontend/lib/api.ts` — tambah type untuk Grade (jika belum ada)

**Interfaces:**
- Consumes: `useGrades()` hook (sudah ada di `frontend/lib/api.ts:242`), endpoint `PUT /auth/profile` yang diperluas (Task 2), `User` fields baru.
- Produces: `EditProfileDialog` dengan field nama, No HP, jenis kelamin, kelas, jurusan (kondisional SMA/SMK), sekolah, foto, email disabled.

- [ ] **Step 1: Perluas interface User di AuthProvider**

Edit `frontend/providers/AuthProvider.tsx:6-14` menjadi:

```ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'STAFF' | 'TEACHER' | 'STUDENT';
  is_active: boolean;
  avatar_url?: string;
  school_name?: string;
  gender?: string;
  phone?: string;
  major?: string;
  grade_id?: string;
}
```

- [ ] **Step 2: Perluas useUpdateProfile payload**

Edit `frontend/lib/api.ts:178-185` menjadi:

```ts
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      full_name?: string;
      avatar_url?: string;
      school_name?: string;
      gender?: string;
      phone?: string;
      major?: string;
      grade_id?: string;
    }) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}
```

- [ ] **Step 3: Tambah type Grade + hook payload helper di lib/api.ts**

Jika belum ada, tambah dekat `useGrades()` (baris ~242):

```ts
export interface Grade {
  id: string;
  education_level_id: string;
  level_code?: string;
  name: string;
  alias?: string;
  display_order: number;
  is_active: boolean;
}
```

Dan ubah `useGrades` menjadi typed:

```ts
export function useGrades() {
  return useQuery<Grade[], Error>({
    queryKey: ['academic', 'grades'],
    queryFn: () => apiFetch<Grade[]>('/academic/grades'),
  });
}
```

- [ ] **Step 4: Perluas EditProfileDialog**

Edit `frontend/app/(portal)/student/profile/page.tsx`:

**4a.** Tambah import `useGrades` ke daftar import dari `@/lib/api` (baris 11-29).

**4b.** Ganti fungsi `EditProfileDialog` (baris 267-319) dengan:

```tsx
function EditProfileDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user, refetch } = useAuth();
    const updateProfile = useUpdateProfile();
    const gradesQuery = useGrades() as any;
    const grades: any[] = Array.isArray(gradesQuery.data) ? gradesQuery.data : [];

    const [fullName, setFullName] = React.useState(user?.full_name || "");
    const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar_url || "");
    const [school, setSchool] = React.useState(user?.school_name || "");
    const [gender, setGender] = React.useState(user?.gender || "");
    const [phone, setPhone] = React.useState(user?.phone || "");
    const [gradeId, setGradeId] = React.useState(user?.grade_id || "");
    const [major, setMajor] = React.useState(user?.major || "");
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        setFullName(user?.full_name || "");
        setAvatarUrl(user?.avatar_url || "");
        setSchool(user?.school_name || "");
        setGender(user?.gender || "");
        setPhone(user?.phone || "");
        setGradeId(user?.grade_id || "");
        setMajor(user?.major || "");
    }, [user, isOpen]);

    const selectedGrade = grades.find((g) => g.id === gradeId);
    const isSmaSmk = selectedGrade?.level_code === "SMA" || selectedGrade?.level_code === "SMK";

    const submit = async () => {
        setError(null);
        if (!fullName.trim()) return setError("Nama lengkap wajib diisi");
        if (phone.length > 20) return setError("Nomor HP maksimal 20 karakter");
        try {
            await updateProfile.mutateAsync({
                full_name: fullName,
                avatar_url: avatarUrl,
                school_name: school,
                gender: gender || undefined,
                phone: phone || undefined,
                major: isSmaSmk ? major || undefined : undefined,
                grade_id: gradeId || undefined,
            });
            await refetch();
            onClose();
        } catch (e: any) {
            setError(e.message || "Gagal menyimpan profil");
        }
    };

    const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Edit Profil" description="Lengkapi data dirimu.">
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nama Lengkap *</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">No HP (opsional)</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Jenis Kelamin (opsional)</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
                        <option value="">Pilih jenis kelamin</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kelas (opsional)</label>
                    <select value={gradeId} onChange={(e) => { setGradeId(e.target.value); if (!isSmaSmk) setMajor(""); }} className={selectClass}>
                        <option value="">Pilih kelas</option>
                        {grades.map((g: any) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
                {isSmaSmk && (
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Jurusan</label>
                        <select value={major} onChange={(e) => setMajor(e.target.value)} className={selectClass}>
                            <option value="">Pilih jurusan</option>
                            <option value="IPA">IPA</option>
                            <option value="IPS">IPS</option>
                            <option value="BAHASA">Bahasa</option>
                            <option value="OLAHRAGA">Olahraga</option>
                        </select>
                    </div>
                )}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sekolah (opsional)</label>
                    <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Nama sekolah" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">URL Foto Profil (opsional)</label>
                    <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                    <Input value={user?.email || ""} disabled />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <Button size="sm" className="w-full" onClick={submit} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Simpan Perubahan
                </Button>
            </div>
        </Dialog>
    );
}
```

- [ ] **Step 5: Tampilkan data identitas di kartu utama**

Edit bagian kartu identitas di `page.tsx` (area sekitar baris 116-125) — tambahkan baris info tambahan di bawah email:

```tsx
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg md:text-xl font-extrabold truncate">{fullName}</h2>
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] uppercase">{role}</Badge>
                            <Badge variant="success" className="text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Terverifikasi
                            </Badge>
                            {user?.gender && <Badge variant="outline" className="text-[10px]">{user.gender === "L" ? "Laki-laki" : "Perempuan"}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {user?.phone && <span className="text-[11px] text-muted-foreground">{user.phone}</span>}
                            {user?.grade_id && <span className="text-[11px] text-muted-foreground">{grades?.find((g: any) => g.id === user.grade_id)?.name}</span>}
                            {user?.major && <span className="text-[11px] text-muted-foreground">Jurusan {user.major}</span>}
                        </div>
                    </div>
```

Catatan: bagian ini memerlukan akses ke daftar grades. Tambahkan di komponen `StudentProfilePage` (baris ~57) satu query grades:

```tsx
    const gradesQuery = useGrades() as any;
    const grades: any[] = Array.isArray(gradesQuery.data) ? gradesQuery.data : [];
```

dan tambahkan `useGrades` ke import di `page.tsx`.

- [ ] **Step 6: Run type-check**

Run dari `frontend/`:
```
cmd /c npx tsc --noEmit
```
Expected: `TYPE-CHECK OK`. Jika `frontend/tsconfig.tsbuildinfo` berubah, restore setelahnya:
```
git checkout -- frontend/tsconfig.tsbuildinfo
```

- [ ] **Step 7: Run test + build**

Run dari `frontend/`:
```
cmd /c npm test
cmd /c npm run build
```
Expected: `Test Files 6 passed`, `Tests 36 passed`, `Compiled successfully`.

- [ ] **Step 8: Commit**

```bash
git add frontend/providers/AuthProvider.tsx frontend/lib/api.ts "frontend/app/(portal)/student/profile/page.tsx"
git commit -m "feat(frontend): full student identity edit in profile dialog"
```

---

### Task 4: Verifikasi live end-to-end + cleanup

**Files:**
- Tidak ada file baru. Menggunakan API live di `http://localhost:8080`.

**Interfaces:**
- Consumes: build `backend/api.exe` terbaru (Task 2), migration 043 (Task 1), frontend build (Task 3).

- [ ] **Step 1: Rebuild + restart server**

Run dari root `D:\Project\EdTech\Yakinlulus.id`:
```
Stop-Process -Name api -Force -ErrorAction SilentlyContinue
```
Lalu dari `backend/`: `go build -o api.exe ./cmd/api`. Lalu restart:
```
Start-Process -FilePath "backend\api.exe" -WorkingDirectory "backend" -WindowStyle Hidden -RedirectStandardOutput "backend\server.out.log" -RedirectStandardError "backend\server.err.log"
```
Verifikasi port: `Get-NetTCPConnection -LocalPort 8080 -State Listen` → OwningProcess baru.

- [ ] **Step 2: Login sebagai murid**

```
$body = '{"email":"murid@yakinlulus.id","password":"Admin@123!"}'
$r = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $body
$t = $r.data.token; Set-Content "C:\Users\ADMINI~1\AppData\Local\Temp\opencode\token.txt" $t
```
Expected: `success` true.

- [ ] **Step 3: Update profil lengkap**

```
$t = Get-Content "C:\Users\ADMINI~1\AppData\Local\Temp\opencode\token.txt" -Raw
$h = @{ Authorization = "Bearer $t" }
$body = '{"full_name":"Ahmad Pratama","gender":"L","phone":"08123456789","major":"IPA","grade_id":"<UUID grade SMA>"}'
$r = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/profile" -Method Put -Headers $h -ContentType "application/json" -Body $body
```
Cari UUID grade SMA (Kelas 10/11/12) via `GET /academic/grades` (auth). Expected: `r.data.gender == "L"`, `phone`, `major == "IPA"`, `grade_id` terisi.

- [ ] **Step 4: Verifikasi invalid input → 400**

- `gender: "X"` → 400
- `major: "AGAMA"` → 400
- `grade_id: "not-a-uuid"` → 400
- `grade_id: "<uuid random valid>"` (grade tidak ada) → 400

- [ ] **Step 5: Verifikasi GET /auth/me mengembalikan field baru**

```
$r = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/me" -Headers $h
```
Expected: `gender`, `phone`, `major`, `grade_id` ada di response.

- [ ] **Step 6: Verifikasi GET /auth/me tanpa field tambahan (profil tidak diubah oleh validasi)**

Set `school_name` tetap ada: `$r.data.school_name` harus tetap `""` (tidak terpengaruh).

- [ ] **Step 7: Cleanup — reset profil ke kondisi awal**

```
$body = '{"full_name":"Ahmad Pratama","gender":"","phone":"","major":"","grade_id":""}'
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/profile" -Method Put -Headers $h -ContentType "application/json" -Body $body
```
Expected: `gender`, `phone`, `major` kosong (NULL), `grade_id` kosong.

- [ ] **Step 8: Verifikasi working tree bersih**

```
git status --short
```
Expected: tidak ada file tak ter-commit selain `frontend/tsconfig.tsbuildinfo` (restore jika ada).

---

## Self-Review

**1. Spec coverage:**
- Migration kolom gender/phone/major → Task 1 ✅
- Backend UpdateProfileRequest + validasi gender/major/phone/grade_id + GradeExists → Task 2 ✅
- User struct + query scans (me, FindAll, Search) → Task 2 ✅
- Frontend User type + useUpdateProfile payload → Task 3 ✅
- EditProfileDialog lengkap (No HP, jenis kelamin, kelas dropdown, jurusan kondisional SMA/SMK, sekolah, foto) → Task 3 ✅
- Data identitas di kartu utama → Task 3 ✅
- Testing: unit backend + type-check + npm test + build → Task 2/3 ✅
- Smoke test live + cleanup → Task 4 ✅

**2. Placeholder scan:** Tidak ada TBD/TODO. Semua langkah berisi kode/kondisi eksplisit. UUID grade SMA perlu dicari live di Step 3 Task 4 — ini bukan placeholder, itu langkah runtime dengan instruksi jelas (via GET /academic/grades).

**3. Type consistency:**
- `UpdateProfileRequest` sama antara Task 2 Step 3 dan test Step 1 ✅
- `User.gender/phone/major/grade_id` konsisten di backend struct (auth.go) dan frontend interface (AuthProvider.tsx) ✅
- `nilString` didefinisikan di Task 2 dan dipakai di `Repository.UpdateProfile` yang sama ✅
- `validateProfileRequest` dipanggil di `Service.UpdateProfile` (Task 2 Step 8) dan di-test (Step 1) ✅
- `useGrades` dipakai di EditProfileDialog dan StudentProfilePage (Task 3) ✅
