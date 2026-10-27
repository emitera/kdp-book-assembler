# User Approval Rules

## Purpose

This document defines mandatory user approval gates for actions that may materially affect production systems, persistent data, security posture, billing, availability, infrastructure, or other high-impact project state.

These rules apply to all agents and workflows in the Antigravity Hub.

Explicit approval is a governance control.

It MUST NOT be replaced by inference, automation success, previous approval of another phase, or agent confidence.

---

## 1. Approval Principle

When an action falls under a mandatory approval gate:

1. describe the proposed action;
2. identify the affected system, environment, or data;
3. identify material risks;
4. identify rollback or recovery options when applicable;
5. state exactly what approval is being requested;
6. STOP execution;
7. continue only after explicit approval is received.

Silence is NOT approval.

Previous approval of planning is NOT approval of execution.

Approval of development is NOT approval of production deployment.

Approval of a migration design is NOT approval of migration execution.

---

## 2. Approval Must Be Scoped

Approval MUST identify the actual operation being authorized.

Acceptable example:

"Approve deployment of version 1.4.0 to production, including the additive `customer_status` database migration."

Insufficient example:

"Continue."

For low-risk workflow progression, a generic continuation may be acceptable where no mandatory approval gate exists.

For high-impact actions, approval MUST be specific.

---

## 3. Production Deployment

Explicit approval is required before:

* first production deployment;
* production application deployment;
* production service restart when it may cause material interruption;
* production release activation;
* traffic cutover;
* blue/green production switch;
* canary expansion to production users when material impact exists.

Before requesting approval, provide when applicable:

* version or change identifier;
* affected services;
* deployment procedure;
* database dependencies;
* expected impact;
* verification procedure;
* rollback procedure;
* known risks.

---

## 4. Production Database Changes

Explicit approval is required before executing:

* production schema migration;
* production data migration;
* production index operation with material impact;
* production constraint changes;
* production partitioning changes;
* production database engine or version migration;
* migration affecting tenant isolation;
* migration affecting authentication or authorization data.

Approval of Database Architecture does NOT authorize production migration execution.

---

## 5. Destructive Data Operations

Explicit approval is required before:

* deleting production data;
* dropping tables, schemas, databases, or collections;
* destructive truncation;
* bulk deletion;
* irreversible transformation;
* anonymization that cannot be reversed;
* removing historical or audit records;
* destructive tenant deletion.

Before requesting approval, identify:

* affected data;
* approximate scope when known;
* whether operation is reversible;
* backup/recovery state;
* retention implications;
* validation plan.

---

## 6. Irreversible Operations

Any action classified as irreversible requires explicit approval.

The approval request MUST clearly state:

`IRREVERSIBLE ACTION`

and describe why rollback is unavailable.

Where possible, provide a recovery alternative before execution.

---

## 7. DNS Changes

Explicit approval is required before modifying production DNS, including:

* A / AAAA records;
* CNAME;
* MX;
* TXT records affecting authentication or mail;
* nameservers;
* production subdomain routing;
* load balancer targets;
* CDN/proxy routing.

Before approval, identify:

* current value;
* proposed value;
* TTL;
* expected impact;
* propagation implications;
* rollback value.

---

## 8. Firewall and Network Security Changes

Explicit approval is required before production changes involving:

* firewall rules;
* security groups;
* ingress exposure;
* egress restrictions;
* VPN access rules;
* public port exposure;
* network ACLs;
* reverse-proxy access restrictions.

Security review may be required before approval.

---

## 9. IAM and Privilege Changes

Explicit approval is required before production changes involving:

* administrator privileges;
* cloud IAM roles;
* service-account permissions;
* CI/CD production permissions;
* database privileges;
* privileged API scopes;
* production access grants;
* privilege escalation.

Least privilege MUST be preserved.

---

## 10. Secrets and Credentials

Explicit approval is required before material production actions such as:

* rotating a production signing key;
* replacing production API credentials;
* rotating database credentials with service impact;
* changing production encryption keys;
* revoking credentials that may interrupt service.

Secrets MUST NOT be included in approval requests.

Refer to secret identifiers, not secret values.

---

## 11. Authentication and Authorization Changes

Explicit approval is required before production changes that materially alter:

* authentication mechanisms;
* login behavior;
* MFA requirements;
* session behavior;
* password policy;
* authorization model;
* role permissions;
* tenant-access rules;
* administrative privileges.

Routine implementation of an already approved security design does not require a separate approval at every code edit, but production activation of material security-policy changes does.

---

## 12. Billing and Payments

Explicit approval is required before production changes that may affect real financial transactions, including:

* payment capture;
* refunds;
* subscription charging;
* invoice generation logic;
* pricing;
* tax calculation;
* billing periods;
* credit/debit logic;
* payment-provider production configuration.

Testing against sandbox environments does not constitute production approval.

---

## 13. Production CI/CD Changes

Explicit approval is required before material production pipeline changes involving:

* production deployment permissions;
* automatic production deployment;
* release gates;
* production secrets;
* signing;
* artifact publication;
* branch protections tied to deployment;
* rollback automation with production impact.

Low-risk CI improvements unrelated to production execution may follow normal review governance.

---

## 14. Major Infrastructure Changes

Explicit approval is required before high-impact production infrastructure changes such as:

* deleting infrastructure;
* replacing production compute;
* changing production storage;
* moving production regions;
* changing hosting providers;
* changing production database infrastructure;
* changing load-balancing architecture;
* introducing material downtime;
* changing backup infrastructure;
* changing disaster-recovery topology.

Minor non-disruptive infrastructure maintenance may be governed by normal workflow rules when no mandatory gate applies.

---

