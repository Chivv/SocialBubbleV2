#!/bin/bash

echo "🔄 Creating a clean repository without node_modules..."
echo ""

# Create a new branch with clean history
echo "1. Creating new orphan branch..."
git checkout --orphan clean-main

# Add all files except node_modules
echo "2. Adding all files except node_modules..."
git add .
git reset -- node_modules
git reset -- .next

# Create initial commit
echo "3. Creating clean commit..."
git commit -m "Initial commit - clean repository without node_modules"

# Delete the old main branch and rename clean-main to main
echo "4. Replacing main branch..."
git branch -D main
git branch -m main

echo ""
echo "✅ Clean repository created!"
echo ""
echo "Now force push to remote:"
echo "git push origin main --force"
echo ""
echo "This will completely replace the remote repository with clean history."