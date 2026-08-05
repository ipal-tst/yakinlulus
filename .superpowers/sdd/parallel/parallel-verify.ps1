param(
    [Parameter(Mandatory = $true)]
    [int]$Phase,
    [Parameter(Mandatory = $true)]
    [int]$ExpectedTables,
    [string]$Schema
)

# parallel-verify.ps1 - assert the live DB table count for a phase's schema.
# Usage: powershell -File parallel-verify.ps1 -Phase 9 -ExpectedTables 20
#   optional: -Schema analytics  (defaults to a phase->schema map; override if unknown)
# Assumes: run from repo root; DB URL resolvable from backend/config.yaml database.url.

$ErrorActionPreference = 'Stop'

$schemaMap = @{
    1  = 'identity'
    2  = 'academic'
    3  = 'media'
    4  = 'question'
    5  = 'cbt'
    6  = 'content'
    7  = 'finance'
    8  = 'ranking'
    9  = 'analytics'
    10 = 'notification'
    11 = 'queue'
    12 = 'ai'
    13 = 'ocr'
    14 = 'report'
    15 = 'search'
    16 = 'config'
    17 = 'audit'
    18 = 'integration'
    19 = 'monitoring'
    20 = 'cms'
}

if (-not $Schema) {
    if (-not $schemaMap.ContainsKey($Phase)) { throw "No schema mapping for phase $Phase; pass -Schema." }
    $Schema = $schemaMap[$Phase]
}

# Resolve DB URL from backend/config.yaml (url: line under database:).
$repo = (Get-Location).Path
$cfg = Get-Content -Raw (Join-Path $repo (Join-Path 'backend' 'config.yaml'))
$urlMatch = [regex]::Match($cfg, '(?m)^\s+url:\s+"([^"]+)"')
if (-not $urlMatch.Success) { throw "database.url not found in backend/config.yaml" }
$env:PQURL = $urlMatch.Groups[1].Value

# Verify via a throwaway pgx program in a per-phase temp dir (copy go.mod/go.sum
# from the established template dir so `go run` resolves pgx without network).
$templateDir = Join-Path $env:TEMP "opencode\verify_id"
if (-not (Test-Path (Join-Path $templateDir 'go.mod'))) { throw "template dir missing go.mod: $templateDir" }
$probeDir = Join-Path $env:TEMP ("opencode\verify_parallel_{0}" -f $Phase)
New-Item -ItemType Directory -Path $probeDir -Force | Out-Null
Copy-Item -Force (Join-Path $templateDir 'go.mod') (Join-Path $probeDir 'go.mod')
Copy-Item -Force (Join-Path $templateDir 'go.sum') (Join-Path $probeDir 'go.sum')
$probe = Join-Path $probeDir "main.go"
# Single-quoted here-string: no PowerShell interpolation (protects Go's $1).
$env:PSCHEMA = $Schema
$env:PEXPECT = "$ExpectedTables"
@'
package main

import (
    "context"
    "fmt"
    "os"
    "github.com/jackc/pgx/v5/pgxpool"
)

func main() {
    p, err := pgxpool.New(context.Background(), os.Getenv("PQURL"))
    if err != nil { fmt.Println("ERR", err); os.Exit(1) }
    defer p.Close()
    var n int
    p.QueryRow(context.Background(), "SELECT count(*) FROM information_schema.tables WHERE table_schema=$1", os.Getenv("PSCHEMA")).Scan(&n)
    var migs int
    p.QueryRow(context.Background(), "SELECT count(*) FROM public._migrations").Scan(&migs)
    fmt.Printf("schema=%s tables=%d (expected %s) _migrations=%d\n", os.Getenv("PSCHEMA"), n, os.Getenv("PEXPECT"), migs)
    want := 0
    fmt.Sscanf(os.Getenv("PEXPECT"), "%d", &want)
    if n != want { os.Exit(2) }
}
'@ | Set-Content -Path $probe -Encoding UTF8

Push-Location $probeDir
try {
    go run $probe
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] schema $Schema has $ExpectedTables tables"
    } else {
        Write-Host "[FAIL] schema $Schema count mismatch (see output above)"
        exit 1
    }
} finally {
    Pop-Location
}
