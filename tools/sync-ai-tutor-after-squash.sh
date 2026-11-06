#!/usr/bin/env bash
# Trusted merged-PR workflow only: never read or execute scripts from PR commits.
set -euo pipefail
branch='feat/ai-tutor-v5-hardening'
merged_head="${AI_TUTOR_MERGED_HEAD:?Missing source PR head}"
squash_sha="${AI_TUTOR_SQUASH_SHA:?Missing squash merge commit}"
pr_number="${AI_TUTOR_PR_NUMBER:?Missing merged PR number}"
for value in "$merged_head" "$squash_sha"; do
  [[ "$value" =~ ^[0-9a-f]{40}$ ]] || { echo "Invalid Git SHA" >&2; exit 2; }
done
[[ "$pr_number" =~ ^[0-9]+$ ]] || { echo "Invalid PR number" >&2; exit 2; }

for attempt in 1 2 3; do
  git fetch --no-tags origin main
  # Squash-merged source commits can become unreachable after auto-delete.
  if ! git cat-file -e "${merged_head}^{commit}" 2>/dev/null; then
    git fetch --no-tags origin "refs/pull/$pr_number/head"
  fi
  git cat-file -e "${merged_head}^{commit}"
  git cat-file -e "${squash_sha}^{commit}"
  if ! git merge-base --is-ancestor "$squash_sha" origin/main; then
    echo "Refusing sync: squash commit is not on main." >&2; exit 1
  fi
  if ! git diff --quiet "$merged_head" "$squash_sha"; then
    echo "Refusing sync: squash and source commits have different file trees." >&2; exit 1
  fi

  if git ls-remote --exit-code --heads origin "refs/heads/$branch" >/dev/null; then
    git fetch --no-tags origin "+refs/heads/$branch:refs/remotes/origin/$branch"
  else
    status=$?
    [[ "$status" == 2 ]] || { echo "Cannot read remote branch status." >&2; exit 1; }
    # Repository auto-delete is enabled. Restore only if there is NO branch
    # to overwrite, using current main as the next safe starting point.
    if git push origin "refs/remotes/origin/main:refs/heads/$branch"; then
      echo "Recreated auto-deleted AI Tutor branch from current main."
      exit 0
    fi
    echo "Concurrent branch creation detected; retrying." >&2
    continue
  fi

  if ! git merge-base --is-ancestor "$merged_head" "origin/$branch"; then
    echo "Feature branch was recreated independently; not changing its history."
    exit 0
  fi
  if git merge-base --is-ancestor "$squash_sha" "origin/$branch"; then
    echo "Already synchronized; no push needed."
    exit 0
  fi

  before_tree="$(git rev-parse "origin/$branch^{tree}")"
  git switch --detach --force "origin/$branch"
  git -c user.name='HSK Branch Sync' \
      -c user.email='hsk-branch-sync@users.noreply.github.com' \
      merge --no-ff -s ours "$squash_sha" \
      -m "chore(ai-tutor): attach verified squash commit to feature history"
  test "$(git rev-parse HEAD^{tree})" = "$before_tree" || {
    echo "Unsafe sync modified the code tree" >&2; exit 1
  }
  if git push origin "HEAD:refs/heads/$branch"; then
    echo "AI Tutor branch safely synchronized without force-push."
    exit 0
  fi
  echo "Concurrent feature push detected on attempt $attempt; retrying." >&2
done
echo "Feature branch changed concurrently; no history was overwritten." >&2
exit 1
