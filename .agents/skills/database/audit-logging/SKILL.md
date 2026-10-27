---
name: database/audit-logging
---

# Audit Logging & Change History

> Core guidance for designing durable audit trails, actor/action/resource records, change history, correlation, integrity, retention, and access controls for security- and compliance-relevant events.

## Use When

- Designing audit trails for security-sensitive or business-critical actions.
- Recording who changed what, when, and through which operation.
- Designing entity change history or before/after records.
- Adding correlation IDs across user actions, background jobs, and integrations.
- Designing audit retention and access policies.
- Reviewing whether an existing logging model is sufficient for forensic or compliance use.
- Designing tenant-aware audit history in multi-tenant systems.

## Do Not Use For

- General application debug logging.
- High-volume observability telemetry such as metrics or traces.
- Analytics event tracking.
- Domain event sourcing unless the system intentionally uses event sourcing.
- Production log-platform administration.

## Core Rules

- **Audit Logs Serve Accountability**: Record events that establish who or what performed a meaningful action, what resource was affected, and when it occurred.
- **Actor Must Be Explicit**: Capture the effective actor type and identity where known, including user, service account, system process, integration, or administrator.
- **Action and Resource Must Be Structured**: Prefer explicit action names, resource types, resource identifiers, and tenant context over free-form text alone.
- **Preserve Useful Change Context**: Record before/after values or a structured change set when the changed state is relevant and safe to retain.
- **Correlation Matters**: Use request, trace, job, transaction, or correlation identifiers so related operations can be reconstructed.
- **Audit History Should Be Append-Oriented**: Avoid routine in-place mutation or deletion of historical audit events; corrections should normally create additional evidence rather than silently rewriting history.
- **Sensitive Data Must Be Minimized**: Do not copy secrets, credentials, raw tokens, or unnecessary personal data into audit records.
- **Retention Is Part of the Design**: Define retention, archival, legal/compliance requirements, and deletion exceptions deliberately.
- **Access Must Be Restricted**: Audit records may contain sensitive operational and security information and should use least-privilege access.
- **Failure Semantics Must Be Explicit**: Decide whether failure to record a critical audit event blocks the business operation or degrades safely, based on the event's risk and compliance requirements.

## References

- No dedicated reference files are currently required.

Load only the references relevant to the current task.

## Boundaries

- Audit logging is distinct from application debug logging, metrics, tracing, and analytics.
- This skill complements `database/data-modeling`.
- Multi-tenant audit systems should also use `database/multitenancy`.
- PostgreSQL-specific implementation may additionally use `database/postgresql`.
- Security-sensitive audit design should involve the Security Agent when appropriate.
- Audit records must not become an alternative storage location for secrets or unrestricted personal data.
- Destructive alteration or removal of production audit history remains subject to applicable data-governance and approval rules.
- Data architecture ownership remains with the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
