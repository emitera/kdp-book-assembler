---
name: domain/billing
---

# Billing Data Modeling

> Core guidance for modeling billing domains including customers, subscriptions, plans, invoices, invoice lines, payments, credits, refunds, monetary values, idempotency, and financial history.

## Use When

- Designing a billing or subscription data model.
- Modeling plans, prices, subscriptions, invoices, and invoice lines.
- Modeling payments, refunds, credits, or adjustments.
- Designing monetary fields and currency handling.
- Integrating external payment providers with an internal billing model.
- Designing idempotent payment or billing operations.
- Preserving financial history and reconciliation data.
- Reviewing billing models for consistency and auditability.

## Do Not Use For

- General accounting or full general-ledger design unless explicitly required.
- Tax or regulatory advice.
- Payment-provider-specific API implementation.
- Generic CRM customer modeling unrelated to billing.
- Production financial-data migrations or destructive financial operations.
- Authorization decisions about who may perform billing actions.

## Core Rules

- **Money Must Be Exact**: Represent monetary values using exact decimal or integer-minor-unit semantics appropriate to the currency and system; do not use binary floating-point for authoritative monetary amounts.
- **Currency Must Be Explicit**: Monetary amounts must carry or derive an unambiguous currency context.
- **Financial History Must Be Preserved**: Do not reconstruct historical invoices or transactions solely from mutable current product or pricing data.
- **Snapshot Commercial Terms**: Persist the relevant price, description, quantity, tax context, discount, and other commercial terms required to interpret historical billing records.
- **Payments and Invoices Are Distinct**: Model the obligation to pay separately from payment attempts and settlement events.
- **External IDs Are Not Internal Identity**: Keep payment-provider identifiers as integration references rather than using them as the sole internal domain identity.
- **Idempotency Is Required for Retryable Financial Operations**: Design retried payment, refund, webhook, and invoice operations so duplicate delivery does not create duplicate financial effects.
- **State Transitions Must Be Explicit**: Define valid lifecycle transitions for subscriptions, invoices, payments, refunds, and credits rather than relying on arbitrary status mutation.
- **Corrections Should Preserve Evidence**: Prefer credits, reversals, refunds, adjustments, or replacement records over silently rewriting finalized financial history.
- **Reconciliation Must Be Possible**: Preserve enough internal and external references to reconcile application state with payment-provider and settlement records.
- **Sensitive Payment Data Must Be Minimized**: Do not store raw card credentials or other restricted payment secrets when tokenized provider mechanisms are available.

## References

- No dedicated reference files are currently required.

Load only the references relevant to the current task.

## Boundaries

- This skill provides billing-domain data-modeling guidance and complements `database/data-modeling`.
- Multi-tenant billing systems should also use `database/multitenancy`.
- Financially significant changes may also require `database/audit-logging`.
- PostgreSQL-specific implementation may use `database/postgresql`.
- ORM-specific implementation may use `database/prisma`.
- Payment-provider integration details belong to the applicable integration or backend implementation layer.
- Accounting, tax, legal, and regulatory requirements must not be inferred from this skill and require appropriate authoritative input.
- Production billing-data migrations, bulk corrections, destructive operations, and payment-impacting changes remain subject to applicable workflows and approval governance.
- Data architecture ownership remains with the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
