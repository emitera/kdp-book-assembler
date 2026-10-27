---
name: frontend/nextjs
---

# Next.js

> Core guidance for Next.js applications, App Router, React Server Components, caching, assets, and metadata.

## Use When

- Building Next.js applications.
- Using App Router and Server Components.
- Working with Next.js caching, metadata, or asset optimization.

## Do Not Use For

- Generic React SPA implementation where Next.js is not used.
- Backend architecture unrelated to Next.js server features.
- General UI design.

## Core Rules

- **Server/Client Boundaries**: Prefer Server Components where they fit the requirement and keep client boundaries deliberate.
- **Caching**: Understand and explicitly control current Next.js route, fetch, and data caching behavior.
- **Asset Optimization**: Prefer Next.js image and font optimization when compatible with the delivery model; use alternatives deliberately when requirements justify them.
- **Metadata**: Provide appropriate metadata for public routes and content where discoverability or sharing requires it.

## References

- `references/next-best-practices.md`
- `references/next-cache-components.md`
- `references/nextjs15-react19-vercelai-tailwind.md`
- `references/nextjs_optimization_guide.md`

Load only the references relevant to the current task.

## Boundaries

- This skill provides Next.js-specific implementation guidance.
- Product and system architecture remain owned by the Architect.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
