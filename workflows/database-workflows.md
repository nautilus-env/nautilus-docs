# Database Workflows

Nautilus supports two main schema-to-database workflows:

- direct schema sync with `nautilus db ...`
- versioned migrations with `nautilus migrate ...`

This page covers the `db` command group.

## `db` Command Surface

| Command | Purpose |
| --- | --- |
| `nautilus db push` | Diff schema against the live database and apply changes immediately |
| `nautilus db status` | Show the pending diff without applying it |
| `nautilus db pull` | Introspect a live database and write a `.nautilus` schema |
| `nautilus db drop` | Drop all tables without recreating them |
| `nautilus db reset` | Drop and recreate schema state, or delete only data |
| `nautilus db seed` | Execute a SQL seed script |

## `db push`

Diff schema against the live database and apply changes immediately, `db push` is the fastest development loop, in production you should use a [reviewed migration workflow](migrations) instead:

> **Note**: Every `--` argument is optional if your schema is located at the same directory as your current command line location
___ 

```bash
nautilus db push --schema schema.nautilus
```

Current options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Explicit schema path |
| `--database-url <DATABASE_URL>` | Override datasource `url` / `direct_url` and environment variables |
| `--accept-data-loss` | Skip the destructive-change confirmation |
| `--no-generate` | Apply schema changes without triggering client generation afterwards |


Important behavior:

- `db push` diffs the live database against the validated schema
- on PostgreSQL, declared datasource `extensions` are created before type, table, and index DDL
- destructive changes may require confirmation unless you pass `--accept-data-loss`
- successful pushes regenerate the client unless `--no-generate` is used
- extra live PostgreSQL extensions are treated as destructive drops unless the datasource sets `preserve_extensions = true`

## `db status`

Show the pending diff without applying it, use this when you want a dry run:

> **Note**: Every `--` argument is optional if your schema is located at the same directory as your current command line location
___ 

```bash
nautilus db status --schema schema.nautilus
```

Options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Explicit schema path |
| `--database-url <DATABASE_URL>` | Override datasource connection |

Use `db status` before `db push` when:

- you want to inspect pending DDL effects
- you suspect a destructive change
- you are comparing behavior across providers

## `db pull`

`db pull` introspects a live database and writes a schema file.

> **Note**: Every `--` argument is optional if your schema is located at the same directory as your current command line location
___ 

```bash
nautilus db pull --database-url "$DATABASE_URL" --output pulled.nautilus
```

Current options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Optional schema file used to resolve datasource values |
| `--database-url <DATABASE_URL>` | Explicit connection string override |
| `--output <OUTPUT>` | Output path, default `pulled.nautilus` |
| `--model-case <auto\|snake\|pascal>` | Naming mode for generated model names |
| `--field-case <auto\|snake\|pascal>` | Naming mode for generated field names |

PostgreSQL-specific behavior:

- installed extensions are serialized into datasource `extensions`
- extensions installed outside `public` are rendered with `extension(name = ..., schema = "...")`
- `citext`, `hstore`, `ltree`, PostGIS, and pgvector columns are mapped back to `Citext`, `Hstore`, `Ltree`, `Geometry`, `Geography`, and `Vector(N)` when possible


## `db drop`

This permanently drops all live tables without recreating them.

> **Note**: Every `--` argument is optional if your schema is located at the same directory as your current command line location
___ 

```bash
nautilus db drop --schema schema.nautilus
```

Options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Explicit schema path |
| `--database-url <DATABASE_URL>` | Explicit connection string override |
| `--force` | Skip the interactive confirmation |

Use it carefully. This is a destructive reset tool, not a normal dev loop.

## `db reset`

Drop and recreate schema state, or simply delete only data:

> **Note**: Every `--` argument is optional if your schema is located at the same directory as your current command line location
___ 

```bash
nautilus db reset --schema schema.nautilus
```

Options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Explicit schema path |
| `--database-url <DATABASE_URL>` | Explicit connection string override |
| `--force` | Skip the interactive confirmation |
| `--only-data` | Delete rows but keep the table structure |


## `db seed`

Run a SQL file against a live database:

> **Note**: Every `--` argument is optional if your schema is located at the same directory as your current command line location
___ 

```bash
nautilus db seed ./seed.sql --database-url "$DATABASE_URL"
```

Options:

| Option | Meaning |
| --- | --- |
| `<FILE>` | Path to the SQL seed file |
| `--database-url <DATABASE_URL>` | Explicit connection string override |

`db seed` executes SQL directly. It does not parse `.nautilus` schema content.
