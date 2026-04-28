# Query API

The generated clients expose the same overall query surface in Python, JavaScript / TypeScript, Rust, and Java. The exact call shape is language-native, so the examples below show each method family in all supported targets.

These examples assume a schema similar to the `User`, `Profile`, `Order`, and `OrderItem` models used throughout the Nautilus examples.

## Query Surface

| Category | Python | JavaScript / TypeScript | Rust | Java |
| --- | --- | --- | --- | --- |
| Reads | `find_many`, `find_first`, `find_unique`, `find_first_or_throw`, `find_unique_or_throw` | `findMany`, `findFirst`, `findUnique`, `findFirstOrThrow`, `findUniqueOrThrow` | `find_many`, `find_first`, `find_unique`, `find_first_or_throw`, `find_unique_or_throw` | `findMany`, `findFirst`, `findUnique`, `findFirstOrThrow`, `findUniqueOrThrow` |
| Writes | `create`, `create_many`, `update`, `delete`, `delete_many`, `upsert` | `create`, `createMany`, `update`, `delete`, `deleteMany`, `upsert` | `create`, `create_many`, `update`, `delete`, `delete_many`, `upsert` | `create`, `createMany`, `update`, `delete`, `deleteMany`, `upsert` |
| Aggregation | `count`, `group_by` | `count`, `groupBy` | `count`, `group_by` | `count`, `groupBy` |
| Raw SQL | `raw_query`, `raw_stmt_query` | `rawQuery`, `rawStmtQuery` | `raw_query`, `raw_stmt_query` | `rawQuery`, `rawStmtQuery` |

General rules:

- use logical schema field names, not raw database column names from `@map`
- `select` and `include` are mutually exclusive
- `cursor` must contain all primary-key fields for the target model
- `chunk_size` / `chunkSize` is exposed in Python, JS, and Java; the current Rust client supports cursor pagination but not chunk-size tuning
- the Rust generated client currently routes `include`, `count`, and `group_by` through the embedded engine path
- some mutation return types differ by language: Python and JS can switch between rows and counts on some methods, while Rust and Java use fixed return shapes

## `find_many` / `findMany`

Complex filters, ordering, and offset pagination:

::: code-group

```python [Python]
admins = await client.user.find_many(
    where={
        "AND": [
            {"role": "ADMIN"},
            {"email": {"contains": "@example.com"}},
            {
                "OR": [
                    {"name": {"contains": "Alice"}},
                    {"name": {"contains": "Bob"}},
                ]
            },
        ],
    },
    order_by={"createdAt": "desc", "email": "asc"},
    take=20,
    skip=20,
)
```

```typescript [JavaScript / TypeScript]
const admins = await client.user.findMany({
  where: {
    AND: [
      { role: 'ADMIN' },
      { email: { contains: '@example.com' } },
      {
        OR: [
          { name: { contains: 'Alice' } },
          { name: { contains: 'Bob' } },
        ],
      },
    ],
  },
  orderBy: [{ createdAt: 'desc' }, { email: 'asc' }],
  take: 20,
  skip: 20,
});
```

```rust [Rust]
use db::{Role, User};
use nautilus_core::FindManyArgs;

let admins = User::nautilus(&client)
    .find_many(FindManyArgs {
        where_: Some(
            User::role()
                .eq(Role::Admin)
                .and(User::email().contains("@example.com"))
                .and(
                    User::name()
                        .contains("Alice")
                        .or(User::name().contains("Bob")),
                ),
        ),
        order_by: vec![User::id().desc(), User::email().asc()],
        take: Some(20),
        skip: Some(20),
        ..Default::default()
    })
    .await?;
```

```java [Java]
import com.example.db.enums.Role;
import com.example.db.model.User;
import java.util.List;

List<User> admins = client.user().findMany(q -> q
    .where(w -> w
        .role(Role.ADMIN)
        .emailContains("@example.com")
        .and(and -> and
            .or(or -> or.nameContains("Alice"))
            .or(or -> or.nameContains("Bob"))
        )
    )
    .take(20)
    .skip(20)
).join();
```

