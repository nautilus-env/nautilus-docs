# PostgreSQL Extension Types

The `extensions` branch adds PostgreSQL extension-backed scalar types to schema validation, migrations, introspection, and generated clients. The latest codegen update keeps the same scalar set and makes the generated APIs more ergonomic: Python and JavaScript now reuse richer `*Input` aliases across create/update/filter/nearest serialization, and all languages gain more capable wrapper helpers for hstore, spatial, and vector values.

The examples below use this schema:

```prisma
datasource db {
  provider            = "postgresql"
  url                 = env("DATABASE_URL")
  extensions          = [citext, hstore, ltree, postgis, vector]
  preserve_extensions = true
}

model Place {
  id        Int        @id @default(autoincrement())
  slug      Citext     @unique
  labels    Hstore?
  path      Ltree?
  footprint Geometry?
  location  Geography?
  embedding Vector(3)

  @@index([embedding], type: Hnsw, opclass: vector_cosine_ops, m: 16, ef_construction: 64)
}
```

## Rich Input Aliases

- `CitextInput` and `LtreeInput` accept wrapper instances, raw strings, and `{ value: ... }` builder objects in Python and JavaScript.
- `GeometryInput` accepts wrapper instances, raw strings, `{ value: ... }`, `{ wkt: "...", srid?: ... }`, and `{ x: ..., y: ..., srid?: ... }`.
- `GeographyInput` accepts wrapper instances, raw strings, `{ value: ... }`, `{ wkt: "...", srid?: ... }`, and `{ lon: ..., lat: ..., srid?: ... }`.
- `HstoreInput` accepts wrapper instances, mappings / records, iterable entry pairs, and `{ entries: ... }`.
- `VectorInput` accepts wrapper instances, iterable numeric values, JavaScript array-like numeric values, and `{ values: ... }`.
- In Python and JavaScript, those same aliases are now serialized automatically in create/update payloads, scalar equality filters, `in` / `notIn`, and `nearest.query`.
- Rust and Java stay wrapper-first, but the generated wrappers now expose matching helper constructors and collection utilities.

`Geometry` and `Geography` wrappers still carry WKT, EWKT, or EWKB text on the wire. Generated create/update/filter/nearest paths serialize those inputs back to PostgreSQL with the correct PostGIS cast.

## Creating Extension Values

::: code-group

```python [Python]
from db.extensions.ltree import Ltree
from db.extensions.postgis import Geography, Geometry

place = await client.place.create({
    "slug": {"value": "central-park"},
    "labels": {"entries": [("zone", "green"), ("seasonal", None)]},
    "path": Ltree.of("parks.usa.nyc.central"),
    "footprint": Geometry.wkt(
        "POLYGON((-73.981 40.768,-73.958 40.800,-73.949 40.796,-73.973 40.764,-73.981 40.768))",
        srid=4326,
    ),
    "location": {"lon": -73.9654, "lat": 40.7829, "srid": 4326},
    "embedding": {"values": [0.12, 0.04, 0.98]},
})

assert place.labels.get("zone") == "green"
assert place.location.equals(Geography.point(-73.9654, 40.7829, srid=4326))
assert place.embedding.at(2) == 0.98
```

```typescript [JavaScript / TypeScript]
import { Geography, Geometry } from './db/extensions/postgis/types.js';
import { Ltree } from './db/extensions/ltree/types.js';

const place = await client.place.create({
  data: {
    slug: { value: 'central-park' },
    labels: { entries: [['zone', 'green'], ['seasonal', null]] },
    path: Ltree.of('parks.usa.nyc.central'),
    footprint: Geometry.wkt(
      'POLYGON((-73.981 40.768,-73.958 40.800,-73.949 40.796,-73.973 40.764,-73.981 40.768))',
      4326,
    ),
    location: { lon: -73.9654, lat: 40.7829, srid: 4326 },
    embedding: { values: [0.12, 0.04, 0.98] },
  },
});

console.log(place.labels.get('zone'));
console.log(place.location.equals(Geography.point(-73.9654, 40.7829, 4326)));
console.log(place.embedding.at(2));
```

```rust [Rust]
use db::{
    Place, PlaceCreateInput,
    extensions::{
        citext::types::Citext,
        hstore::types::Hstore,
        ltree::types::Ltree,
        postgis::types::{Geography, Geometry},
        vector::types::Vector,
    },
};

let place = Place::nautilus(&client)
    .create(PlaceCreateInput {
        slug: Some(Citext::of("central-park")),
        labels: Some(Some(
            Hstore::empty()
                .with("zone", Some("green"))
                .with_null("seasonal"),
        )),
        path: Some(Some(Ltree::of("parks.usa.nyc.central"))),
        footprint: Some(Some(Geometry::wkt_with_srid(
            "POLYGON((-73.981 40.768,-73.958 40.800,-73.949 40.796,-73.973 40.764,-73.981 40.768))",
            4326,
        ))),
        location: Some(Some(Geography::point_with_srid(-73.9654, 40.7829, 4326))),
        embedding: Some(Vector::of([0.12_f64, 0.04, 0.98])),
        ..Default::default()
    })
    .await?;

assert!(place.slug.equals("central-park"));
assert_eq!(place.embedding.len(), 3);
```

