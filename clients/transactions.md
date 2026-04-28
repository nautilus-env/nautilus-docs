# Transactions

All generated clients expose a transaction helper that wraps multiple operations in a single atomic unit. If any operation inside the transaction fails, the entire block is rolled back.

::: code-group

```python [Python Context Manager]
async with Nautilus() as client:
    async with client.transaction() as tx:
        user = await tx.user.create({
            "email": "bob@example.com",
            "username": "bob",
            "name": "Bob Jones",
        })
```

```python [Python Callback]
import asyncio
from db import Nautilus

async def main():
    async with Nautilus() as client:
        async def work(tx):
            return await tx.user.find_many()

        result = await client.transaction(work, timeout_ms=10000)
        return result

asyncio.run(main())
```

```typescript [JavaScript / TypeScript]
const result = await client.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'bob@example.com', username: 'bob', name: 'Bob Jones' },
  });

  return tx.order.create({
    data: {
      userId: user!.id,
      status: 'CONFIRMED',
      totalAmount: 149.99,
    },
  });
});
```

```rust [Rust]
use db::{
    Client, Order, OrderCreateInput, TransactionOptions, User, UserCreateInput,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = Client::postgres(&std::env::var("DATABASE_URL")?).await?;

    let order = client
        .transaction(TransactionOptions::default(), |tx| Box::pin(async move {
            let user = User::nautilus(&tx)
                .create(UserCreateInput {
                    email: Some("bob@example.com".into()),
                    username: Some("bob".into()),
                    name: Some("Bob Jones".into()),
                    ..Default::default()
                })
                .await?;

            Order::nautilus(&tx)
                .create(OrderCreateInput {
                    user_id: Some(user.id),
                    ..Default::default()
                })
                .await
        }))
        .await?;

    println!("{}", order.id);
    Ok(())
}
```

```java [Java]
import com.example.db.client.Nautilus;
import com.example.db.enums.OrderStatus;
import com.example.db.model.Order;
import java.math.BigDecimal;

public final class App {
    public static void main(String[] args) {
        try (var client = new Nautilus()) {
            Order order = client.transaction(tx ->
                tx.user().create(u -> u
                    .email("bob@example.com")
                    .username("bob")
                    .name("Bob Jones")
                ).thenCompose(user ->
                    tx.order().create(o -> o
                        .userId(user.id())
                        .status(OrderStatus.CONFIRMED)
                        .totalAmount(new BigDecimal("149.99"))
                    ).thenCompose(order ->
                        tx.orderItem().create(i -> i
                            .orderId(order.id())
                            .productId(1L)
                            .quantity(1)
                            .unitPrice(new BigDecimal("149.99"))
                        ).thenApply(ignored -> order)
                    )
                )
            ).join();

            System.out.println(order.id());
        }
    }
}
```

:::