:::

Nested includes with child filters and child pagination:

::: code-group

```python [Python]
users = await client.user.find_many(
    where={"email": {"contains": "@example.com"}},
    include={
        "orders": {
            "where": {"status": "CONFIRMED"},
            "order_by": {"createdAt": "desc"},
            "take": 5,
            "include": {
                "items": {
                    "order_by": {"quantity": "desc"},
                    "take": 3,
                }
            },
        }
    },
)
```

```typescript [JavaScript / TypeScript]
const users = await client.user.findMany({
  where: { email: { contains: '@example.com' } },
  include: {
    orders: {
      where: { status: 'CONFIRMED' },
      orderBy: [{ createdAt: 'desc' }],
      take: 5,
      include: {
        items: {
          orderBy: [{ quantity: 'desc' }],
          take: 3,
        },
      },
    },
  },
});
```

```rust [Rust]
use std::collections::HashMap;

use db::{Order, OrderItem, OrderStatus, User};
use nautilus_core::{FindManyArgs, IncludeRelation};

let users = User::nautilus(&client)
    .find_many(FindManyArgs {
        where_: Some(User::email().contains("@example.com")),
        include: HashMap::from([(
            "orders".to_string(),
            IncludeRelation::with_filter(Order::status().eq(OrderStatus::Confirmed))
                .with_order_by(Order::id().desc())
                .with_take(5)
                .with_include(
                    "items",
                    IncludeRelation::plain()
                        .with_order_by(OrderItem::quantity().desc())
                        .with_take(3),
                ),
        )]),
        ..Default::default()
    })
    .await?;
```

```java [Java]
import com.example.db.enums.OrderStatus;
import com.example.db.model.User;
import java.util.List;

List<User> users = client.user().findMany(q -> q
    .where(w -> w.emailContains("@example.com"))
    .include(i -> i.orders(o -> o
        .where(w -> w.status(OrderStatus.CONFIRMED))
        .take(5)
        .include(ii -> ii.items(items -> items.take(3)))
    ))
).join();
```

:::

Cursor pagination and large-read variants:

::: code-group

```python [Python]
next_page = await client.order.find_many(
    where={"status": "CONFIRMED"},
    order_by={"id": "asc"},
    cursor={"id": last_seen_order_id},
    take=10,
    chunk_size=500,
)

previous_page = await client.order.find_many(
    order_by={"id": "asc"},
    cursor={"id": last_seen_order_id},
    take=-10,
)
```

```typescript [JavaScript / TypeScript]
const nextPage = await client.order.findMany({
  where: { status: 'CONFIRMED' },
  orderBy: [{ id: 'asc' }],
  cursor: { id: lastSeenOrderId },
  take: 10,
  chunkSize: 500,
});

const previousPage = await client.order.findMany({
  orderBy: [{ id: 'asc' }],
  cursor: { id: lastSeenOrderId },
  take: -10,
});
```

```rust [Rust]
use std::collections::HashMap;

use db::Order;
use nautilus_core::{FindManyArgs, Value};

let next_page = Order::nautilus(&client)
    .find_many(FindManyArgs {
        order_by: vec![Order::id().asc()],
        cursor: Some(HashMap::from([(
            "id".to_string(),
            Value::I64(last_seen_order_id),
        )])),
        take: Some(10),
        ..Default::default()
    })
    .await?;

let previous_page = Order::nautilus(&client)
    .find_many(FindManyArgs {
        order_by: vec![Order::id().asc()],
        cursor: Some(HashMap::from([(
            "id".to_string(),
            Value::I64(last_seen_order_id),
        )])),
        take: Some(-10),
        ..Default::default()
    })
    .await?;
```