## 15. Backup and Recovery Changes

Explicit approval is required before changes that materially reduce or remove existing production recovery capability, including:

* deleting backups;
* reducing retention below approved requirements;
* disabling backups;
* replacing a proven backup mechanism without validated replacement;
* removing disaster-recovery capability.

Creating additional safe backups does not normally require approval unless it introduces security, privacy, or cost impact.

---

## 16. Security Risk Acceptance

Agents MUST NOT silently accept material residual security risk.

When governance permits risk acceptance, explicit approval is required for material High or Critical residual risk.

The approval request MUST include:

* finding ID;
* severity;
* affected asset;
* impact;
* existing controls;
* proposed acceptance rationale;
* compensating controls;
* remediation alternative when available.

Security risk acceptance does NOT eliminate the finding.

It records an authorized decision to proceed with known risk.

---

## 17. Open-Source and Licensing Decisions

Once `OPEN_SOURCE_POLICY.md` exists, it becomes authoritative.

Until then, explicit approval is required before introducing a dependency with material licensing implications such as:

* AGPL;
* strong copyleft affecting distribution or service architecture;
* unknown or ambiguous license;
* commercial restrictions;
* source-availability obligations that may affect the product.

Routine use of clearly compatible permissive dependencies may proceed through normal technical review.

---

## 18. Major Architecture Baseline Changes

For substantial projects, explicit approval is required before adopting material architecture changes such as:

* changing architecture style;
* moving from monolith to microservices;
* changing primary database technology;
* changing tenancy model;
* changing hosting model;
* introducing major vendor lock-in;
* introducing a major external managed platform with material cost or operational impact.

Architecture exploration does not require approval.

Adopting the new architecture baseline does.

---

## 19. Scope and Requirements Baselines

For substantial projects or major features:

explicit approval is required before treating the following as approved baselines:

* Business Requirements Package;
* project scope;
* MVP definition;
* major roadmap baseline;
* architecture baseline;
* detailed database architecture baseline.

Approval may be performed phase by phase.

One approval MUST NOT be interpreted as approval of all later lifecycle phases.

---

## 20. High-Risk Automation

Explicit approval is required before enabling automation that can autonomously perform high-impact production actions, including:

* production deployment;
* data deletion;
* account suspension;
* billing actions;
* firewall modification;
* IAM modification;
* infrastructure deletion;
* destructive remediation.

Automation does not remove governance responsibility.

---

## 21. Bulk Operations

Explicit approval is required before material bulk production operations such as:

* bulk user modification;
* bulk permission changes;
* bulk deletion;
* bulk tenant migration;
* bulk billing action;
* bulk data rewrite.

The approval request SHOULD identify expected scope or count when known.

---

## 22. Third-Party Production Integration Changes

Explicit approval is required before introducing or materially changing production integrations that:

* receive sensitive data;
* gain privileged access;
* affect billing;
* affect identity;
* affect critical operations;
* create material vendor dependency.

Routine low-impact integration configuration may follow normal workflow governance.

---

## 23. User Communication Before Approval

Approval requests MUST be concise but complete.

Use this structure when applicable:

### Proposed Action

What will be changed?

### Target

Which environment, service, data set, or system is affected?

### Reason

Why is the action required?

### Risk

What can go wrong?

### Recovery

How can the change be rolled back or recovered?

### Verification

How will success be confirmed?

### Approval Requested

State exactly what authorization is needed.

---

## 24. Approval State

Use explicit approval states:

* `NOT_REQUIRED`
* `PENDING`
* `APPROVED`
* `REJECTED`
* `EXPIRED`
* `SUPERSEDED`

Do not represent `PENDING` as implicit approval.

If the proposed operation materially changes after approval, the approval MAY become `SUPERSEDED` and require a new request.

---

## 25. Approval Recording

For significant project work, record:

* approval scope;
* approver;
* date/time when available;
* affected phase or operation;
* relevant artifact/version;
* material conditions.

Do NOT record secret values.

---

## 26. Emergency Situations

Emergency context does NOT automatically eliminate approval requirements.

If immediate action is necessary to prevent ongoing severe damage and the authorized user has explicitly delegated emergency authority, follow the applicable emergency procedure.

Without such authority:

escalate and request approval.

Do not invent emergency authorization.

---

## 27. Rejected Approval

If approval is rejected:

* do not perform the gated action;
* record the rejection;
* preserve current safe state where possible;
* provide alternative options when appropriate.

Do not repeatedly request the same approval without material new information.

---

## 28. Changed Scope After Approval

If execution scope materially changes after approval:

STOP.

Explain the change.

Determine whether the existing approval still applies.

When uncertain, request new approval.

---

## 29. Agent Responsibilities

### Orchestrator

Identifies approval gates, requests approval, records approval state, and blocks unauthorized lifecycle progression.

### Specialist Agents

Identify approval-sensitive actions within their domains and notify the Orchestrator.

### Implementation Agents

MUST NOT bypass a gate because implementation is technically ready.

### Reviewer, QA, and Security

Provide evidence and findings.

They do NOT substitute for required user authorization.

---

## 30. Workflow Responsibilities

High-risk workflows MUST explicitly identify:

* approval gates;
* execution boundary;
* rollback/recovery requirements;
* verification requirements.

A workflow MUST NOT hide a gated action inside an apparently routine step.

---

## 31. Completion Criteria

An approval-gated action may proceed only when:

* the proposed operation is clearly identified;
* affected scope is understood;
* material risks are disclosed;
* rollback or recovery is defined when applicable;
* required prerequisite reviews are complete;
* approval state is `APPROVED`;
* the actual execution remains within approved scope.

If any of these conditions materially changes, stop and reassess approval.
