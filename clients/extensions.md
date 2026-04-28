# PostgreSQL Extension Types

The `extensions` branch adds PostgreSQL extension-backed scalar types to schema validation, migrations, introspection, and generated clients. When the matching extension is declared in the datasource, generated clients emit dedicated wrapper types for `Citext`, `Hstore`, `Ltree`, `Geometry`, `Geography`, and `Vector`.

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

## Generated Wrapper Mapping

| Schema type | Python | JavaScript / TypeScript | Rust | Java |
| --- | --- | --- | --- | --- |
| `Citext` | model field `Citext`; input `Citext \| str` | model field `Citext`; input `CitextInput` (`Citext \| string`) | `db::extensions::citext::types::Citext` | `com.example.db.extensions.citext.types.Citext`; builders also accept `String` |
| `Hstore` | model field `Hstore`; input `Hstore \| Dict[str, Optional[str]]` | model field `Hstore`; input `HstoreInput` (`Hstore \| Record<string, string \| null>`) | `db::extensions::hstore::types::Hstore` | `com.example.db.extensions.hstore.types.Hstore`; builders also accept `Map<String, String>` |
| `Ltree` | model field `Ltree`; input `Ltree \| str` | model field `Ltree`; input `LtreeInput` (`Ltree \| string`) | `db::extensions::ltree::types::Ltree` | `com.example.db.extensions.ltree.types.Ltree`; builders also accept `String` |
| `Geometry` | model field `Geometry`; input `Geometry \| str` | model field `Geometry`; input `GeometryInput` (`Geometry \| string`) | `db::extensions::postgis::types::Geometry` | `com.example.db.extensions.postgis.types.Geometry`; builders also accept `String` |
| `Geography` | model field `Geography`; input `Geography \| str` | model field `Geography`; input `GeographyInput` (`Geography \| string`) | `db::extensions::postgis::types::Geography` | `com.example.db.extensions.postgis.types.Geography`; builders also accept `String` |
| `Vector(N)` | model field `Vector`; input `Vector \| List[float]` | model field `Vector`; input `VectorInput` (`Vector \| number[]`) | `db::extensions::vector::types::Vector` | `com.example.db.extensions.vector.types.Vector`; builders also accept `List<Float>` |

`Geometry` and `Geography` wrappers still carry WKT, EWKT, or EWKB text on the wire. Generated create/update/filter paths serialize those wrappers back to PostgreSQL with the correct PostGIS cast.

## Creating Extension Values

::: code-group

```python [Python]
from db.extensions.citext import Citext
from db.extensions.hstore import Hstore
from db.extensions.ltree import Ltree
from db.extensions.postgis import Geography, Geometry
from db.extensions.vector import Vector

place = await client.place.create({
    "slug": Citext("central-park"),
    "labels": Hstore({"zone": "green", "seasonal": None}),
    "path": Ltree("parks.usa.nyc.central"),
    "footprint": Geometry("POLYGON((-73.981 40.768,-73.958 40.800,-73.949 40.796,-73.973 40.764,-73.981 40.768))"),
    "location": Geography("SRID=4326;POINT(-73.9654 40.7829)"),
    "embedding": Vector([0.12, 0.04, 0.98]),
})

assert place.slug.as_str() == "central-park"
assert place.embedding.to_list() == [0.12, 0.04, 0.98]
```

```typescript [JavaScript / TypeScript]
import { Citext } from './db/extensions/citext/types.js';
import { Hstore } from './db/extensions/hstore/types.js';
import { Ltree } from './db/extensions/ltree/types.js';
import { Geography, Geometry } from './db/extensions/postgis/types.js';
import { Vector } from './db/extensions/vector/types.js';

const place = await client.place.create({
  data: {
    slug: new Citext('central-park'),
    labels: new Hstore({ zone: 'green', seasonal: null }),
    path: new Ltree('parks.usa.nyc.central'),
    footprint: new Geometry('POLYGON((-73.981 40.768,-73.958 40.800,-73.949 40.796,-73.973 40.764,-73.981 40.768))'),
    location: new Geography('SRID=4326;POINT(-73.9654 40.7829)'),
    embedding: new Vector([0.12, 0.04, 0.98]),
  },
});

console.log(place.slug.asString());
console.log(place.embedding.toList());
```