```java [Java]
import com.example.db.enums.OrderStatus;
import com.example.db.model.Order;
import java.util.List;

List<Order> nextPage = client.order().findMany(q -> q
    .where(w -> w.status(OrderStatus.CONFIRMED))
    .cursor("id", lastSeenOrderId)
    .take(10)
    .chunkSize(500)
).join();

List<Order> previousPage = client.order().findMany(q -> q
    .cursor("id", lastSeenOrderId)
    .take(-10)
).join();
```

:::

`find_many` / `findMany` also accepts `distinct`. On PostgreSQL this maps to `DISTINCT ON (...)`; on SQLite and MySQL it becomes plain `SELECT DISTINCT`, so it is most predictable when paired with a narrow projection.

## `find_first` / `findFirst`

Use `find_first` / `findFirst` when you want the first row after filtering:

::: code-group

```python [Python]
latest_confirmed_order = await client.order.find_first(
    where={"status": "CONFIRMED"},
    order_by={"createdAt": "desc"},
)
```

```typescript [JavaScript / TypeScript]
const latestConfirmedOrder = await client.order.findFirst({
  where: { status: 'CONFIRMED' },
  orderBy: [{ createdAt: 'desc' }],
  select: {
    id: true,
    status: true,
    totalAmount: true,
    createdAt: true,
  },
});
```

```rust [Rust]
use db::{Order, OrderStatus};
use nautilus_core::FindManyArgs;

let latest_confirmed_order = Order::nautilus(&client)
    .find_first(FindManyArgs {
        where_: Some(Order::status().eq(OrderStatus::Confirmed)),
        order_by: vec![Order::id().desc()],
        ..Default::default()
    })
    .await?;
```

```java [Java]
import com.example.db.enums.OrderStatus;
import com.example.db.model.Order;

Order latestConfirmedOrder = client.order().findFirst(q -> q
    .where(w -> w.status(OrderStatus.CONFIRMED))
    .select(s -> s.id().status().totalAmount())
).join();
```

:::

## `find_unique` / `findUnique`

Use a unique field or primary key in `where`:

::: code-group

```python [Python]
user_summary = await client.user.find_unique(
    where={"email": "alice@example.com"},
    select={"id": True, "email": True, "role": True},
)
```

```typescript [JavaScript / TypeScript]
const user = await client.user.findUnique({
  where: { email: 'alice@example.com' },
  include: {
    profile: true,
    orders: {
      where: { status: 'CONFIRMED' },
      orderBy: [{ createdAt: 'desc' }],
      take: 3,
    },
  },
});
```

```rust [Rust]
use db::{Order, OrderStatus, User};
use nautilus_core::{FindUniqueArgs, IncludeRelation};

let user_summary = User::nautilus(&client)
    .find_unique(
        FindUniqueArgs::new(User::email().eq("alice@example.com"))
            .with_select("id")
            .with_select("email")
            .with_select("role"),
    )
    .await?;

let user = User::nautilus(&client)
    .find_unique(
        FindUniqueArgs::new(User::email().eq("alice@example.com"))
            .with_include("profile", IncludeRelation::plain())
            .with_include(
                "orders",
                IncludeRelation::with_filter(Order::status().eq(OrderStatus::Confirmed))
                    .with_take(3),
            ),
    )
    .await?;
```

```java [Java]
import com.example.db.enums.OrderStatus;
import com.example.db.model.User;

User userSummary = client.user().findUnique(q -> q
    .where(w -> w.email("alice@example.com"))
    .select(s -> s.id().email().role())
).join();

User user = client.user().findUnique(q -> q
    .where(w -> w.email("alice@example.com"))
    .include(i -> i
        .profile()
        .orders(o -> o
            .where(w -> w.status(OrderStatus.CONFIRMED))
            .take(3)
        )
    )
).join();
```

:::

## `find_first_or_throw` / `findFirstOrThrow` and `find_unique_or_throw` / `findUniqueOrThrow`

These variants fail when nothing matches:

::: code-group

