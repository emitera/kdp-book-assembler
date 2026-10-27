---
name: database/multitenancy
---

# Multi-Tenant Data Architecture

> Core guidance for designing tenant isolation, tenant identity, data ownership, shared-schema and isolated-schema models, row-level security, cross-tenant access controls, and tenant lifecycle.

## Use When

- Designing SaaS or multi-tenant application data architecture.
- Choosing between shared-database/shared-schema, schema-per-tenant, and database-per-tenant models.
- Defining tenant identity and tenant-scoped keys.
- Designing tenant isolation with PostgreSQL row-level security.
- Reviewing cross-tenant access risks.
- Designing tenant provisioning, suspension, archival, export, or deletion.
- Evaluating operational tradeoffs between isolation, cost, complexity, and scale.

## Do Not Use For

- Single-tenant applications with no tenant-isolation requirement.
- General relational data modeling independent of tenancy.
- Authentication design unrelated to tenant authorization.
- Production tenant migration or destructive tenant deletion execution.
- Billing account modeling unless tenancy and billing ownership intersect.

## Core Rules

- **Tenant Context Must Be Explicit**: Every tenant-scoped operation must have an explicit, validated tenant context rather than relying on implicit global state.
- **Isolation Is a Security Boundary**: Treat cross-tenant data exposure as a security failure, not merely an application bug.
- **Choose the Isolation Model Deliberately**: Select shared schema, schema-per-tenant, or database-per-tenant based on compliance, scale, operational complexity, cost, and isolation requirements.
- **Tenant Keys Must Propagate**: Tenant-scoped entities should carry or derive tenant ownership consistently so isolation can be enforced and audited.
- **Database Enforcement Is Preferred Where Practical**: Use foreign keys, composite constraints, RLS, or equivalent database controls to reinforce tenant isolation rather than relying only on application filters.
- **Cross-Tenant Operations Are Exceptional**: Administrative or reporting operations spanning tenants must be explicit, authorized, auditable, and narrowly scoped.
- **Lifecycle Must Be Designed**: Define provisioning, suspension, transfer, export, retention, archival, and deletion behavior before production use.
- **Migration Strategy Must Respect Isolation**: Schema and data migrations must preserve tenant boundaries and avoid cross-tenant contamination.

## References

- No dedicated reference files are currently required.

Load only the references relevant to the current task.

## Boundaries

- This skill complements `database/data-modeling` and, for PostgreSQL systems, `database/postgresql`.
- Authentication and authorization policy remains owned by Security and application architecture.
- Billing-domain behavior belongs in `domain/billing`.
- Production tenant migrations, bulk operations, and destructive tenant deletion remain governed by `db.migration`, applicable operational workflows, and approval policy.
- Security-sensitive tenancy designs should involve the Security Agent.
- Data architecture ownership remains with the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
