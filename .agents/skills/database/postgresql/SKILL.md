---
name: database/postgresql
---

# PostgreSQL Engineering

> Core guidance for PostgreSQL schema design, data types, indexes, query planning, transactions, locking, constraints, partitioning, and engine-specific behavior.

## Use When

- Designing or reviewing PostgreSQL-specific schemas.
- Choosing PostgreSQL data types, indexes, constraints, or generated columns.
- Reviewing query plans and query performance.
- Designing transaction boundaries and concurrency behavior.
- Working with locking, isolation levels, deadlocks, or contention.
- Evaluating PostgreSQL partitioning, extensions, or row-level security.
- Reviewing PostgreSQL operational behavior that affects application design.

## Do Not Use For

- General relational data modeling independent of a database engine.
- Prisma schema syntax or Prisma Client behavior.
- Production migration execution.
- Database server administration, backup operations, replication operations, or production failover unless explicitly extended for that purpose.
- Domain-specific CRM, billing, ticketing, or inventory modeling.

## Core Rules

- **Model Before Optimizing**: Use `database/data-modeling` to establish sound relational structure before applying PostgreSQL-specific optimization.
- **Data Types Matter**: Choose PostgreSQL types according to semantics, range, precision, indexing behavior, and interoperability rather than convenience alone.
- **Constraints Protect Integrity**: Use primary keys, foreign keys, uniqueness, `CHECK`, exclusion constraints, and `NOT NULL` deliberately to enforce durable invariants.
- **Indexes Follow Access Patterns**: Design indexes from real query predicates, joins, ordering, uniqueness, and selectivity rather than indexing every column.
- **Measure Query Plans**: Use `EXPLAIN` and `EXPLAIN ANALYZE` appropriately when investigating query behavior; do not optimize only from intuition.
- **Transactions Must Be Bounded**: Keep transactions as short as practical and understand their isolation, locking, retry, and failure semantics.
- **Concurrency Is a Data Concern**: Design for races, conflicting writes, idempotency, and lock behavior explicitly where concurrent mutation is possible.
- **Use Engine Features Deliberately**: Features such as JSONB, arrays, generated columns, partial indexes, expression indexes, partitioning, and RLS should solve a concrete requirement rather than replace clear relational modeling.

## References

- No dedicated reference files are currently required.

Load only the references relevant to the current task.

## Boundaries

- This skill is PostgreSQL-engine-specific and complements `database/data-modeling`.
- ORM-specific implementation belongs in skills such as `database/prisma`.
- Multi-tenant isolation architecture should also use `database/multitenancy`.
- Audit-history architecture should also use `database/audit-logging` when applicable.
- Production migrations remain governed by `db.migration` and applicable approval rules.
- Production operations such as backup, restore, failover, replication changes, or destructive maintenance require the appropriate operational workflow and governance.
- Data architecture ownership remains with the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
