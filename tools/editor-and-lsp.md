# Editor and LSP

Nautilus ships a language server and a VS Code extension for `.nautilus` files.

## Current LSP Features

The upstream `nautilus-lsp` README describes these capabilities:

- diagnostics after open, change, and save
- completion
- hover
- go-to-definition
- whole-file formatting
- semantic tokens
- full-document sync

## VS Code Extension

The extension lives in `tools/vscode-nautilus-schema` in the upstream repo and is distributed as a `.vsix` asset in the release bundle.

From the current release, the extension asset is:

- `vscode-nautilus-schema-*.*.*.vsix`

## Install the Extension

1. Download the `.vsix` from the upstream Nautilus release.
2. In VS Code, open `Extensions -> ... -> Install from VSIX...`.
3. Open a `.nautilus` file.

## Binary Resolution Order

The extension resolves `nautilus-lsp` in this order:

1. `nautilus.lspPath`
2. local repo debug build
3. cached downloaded binary
4. `nautilus-lsp` on `PATH`
5. GitHub release download

## Manual Binary Override

If you manage the binary yourself, set:

```json
{
  "nautilus.lspPath": "/absolute/path/to/nautilus-lsp"
}
```

## Running the LSP From Source

From the upstream repo:

```bash
cargo run -p nautilus-orm-lsp
```

The server uses stdio and is intended to be launched by editor integrations.

