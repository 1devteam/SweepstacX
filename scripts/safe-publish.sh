#!/usr/bin/env bash
set -euo pipefail
[ -f package.json ] || { echo "❌ Not in project root (missing package.json)"; exit 1; }
[ -d .git ] || { echo "❌ Not a git repo (missing .git)"; exit 1; }
name=$(jq -r .name package.json); ver=$(jq -r .version package.json)
echo "About to publish: $name@$ver from $(pwd)"
npm whoami
npm publish --dry-run
read -r -p "Publish for real? [y/N] " ans
[[ ${ans:-N} =~ ^[Yy]$ ]] && npm publish --access public || echo "Aborted."
