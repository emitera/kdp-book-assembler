---
name: domain/inventory
---

# Inventory Data Modeling

> Core guidance for modeling items, products, SKUs, stock locations, quantities, stock movements, reservations, transfers, adjustments, serial numbers, and inventory history.

## Use When

- Designing an inventory or stock-management data model.
- Modeling products, items, SKUs, or variants.
- Designing warehouse, site, bin, or logical stock locations.
- Tracking receipts, issues, transfers, returns, and adjustments.
- Designing stock reservations and availability.
- Tracking serialized or individually identifiable assets.
- Designing inventory balances and stock movement history.
- Integrating inventory with CRM, ticketing, purchasing, or billing.
- Reviewing inventory consistency and reconciliation behavior.

## Do Not Use For

- Fixed-asset accounting or depreciation unless explicitly in scope.
- General product catalog modeling with no stock semantics.
- Billing and payment modeling.
- Procurement workflow design unless inventory state is directly involved.
- Authentication or authorization design.
- Production inventory corrections, bulk adjustments, or destructive migration execution.

## Core Rules

- **Movement History Is Authoritative**: Prefer durable stock-movement records for receipts, issues, transfers, returns, adjustments, and other quantity-changing operations rather than relying only on a mutable quantity field.
- **Balance Is Derived or Reconciled State**: Current stock may be cached or materialized for performance, but it must remain explainable and reconcilable against authoritative inventory events or movements.
- **Location Must Be Explicit**: Stock quantity has meaning only in a defined location or ownership context such as warehouse, site, bin, vehicle, technician, customer allocation, or logical pool.
- **Item Identity and SKU Are Different Concepts**: Separate internal item/product identity from mutable or externally meaningful SKU, barcode, manufacturer part number, or supplier identifier.
- **Reservations Must Not Pretend to Be Physical Movement**: Distinguish on-hand, reserved, allocated, available, in-transit, damaged, or other operational quantity states where the business requires them.
- **Transfers Have Two Sides**: Model source, destination, dispatch, receipt, and in-transit state deliberately when transfers are not instantaneous.
- **Adjustments Require Reason**: Manual quantity corrections should preserve reason, actor, time, affected location, and the quantity delta.
- **Serialized Inventory Needs Individual Identity**: When items are individually tracked, model serial/asset identity separately from aggregate SKU-level quantity.
- **Negative Stock Must Be Intentional**: Decide explicitly whether negative inventory is forbidden, temporarily permitted, or expected for specific workflows.
- **Concurrency Must Be Designed**: Reservation, allocation, fulfillment, and adjustment operations must handle concurrent changes without silently overselling or corrupting balances.
- **Unit of Measure Must Be Explicit**: Quantities should have stable unit semantics, including conversion rules when multiple units are supported.
- **Reconciliation Must Be Possible**: Preserve enough history to compare system stock with physical counts and explain discrepancies.

## References

- No dedicated reference files are currently required.

Load only the references relevant to the current task.

## Boundaries

- This skill provides inventory-domain data-modeling guidance and complements `database/data-modeling`.
- Multi-tenant inventory systems should also use `database/multitenancy`.
- Important adjustments and administrative changes may also use `database/audit-logging`.
- Customer and organization relationships belong primarily in `domain/crm`.
- Service-ticket relationships belong in `domain/ticketing`.
- Billing and financial settlement belong in `domain/billing`.
- PostgreSQL-specific implementation may use `database/postgresql`.
- ORM-specific implementation may use `database/prisma`.
- Production bulk adjustments, destructive stock corrections, migrations, and inventory-impacting operations remain governed by applicable workflows and approval rules.
- Data architecture ownership remains with the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
