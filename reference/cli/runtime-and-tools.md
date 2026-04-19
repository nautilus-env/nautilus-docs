# Runtime and Tooling Commands

This page covers the remaining runtime and utility commands.

## `nautilus engine serve`

Start the JSON-RPC engine used by generated clients.

```text
Usage: nautilus engine serve [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `-s, --schema <SCHEMA>` | Schema path |
| `--database-url <DATABASE_URL>` | Database URL override |
| `--migrate` | Run DDL migrations before entering the request loop |

Use it when you want to debug or launch the engine manually instead of letting generated clients manage it.

## `nautilus python install`

Install a `.pth` shim for Python CLI access.

```text
Usage: nautilus python install [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `--python <PYTHON>` | Python executable override |

Notes:

- after installation, the shim is intended to make `python -m nautilus` and `import nautilus` resolve to the CLI wrapper
- this is separate from client generation
- if you generated a Python client without `--no-install`, that client may already have been copied to `site-packages/nautilus` and can shadow the shim

## `nautilus python uninstall`

Remove the Python shim.

```text
Usage: nautilus python uninstall [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `--python <PYTHON>` | Python executable override |

## `nautilus studio`

Manage the Nautilus Studio Next.js app checkout/build and launch flow.

```text
Usage: nautilus studio [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `--update` | Download the latest Studio release again before starting |
| `--uninstall` | Remove the locally cached Studio release files |

Studio runtime notes from the current implementation:

- Node.js is required
- npm is required
- the CLI downloads a platform-specific release asset from the configured Studio GitHub repo
- it installs runtime dependencies from `package-lock.json` when needed
- it launches the app from the current project directory
