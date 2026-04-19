# Database Commands

The `db` group is the direct live-database workflow.

## `nautilus db push`

Push the current schema state to the database.

```text
Usage: nautilus db push [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |
| `--accept-data-loss` | Skip interactive confirmation for destructive changes |
| `--no-generate` | Apply schema changes without generating a client afterwards |

## `nautilus db status`

Show pending schema changes without applying them.

```text
Usage: nautilus db status [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |

## `nautilus db pull`

Introspect a live database and write an equivalent `.nautilus` schema.

```text
Usage: nautilus db pull [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `-s, --schema <SCHEMA>` | Optional schema path for datasource lookup |
| `--database-url <DATABASE_URL>` | Database URL override |
| `-o, --output <OUTPUT>` | Output file path, default `pulled.nautilus` |
| `--model-case <auto|snake|pascal>` | Naming mode for generated model names |
| `--field-case <auto|snake|pascal>` | Naming mode for generated field names |

## `nautilus db drop`

Drop all tables without recreating them.

```text
Usage: nautilus db drop [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |
| `--force` | Skip confirmation |

## `nautilus db reset`

Drop and recreate schema state, or truncate data only.

```text
Usage: nautilus db reset [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |
| `--force` | Skip confirmation |
| `--only-data` | Delete rows but keep table structure |

## `nautilus db seed`

Run a SQL seed script.

```text
Usage: nautilus db seed [OPTIONS] <FILE>
```

| Option | Meaning |
| --- | --- |
| `<FILE>` | Path to the SQL file |
| `--database-url <DATABASE_URL>` | Database URL override |

## Practical Advice

- use `db status` before risky pushes
- reserve `db drop` and `db reset` for deliberate cleanup
- use `db pull` when adopting Nautilus against an existing database
- use `db seed` only for raw SQL seeding, not schema definition
