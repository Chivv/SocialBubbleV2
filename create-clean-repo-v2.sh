#!/bin/bash

echo "🔄 Creating a completely clean repository without secrets..."
echo ""

# Create a new orphan branch
echo "1. Creating new orphan branch..."
git checkout --orphan clean-main-v2

# Add all files except node_modules and GOOGLE_DRIVE_SETUP.md
echo "2. Adding all files except node_modules and sensitive files..."
git add .
git reset -- node_modules
git reset -- .next
git reset -- GOOGLE_DRIVE_SETUP.md

# Create initial commit
echo "3. Creating clean commit..."
git commit -m "Initial commit - clean repository without node_modules or secrets"

# Now add the sanitized GOOGLE_DRIVE_SETUP.md
echo "4. Adding sanitized documentation..."
git add GOOGLE_DRIVE_SETUP.md
git commit -m "Add Google Drive setup documentation (sanitized)"

# Delete the old main branch and rename clean-main-v2 to main
echo "5. Replacing main branch..."
git branch -D main 2>/dev/null || true
git branch -m main

echo ""
echo "✅ Clean repository created without any secrets!"
echo ""
echo "Now force push to remote:"
echo "git push origin main --force"
echo ""
echo "This will completely replace the remote repository with clean history."