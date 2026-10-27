---
name: database/prisma
---

# Prisma ORM

> Prisma-specific guidance for schema models, Prisma Client, query efficiency, indexes, constraints, and development migrations.

## Use When

- Designing Prisma schema models.
- Using Prisma Client.
- Optimizing Prisma queries.
- Managing Prisma-specific development migrations.

## Do Not Use For

- General PostgreSQL engine administration.
- Database architecture independent of Prisma.
- Production migration execution.
- Cross-database data migration strategy.

## Core Rules

- **Query Efficiency**: Avoid N+1 behavior and fetch only data required by the use case.
- **Prisma Migrations**: Use Prisma migrations for Prisma-managed schema changes; use `prisma migrate dev` for development workflows.
- **Production Boundary**: Production migration execution must follow `db.migration` and the approved production migration procedure.
- **Indexes and Constraints**: Model indexes, uniqueness, relations, and constraints deliberately according to access patterns and integrity requirements.

## References

- `references/prisma-client-api.md`
- `references/prisma-database-setup.md`
- `references/prisma-performance.md`
- `references/prisma-postgres.md`

Load only the references relevant to the current task.

## Boundaries

- This skill is Prisma-specific ORM guidance.
- Database architecture remains owned by the Database Architect.
- Production persistent-data migration must use `db.migration` and applicable approval governance.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
