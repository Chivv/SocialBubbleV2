#!/bin/bash

echo "🚨 Fixing large files in Git history"
echo ""
echo "This script will:"
echo "1. Remove ALL files larger than 100M from Git history"
echo "2. Clean up the repository"
echo "3. Force push the changes"
echo ""
echo "⚠️  WARNING: This will rewrite Git history!"
echo ""

# Option 1: Using git filter-repo (recommended if available)
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo..."
    
    # Remove node_modules from history
    git filter-repo --path node_modules --invert-paths --force
    
    # Remove any file larger than 100M
    git filter-repo --strip-blobs-bigger-than 100M --force
    
else
    echo "git-filter-repo not found. Installing..."
    echo "Run: pip3 install git-filter-repo"
    echo ""
    echo "Alternative: Download BFG Repo-Cleaner"
    echo "1. Download from: https://rtyley.github.io/bfg-repo-cleaner/"
    echo "2. Run: java -jar bfg.jar --strip-blobs-bigger-than 100M"
    echo "3. Run: git reflog expire --expire=now --all && git gc --prune=now --aggressive"
    exit 1
fi

echo ""
echo "✅ Repository cleaned!"
echo ""
echo "Now run:"
echo "git push origin main --force"