# SQLite

SQLite is the easiest way to get started with Nautilus locally.

## Datasource

```prisma
datasource db {
  provider = "sqlite"
  url      = "sqlite://./nautilus.db"
}
```

## Why SQLite Is Great for Learning

- no separate database server required
- easiest local validation and iteration story

## Important SQLite Limits

- no native enum type
- no `Jsonb`
- no advanced index families like `Gin`, `Gist`, or `Brin`
- fewer `ALTER TABLE` capabilities, so some diffs may rebuild tables instead of altering them in place

## Recommended Modeling Style on SQLite

- prefer `@store(json)` for arrays and composite fields
- keep examples portable unless you explicitly want provider-specific behavior
- use SQLite for zero-setup experimentation, not as proof that every provider-specific feature is portable
