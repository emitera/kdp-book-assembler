---
name: devops/turborepo
---

# Turborepo & Monorepo

> Core guidance for Turborepo task graphs, caching, package boundaries, pruning, and monorepo build behavior.

## Use When

- Using Turborepo in a monorepo.
- Designing task inputs, outputs, and caching.
- Optimizing monorepo builds.

## Do Not Use For

- General repository architecture when Turborepo is not used.
- Application domain architecture.
- Package-manager questions unrelated to monorepo orchestration.

## Core Rules

- **Explicit Task Graph**: Define task dependencies, inputs, and outputs sufficiently for correct caching and execution.
- **Package Boundaries**: Prefer explicit workspace/package boundaries for shared code; avoid cross-package relative imports that bypass declared package interfaces.
- **Pruning**: Use `turbo prune` when it materially improves deployment or container build scope.

## References

- `references/turborepo-caching.md`
- `references/turborepo.md`

Load only the references relevant to the current task.

## Boundaries

- This skill is Turborepo-specific.
- Overall monorepo architecture remains governed by `monorepo.toolkit` and the Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
