---
name: domain/ticketing
---

# Ticketing & Service Desk Data Modeling

> Core guidance for modeling tickets, service requests, queues, assignment, status lifecycle, priority, SLA targets, conversations, internal notes, events, escalation, and resolution history.

## Use When

- Designing a helpdesk, service desk, support, or ticket-management data model.
- Modeling tickets, incidents, requests, cases, or service tasks.
- Designing queues, assignment, ownership, and escalation.
- Modeling ticket statuses and lifecycle transitions.
- Designing priority, severity, or impact/urgency models.
- Modeling SLA targets, response deadlines, resolution deadlines, and breach state.
- Recording requester/agent communication and internal notes.
- Preserving ticket history and operational events.
- Integrating ticketing with CRM, inventory, users, or external support channels.

## Do Not Use For

- General project-management task tracking.
- Software-development issue tracking unless the product intentionally shares the same domain model.
- CRM opportunity or sales-pipeline modeling.
- Inventory movement or asset-ledger modeling.
- Authentication and authorization design.
- Production ticket-data migrations or bulk destructive operations.

## Core Rules

- **Ticket Identity Must Be Stable**: Give each ticket a durable internal identity and, where useful, a human-facing reference number that can remain stable across lifecycle changes.
- **Lifecycle Must Be Explicit**: Define valid states and transitions rather than allowing arbitrary status strings or unrestricted mutation.
- **Status and Resolution Are Different Concepts**: A ticket may be closed or resolved operationally while retaining a structured resolution reason or outcome.
- **Assignment Must Be Historical When It Matters**: Preserve meaningful changes in assigned user, team, queue, or escalation ownership when operational accountability requires it.
- **Requester and Agent Roles Must Be Distinct**: Model who requested service separately from who owns, handles, comments on, or resolves the ticket.
- **Conversation and Internal Notes Must Be Distinguishable**: Separate customer-visible communication from internal operational notes and preserve visibility semantics explicitly.
- **Priority Must Have Defined Semantics**: Avoid arbitrary priority labels without documented business meaning; where appropriate derive priority from impact, urgency, severity, or service policy.
- **SLA Is a Time Model, Not a Boolean**: Represent SLA policy, applicable targets, start/pause/resume rules, deadlines, achievement, and breach state explicitly when SLA is required.
- **Events Should Preserve Operational History**: Important transitions such as assignment, escalation, status change, SLA pause, resolution, and reopening should remain reconstructable.
- **Channel Origin Should Be Traceable**: Preserve whether a ticket originated from portal, email, API, monitoring, chat, phone, or another integration when the distinction matters.
- **Reopening Must Be Defined**: Decide whether reopening continues the same ticket lifecycle, creates a linked new ticket, or follows another explicit business rule.
- **External Integration IDs Are References**: Keep third-party ticket IDs and message IDs separate from internal identity.

## References

- No dedicated reference files are currently required.

Load only the references relevant to the current task.

## Boundaries

- This skill provides ticketing and service-desk domain data-modeling guidance and complements `database/data-modeling`.
- Multi-tenant service platforms should also use `database/multitenancy`.
- Important administrative and security-sensitive ticket changes may also use `database/audit-logging`.
- Customer/account relationships belong primarily in `domain/crm`.
- Asset and stock relationships belong in `domain/inventory`.
- Authentication, authorization, and agent permissions remain separate security concerns.
- PostgreSQL-specific implementation may use `database/postgresql`.
- ORM-specific implementation may use `database/prisma`.
- Production ticket migrations, bulk changes, destructive operations, or SLA-impacting production corrections remain governed by applicable workflows and approval rules.
- Data architecture ownership remains with the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
