# Core Commands

These commands work directly on schema files and do not require a live database unless the generated client or runtime workflow depends on one later.

## `nautilus generate`

Generate client code from a schema file.

```text
Usage: nautilus generate [OPTIONS]
```

Options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Path to the schema file |
| `--no-install` | Skip automatic package installation after generation |
| `-v, --verbose` | Verbose output |
| `--standalone` | Rust only; also generate a `Cargo.toml` next to generated sources |

Notes:

- the generator target is chosen from the schema’s `generator` block
- `--standalone` matters only for `nautilus-client-rs`
- `--no-install` is useful when you want pure file output without the target-specific local install step

## `nautilus validate`

Validate a schema file without generating code.

```text
Usage: nautilus validate [OPTIONS]
```

Options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Path to the schema file |

Use this command first when:

- checking a new schema
- debugging relation or type errors
- validating after manual edits

## `nautilus format`

Format a `.nautilus` schema file in place.

```text
Usage: nautilus format [OPTIONS]
```

Options:

| Option | Meaning |
| --- | --- |
| `--schema <SCHEMA>` | Path to the schema file |

Use `format` after the file is structurally valid or close to it. It rewrites the file into Nautilus’s canonical formatting style.

## Recommended Sequence

For schema authoring, the usual loop is:

```bash
nautilus validate --schema schema.nautilus
nautilus format --schema schema.nautilus
nautilus generate --schema schema.nautilus
```
