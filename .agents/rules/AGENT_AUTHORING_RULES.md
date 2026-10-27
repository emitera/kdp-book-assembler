# Agent Authoring Rules

## Purpose

This document defines the canonical structure, responsibility boundaries, resource-loading rules, and governance requirements for all agents in the Antigravity Hub.

All agent definitions MUST comply with this standard.

This standard operates under the global governance and precedence model defined in:

`rules/GLOBAL_AGENT_RULES.md`

If an agent-authoring rule appears to conflict with another mandatory Hub policy, apply the authority and precedence rules defined there.

---

## 1. Canonical Agent Structure

Every agent file MUST use the following section order:

### Role

Defines who the agent is and the boundaries of its authority.

### Primary Objectives

Defines the outcomes the agent is responsible for achieving.

### Must Use

Defines resources that MUST be loaded or consulted whenever the agent performs its role.

Only genuinely mandatory resources belong here.

Do not place task-specific workflows in this section unless they are required for every invocation of the agent.

### Conditional Workflows

Defines workflows that MUST be used when their applicability conditions are met.

Each entry MUST specify:

* workflow path or registered workflow ID;
* when to use it;
* when not to use it.

### Inputs

Defines the information and approved artifacts required before the agent can perform its responsibilities.

If mandatory input is missing, the agent MUST stop, request the missing information, or return the task to the responsible upstream agent.

### Responsibilities

Defines what the agent owns.

Responsibilities MUST NOT overlap with another agent's ownership unless the relationship is explicitly defined as review, consultation, or approval.

### Deliverables

Defines concrete artifacts produced by the agent.

Deliverables SHOULD be suitable for handoff to another agent without requiring reconstruction of hidden context.

### Restrictions

Defines actions and decisions outside the agent's authority.

The agent MUST NOT silently assume responsibilities assigned to another agent.

### Handoff

Defines:

* target agent or agents;
* artifacts transferred;
* unresolved questions;
* known risks;
* decisions already made;
* approval state.

### Approval Requirements

Defines actions or decisions requiring explicit user approval or another mandatory governance gate.

Agents MUST NOT interpret silence as approval.

### Success Criteria

Defines objective conditions that must be satisfied before the agent may report its work as complete.

---

## 2. Resource Loading

Agents MUST follow this hierarchy:

1. Global rules.
2. Applicable specialized rules.
3. Agent registry.
4. Workflow registry.
5. Skills registry.
6. Agent-specific mandatory resources.
7. Conditional workflows and skills required by the current task.

Agents MUST NOT load every workflow or every skill by default.

Use the minimum relevant context required for the task.

---

## 3. Must Use vs Conditional Workflows

### Must Use

Use for resources required on every invocation of the agent.

Examples:

* global governance rules;
* relevant registries;
* mandatory role-specific policies.

### Conditional Workflows

Use for operational procedures triggered by a particular task.

Example:

A Database Architect MAY use the database migration workflow when modifying an existing database.

A Database Architect MUST NOT load the database migration workflow merely to create a conceptual data model for a new project.

---

## 4. Responsibility Ownership

Every significant responsibility MUST have one primary owner.

Other agents MAY:

* provide input;
* review;
* validate;
* implement an approved design;
* escalate concerns.

They MUST NOT silently take ownership.

Examples:

* Business Analyst owns business requirements.
* Project Manager owns project planning and delivery structure.
* Software Architect owns system architecture.
* Database Architect owns detailed data and database architecture.
* Security Agent owns security assessment and security controls review.
* Backend Agent owns backend implementation.
* Frontend Agent owns frontend implementation.
* QA Agent owns verification against requirements and test evidence.
* Reviewer Agent owns independent technical review.
* DevOps Agent owns deployment and operational implementation.
* Technical Writer owns maintained project and operational documentation.
* Orchestrator owns coordination, routing, lifecycle state, and governance enforcement.

---

## 5. Separation of Coordination and Execution

The Orchestrator MUST NOT perform specialist work merely because it coordinates specialist agents.

The Project Manager MUST NOT act as the Orchestrator.

Review agents MUST NOT approve their own implementation work.

Implementation agents MUST NOT redefine approved architecture, requirements, or data models without escalation.

---

## 6. Handoff Contract

Every inter-agent handoff SHOULD contain:

* Current lifecycle phase
* Source agent
* Target agent
* Completed artifacts
* Key decisions
* Assumptions
* Open questions
* Known risks
* Blocking issues
* Approval status
* Recommended next action

The receiving agent MUST validate required inputs before starting work.

---

## 7. Approval Semantics

Approval MUST be explicit when required by governance rules.

The following are NOT approval:

* no response;
* task continuation by assumption;
* previous approval of a different phase;
* successful automated tests;
* approval by the agent that created the change.

When an approval gate is reached, execution MUST stop until the required approval exists.

---

## 8. Escalation

An agent MUST escalate when:

* required information is missing;
* requirements conflict;
* an action exceeds its authority;
* a security or privacy risk is discovered;
* architecture must materially change;
* data integrity may be affected;
* production systems may be affected;
* another agent's approved artifact must be changed.

Escalation MUST identify:

* the problem;
* affected artifact or decision;
* responsible owner;
* impact;
* recommended resolution.

---

## 9. No Hidden Assumptions

Agents MUST distinguish between:

* confirmed facts;
* approved decisions;
* assumptions;
* recommendations;
* unresolved questions.

Material assumptions MUST NOT be silently converted into requirements or architecture decisions.

---

## 10. Completion

An agent MUST NOT report a phase as complete merely because it produced text or code.

Completion requires:

* required inputs were available;
* responsibilities were performed;
* required deliverables exist;
* applicable validation was completed;
* blocking issues are resolved or explicitly escalated;
* required approvals exist;
* handoff information is complete.

---

## 11. Naming

Agent filenames use:

`<role>.agent.md`

Canonical examples:

* `orchestrator.agent.md`
* `business.analyst.agent.md`
* `project.manager.agent.md`
* `architect.agent.md`
* `database.architect.agent.md`
* `security.agent.md`
* `backend.agent.md`
* `frontend.agent.md`
* `qa.agent.md`
* `reviewer.agent.md`
* `devops.agent.md`
* `technical.writer.agent.md`

Registry IDs MUST remain stable even if the human-readable role name changes.

---

## 12. Governance

Changes to agent responsibilities MUST be checked for conflicts with:

* other agents;
* workflows;
* registries;
* global rules;
* approval rules;
* lifecycle rules.

An agent definition MUST NOT be considered complete until its registry entry and workflow relationships are consistent with the rest of the Hub.
