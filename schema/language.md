# Schema Language Overview

Nautilus schema files use the `.nautilus` extension. A schema file can contain five top-level declaration kinds:

- `datasource`
- `generator`
- `model`
- `enum`
- `type`

## Typical File Shape

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider  = "nautilus-client-py"
  interface = "async"
}

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
  id      Uuid     @id @default(uuid())
  email   String   @unique
  role    Role     @default(USER)
  address Address? 
}
```

## The Core Concepts

### Datasource

Declares the database provider and connection string source.

Supported providers:

- `postgresql`
- `mysql`
- `sqlite`

See [Datasource and Generator](/schema/datasource-and-generator) for field-level details and provider examples.

### Generator

Selects the generated client target and output shape.

Current generator providers:

- `nautilus-client-rs`
- `nautilus-client-py`
- `nautilus-client-js`
- `nautilus-client-java`

Generator blocks control where code is written and whether the generated API is sync or async.

### Model

Defines a database-backed entity with fields and model-level attributes.

Models are where you describe:

- primary keys
- unique constraints
- optional vs required fields
- lists and relations
- mapped physical names
- indexes and checks

### Enum

Defines a closed set of values used by model or composite fields.

### Type

Defines a reusable composite type for embedded structured data.

Composite types are especially useful when you want one logical field with multiple nested scalar fields, typically stored as JSON on providers that do not have a native equivalent.

## Field Types

Nautilus supports:

- scalar types such as `String`, `Boolean`, `Int`, `BigInt`, `Float`, `DateTime`, `Bytes`, `Json`, `Jsonb`, `Uuid`, `Xml`
- bounded strings such as `Char(2)` and `VarChar(255)`
- `Decimal(precision, scale)`
- user-defined enums
- user-defined models
- user-defined composite types

## Field Modifiers

| Syntax | Meaning |
| --- | --- |
| no suffix | required |
| `?` | optional / nullable |
| `!` | explicitly required |
| `[]` | list / array |

Notes:

- no suffix and `!` both mean not-null
- `[]` is used for list fields and many-side relation fields
- relation fields are logical schema constructs, not direct physical columns

## Attributes

There are two attribute forms:

- field attributes such as `@id`, `@default(...)`, `@relation(...)`
- model attributes such as `@@map(...)`, `@@index(...)`, `@@check(...)`

See [Models, Relations, and Attributes](/schema/models-relations-and-attributes) for the full reference.

## Expressions

Nautilus expressions are used inside defaults, checks, arrays, and some named arguments.

Supported expression building blocks include:

- string, number, and boolean literals
- function calls such as `uuid()`, `autoincrement()`, `now()`, `env("DATABASE_URL")`
- arrays such as `[userId, status]`
- identifiers such as enum variants or field names

## Formatting and Parsing Notes

- newlines terminate declarations and config fields
- both `//` and `/* ... */` comments are supported
- `nautilus format` rewrites a schema into canonical formatting
- parser recovery tries to continue after declaration-level errors so multiple problems can be reported in one run

## Where to Go Next

- [Datasource and Generator](/schema/datasource-and-generator)
- [Models, Relations, and Attributes](/schema/models-relations-and-attributes)
