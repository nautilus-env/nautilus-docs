# Migration Commands

The `migrate` group is the versioned SQL workflow.

## `nautilus migrate generate`

Create a new migration file from the current schema diff.

```text
Usage: nautilus migrate generate [OPTIONS] [LABEL]
```

| Option | Meaning |
| --- | --- |
| `[LABEL]` | Human-readable label such as `add_users` |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |
| `--migrations-dir <MIGRATIONS_DIR>` | Migration directory override |

## `nautilus migrate apply`

Apply all pending migration files in chronological order.

```text
Usage: nautilus migrate apply [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |
| `--migrations-dir <MIGRATIONS_DIR>` | Migration directory override |

## `nautilus migrate rollback`

Roll back the last applied migration set.

```text
Usage: nautilus migrate rollback [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `--steps <STEPS>` | Number of migrations to roll back, default `1` |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |
| `--migrations-dir <MIGRATIONS_DIR>` | Migration directory override |

## `nautilus migrate status`

Show pending and applied migration state.

```text
Usage: nautilus migrate status [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |
| `--migrations-dir <MIGRATIONS_DIR>` | Migration directory override |

## Recommended Use

Use this group when:

- you want committed SQL files
- reviewers should see the exact DDL
- rollback files matter
- environments must advance through the same ordered changes
