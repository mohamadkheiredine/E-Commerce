# Database

I chose SQLite because it is simple and doesn't need a separate database server. For a real production system with many concurrent writes, I would use PostgreSQL instead.

I chose Prisma because it gives type-safe queries and makes database migrations easy to track in Git. The Prisma schema also keeps the database structure in one place.

Order items store a snapshot of the product information because an order should keep the original price and details, even if the product changes later.

The unique constraint on `user_id`, `product_id`, and `variant_id` prevents duplicate cart items

The database and API use `snake_case`, while the code uses `camelCase`. I handle this conversion by serializers across the project