```python [Python]
user = await client.user.find_unique_or_throw(
    where={"email": "alice@example.com"},
)

latest_order = await client.order.find_first_or_throw(
    where={"status": "CONFIRMED"},
    order_by={"createdAt": "desc"},
)
```

```typescript [JavaScript / TypeScript]
const user = await client.user.findUniqueOrThrow({
  where: { email: 'alice@example.com' },
});

const latestOrder = await client.order.findFirstOrThrow({
  where: { status: 'CONFIRMED' },
  orderBy: [{ createdAt: 'desc' }],
});
```

```rust [Rust]
use db::{Order, OrderStatus, User};
use nautilus_core::{FindManyArgs, FindUniqueArgs};

let user = User::nautilus(&client)
    .find_unique_or_throw(
        FindUniqueArgs::new(User::email().eq("alice@example.com")),
    )
    .await?;

let latest_order = Order::nautilus(&client)
    .find_first_or_throw(FindManyArgs {
        where_: Some(Order::status().eq(OrderStatus::Confirmed)),
        order_by: vec![Order::id().desc()],
        ..Default::default()
    })
    .await?;
```

```java [Java]
import com.example.db.enums.OrderStatus;
import com.example.db.model.Order;
import com.example.db.model.User;

User user = client.user().findUniqueOrThrow(q -> q
    .where(w -> w.email("alice@example.com"))
).join();

Order latestOrder = client.order().findFirstOrThrow(q -> q
    .where(w -> w.status(OrderStatus.CONFIRMED))
).join();
```

:::

## `create` / `create_many` / `createMany`

Single-row and batch insert variants:

::: code-group

```python [Python]
user = await client.user.create({
    "email": "alice@example.com",
    "username": "alice",
    "name": "Alice Smith",
    "role": "ADMIN",
})

seeded = await client.user.create_many(
    [
        {
            "email": "bob@example.com",
            "username": "bob",
            "name": "Bob Jones",
        },
        {
            "email": "carol@example.com",
            "username": "carol",
            "name": "Carol Stone",
        },
    ],
    return_data=True,
)
```

```typescript [JavaScript / TypeScript]
const user = await client.user.create({
  data: {
    email: 'alice@example.com',
    username: 'alice',
    name: 'Alice Smith',
    role: 'ADMIN',
  },
});

const seeded = await client.user.createMany({
  data: [
    {
      email: 'bob@example.com',
      username: 'bob',
      name: 'Bob Jones',
    },
    {
      email: 'carol@example.com',
      username: 'carol',
      name: 'Carol Stone',
    },
  ],
  returnData: true,
});
```

```rust [Rust]
use db::{Metric, MetricCreateEntry, Role, User, UserCreateInput};

let user = User::nautilus(&client)
    .create(UserCreateInput {
        email: Some("alice@example.com".into()),
        username: Some("alice".into()),
        name: Some("Alice Smith".into()),
        role: Some(Role::Admin),
        ..Default::default()
    })
    .await?;

// `create_many` currently takes a generated `*CreateEntry` with one scalar field
// per entry. Using a tiny `Metric` model keeps the shape readable here.
let seeded = Metric::nautilus(&client)
    .create_many(vec![
        MetricCreateEntry {
            id: 1,
            bucket: "gold".into(),
            label: "gold-a".into(),
            points: 50,
        },
        MetricCreateEntry {
            id: 2,
            bucket: "silver".into(),
            label: "silver-a".into(),
            points: 30,
        },
    ])
    .await?;
```

```java [Java]
import com.example.db.dsl.UserDsl;
import com.example.db.enums.Role;
import com.example.db.model.User;
import java.util.List;

User user = client.user().create(u -> u
    .email("alice@example.com")
    .username("alice")
    .name("Alice Smith")
    .role(Role.ADMIN)
).join();

List<User> seeded = client.user().createMany(List.of(
    new UserDsl.CreateInput()
        .email("bob@example.com")
        .username("bob")
        .name("Bob Jones"),
    new UserDsl.CreateInput()
        .email("carol@example.com")
        .username("carol")
        .name("Carol Stone")
)).join();
```

