---
name: frontend/tailwind
---

# Tailwind CSS

> Core guidance for Tailwind-based styling, responsive utilities, themes, class composition, and maintainable utility-first CSS.

## Use When

- Styling applications with Tailwind CSS.
- Designing Tailwind-based responsive behavior.
- Managing Tailwind theme and utility composition.

## Do Not Use For

- General UI/UX design decisions.
- CSS architectures that do not use Tailwind.
- Design-system governance beyond Tailwind implementation.

## Core Rules

- **Utility-First**: Prefer utility-first styling; use custom CSS when it improves correctness, maintainability, or behavior not cleanly expressed with utilities.
- **Themes**: Use coherent design tokens and CSS variables where they improve theming and consistency.
- **Responsive Styling**: Apply responsive utilities according to actual breakpoints and content needs.
- **Class Composition**: Use `clsx`/`cn` and `twMerge` when dynamically composing potentially conflicting Tailwind classes.

## References

- `references/shadcn.md`
- `references/tailwind-css-patterns.md`
- `references/tailwind-v4-shadcn.md`

Load only the references relevant to the current task.

## Boundaries

- This skill provides Tailwind-specific implementation guidance.
- It does not replace `design/ui` or `design.system.audit`.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
