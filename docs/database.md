# Database

- **SQLite:** Simple setup with no database server needed. Good fit for a small take-home project.

- **Prisma:** Provides type-safe queries, migrations, and a clear database schema.

- **Integer prices:** Avoids floating-point rounding issues and keeps money calculations accurate.

- **OrderItem snapshots:** Keeps the original product name, price, and variant even if the product changes later.

- **CartItem unique constraint:** Prevents duplicate cart items and allows existing quantities to be merged.
