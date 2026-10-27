# Prisma Performance Best Practices

1. **Avoid N+1 Queries**: Always use `include` or nested `select` to fetch relations in a single query.
2. **Select Only What's Needed**: Never select large blobs or text fields unless strictly required. Use explicit `select`.
3. **Indexes**: Add `@index` to columns heavily used in `where` or `orderBy` clauses.
4. **Connection Pooling**: Use PgBouncer or Prisma Accelerate for serverless deployments.
