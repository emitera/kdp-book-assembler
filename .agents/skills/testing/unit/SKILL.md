---
name: testing/unit
---

# Unit Testing (Vitest/Jest)

> Core guidance for isolated unit testing, test structure, mocking boundaries, and fast deterministic feedback.

## Use When

- Writing unit tests with Vitest or Jest.
- Testing isolated business logic.
- Designing mocks around external boundaries.

## Do Not Use For

- Browser E2E testing.
- Production acceptance testing.
- Testing real external infrastructure.

## Core Rules

- **Clear Structure**: Use a consistent structure such as Arrange–Act–Assert when it improves readability.
- **Mock at Boundaries**: Mock or fake external dependencies while testing real domain behavior.
- **Fast and Deterministic**: Unit tests should avoid real network, external APIs, and uncontrolled infrastructure dependencies.

## References

- `references/test-driven-development.md`
- `references/vitest.md`

Load only the references relevant to the current task.

## Boundaries

- This skill covers unit-test implementation guidance.
- Passing unit tests does not replace independent QA.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