:::

Python and JS batch inserts normalize each entry through the same create-data pipeline used by `create`. Rust batch inserts are stricter today because `*CreateEntry` mirrors the generated scalar row shape directly.

## `update`

`update` can target one row or many rows:

::: code-group

```python [Python]
updated_admins = await client.user.update(
    where={"email": {"contains": "@example.com"}},
    data={"role": "MODERATOR", "bio": "Promoted by bulk sync"},
)

affected = await client.user.update(
    where={"role": "USER"},
    data={"bio": "Needs profile review"},
    return_data=False,
)
```

```typescript [JavaScript / TypeScript]
const updatedAdmins = await client.user.update({
  where: { email: { contains: '@example.com' } },
  data: { role: 'MODERATOR', bio: 'Promoted by bulk sync' },
});

const affected = await client.user.update({
  where: { role: 'USER' },
  data: { bio: 'Needs profile review' },
  returnData: false,
});
```

```rust [Rust]
use db::{Role, User, UserUpdateArgs, UserUpdateInput};

let updated_admins = User::nautilus(&client)
    .update(UserUpdateArgs {
        where_: Some(User::email().contains("@example.com")),
        data: UserUpdateInput {
            role: Some(Role::Moderator),
            name: Some("Promoted User".into()),
            ..Default::default()
        },
    })
    .await?;
```

```java [Java]
import com.example.db.enums.Role;
import com.example.db.model.User;
import java.util.List;

List<User> updatedAdmins = client.user().update(q -> q
    .where(w -> w.emailContains("@example.com"))
    .data(u -> u
        .role(Role.MODERATOR)
        .name("Promoted User")
    )
).join();
```

:::

Only Python and JS expose `return_data=False` / `returnData: false`. Rust and Java always return the updated rows.

## `delete` / `delete_many` / `deleteMany`

`delete` removes the first matching record. `delete_many` / `deleteMany` removes all matching rows:

::: code-group

```python [Python]
deleted_user = await client.user.delete(
    where={"email": "alice@example.com"},
)

deleted_count = await client.order.delete_many(
    where={"status": "CANCELLED"},
)
```

```typescript [JavaScript / TypeScript]
const deletedUser = await client.user.delete({
  where: { email: 'alice@example.com' },
});

const deletedCount = await client.order.deleteMany({
  where: { status: 'CANCELLED' },
});
```

```rust [Rust]
use db::{Order, OrderDeleteArgs, OrderStatus, User, UserDeleteArgs};

let deleted_user = User::nautilus(&client)
    .delete(UserDeleteArgs {
        where_: Some(User::email().eq("alice@example.com")),
    })
    .await?;

let deleted_cancelled = Order::nautilus(&client)
    .delete_many(OrderDeleteArgs {
        where_: Some(Order::status().eq(OrderStatus::Cancelled)),
    })
    .await?;
```

```java [Java]
import com.example.db.enums.OrderStatus;
import com.example.db.model.User;

User deletedUser = client.user().delete(q -> q
    .where(w -> w.email("alice@example.com"))
).join();

long deletedCount = client.order().deleteMany(q -> q
    .where(w -> w.status(OrderStatus.CANCELLED))
).join();
```

:::

Delete behavior differs slightly by language:

- Python, JS, and Java raise a not-found error for `delete` when nothing matches
- Rust returns `Ok(None)` for `delete`
- Python and JS can return either count or deleted rows for `delete_many` / `deleteMany`
- Rust returns deleted rows from `delete_many`
- Java returns only the affected-row count from `deleteMany`

## `count`

`count` accepts the same filtering window used for paginated reads:

::: code-group

