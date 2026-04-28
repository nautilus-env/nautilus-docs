# Models, Relations, and Attributes

This page is the practical reference for modeling data in Nautilus.

## Scalar and User Types

### Built-in scalar types

| Type | Notes |
| --- | --- |
| `String` | Unbounded text |
| `Boolean` | Boolean |
| `Int` | 32-bit integer style field |
| `BigInt` | Large integer |
| `Float` | Floating-point |
| `DateTime` | Timestamp |
| `Bytes` | Binary data |
| `Json` | JSON value |
| `Jsonb` | PostgreSQL-specific JSONB |
| `Uuid` | UUID |
| `Xml` | XML/text-like database type where supported |
| `Char(N)` | Fixed-length text |
| `VarChar(N)` | Bounded text |
| `Decimal(P, S)` | Precision/scale decimal |
| `Citext` | PostgreSQL `citext` extension, string-like |
| `Hstore` | PostgreSQL `hstore` extension key/value map |
| `Ltree` | PostgreSQL `ltree` extension path value |
| `Geometry` | PostgreSQL PostGIS `GEOMETRY` |
| `Geography` | PostgreSQL PostGIS `GEOGRAPHY` |
| `Vector(N)` | PostgreSQL pgvector embedding with dimension `N` |

### User-defined types

You can also use:

- enums
- models
- composite `type` declarations

## Field Modifiers

```prisma
name     String
bio      String?
code     String!
tags     String[]
author   User
posts    Post[]
profile  Profile?
```

## Composite Types

Composite `type` blocks are reusable embedded structures.

```prisma
enum CountryCode {
  DE
  FR
  US
}

type Address {
  street  String
  city    String
  zip     String
  country CountryCode
}
```

Constraints:

- fields inside `type` blocks may be scalar, lists or enum types
- nested composite types are not allowed
- model relations are not allowed inside composite types
- composite fields often need `@store(json)` on providers without native equivalents

## Field Attributes

### `@id`

Marks a field as the primary key.

```prisma
id Uuid @id @default(uuid())
```

### `@unique`

Adds a unique constraint.

```prisma
email String @unique
```

### `@default(...)`

Declares a default value or function.

```prisma
id        Int      @default(autoincrement())
uuid      Uuid     @default(uuid())
createdAt DateTime @default(now())
active    Boolean  @default(true)
role      Role     @default(USER)
```

### `@map("...")`

Maps a logical field name to a physical column name.

```prisma
userId Uuid @map("user_id")
```

### `@store(json | native)`

Controls how arrays and composite-type fields are stored.

```prisma
tags    String[] @store(json)
address Address? @store(json)
```

Use `json` when you need portability or when the provider does not expose a suitable native type.

### `@updatedAt`

Marks a `DateTime` field that Nautilus updates automatically on create and update.

```prisma
updatedAt DateTime @updatedAt
```

Important note:

- combining `@updatedAt` and `@default(now())` is accepted as a warning-style modeling smell because Nautilus already manages `@updatedAt`

### `@computed(expr, Stored | Virtual)`

Declares a generated database column.

```prisma
lineTotal Decimal(10, 2) @computed(quantity * unitPrice, Stored)
```

Rules:

- computed fields are read-only
- they cannot also be `@id`, `@default(...)`, or `@updatedAt`
- they cannot be relation or array fields
- `Virtual` is not supported for PostgreSQL

### `@check(expr)`

Adds a field-level check constraint.

```prisma
price Decimal(10, 2) @check(price >= 0)
stock Int            @check(stock >= 0)
```

Field-level checks may only refer to the decorated field itself.

### `@relation(...)`

Defines relation metadata.

```prisma
author User @relation(
  fields: [authorId],
  references: [id],
  onDelete: Cascade,
  onUpdate: Restrict
)
```

Supported named arguments:

| Argument | Meaning |
| --- | --- |
| `name` | Relation name for disambiguation |
| `fields` | Foreign-key fields on the current model |
| `references` | Referenced fields on the target model |
| `onDelete` | Delete action |
| `onUpdate` | Update action |

Use `name` when you have multiple relations between the same two models.

### Supported actions:

- `Cascade`
- `Restrict`
- `NoAction`
- `SetNull`
- `SetDefault`

Example:

```prisma
user User @relation(
  fields: [userId],
  references: [id],
  onDelete: Cascade,
  onUpdate: SetNull
)
```

## Model Attributes

### `@@map("...")`

Maps the model to a physical table name.

```prisma
@@map("users")
```

### `@@id([...])`

Composite primary key.

```prisma
@@id([userId, roleId])
```

### `@@unique([...])`

Composite unique constraint.

```prisma
@@unique([email, username])
```

### `@@index([...], type?, name?, map?)`

Defines an index.

```prisma
@@index([authorId, createdAt])
@@index([createdAt], type: Brin, map: "idx_posts_created")
```

Supported index types:

- `BTree`
- `Hash`
- `Gin`
- `Gist`
- `Brin`
- `FullText`
- `Hnsw`
- `Ivfflat`

Provider support varies. See [Provider Matrix](/providers/provider-matrix).

### pgvector indexes

`Hnsw` and `Ivfflat` are PostgreSQL pgvector index types and must target exactly one `Vector(N)` field. They require an explicit opclass:

- `vector_l2_ops`
- `vector_ip_ops`
- `vector_cosine_ops`

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

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

`m` and `ef_construction` apply only to `Hnsw`; `lists` applies only to `Ivfflat`.

### `@@check(expr)`

Adds a table-level check.

```prisma
@@check(startDate < endDate)
```

Unlike field-level `@check`, this form can reference multiple scalar fields.


## A Complete Example

```prisma
enum Role {
  USER
  ADMIN
}

type Address {
  street String
  city   String
  zip    String
}

model User {
  id        Uuid     @id @default(uuid())
  email     String   @unique
  role      Role     @default(USER)
  address   Address? @store(json)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  posts     Post[]

  @@map("users")
  @@index([email])
}

model Post {
  id       Int     @id @default(autoincrement())
  authorId Uuid    @map("author_id")
  title    String
  rating   Int     @check(rating >= 0)
  author   User    @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("posts")
}
```
