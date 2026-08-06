param(
    [Parameter(Mandatory = $true)]
    [string]$Phases
)

# parallel-setup.ps1 - create a git worktree + branch phase-N for each listed phase.
# Usage: powershell -File parallel-setup.ps1 -Phases "9,10,11"
# Assumes: run from repo root (main checked out), git available.

$ErrorActionPreference = 'Stop'
$repo = (Get-Location).Path
$worktreeRoot = Join-Path (Split-Path $repo -Parent) "yl-phase-"
$phaseList = @($Phases.Split(',') | ForEach-Object { [int]$_ })

foreach ($phase in $phaseList) {
    $branch = "phase-$phase"
    $path = "$worktreeRoot$phase"
    $existing = git worktree list --porcelain | Select-String "worktree $([regex]::Escape($path))$"
    if ($existing) {
        Write-Host "[skip] worktree $path already exists (branch $branch)"
        continue
    }
    $branchExists = git rev-parse --verify --quiet "$branch"
    if ($branchExists) {
        Write-Host "[skip] branch $branch exists; use parallel-finish.ps1 to merge it, then delete."
        continue
    }
    git worktree add $path -b $branch
    if ($LASTEXITCODE -ne 0) { throw "git worktree add failed for phase $phase" }
    Write-Host "[ok] phase-$phase worktree: $path"
}

Write-Host ""
Write-Host "Next: in each worktree, execute the per-phase loop from the runbook:"
Write-Host "  docs/superpowers/plans/2026-08-05-parallel-execution-runbook.md  (section 4)"
Write-Host "Per-phase migration ranges are allocated in section 2 of the runbook."
