---
name: testing/e2e
---

# E2E Testing (Playwright)

> Core guidance for Playwright end-to-end browser testing, resilient locators, assertions, isolation, and user-visible workflows.

## Use When

- Writing Playwright end-to-end tests.
- Testing browser-visible user workflows.
- Designing resilient browser locators and E2E test isolation.

## Do Not Use For

- Unit testing.
- Backend-only integration testing without browser behavior.
- Manual QA planning.

## Core Rules

- **User-Oriented Locators**: Prefer roles, accessible names, visible text, and stable test identifiers over implementation-specific CSS selectors.
- **Web-First Assertions**: Prefer assertions that understand asynchronous browser state and retry appropriately.
- **Isolation**: Design tests so they do not depend on uncontrolled state from other tests.
- **Parallelism**: Enable parallel execution only where test isolation and environment capacity support it.

## References

- `references/playwright-best-practices.md`

Load only the references relevant to the current task.

## Boundaries

- This skill provides E2E test implementation guidance.
- QA ownership remains with the QA Agent and `qa.orchestrator`.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
