#!/usr/bin/env bash
# parallel-execute.sh - Bash driver (Hermes-CLI friendly) to launch one parallel phase.
# Usage: ./parallel-execute.sh <phase> <domain> <expected_tables>
#   example: ./parallel-execute.sh 9 analytics 20
# Prints the per-phase scaffold: worktree path, migration range, plan file to create.
set -euo pipefail

PHASE="${1:?usage: parallel-execute.sh <phase> <domain> <expected_tables>}"
DOMAIN="${2:?missing domain}"
TABLES="${3:?missing expected_tables}"

ROOT="$(pwd)"
SKILLS="$HOME/.config/opencode/skills/superpowers/subagent-driven-development"
DATE="$(date +%Y-%m-%d)"
WT="../yl-phase-${PHASE}"
BRANCH="phase-${PHASE}"

# Migration range per phase (runbook section 2)
case "$PHASE" in
  9)  RANGE="092-099" ;;
  10) RANGE="100-109" ;;
  11) RANGE="110-119" ;;
  12) RANGE="120-129" ;;
  13) RANGE="130-139" ;;
  14) RANGE="140-149" ;;
  15) RANGE="150-159" ;;
  16) RANGE="160-169" ;;
  17) RANGE="170-179" ;;
  18) RANGE="180-189" ;;
  19) RANGE="190-199" ;;
  20) RANGE="200-209" ;;
  *) echo "unknown phase $PHASE"; exit 2 ;;
esac

echo "== Phase $PHASE ($DOMAIN) - parallel execution scaffold =="
echo "worktree:      $WT  (branch $BRANCH)"
echo "migration range: $RANGE"
echo "expected tables: $TABLES"

if git worktree list --porcelain | grep -q "worktree $(realpath -m "$WT" 2>/dev/null || echo "$WT")"; then
  echo "[skip] worktree exists"
else
  git worktree add "$WT" -b "$BRANCH"
  echo "[ok] worktree created"
fi

PLAN="$WT/docs/superpowers/plans/${DATE}-database-rebuild-phase${PHASE}-${DOMAIN}.md"
echo ""
echo "== Next steps (in $WT) =="
echo "1. Write the plan to: $PLAN"
echo "   Follow docs/superpowers/plans/2026-08-05-parallel-execution-runbook.md section 4."
echo "   Use migration files ONLY in range $RANGE (backend/migrations/${RANGE:0:3}_* to ${RANGE:4:3}_*)."
echo "2. Generate task briefs:"
echo "   bash \"$SKILLS/scripts/task-brief\" \"$PLAN\" <TASK>"
echo "3. Execute via subagent-driven-development; verify with:"
echo "   powershell -File .superpowers/sdd/parallel/parallel-verify.ps1 -Phase $PHASE -ExpectedTables $TABLES"
echo "4. On DONE, merge:"
echo "   powershell -File .superpowers/sdd/parallel/parallel-finish.ps1 -Phase $PHASE"
echo ""
echo "DB URL (implementer env): postgresql://postgres:kqHtPV72xUL1PYv1@db.cjrhqywtwlmebthajrkx.supabase.co:5432/postgres?sslmode=require&connect_timeout=10"
