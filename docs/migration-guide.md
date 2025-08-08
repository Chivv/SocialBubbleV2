# Supabase Migration Guide

## Creating New Migrations

Always use the Supabase CLI to create new migrations:

```bash
# Create a new migration
npm run supabase:migration:new -- your_migration_name

# This creates a file like: supabase/migrations/20240123123456_your_migration_name.sql
```

## Applying Migrations

```bash
# Apply all pending migrations
npm run supabase:db:push

# Or if you have migrations that need to be applied in order
npm run supabase:db:push -- --include-all
```

## Migration File Format

Migration files must follow this naming pattern:
- `YYYYMMDDHHmmss_description.sql`
- Example: `20240123123456_add_user_profiles.sql`

## Fixing Migration Issues

If you've manually run SQL and need to mark migrations as applied:

```bash
# Mark a specific migration as applied
npx supabase migration repair --status applied <version>

# Example:
npx supabase migration repair --status applied 20240123123456
```

If you need to revert a migration from history:

```bash
npx supabase migration repair --status reverted <version>
```

## Best Practices

1. **Always use the CLI**: Create migrations with `npm run supabase:migration:new`
2. **Never run SQL manually in production**: Use migrations instead
3. **Test locally first**: Use `supabase start` to test migrations locally
4. **Keep migrations small**: One logical change per migration
5. **Use descriptive names**: Make it clear what the migration does

## Common Commands

```bash
# List all migrations and their status
npx supabase migration list

# Create a new migration
npm run supabase:migration:new -- add_user_settings

# Apply migrations
npm run supabase:db:push

# Pull remote schema (be careful, this can overwrite local changes)
npx supabase db pull
```

## Troubleshooting

### "Remote migration versions not found in local"
This happens when there are migrations on remote that aren't in your local files.
Solution: Either pull the schema or mark the remote migration as reverted.

### "Found local migration files to be inserted before the last migration"
This happens when you have local migrations with timestamps earlier than the latest remote migration.
Solution: Use `--include-all` flag or rename your local migrations with newer timestamps.