#!/bin/bash

echo "🧹 Cleaning Git history to remove large files..."
echo ""
echo "⚠️  WARNING: This will rewrite Git history!"
echo "Make sure you have a backup of your repository."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Method 1: Using git filter-branch (built-in but slower)
echo "Using git filter-branch to remove node_modules from history..."
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch node_modules' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
echo "Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Git history cleaned!"
echo ""
echo "Now force push to remote:"
echo "git push origin main --force"
echo ""
echo "⚠️  All team members will need to re-clone the repository after this!"