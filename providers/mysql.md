# MySQL

MySQL is a solid middle ground when you need a mainstream SQL backend but do not require every PostgreSQL-specific feature.

## Datasource

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## What to Expect

- `Json` works, but `Jsonb` does not apply
- `FullText` indexing is the main provider-specific index type documented here
- computed columns can be stored or virtual
- the SQL renderer does not use native `RETURNING`

## Good Use Cases

- apps already deployed on MySQL
- teams that want a provider with broader hosting familiarity than PostgreSQL-specific features
- schemas that do not depend on PostgreSQL-only index or type features
