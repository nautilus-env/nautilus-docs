# Provider Matrix

Nautilus supports PostgreSQL, MySQL, and SQLite. The schema language is shared, but some features are provider-specific.

## Datasource Snippets

### PostgreSQL

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### MySQL

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### SQLite

```prisma
datasource db {
  provider = "sqlite"
  url      = "sqlite://./nautilus.db"
}
```

## Capability Matrix

| Feature | PostgreSQL | MySQL | SQLite |
| --- | --- | --- | --- |
| Native enum type | yes | no native enum story documented here | no |
| `Jsonb` scalar | yes | no | no |
| `Json` scalar | yes | yes | yes |
| Stored computed column | yes | yes | yes |
| Virtual computed column | no | yes | yes |
| `BTree` index | yes | yes | yes |
| `Hash` index | yes | yes | no |
| `Gin` index | yes | no | no |
| `Gist` index | yes | no | no |
| `Brin` index | yes | no | no |
| `FullText` index | no | yes | no |
| Datasource `extensions` | yes | no | no |
| `Citext`, `Hstore`, `Ltree` | yes, with matching extension | no | no |
| PostGIS `Geometry` / `Geography` | yes, with `postgis` | no | no |
| pgvector `Vector(N)` | yes, with `vector` | no | no |
| pgvector `Hnsw` / `Ivfflat` index | yes | no | no |
| pgvector nearest-neighbor query | yes | no | no |
| Arrays/composites via `@store(json)` | yes | yes | yes |
| Fastest zero-setup local loop | no | no | yes |

## DDL and Runtime Differences

| Area | PostgreSQL | MySQL | SQLite |
| --- | --- | --- | --- |
| Quoting style | `"name"` | `` `name` `` | `"name"` |
| Returning behavior | native `RETURNING` | omitted / emulated | `RETURNING` on supported versions |
| Richest index support | highest | medium | lowest |
| Extension diffing | declared extensions are created; extra live extensions may be dropped unless `preserve_extensions = true` | not supported | not supported |
| Alter table flexibility | high | medium | lowest |
| Some complex diffs may rebuild tables | less often | sometimes | more often |

## Choosing a Default

Use:

- **PostgreSQL** when you want the richest Nautilus feature surface
- **MySQL** when you need a mainstream MySQL-family deployment target
- **SQLite** when you want the easiest local experimentation and zero-service setup

## More Detail

- [PostgreSQL](/providers/postgresql)
- [MySQL](/providers/mysql)
- [SQLite](/providers/sqlite)
