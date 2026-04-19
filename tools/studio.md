# Studio

`nautilus studio` Create a web database editor, schema explorer, and query playground with the latest release of your schema and clients.

## Command Surface

```text
Usage: nautilus studio [OPTIONS]
```

| Option | Meaning |
| --- | --- |
| `--update` | Download the latest Studio release again before starting |
| `--uninstall` | Remove the locally cached Studio release files |

## Runtime Requirements

The current CLI implementation requires:

- Node.js
- npm

If either command is missing, `nautilus studio` fails early with an explicit runtime message.

## What the Command Does

From the current upstream CLI implementation, `nautilus studio`:

1. checks whether Node.js and npm exist
2. looks up the latest release from [nautilus-env/nautilus-orm-studio](https://github.com/nautilus-env/nautilus-orm-studio)
3. resolves the current platform asset named `nautilus-orm-studio-${tag}-${os}.zip`
4. extracts the release under the local Nautilus data directory
5. installs runtime dependencies with npm if `node_modules` is missing
6. launches the bundled Next.js app from the current project directory

## Platform Asset Naming

The implementation currently expects one of:

- `windows`
- `linux`
- `macos`

inside the release asset name.

## Common Commands

Start Studio:

```bash
nautilus studio
```

Force refresh from the latest release:

```bash
nautilus studio --update
```

Remove the cached install:

```bash
nautilus studio --uninstall
```
