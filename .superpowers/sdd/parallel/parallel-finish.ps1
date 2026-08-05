param(
    [Parameter(Mandatory = $true)]
    [int]$Phase,
    [string]$Message
)

# parallel-finish.ps1 - merge a phase worktree branch back into main, then clean up.
# Usage: powershell -File parallel-finish.ps1 -Phase 9 [-Message "feat(db): phase 9 analytics"]
# Assumes: run from repo root on main; worktree/branch phase-N exist.

$ErrorActionPreference = 'Stop'
$repo = (Get-Location).Path
$branch = "phase-$Phase"
$path = Join-Path (Split-Path $repo -Parent) "yl-phase-$Phase"

# Safety: verify the phase worktree has no uncommitted changes.
$dirty = git -C $path status --porcelain
if ($dirty) {
    Write-Host "[warn] phase-$Phase worktree has uncommitted changes:"
    Write-Host $dirty
    Write-Host "Aborting merge. Commit or stash first."
    exit 1
}

if (-not $Message) { $Message = "feat(db): phase $Phase" }

git checkout main
if ($LASTEXITCODE -ne 0) { throw "cannot checkout main" }

git merge --no-ff $branch -m $Message
if ($LASTEXITCODE -ne 0) { throw "merge of $branch failed" }

git worktree remove $path
git branch -d $branch

Write-Host "[ok] phase-$Phase merged and cleaned. Next: run 'go run cmd/migrate/main.go up' from backend/ once, then re-verify."
