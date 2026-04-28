# Language-Specific Notes

## Python

### Manual Connect / Disconnect

```python
import asyncio
from db import Nautilus

async def main():
    client = Nautilus()
    await client.connect()
    try:
        users = await client.user.find_many()
    finally:
        await client.disconnect()

asyncio.run(main())
```

### Auto-Register

If you enable auto-register mode, generated model classes expose a direct Nautilus accessor:

```python
from db import Nautilus
from db.models import User

async with Nautilus(auto_register=True) as client:
    admins = await User.nautilus.find_many(where={"role": "ADMIN"})
```

### `recursive_type_depth`

This setting is currently Python-only. It controls how many levels of recursive include type helpers Nautilus generates.

### Python version baseline

The current generated Python templates import `typing.NotRequired` directly from the standard library. In practice, Python `3.11+` is the safest baseline for generated clients even though the CLI package itself publishes for older Python versions.

### `chunk_size` on `find_many`

The current generated Python client exposes `chunk_size` on `find_many` and forwards it to the engine as protocol-level `chunkSize`.

### Sync vs Async

If you use `interface = "sync"`, the client surface becomes synchronous instead of async.

### Local install behavior

`nautilus generate` can also perform the target-specific local install step, but the normal workflow is still to import from the configured `output` directory directly.

Prefer:

```bash
nautilus generate --schema schema.nautilus --no-install
```

The default install step copies the generated package into `site-packages/nautilus`. That is convenient for some local experiments, but it also means the generated client can shadow the separate CLI shim installed by `nautilus python install`.

## JavaScript / TypeScript

### TypeScript declarations

Nautilus writes `.d.ts` declarations so the generated package is usable in both plain JS and TS projects.

### `chunkSize` on `findMany`

The current generated JS client exposes `chunkSize` on `findMany` and forwards it to the engine at the protocol level.

### Select and include

The generated types reflect logical field names from your schema, including mapped fields. That means `select` and `include` shapes are schema-aware rather than raw database-column-driven.

### Local install behavior

The current generation story is local-first. Import from the configured output directory. If you want generation without target-specific local install behavior, use:

```bash
nautilus generate --schema schema.nautilus --no-install
```

When you keep the default install step, Nautilus can also copy the generated files into the nearest `node_modules/nautilus`, but `output/index.js` is still the stable entry point documented here.

## Rust

- the generated Rust API is schema-aware rather than raw-SQL-first
- Rust generation can emit bare sources for embedding into an existing workspace
- `--no-install` skips the target-specific local install behavior if you only want files written to disk

If you want the low-level runtime building blocks instead of generated sources, the upstream workspace also exposes dedicated crates, but that is outside the main end-user scope of this site.

## Java

### Plain Java Compile / Run

::: code-group

```powershell [Windows]
javac --release 21 -cp "db\dist\nautilus-client.jar;db\dist\lib\*" Main.java
java -cp ".;db\dist\nautilus-client.jar;db\dist\lib\*" Main
```

```bash [POSIX]
javac --release 21 -cp "db/dist/nautilus-client.jar:db/dist/lib/*" Main.java
java -cp ".:db/dist/nautilus-client.jar:db/dist/lib/*" Main
```

:::

- the generated Java runtime loads dotenv data before spawning the engine
- `install = true` is currently ignored for Java in the upstream runtime notes
- `mode = "jar"` is the best fit when you want the most explicit local output story