```python [Python]
open_orders = await client.order.count(where={"status": "PENDING"})

window_count = await client.order.count(
    where={"status": "CONFIRMED"},
    cursor={"id": last_seen_order_id},
    take=50,
    skip=1,
)
```

```typescript [JavaScript / TypeScript]
const openOrders = await client.order.count({
  where: { status: 'PENDING' },
});

const windowCount = await client.order.count({
  where: { status: 'CONFIRMED' },
  cursor: { id: lastSeenOrderId },
  take: 50,
  skip: 1,
});
```

```rust [Rust]
use std::collections::HashMap;

use db::{Order, OrderCountArgs, OrderStatus};
use nautilus_core::Value;

let open_orders = Order::nautilus(&client)
    .count(OrderCountArgs {
        where_: Some(Order::status().eq(OrderStatus::Pending)),
        ..Default::default()
    })
    .await?;

let window_count = Order::nautilus(&client)
    .count(OrderCountArgs {
        where_: Some(Order::status().eq(OrderStatus::Confirmed)),
        cursor: Some(HashMap::from([(
            "id".to_string(),
            Value::I64(last_seen_order_id),
        )])),
        take: Some(50),
        skip: Some(1),
    })
    .await?;
```

```java [Java]
import com.example.db.enums.OrderStatus;

long openOrders = client.order().count(q -> q
    .where(w -> w.status(OrderStatus.PENDING))
).join();

long windowCount = client.order().count(q -> q
    .where(w -> w.status(OrderStatus.CONFIRMED))
    .cursor("id", lastSeenOrderId)
    .take(50)
    .skip(1)
).join();
```

:::

## `group_by` / `groupBy`

`group_by` / `groupBy` supports grouped aggregates and pagination over groups:

::: code-group

```python [Python]
per_order = await client.order_item.group_by(
    ["orderId"],
    count={"_all": True},
    avg={"quantity": True},
    sum={"quantity": True},
    max={"quantity": True},
    having={"_sum": {"quantity": {"gte": 5}}},
    order={"orderId": "asc"},
)
```

```typescript [JavaScript / TypeScript]
const perOrder = await client.orderItem.groupBy({
  by: ['orderId'],
  count: { _all: true },
  avg: { quantity: true },
  sum: { quantity: true },
  max: { quantity: true },
  having: {
    _sum: {
      quantity: { gte: 5 },
    },
  },
  order: [{ orderId: 'asc' }],
});
```

```rust [Rust]
use db::{
    OrderItem,
    OrderItemCountAggregateInput,
    OrderItemGroupByArgs,
    OrderItemGroupByOrderBy,
    OrderItemMaxAggregateInput,
    OrderItemScalarField,
    OrderItemSortOrder,
    OrderItemSumAggregateInput,
};

let per_order = OrderItem::nautilus(&client)
    .group_by(OrderItemGroupByArgs {
        by: vec![OrderItemScalarField::OrderId],
        count: Some(OrderItemCountAggregateInput {
            _all: true,
            ..Default::default()
        }),
        sum: Some(OrderItemSumAggregateInput {
            quantity: true,
            ..Default::default()
        }),
        max: Some(OrderItemMaxAggregateInput {
            quantity: true,
            ..Default::default()
        }),
        order_by: vec![OrderItemGroupByOrderBy::Field {
            field: OrderItemScalarField::OrderId,
            direction: OrderItemSortOrder::Asc,
        }],
        ..Default::default()
    })
    .await?;
```

```java [Java]
import com.example.db.dsl.OrderItemDsl;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

List<JsonNode> perOrder = client.orderItem().groupBy(q -> q
    .by(
        OrderItemDsl.ScalarField.OrderId
    )
    .count(c -> c._all())
    .sum(s -> s.quantity())
    .max(m -> m.quantity())
).join();
```

:::

Python and JS expose `having` as part of the normal query object. Rust and Java currently accept `having` in a more raw form (`serde_json::Value` / `JsonNode`) when you need aggregate post-filters.

## `upsert`

