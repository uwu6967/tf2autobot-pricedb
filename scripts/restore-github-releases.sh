#!/usr/bin/env bash
# Restore GitHub releases published under your account (not cursor[bot]).
# Run locally after: gh auth login  (as uwu6967)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NOTES_DIR="$ROOT/scripts/release-notes"

if ! gh auth status >/dev/null 2>&1; then
    echo "Run: gh auth login"
    exit 1
fi

LOGIN="$(gh api user --jq .login)"
if [[ "$LOGIN" == "cursor[bot]" ]]; then
    echo "Logged in as cursor[bot]. Switch to your GitHub account first:"
    echo "  gh auth login"
    exit 1
fi

echo "Publishing releases as $LOGIN ..."

declare -A TAGS=(
    [v1.0.0]=e03bef6df358176d9bad975b7852563cf5889664
    [v1.0.1]=6d685dbe8496e698bd6f8c1b9d97d7d9380bdf0f
    [v1.0.2]=eb470a3bfb0456d49103567cb9bf3a0f7e36c64d
    [v1.0.3]=5772801c35133dbccaddd52cf40897dc310af547
    [v1.0.4]=e245a83ad9257deaf405a4e8a45b5035874d5ecd
    [v1.0.5]=8214498ab4de999bc1d40e96dfb358924867b65b
    [v1.0.6]=fa9ab53985b386721751c50dfcacece5cca150c7
)

declare -A TITLES=(
    [v1.0.0]="v1.0.0 - uwu6967 blank-bot fork"
    [v1.0.1]="v1.0.1 - uwu6967 blank-bot fork"
    [v1.0.2]="v1.0.2 - Discord version update notifications"
    [v1.0.3]="v1.0.3 - Steam rate limit resilience"
    [v1.0.4]="v1.0.4 - !updaterepo dist build safety"
    [v1.0.5]="v1.0.5 - panel IPC string error messages"
    [v1.0.6]="v1.0.6 - The Big One: 5.17.0 blank bot + Discord + partial autoprice + panel"
)

for tag in v1.0.0 v1.0.1 v1.0.2 v1.0.3 v1.0.4 v1.0.5 v1.0.6; do
    sha="${TAGS[$tag]}"
    notes="$NOTES_DIR/${tag}.md"

    if gh release view "$tag" >/dev/null 2>&1; then
        author="$(gh release view "$tag" --json author --jq .author.login 2>/dev/null || echo unknown)"
        target="$(gh release view "$tag" --json targetCommitish --jq .targetCommitish 2>/dev/null || echo unknown)"
        if [[ "$author" == "$LOGIN" && "$target" == "$sha" ]]; then
            echo "Skip $tag (release already exists under $LOGIN at $sha)"
            continue
        fi
        if [[ "$author" == "cursor[bot]" || "$target" != "$sha" ]]; then
            echo "Replacing release $tag (author=$author target=$target) with $LOGIN @ $sha ..."
            gh release delete "$tag" --yes || true
        else
            echo "Skip $tag (release exists under $author)"
            continue
        fi
    fi

    if ! git rev-parse "$tag" >/dev/null 2>&1; then
        echo "Creating tag $tag -> $sha"
        git tag -a "$tag" "$sha" -m "${TITLES[$tag]}" --force
        git push origin "$tag" --force
    fi

    echo "Creating release $tag"
    if [[ -f "$notes" ]]; then
        gh release create "$tag" \
            --target "$sha" \
            --title "${TITLES[$tag]}" \
            --notes-file "$notes"
    else
        gh release create "$tag" \
            --target "$sha" \
            --title "${TITLES[$tag]}" \
            --notes "${TITLES[$tag]}"
    fi
done

echo "Done. Latest release should be v1.0.6 under $LOGIN."
