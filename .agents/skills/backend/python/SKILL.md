---
name: backend/python
---

# Python Backend

> Core guidance for Python backend services, especially FastAPI, Pydantic, validation, and maintainable service patterns.

## Use When

- Building Python backend services.
- Using FastAPI, Pydantic, or Python service patterns.
- Implementing Python validation or API logic.

## Do Not Use For

- Node.js or Rust backend implementation.
- General Python scripting unrelated to backend services.
- Database architecture ownership.

## Core Rules

- **Typed Validation**: Use Pydantic or equivalent typed validation at external boundaries where appropriate.
- **Explicit Contracts**: Keep request, response, configuration, and domain contracts explicit.
- **Reference-Driven**: Load only the relevant Python/FastAPI/Pydantic references for the current task.

## References

- `references/fastapi-python.md`
- `references/pydantic.md`
- `references/python-patterns.md`

Load only the references relevant to the current task.

## Boundaries

- This skill provides Python backend implementation guidance.
- Architecture, data architecture, and production operations remain governed separately.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
