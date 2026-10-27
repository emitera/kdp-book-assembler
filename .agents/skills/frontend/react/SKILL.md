---
name: frontend/react
---

# React

> Core guidance for React applications, component design, hooks, state colocation, server state, and Vite-based SPA patterns.

## Use When

- Building React SPA applications.
- Using React Query, Zustand, Vite, or React component patterns.
- Reviewing React state and component architecture.

## Do Not Use For

- Next.js-specific behavior when `frontend/nextjs` is the better fit.
- General UI design independent of React.
- Backend TypeScript implementation.

## Core Rules

- **Hooks Rules**: Follow the Rules of Hooks; treat dependency management deliberately and use linting as a correctness aid.
- **State Colocation**: Keep state as close to its consumers as practical and avoid unnecessary global state.
- **Component Boundaries**: Build cohesive components with clear responsibilities rather than forcing total self-containment.
- **Server vs Client State**: Keep remote/server state concerns distinct from local UI state.

## References

- `references/frontend-design.md`
- `references/react-best-practices.md`
- `references/react-component-performance.md`
- `references/react-query.md`
- `references/react-ui-patterns.md`
- `references/server-cache-react.md`
- `references/typescript-expert.md`
- `references/vite.md`
- `references/zustand-store-ts.md`

Load only the references relevant to the current task.

## Boundaries

- This skill covers React implementation patterns.
- Design-system and product architecture remain separate responsibilities.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
