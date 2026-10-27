---
name: domain/crm
---

# CRM Data Modeling

> Core guidance for modeling customer relationship management domains including organizations, contacts, leads, opportunities, pipelines, activities, ownership, communication history, and lifecycle.

## Use When

- Designing a CRM data model.
- Modeling organizations, accounts, contacts, leads, or prospects.
- Designing sales opportunities and pipeline stages.
- Modeling relationship ownership, assignment, and teams.
- Recording activities such as calls, meetings, emails, notes, and follow-ups.
- Designing lead conversion and customer lifecycle.
- Integrating CRM records with billing, ticketing, or external systems.
- Reviewing CRM data models for history, integrity, and extensibility.

## Do Not Use For

- Billing and payment-domain design.
- Support-ticket workflow modeling when `domain/ticketing` applies.
- Inventory or warehouse modeling.
- Marketing analytics or campaign automation unless explicitly in scope.
- Identity and authentication account modeling.
- Production CRM data migration execution.

## Core Rules

- **Separate Organizations and People**: Model organizations/accounts independently from contacts so one person can participate in the correct organizational relationships.
- **Relationship Roles Must Be Explicit**: Represent roles, ownership, account relationships, decision-making roles, and assignments explicitly rather than encoding them only in free-form notes.
- **Lead and Customer Are Lifecycle Concepts**: Avoid assuming that lead, contact, account, and customer are always the same entity; model lifecycle transitions according to actual business semantics.
- **Opportunities Need Historical Context**: Preserve meaningful opportunity stage transitions, ownership changes, amounts, expected dates, and closure outcomes when sales history matters.
- **Activities Are First-Class Records**: Calls, meetings, notes, emails, tasks, and other interactions should have structured identity, timestamps, actors, and related entities.
- **Pipeline Configuration Should Be Data-Driven**: Avoid hardcoding stage names and transitions when the business requires configurable pipelines.
- **Ownership Must Be Explicit**: Model responsible user/team ownership independently from record creation identity.
- **Avoid Unbounded Custom Fields Without Governance**: Extensibility mechanisms should preserve validation, searchability, reporting, and migration capability.
- **External Identity Must Be Traceable**: Preserve integration identifiers separately from internal CRM entity identity.
- **History Should Match Business Need**: Keep durable state or change history for fields whose previous values matter operationally, legally, or analytically.

## References

- No dedicated reference files are currently required.

Load only the references relevant to the current task.

## Boundaries

- This skill provides CRM-domain data-modeling guidance and complements `database/data-modeling`.
- Multi-tenant CRM systems should also use `database/multitenancy`.
- Material CRM change history may also use `database/audit-logging`.
- Billing relationships belong in `domain/billing`.
- Support cases and service queues belong in `domain/ticketing`.
- Authentication identities and authorization policy remain separate from CRM contacts and ownership.
- PostgreSQL-specific implementation may use `database/postgresql`.
- ORM-specific implementation may use `database/prisma`.
- Production CRM data migrations and bulk destructive operations remain governed by applicable database workflows and approval rules.
- Data architecture ownership remains with the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
