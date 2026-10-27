---
name: backend/nodejs
---

# Node.js & TypeScript Backend

> Core guidance for TypeScript and Node.js backend services, including Express, Fastify, NestJS, validation, service boundaries, and error handling.

## Use When

- Building Node.js or TypeScript backend services.
- Designing controllers, services, DTO validation, or backend error handling.
- Working with Express, Fastify, or NestJS.

## Do Not Use For

- Frontend TypeScript implementation.
- Database architecture ownership.
- Python or Rust backend implementation.

## Core Rules

- **Strict TypeScript**: Enable strict type checking and avoid `any` unless a constrained interoperability boundary genuinely requires it.
- **Service Layer**: Keep domain/business logic out of transport controllers.
- **Validation**: Validate external input before business processing using an appropriate schema or DTO validation mechanism.
- **Error Handling**: Centralize error handling and never expose stack traces or internal error details to external clients in production.

## References

- `references/nestjs-best-practices.md`
- `references/nodejs-backend-patterns.md`
- `references/nodejs-best-practices.md`

Load only the references relevant to the current task.

## Boundaries

- Backend implementation guidance does not transfer architecture or database ownership.
- Persistent schema changes remain governed by database workflows and the Database Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
