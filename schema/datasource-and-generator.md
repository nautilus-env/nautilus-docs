# Datasource and Generator

The `datasource` block describes where Nautilus should connect. The `generator` block describes what client code Nautilus should write.

## Datasource

### Required fields

| Field | Required | Meaning |
| --- | --- | --- |
| `provider` | yes | Database provider string |
| `url` | yes | Connection string or `env(...)` expression |

### Optional fields

| Field | Meaning |
| --- | --- |
| `direct_url` | Optional direct connection string, accepted by the validator and preserved in schema IR |
| `extensions` | PostgreSQL-only extension list to manage with database workflows |
| `preserve_extensions` | PostgreSQL-only boolean that keeps live extensions not declared in the schema |

### Datasource example: PostgreSQL

```prisma
datasource db {
  provider            = "postgresql"
  url                 = env("DATABASE_URL")
  direct_url          = env("DIRECT_DATABASE_URL")
  extensions          = [citext, hstore, ltree, postgis, vector, "uuid-ossp"]
  preserve_extensions = true
}
```

### Datasource example: MySQL

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Datasource example: SQLite

```prisma
datasource db {
  provider = "sqlite"
  url      = "sqlite://./nautilus.db"
}
```

### `env(...)` rules

The validator expects `env(...)` to receive a single string argument.

Valid:

```prisma
url = env("DATABASE_URL")
```

Invalid:

```prisma
url = env("DATABASE_URL", 1)
```

## PostgreSQL Extensions

`extensions` is a declarative PostgreSQL-only datasource field. Nautilus emits `CREATE EXTENSION IF NOT EXISTS` before enum, composite type, table, and index DDL. `db pull` also serializes installed extensions back into the datasource block.

Entries can be bare identifiers, string literals, or structured entries with a target schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  extensions = [
    citext,
    pg_trgm,
    "uuid-ossp",
    extension(name = vector, schema = "extensions"),
  ]
}
```

Nautilus knows these extension names: `btree_gin`, `btree_gist`, `citext`, `hstore`, `intarray`, `ltree`, `pgcrypto`, `pg_trgm`, `postgis`, `unaccent`, `uuid-ossp`, and `vector`. Unknown names validate with a warning, so custom extensions can still be installed.

Extension-backed field types are PostgreSQL-only. When the matching extension is declared, generated clients emit typed wrapper scalars for these fields:

| Schema type | Extension | Notes |
| --- | --- | --- |
| `Citext` | `citext` | Case-insensitive text with a generated `Citext` wrapper and string-style filters |
| `Hstore` | `hstore` | Key/value map with optional string values and a generated `Hstore` wrapper |
| `Ltree` | `ltree` | PostgreSQL label-tree path with a generated `Ltree` wrapper and string-style filters |
| `Geometry` | `postgis` | PostGIS `GEOMETRY`, exposed as a generated `Geometry` wrapper over WKT/EWKT/EWKB text |
| `Geography` | `postgis` | PostGIS `GEOGRAPHY`, exposed as a generated `Geography` wrapper over WKT/EWKT/EWKB text |
| `Vector(dim)` | `vector` | pgvector dense embedding with a generated `Vector` wrapper and a required positive dimension |

If you use one of these types without the matching extension, validation still succeeds but reports a warning such as `extensions = [postgis]`.

By default extension management is declarative: an extension present in the live database but absent from the schema appears as a destructive drop in `db status` / `db push`. Drops are generated without `CASCADE`, so PostgreSQL rejects them if dependent objects still exist. Set `preserve_extensions = true` when another tool or platform owns extra live extensions.

## Generator

### Current providers

| Provider | Target |
| --- | --- |
| `nautilus-client-rs` | Rust source output |
| `nautilus-client-py` | Python package output |
| `nautilus-client-js` | JavaScript runtime plus `.d.ts` typings |
| `nautilus-client-java` | Java Maven module or jar bundle |

### Shared generator fields

| Field | Required | Meaning |
| --- | --- | --- |
| `provider` | yes | Client target provider |
| `output` | no | Output directory for generated artifacts, if not specified the default language's module folder is used|
| `interface` | no | `"sync"` or `"async"` |

### Python-only field

| Field | Meaning |
| --- | --- |
| `recursive_type_depth` | Controls how deeply recursive include TypedDicts are generated for Python clients |

`recursive_type_depth` is currently a Python-only setting. Using it with Rust or JS generators is a validation error.

### Java-only fields

| Field | Meaning |
| --- | --- |
| `package` | Java package name |
| `group_id` | Maven group ID |
| `artifact_id` | Maven artifact ID |
| `mode` | `"maven"` or `"jar"` |

These fields belong only to the Java generator. Using them with a non-Java provider is a validation error.

## Generator examples

::: code-group

```prisma [Python]
generator client {
  provider             = "nautilus-client-py"
  output               = "./db"
  interface            = "async"
  recursive_type_depth = 3
}
```

```prisma [TypeScript]
generator client {
  provider  = "nautilus-client-js"
  output    = "./db"
  interface = "async"
}
```

```prisma [Rust]
generator client {
  provider  = "nautilus-client-rs"
  output    = "./db"
  interface = "async"
}
```

```prisma [Java]
generator client {
  provider    = "nautilus-client-java"
  output      = "./db"
  package     = "com.example.db"
  group_id    = "com.example"
  artifact_id = "nautilus-client"
  mode        = "jar"
  interface   = "async"
}
```

:::

## Sync vs Async

`interface` controls the shape of the generated API:

- `"sync"` generates synchronous methods
- `"async"` generates asynchronous methods

Current docs and examples show:

- Python: `def` vs `async def`
- Rust: async functions for the async target
- Java: direct return values vs `CompletableFuture`
- JS/TS: No difference, all methods are async and return Promises

## Generation and Local Install Behavior

The public CLI controls installation behavior with `nautilus generate` options

Important practical notes:

- generated clients are local artifacts, not published packages
- Python and JS are normally consumed directly from the generated output directory
- Rust can generate into an existing workspace or use `--standalone`
- Java writes a Maven module by default and can also write a plain jar bundle when `mode = "jar"`