```java [Java]
import com.example.db.extensions.citext.types.Citext;
import com.example.db.extensions.hstore.types.Hstore;
import com.example.db.extensions.ltree.types.Ltree;
import com.example.db.extensions.postgis.types.Geography;
import com.example.db.extensions.postgis.types.Geometry;
import com.example.db.extensions.vector.types.Vector;
import com.example.db.model.Place;

Place place = client.place().create(p -> p
    .slug(Citext.of("central-park"))
    .labels(Hstore.empty().with("zone", "green").withNull("seasonal"))
    .path(Ltree.of("parks.usa.nyc.central"))
    .footprint(Geometry.wkt(
        "POLYGON((-73.981 40.768,-73.958 40.800,-73.949 40.796,-73.973 40.764,-73.981 40.768))",
        4326
    ))
    .location(Geography.point(-73.9654, 40.7829, 4326))
    .embedding(Vector.of(0.12, 0.04, 0.98))
).join();

System.out.println(place.labels().get("zone"));
System.out.println(place.embedding().get(2));
```

:::

Python and JavaScript can now mix raw builder objects and wrapper instances freely in the same payload. Rust and Java remain explicit about wrapper usage, but the generated helpers make the common constructors much shorter.

## Filtering And Nearest Serialization

`Citext` and `Ltree` keep string-style filter helpers. `Hstore`, `Geometry`, `Geography`, and `Vector(N)` still support direct equality, `not`, and null checks in generated filters; use raw SQL for richer hstore operators or PostGIS predicates.

Python and JavaScript now serialize extension inputs consistently in `where` objects and `nearest.query`, so object-shaped builder inputs work there too.

::: code-group

```python [Python]
parks = await client.place.find_many(
    where={
        "slug": {"contains": "park"},
        "path": {"startswith": "parks.usa"},
        "location": {"lon": -73.9654, "lat": 40.7829, "srid": 4326},
    },
    select={"id": True, "slug": True, "location": True},
)

nearby = await client.place.find_many(
    nearest={
        "field": "embedding",
        "query": {"values": [0.12, 0.04, 0.98]},
        "metric": "cosine",
    },
    take=10,
)
```

```typescript [JavaScript / TypeScript]
const parks = await client.place.findMany({
  where: {
    slug: { contains: 'park' },
    path: { startsWith: 'parks.usa' },
    location: { lon: -73.9654, lat: 40.7829, srid: 4326 },
  },
  select: { id: true, slug: true, location: true },
});

const nearby = await client.place.findMany({
  nearest: {
    field: 'embedding',
    query: { values: [0.12, 0.04, 0.98] },
    metric: 'cosine',
  },
  take: 10,
});
```

```rust [Rust]
use db::{
    Place,
    extensions::postgis::types::Geography,
};
use nautilus_core::{FindManyArgs, VectorMetric, VectorNearest};

let parks = Place::nautilus(&client)
    .find_many(FindManyArgs {
        where_: Some(
            Place::slug()
                .contains("park")
                .and(Place::path().starts_with("parks.usa"))
                .and(Place::location().eq(Geography::point_with_srid(
                    -73.9654,
                    40.7829,
                    4326,
                ))),
        ),
        select: [
            ("id".to_string(), true),
            ("slug".to_string(), true),
            ("location".to_string(), true),
        ]
        .into_iter()
        .collect(),
        ..Default::default()
    })
    .await?;

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
import com.example.db.extensions.postgis.types.Geography;
import com.example.db.extensions.vector.types.Vector;
import com.example.db.model.Place;
import java.util.List;

List<Place> parks = client.place().findMany(q -> q
    .where(w -> w
        .slugContains("park")
        .pathStartsWith("parks.usa")
        .location(Geography.point(-73.9654, 40.7829, 4326)))
    .select(s -> s.id().slug().location())
).join();

List<Place> nearby = client.place().findMany(q -> q
    .nearest(n -> n
        .embedding()
        .query(Vector.of(0.12, 0.04, 0.98))
        .metric(PlaceDsl.VectorMetric.COSINE))
    .take(10)
).join();
```

:::

## Wrapper Convenience Cheatsheet

- String-backed wrappers (`Citext`, `Ltree`, `Geometry`, `Geography`) now expose `of` across languages, `from` / `from_input` plus `toWireInput` / `to_wire_input` in JavaScript and Python, and emptiness checks everywhere.
- Spatial wrappers add `wkt(...)` and `point(...)` helpers. `Geometry.point` uses `x` / `y`; `Geography.point` uses `lon` / `lat`.
- `Hstore` adds empty constructors, entry builders, keyed accessors, `with` / `with_`, `withNull` / `with_null`, and iteration-friendly APIs.
- `Vector` adds empty constructors, shorter builders, indexed access, length / size helpers, and concatenation or mutation helpers depending on the language.

Nearest-neighbor query metrics are `l2`, `innerProduct`, and `cosine`. Match the metric to the index opclass for best planner behavior: `vector_l2_ops`, `vector_ip_ops`, or `vector_cosine_ops`.
