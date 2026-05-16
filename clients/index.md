# Generated Clients

Nautilus generates local client artifacts from your schema. These outputs are designed to be used directly by your application, not published as registry packages.

Generated model and projection fields include compact docs derived from schema modifiers such as `@id`, `@unique`, `@default`, `@map`, `@updatedAt`, `@computed`, and `@check`.

## Generator Block

::: code-group

```prisma [Python]
generator client {
  provider             = "nautilus-client-py"
  output               = "./db"
  interface            = "async"
  recursive_type_depth = 3
}
```

```prisma [JavaScript / TypeScript]
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

## What It Generates

### Python

- a local Python package in the configured `output` directory
- generated model types
- projection objects returned by `select`
- delegate methods for model operations
- runtime glue for talking to the Nautilus engine

The normal workflow is to import the generated output directly. The package root exports `Nautilus`; model classes are exported from `models`.

### JavaScript / TypeScript

- JavaScript runtime files
- `.d.ts` type declarations
- model delegates and runtime helpers
- typed `select` overloads and `streamMany` async iterables

The normal consumption path is to import from the generated `index.js` entry point in the configured `output` directory.

### Rust

#### Integrated workspace mode

This is the normal mode. Nautilus writes Rust sources into the configured output path and expects you to integrate them into your existing project or workspace.

#### Standalone mode

Use the CLI flag when you want Nautilus to also emit a `Cargo.toml`:

```bash
nautilus generate --schema schema.nautilus --standalone
```

`--standalone` is meaningful only for the Rust target.

Generated Rust delegates also include typed column accessors for scalar projections and `stream_many` on async clients.

### Java

#### Maven mode

The default Java workflow writes a generated Maven module rooted at the configured `output` path.

Use this when:

- your project already uses Maven or Gradle
- you want the generated client to behave like a normal module dependency

#### Jar mode

If `mode = "jar"`, Nautilus also writes:

- `output/dist/{artifactId}.jar`
- `output/dist/lib/*.jar`

Use this when:

- you want plain `javac` / `java` usage
- you want a self-contained bundle outside Maven or Gradle

Generated Java clients include `*Projection` classes for selected scalar fields and `streamMany` methods for pull-based reads.

## Typical Usage

::: code-group

```python [Python]
import asyncio
from db import Nautilus

async def main():
    async with Nautilus() as client:
        user = await client.user.create({
            "email": "alice@example.com",
            "username": "alice",
            "name": "Alice Smith",
        })

        found = await client.user.find_unique(where={"email": "alice@example.com"})
        admins = await client.user.find_many(where={"role": "ADMIN"})

        await client.user.delete(where={"email": "alice@example.com"})

asyncio.run(main())
```

```typescript [JavaScript / TypeScript]
import { Nautilus } from './db/index.js';

async function main() {
  const client = new Nautilus();
  await client.connect();

  const user = await client.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      name: 'Alice Smith',
    },
  });

  const found = await client.user.findUnique({
    where: { email: 'alice@example.com' },
  });

  const admins = await client.user.findMany({
    where: { role: 'ADMIN' },
  });

  await client.disconnect();
}

main();
```

```rust [Rust]
use db::{
    Client, User, UserCreateInput,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = Client::postgres(&std::env::var("DATABASE_URL")?).await?;

    let user = User::nautilus(&client)
        .create(UserCreateInput {
            email: Some("alice@example.com".into()),
            username: Some("alice".into()),
            name: Some("Alice Smith".into()),
            ..Default::default()
        })
        .await?;

    println!("{}", user.email);
    Ok(())
}
```

```java [Java]
import com.example.db.client.Nautilus;
import com.example.db.client.NautilusOptions;
import com.example.db.enums.Role;
import com.example.db.model.User;
import java.util.List;

public final class App {
    public static void main(String[] args) {
        try (var client = new Nautilus(new NautilusOptions().autoRegister(true))) {
            User user = client.user().create(u -> u
                .email("alice@example.com")
                .username("alice")
                .name("Alice Smith")
                .role(Role.ADMIN)
                .tags(List.of("vip", "early-adopter"))
            ).join();

            System.out.println(user.email());
        }
    }
}
```

:::

## Projection And Streaming Examples

The generated clients expose the same recent read features in language-native shapes. Python and JavaScript / TypeScript use `select` directly on read methods. Rust uses typed column accessors for projection methods. Java uses generated `*Projection` classes.

::: code-group

```python [Python]
from typing import AsyncIterator

from db.models import UserProjection

summaries = await client.user.find_many(
    where={"role": "ADMIN"},
    order_by={"id": "asc"},
    select={"id": True, "email": True},
)

user_stream: AsyncIterator[UserProjection] = client.user.stream_many(
    where={"role": "ADMIN"},
    order_by={"id": "asc"},
    select={"id": True, "email": True},
    chunk_size=256,
)

async for user in user_stream:
    print(user.email)
```

```typescript [JavaScript / TypeScript]
import type { UserModel } from './db/models/user.js';

type UserSummary = Pick<UserModel, 'id' | 'email'>;

const summaries = await client.user.findMany({
  where: { role: 'ADMIN' },
  orderBy: [{ id: 'asc' }],
  select: { id: true, email: true },
});

const userStream: AsyncIterable<UserSummary> = client.user.streamMany({
  where: { role: 'ADMIN' },
  orderBy: [{ id: 'asc' }],
  select: { id: true, email: true },
  chunkSize: 256,
});

for await (const user of userStream) {
  console.log(user.email);
}
```

```rust [Rust]
use db::{Role, User};
use futures::TryStreamExt;
use nautilus_core::FindManyArgs;

let summaries = User::nautilus(&client)
    .find_many_select(
        FindManyArgs {
            where_: Some(User::role().eq(Role::Admin)),
            order_by: vec![User::id().asc()],
            ..Default::default()
        },
        |u| (u.id(), u.email()),
    )
    .await?;

let mut users = User::nautilus(&client).stream_many(FindManyArgs {
    where_: Some(User::role().eq(Role::Admin)),
    order_by: vec![User::id().asc()],
    ..Default::default()
})?;

// `users` implements `Stream<Item = nautilus_core::Result<User>>`.
while let Some(user) = users.try_next().await? {
    println!("{}", user.email);
}
```

```java [Java]
import com.example.db.dsl.SortOrder;
import com.example.db.enums.Role;
import com.example.db.model.UserProjection;
import java.util.List;
import java.util.stream.Stream;

List<UserProjection> summaries = client.user().findManySelect(q -> q
    .where(w -> w.role(Role.ADMIN))
    .orderBy(o -> o.id(SortOrder.ASC))
    .select(s -> s.id().email())
).join();

Stream<UserProjection> userStream = client.user().streamManySelect(q -> q
    .where(w -> w.role(Role.ADMIN))
    .orderBy(o -> o.id(SortOrder.ASC))
    .select(s -> s.id().email())
    .chunkSize(256)
);

try (userStream) {
    userStream.forEach(user -> System.out.println(user.email()));
}
```

:::

## What's Next

- [Query API](/clients/query-api) — all query methods: find, create, update, delete, upsert, aggregations, and raw SQL
- [Transactions](/clients/transactions) — wrapping multiple operations in a single atomic unit
- [PostgreSQL Extension Types](/clients/extensions) — citext, hstore, ltree, PostGIS, pgvector, and richer extension input helpers
- [Language-Specific Notes](/clients/language-notes) — Python, JavaScript / TypeScript, Rust, and Java specifics