`upsert` is useful when you want a "find or create, otherwise update" flow behind one helper. In practice, `where` should normally target a unique field:

::: code-group

```python [Python]
user = await client.user.upsert(
    where={"email": "alice@example.com"},
    data={
        "create": {
            "email": "alice@example.com",
            "username": "alice",
            "name": "Alice Smith",
            "role": "ADMIN",
        },
        "update": {
            "name": "Alice S.",
            "bio": "Updated during sync",
        },
    },
    include={
        "orders": {
            "order_by": {"createdAt": "desc"},
            "take": 3,
        }
    },
)
```

```typescript [JavaScript / TypeScript]
const user = await client.user.upsert({
  where: { email: 'alice@example.com' },
  data: {
    create: {
      email: 'alice@example.com',
      username: 'alice',
      name: 'Alice Smith',
      role: 'ADMIN',
    },
    update: {
      name: 'Alice S.',
      bio: 'Updated during sync',
    },
  },
  include: {
    orders: {
      orderBy: [{ createdAt: 'desc' }],
      take: 3,
    },
  },
});
```

```rust [Rust]
use db::{Role, User, UserCreateInput, UserUpdateInput, UserUpsertArgs};

let user = User::nautilus(&client)
    .upsert(UserUpsertArgs {
        where_: Some(User::email().eq("alice@example.com")),
        create: UserCreateInput {
            email: Some("alice@example.com".into()),
            username: Some("alice".into()),
            name: Some("Alice Smith".into()),
            role: Some(Role::Admin),
            ..Default::default()
        },
        update: UserUpdateInput {
            name: Some("Alice S.".into()),
            ..Default::default()
        },
        return_data: true,
    })
    .await?;
```

```java [Java]
import com.example.db.enums.Role;
import com.example.db.model.User;

User user = client.user().upsert(q -> q
    .where(w -> w.email("alice@example.com"))
    .create(u -> u
        .email("alice@example.com")
        .username("alice")
        .name("Alice Smith")
        .role(Role.ADMIN)
    )
    .update(u -> u
        .name("Alice S.")
    )
).join();
```

:::

At the moment, `include` on `upsert` is only surfaced in Python and JS. Rust and Java return the created or updated base record.

## `raw_query` / `raw_stmt_query` and `rawQuery` / `rawStmtQuery`

Use raw SQL only when the generated query surface is not enough. Prefer the statement variant whenever user input is involved. Use `$1`, `$2`, ... placeholders on PostgreSQL or `?` placeholders on SQLite / MySQL:

::: code-group

```python [Python]
rows = await client.user.raw_query(
    "SELECT email, role FROM users ORDER BY created_at DESC LIMIT 5"
)

safe_rows = await client.user.raw_stmt_query(
    "SELECT email, role FROM users WHERE role = $1",
    ["ADMIN"],
)
```

```typescript [JavaScript / TypeScript]
const rows = await client.user.rawQuery(
  'SELECT email, role FROM users ORDER BY created_at DESC LIMIT 5',
);

const safeRows = await client.user.rawStmtQuery(
  'SELECT email, role FROM users WHERE role = $1',
  ['ADMIN'],
);
```

```rust [Rust]
use nautilus_core::Value;

let rows = User::nautilus(&client)
    .raw_query("SELECT email, role FROM users ORDER BY created_at DESC LIMIT 5")
    .await?;

let safe_rows = User::nautilus(&client)
    .raw_stmt_query(
        "SELECT email, role FROM users WHERE role = $1",
        vec![Value::String("ADMIN".into())],
    )
    .await?;
```

```java [Java]
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

List<JsonNode> rows = client.user().rawQuery(
    "SELECT email, role FROM users ORDER BY created_at DESC LIMIT 5"
).join();

List<JsonNode> safeRows = client.user().rawStmtQuery(
    "SELECT email, role FROM users WHERE role = $1",
    List.of("ADMIN")
).join();
```

:::
