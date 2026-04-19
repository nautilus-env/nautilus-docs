# CLI Reference

This section documents the current Nautilus CLI surface.

Top-level help currently reports:

| Command group | Purpose |
| --- | --- |
| `generate` | Generate client code from a schema file |
| `validate` | Validate a schema file without generating code |
| `format` | Format a `.nautilus` file in place |
| `db` | Database management commands |
| `migrate` | Versioned migration commands |
| `engine` | Engine runtime commands |
| `python` | Python shim install/uninstall |
| `studio` | Nautilus Studio lifecycle management |

## Common CLI Rules

- `--schema` is optional on schema-based commands because Nautilus auto-detects the first `.nautilus` file in the current directory
- `--database-url` overrides datasource connection settings
- generation behavior is target-specific and can be adjusted with `--no-install`

## Command Pages

- [Core Commands](/reference/cli/core-commands)
- [Database Commands](/reference/cli/database-commands)
- [Migration Commands](/reference/cli/migration-commands)
- [Runtime and Tooling Commands](/reference/cli/runtime-and-tools)
