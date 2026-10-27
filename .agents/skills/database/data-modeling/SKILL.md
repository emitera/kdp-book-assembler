---
name: database/data-modeling
---

# Relational Data Modeling

> Core guidance for designing relational data models, entity boundaries, keys, relationships, constraints, normalization, lifecycle, and integrity independent of a specific ORM or database engine.

## Use When

- Designing a new relational data model.
- Defining entities, aggregates, relationships, and cardinality.
- Choosing primary keys, foreign keys, uniqueness constraints, and ownership boundaries.
- Reviewing normalization, denormalization, and data integrity.
- Designing persistent models before choosing ORM-specific implementation details.
- Evaluating how domain concepts should be represented in relational storage.

## Do Not Use For

- PostgreSQL-specific engine behavior, query planning, indexing internals, or administration.
- Prisma-specific schema syntax or Prisma Client usage.
- Production migration execution.
- Domain-specific CRM, billing, ticketing, or inventory modeling when a dedicated domain skill applies.
- Analytics warehouse or non-relational modeling unless explicitly extended for that purpose.

## Core Rules

- **Model the Domain First**: Define business concepts, invariants, ownership, and lifecycle before translating them into tables or ORM models.
- **Stable Identity**: Give persistent entities explicit, stable identifiers and distinguish identity from mutable business attributes.
- **Referential Integrity**: Represent relationships with explicit foreign keys and constraints when relational integrity is required.
- **Cardinality Matters**: Define one-to-one, one-to-many, and many-to-many relationships intentionally rather than inferring them from application code.
- **Normalize by Default**: Start from normalized structures that preserve integrity and reduce duplication; denormalize only for a demonstrated operational or performance reason.
- **Constraints Belong Near the Data**: Enforce durable invariants with database constraints where the database can reliably protect them.
- **Lifecycle Is Part of the Model**: Define creation, mutation, archival, deletion, historical retention, and ownership behavior for important entities.
- **Separate Current State from History**: Do not overload one mutable record when the system requires a durable history of state transitions or events.

## References

- No dedicated reference files are currently required.

Load only the references relevant to the current task.

## Boundaries

- This skill provides database-independent relational modeling guidance.
- Database-engine-specific design belongs in the relevant engine skill such as `database/postgresql`.
- ORM implementation belongs in the applicable ORM skill such as `database/prisma`.
- Domain-specific models should use the appropriate domain skill in addition to this foundational skill.
- Production persistent-data changes remain governed by `db.orchestrator`, `db.migration`, and applicable approval rules.
- Data architecture ownership remains with the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