```rust [Rust]
use std::collections::BTreeMap;

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
        slug: Some(Citext::from("central-park")),
        labels: Some(Some(Hstore::from(BTreeMap::from([
            ("zone".into(), Some("green".into())),
            ("seasonal".into(), None),
        ])))),
        path: Some(Some(Ltree::from("parks.usa.nyc.central"))),
        footprint: Some(Some(Geometry::from(
            "POLYGON((-73.981 40.768,-73.958 40.800,-73.949 40.796,-73.973 40.764,-73.981 40.768))",
        ))),
        location: Some(Some(Geography::from("SRID=4326;POINT(-73.9654 40.7829)"))),
        embedding: Some(Vector::from(vec![0.12, 0.04, 0.98])),
        ..Default::default()
    })
    .await?;

assert!(place.slug.equals("central-park"));
assert_eq!(place.embedding.to_list(), vec![0.12, 0.04, 0.98]);
```

```java [Java]
import com.example.db.extensions.citext.types.Citext;
import com.example.db.extensions.hstore.types.Hstore;
import com.example.db.extensions.ltree.types.Ltree;
import com.example.db.extensions.postgis.types.Geography;
import com.example.db.extensions.postgis.types.Geometry;
import com.example.db.extensions.vector.types.Vector;
import com.example.db.model.Place;
import java.util.LinkedHashMap;
import java.util.List;

var labels = new LinkedHashMap<String, String>();
labels.put("zone", "green");
labels.put("seasonal", null);

Place place = client.place().create(p -> p
    .slug(Citext.of("central-park"))
    .labels(Hstore.of(labels))
    .path(Ltree.of("parks.usa.nyc.central"))
    .footprint(Geometry.of("POLYGON((-73.981 40.768,-73.958 40.800,-73.949 40.796,-73.973 40.764,-73.981 40.768))"))
    .location(Geography.of("SRID=4326;POINT(-73.9654 40.7829)"))
    .embedding(Vector.of(List.of(0.12f, 0.04f, 0.98f)))
).join();

System.out.println(place.slug().asString());
System.out.println(place.embedding().toList());
```

:::

Python and JS create/update/filter inputs still accept raw strings, dicts, and float lists via generated unions, and Java builders expose raw overloads alongside wrapper overloads. Rust model and create/update types use the generated wrapper paths directly.

## Filtering Extension Fields

`Citext` and `Ltree` keep string-style filter helpers. `Hstore`, `Geometry`, `Geography`, and `Vector(N)` support direct equality, `not`, and null checks in generated filters; use raw SQL for richer hstore operators or PostGIS predicates.

::: code-group

```python [Python]
from db.extensions.postgis import Geography
from db.extensions.vector import Vector

parks = await client.place.find_many(
    where={
        "slug": {"contains": "park"},
        "path": {"startswith": "parks.usa"},
        "location": Geography("SRID=4326;POINT(-73.9654 40.7829)"),
    },
    select={"id": True, "slug": True, "location": True},
)

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
import { Geography } from './db/extensions/postgis/types.js';
import { Vector } from './db/extensions/vector/types.js';

const parks = await client.place.findMany({
  where: {
    slug: { contains: 'park' },
    path: { startsWith: 'parks.usa' },
    location: new Geography('SRID=4326;POINT(-73.9654 40.7829)'),
  },
  select: { id: true, slug: true, location: true },
});

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
                .and(Place::location().eq(Geography::from(
                    "SRID=4326;POINT(-73.9654 40.7829)",
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
        .location(Geography.of("SRID=4326;POINT(-73.9654 40.7829)")))
    .select(s -> s.id().slug().location())
).join();

List<Place> nearby = client.place().findMany(q -> q
    .nearest(n -> n
        .embedding()
        .query(Vector.of(List.of(0.12f, 0.04f, 0.98f)))
        .metric(PlaceDsl.VectorMetric.COSINE))
    .take(10)
).join();
```

:::

Nearest-neighbor query metrics are `l2`, `innerProduct`, and `cosine`. Match the metric to the index opclass for best planner behavior: `vector_l2_ops`, `vector_ip_ops`, or `vector_cosine_ops`.
