#!/bin/bash
set -e

REPO_URL="https://Pablosototo:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/Pablosototo/GHF_Replit.git"

git config user.email "replit@replit.com"
git config user.name "Replit Agent"

if git remote get-url github 2>/dev/null; then
  git remote set-url github "$REPO_URL"
else
  git remote add github "$REPO_URL"
fi

git push github main --force

echo ""
echo "Codigo subido exitosamente a GitHub: https://github.com/Pablosototo/GHF_Replit"
