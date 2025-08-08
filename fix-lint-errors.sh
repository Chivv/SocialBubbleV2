#!/bin/bash

echo "🔧 Fixing all ESLint errors..."

# Fix unescaped entities in all files
FILES=(
  "app/dashboard/creator/briefings/[id]/page.tsx"
  "app/dashboard/creator/briefings/creator-briefings-client.tsx"
  "app/dashboard/creator/opportunities/opportunities-client.tsx"
  "app/dashboard/creators/[id]/view/creator-profile-view.tsx"
  "app/dashboard/creators/[id]/view/page.tsx"
  "app/dashboard/settings/automations/components/rules-list.tsx"
  "app/dashboard/settings/google-drive/page.tsx"
  "app/dashboard/test-workflow/page.tsx"
  "components/emails/briefing-now-ready.tsx"
  "components/emails/casting-approved-no-briefing.tsx"
  "components/emails/casting-approved-with-briefing.tsx"
  "components/emails/casting-closed-no-response.tsx"
  "components/emails/casting-invite-template.tsx"
  "components/emails/casting-not-selected.tsx"
  "components/emails/casting-ready-for-review.tsx"
  "components/emails/creator-invitation-template.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Replace single quotes with &apos;
    sed -i.bak "s/'/\&apos;/g" "$file"
    # Replace double quotes in JSX text with &quot;
    sed -i.bak 's/\([>]\)\([^<]*\)"\([^<]*\)"\([^<]*\)\([<]\)/\1\2\&quot;\3\&quot;\4\5/g' "$file"
    rm "$file.bak"
  fi
done

# Fix the syntax error in slack blocks
echo "Fixing lib/slack/blocks/creator-signup.ts..."
sed -i.bak '192s/^/  /' lib/slack/blocks/creator-signup.ts
rm lib/slack/blocks/creator-signup.ts.bak

echo "✅ Lint fixes applied!"