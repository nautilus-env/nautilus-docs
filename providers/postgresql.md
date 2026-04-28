# PostgreSQL

PostgreSQL is the strongest fit when you want the richest Nautilus schema feature surface.

## Datasource

```prisma
datasource db {
  provider            = "postgresql"
  url                 = env("DATABASE_URL")
  extensions          = [citext, hstore, ltree, postgis, vector]
  preserve_extensions = true
}
```

## Where PostgreSQL Stands Out

- native enum creation
- declarative extension management through `extensions`
- extension-backed types such as `Citext`, `Hstore`, `Ltree`, `Geometry`, `Geography`, and `Vector(N)`
- `Jsonb`
- advanced index types such as `Gin`, `Gist`, and `Brin`
- pgvector `Hnsw` / `Ivfflat` indexes and nearest-neighbor queries
- strong generated-column support for stored computed fields
- richer native array behavior than the other supported providers

## PostgreSQL Extensions

PostgreSQL extensions are declared in the datasource. `db push` and migrations create missing declared extensions before the rest of the schema DDL. `db pull` serializes installed extensions back into the datasource.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  extensions = [
    citext,
    hstore,
    ltree,
    postgis,
    vector,
    "uuid-ossp",
    extension(name = pg_trgm, schema = "extensions"),
  ]
}
```

Use `preserve_extensions = true` when your database has extra live extensions managed outside Nautilus. Without it, `db status` / `db push` treat undeclared live extensions as destructive drops.

### Extension-backed scalar types

When the matching extension is declared in the datasource, generated clients expose wrapper scalar types for these fields.

| Type | Extension | Database type | Generated-client shape |
| --- | --- | --- | --- |
| `Citext` | `citext` | `CITEXT` | generated `Citext` wrapper; JS/Python/Java inputs also accept raw strings |
| `Hstore` | `hstore` | `HSTORE` | generated `Hstore` wrapper; JS/Python/Java inputs also accept raw key/value maps |
| `Ltree` | `ltree` | `LTREE` | generated `Ltree` wrapper; JS/Python/Java inputs also accept raw strings |
| `Geometry` | `postgis` | `GEOMETRY` | generated `Geometry` wrapper over WKT/EWKT/EWKB text |
| `Geography` | `postgis` | `GEOGRAPHY` | generated `Geography` wrapper over WKT/EWKT/EWKB text |
| `Vector(N)` | `vector` | `VECTOR(N)` | generated `Vector` wrapper; JS/Python/Java inputs also accept raw float lists |

```prisma
model Place {
  id        Int        @id @default(autoincrement())
  slug      Citext     @unique
  labels    Hstore?
  path      Ltree?
  footprint Geometry?
  location  Geography?
  embedding Vector(1536)

  @@index([embedding], type: Hnsw, opclass: vector_cosine_ops, m: 16, ef_construction: 64)
}
```

`Citext` and `Ltree` expose string-like filters. `Hstore`, `Geometry`, `Geography`, and `Vector(N)` expose equality, `not`, and null checks in generated filter helpers. For richer spatial predicates, use raw SQL with PostGIS functions such as `ST_DWithin` and explicit casts or constructors.

### Vector indexes

Use `Hnsw` for graph-based indexes and `Ivfflat` for list-based indexes:

```prisma
model Embedding {
  id        Int          @id @default(autoincrement())
  embedding Vector(1536)

  @@index([embedding], type: Hnsw, opclass: vector_cosine_ops, m: 16, ef_construction: 64)
}

model EmbeddingIvf {
  id        Int          @id @default(autoincrement())
  embedding Vector(1536)

  @@index([embedding], type: Ivfflat, opclass: vector_l2_ops, lists: 100)
}
```

Pair the query metric with the matching opclass: `l2` with `vector_l2_ops`, `innerProduct` with `vector_ip_ops`, and `cosine` with `vector_cosine_ops`.

### Nearest-neighbor queries

Nearest-neighbor search is available on models that contain at least one `Vector(N)` field. `take` is required and must be positive.

::: code-group

```python [Python]
from db.extensions.vector import Vector

nearby = await client.place.find_many(
    nearest={
        "field": "embedding",
        "query": Vector([0.12, 0.04, 0.98]),
        "metric": "cosine",
    },
    take=10,
)
```

```typescript [JavaScript / TypeScript]
import { Vector } from './db/extensions/vector/types.js';

const nearby = await client.place.findMany({
  nearest: {
    field: 'embedding',
    query: new Vector([0.12, 0.04, 0.98]),
    metric: 'cosine',
  },
  take: 10,
});
```

```rust [Rust]
use db::Place;
use nautilus_core::{FindManyArgs, VectorMetric, VectorNearest};

let nearby = Place::nautilus(&client)
    .find_many(FindManyArgs {
        nearest: Some(VectorNearest {
            field: "embedding".into(),
            query: vec![0.12, 0.04, 0.98],
            metric: VectorMetric::Cosine,
        }),
        take: Some(10),
        ..Default::default()
    })
    .await?;
```

```java [Java]
import com.example.db.dsl.PlaceDsl;
import com.example.db.extensions.vector.types.Vector;
import com.example.db.model.Place;
import java.util.List;

List<Place> nearby = client.place().findMany(q -> q
    .nearest(n -> n
        .embedding()
        .query(Vector.of(List.of(0.12f, 0.04f, 0.98f)))
        .metric(PlaceDsl.VectorMetric.COSINE))
    .take(10)
).join();
```

:::

## PostgreSQL-Specific Notes

- `Virtual` computed columns are not supported
- `extensions` and `preserve_extensions` are PostgreSQL-only datasource fields
- unknown extension names validate with a warning so custom extensions can still be managed
- extension-backed scalar types warn when the matching extension is missing
- generated `Geometry` and `Geography` wrappers serialize to strings and are cast to PostGIS types during PostgreSQL query rendering
- PostgreSQL DDL is the best fit for advanced indexing examples in Nautilus docs
- when you want to demonstrate `Jsonb`, PostgreSQL is the correct primary target

## Good Use Cases

- production systems that want the widest Nautilus feature coverage
- schemas using advanced indexing
- schemas that benefit from PostgreSQL’s type system
