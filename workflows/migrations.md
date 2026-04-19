# Migrations

Nautilus migrations use the same underlying diff engine as `db push`, but they materialize the change set as versioned SQL files before application.

## When to Use Migrations

Use migrations when you need:

- reviewed SQL files in version control
- reproducible deployment order
- rollback files alongside forward files
- a production-friendly workflow

Use `db push` when you need speed in development and do not want to maintain migration files yet.

## Migration Command Surface

| Command | Purpose |
| --- | --- |
| `nautilus migrate generate [LABEL]` | Create a new migration from the current schema diff |
| `nautilus migrate apply` | Apply pending migrations in chronological order |
| `nautilus migrate rollback` | Roll back the last applied migration set |
| `nautilus migrate status` | Show applied vs pending migrations |

## How the Workflow Looks

### 1. Generate a migration

```bash
nautilus migrate generate add_users --schema schema.nautilus
```

Options:

| Option | Meaning |
| --- | --- |
| `[LABEL]` | Human-readable label such as `add_users` |
| `--schema <SCHEMA>` | Explicit schema path |
| `--database-url <DATABASE_URL>` | Connection override |
| `--migrations-dir <MIGRATIONS_DIR>` | Custom migrations directory |

Default migrations directory behavior:

- Nautilus writes to `migrations/` next to the schema file unless overridden

### 2. Review the generated SQL

The versioned workflow writes paired files:

- `.up.sql`
- `.down.sql`

Review these before applying them to shared environments.

### 3. Apply migrations

```bash
nautilus migrate apply --schema schema.nautilus
```

Options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Explicit schema path |
| `--database-url <DATABASE_URL>` | Connection override |
| `--migrations-dir <MIGRATIONS_DIR>` | Custom migrations directory |

### 4. Check status

```bash
nautilus migrate status --schema schema.nautilus
```

This tells you which migrations are already applied and which are still pending.

### 5. Roll back if needed

```bash
nautilus migrate rollback --schema schema.nautilus --steps 1
```

Options:

| Option | Meaning |
| --- | --- |
| `--steps <STEPS>` | Number of applied migrations to roll back, default `1` |
| `--schema <SCHEMA>` | Explicit schema path |
| `--database-url <DATABASE_URL>` | Connection override |
| `--migrations-dir <MIGRATIONS_DIR>` | Custom migrations directory |

## What Nautilus Tracks

The migration executor maintains a migration tracking table in the database. The upstream migration docs refer to `DB + _nautilus_migrations` as the tracked state.

That means migration status is not inferred purely from files on disk. Nautilus compares:

- files in the migrations directory
- applied migration records in the database

## `db push` vs Migrations

| Question | `db push` | Migrations |
| --- | --- | --- |
| Writes SQL files to disk | no | yes |
| Fast local iteration | excellent | slower |
| Production review story | weak | strong |
| Rollback files | no | yes |
| Best for | local development | shared and production environments |


## Notes on Provider Differences

Migration SQL remains provider-aware:

- PostgreSQL supports the richest index and native-type surface
- MySQL and SQLite have different DDL constraints
- SQLite may rebuild tables for changes that other providers handle with `ALTER TABLE`

This is one reason to review generated SQL instead of assuming every diff is equally cheap across providers.
