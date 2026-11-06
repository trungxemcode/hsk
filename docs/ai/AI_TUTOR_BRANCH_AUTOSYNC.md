# AI Tutor V5 – safe branch synchronization

## Why PR #308–310 repeatedly conflicted

AI Tutor work reused `feat/ai-tutor-v5-hardening` after each **squash merge**. GitHub
put the new code into `main` as a different commit, while the feature branch
still contained the original commits. The branch histories then diverged.
GitHub could not build a test merge, so PR checks did not start.

## Automatic recovery on future merges

The trusted workflow `.github/workflows/ai-tutor-branch-sync.yml` runs when
a merged PR from this exact in-repository AI Tutor branch closes. It verifies:

1. The source PR commit and squash commit have **identical Git trees**.
2. The squash commit is genuinely on `main`.
3. The current feature branch still descends from the merged PR head.
4. The operation adds only a merge parent, **without changing file contents**.

It pushes using a normal fast-forward, without force-push. If any assertion
fails or the source branch was replaced, it refuses to overwrite anything.
New work committed after the merged head is retained. The repository currently
has **delete_branch_on_merge=true**: if GitHub has removed the source branch,
the workflow recreates it from current `main`, without rewriting any existing
ref. A cheap six-hour schedule checks only for an absent branch, with an
on-demand `workflow_dispatch` recovery option.

This workflow needs GitHub Actions `contents: write` permission. A push made
with the GitHub Actions `GITHUB_TOKEN` does **not** automatically start other
GitHub Actions; developers should start new feature work *after* the sync
workflow finishes and push their own changes normally to trigger PR checks.

## Before any manual / agent push

Run `git fetch origin`. Work on a new branch cut from current `origin/main`
for each new PR whenever possible. If continuing on the AI Tutor branch,
run `git merge origin/main` and resolve genuine source conflicts rather than
using `git push --force` or `git merge -s ours` on unrelated commits.
The special ancestry-only reconciliation is safe **only after** checking
the identical squash trees as the script does.

## CI font reproducibility

UI visual comparison uses the same Noto CJK font installation for base and
head. The workflow now caches the font and bounds apt operations so failed
package mirrors cannot occupy the entire 20-minute matrix job. Never mark
the UI check successful without actually capturing the protected routes.
