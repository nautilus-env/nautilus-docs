# PostgreSQL

PostgreSQL is the strongest fit when you want the richest Nautilus schema feature surface.

## Datasource

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Where PostgreSQL Stands Out

- native enum creation
- `Jsonb`
- advanced index types such as `Gin`, `Gist`, and `Brin`
- strong generated-column support for stored computed fields
- richer native array behavior than the other supported providers

## PostgreSQL-Specific Notes

- `Virtual` computed columns are not supported
- PostgreSQL DDL is the best fit for advanced indexing examples in Nautilus docs
- when you want to demonstrate `Jsonb`, PostgreSQL is the correct primary target

## Good Use Cases

- production systems that want the widest Nautilus feature coverage
- schemas using advanced indexing
- schemas that benefit from PostgreSQL’s type system
