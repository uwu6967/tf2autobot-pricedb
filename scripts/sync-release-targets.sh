#!/usr/bin/env bash
# Align GitHub release targets and Latest flag with scripts/restore-github-releases.sh.
# Safe to run as cursor[bot] or any account with release edit access.
# Does not change release author — use restore-github-releases.sh (as uwu6967) for that.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NOTES_DIR="$ROOT/scripts/release-notes"

if ! gh auth status >/dev/null 2>&1; then
    echo "Run: gh auth login"
    exit 1
fi

REPO="${GITHUB_REPOSITORY:-uwu6967/tf2autobot-pricedb}"

declare -A TAGS=(
    [v1.0.0]=e03bef6df358176d9bad975b7852563cf5889664
    [v1.0.1]=6d685dbe8496e698bd6f8c1b9d97d7d9380bdf0f
    [v1.0.2]=eb470a3bfb0456d49103567cb9bf3a0f7e36c64d
    [v1.0.3]=5772801c35133dbccaddd52cf40897dc310af547
    [v1.0.4]=e245a83ad9257deaf405a4e8a45b5035874d5ecd
    [v1.0.5]=8214498ab4de999bc1d40e96dfb358924867b65b
    [v1.0.6]=fa9ab53985b386721751c50dfcacece5cca150c7
    [v1.0.7]=7d490805537dd488ce5d99c89ffc9d1c0d5d81e0
    [v1.0.8]=7b60070400f08703951a5da3389ec3626c994d45
    [v1.0.9]=17091b891a0a50ace6ff0f56c978bdea057cd80a
    [v1.0.10]=534a84927bdc22d249ef9eb1e6f9f7ef3076f25a
)

LATEST_TAG="v1.0.10"
RELEASE_TAGS=(v1.0.0 v1.0.1 v1.0.2 v1.0.3 v1.0.4 v1.0.5 v1.0.6 v1.0.7 v1.0.8 v1.0.9 v1.0.10)

echo "Syncing release targets on $REPO ..."

for tag in "${RELEASE_TAGS[@]}"; do
    sha="${TAGS[$tag]}"
    if ! gh release view "$tag" -R "$REPO" >/dev/null 2>&1; then
        echo "Skip $tag (release missing)"
        continue
    fi

    target="$(gh release view "$tag" -R "$REPO" --json targetCommitish --jq .targetCommitish)"
    if [[ "$target" != "$sha" ]]; then
        echo "Updating $tag target $target -> $sha"
        gh release edit "$tag" -R "$REPO" --target "$sha"
    else
        echo "OK $tag target $sha"
    fi
done

current_latest="$(gh api "repos/$REPO/releases/latest" --jq .tag_name)"
if [[ "$current_latest" != "$LATEST_TAG" ]]; then
    echo "Marking $LATEST_TAG as Latest (was $current_latest)"
    gh release edit "$LATEST_TAG" -R "$REPO" --latest
else
    echo "OK latest is $LATEST_TAG"
fi

echo "Done. Run ./scripts/restore-github-releases.sh as uwu6967 to fix release authors."
