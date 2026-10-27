---
name: backend/rust
---

# Rust Backend

> Core guidance for high-performance, memory-safe Rust backend and systems services.

## Use When

- Building Rust backend or systems services.
- Designing async Rust services.
- Reviewing ownership, error handling, or runtime behavior.

## Do Not Use For

- Frontend Rust usage unrelated to backend or systems code.
- Tauri-specific application architecture when `native/tauri` is the better fit.
- General backend design independent of Rust.

## Core Rules

- **Ownership**: Use Rust ownership and borrowing deliberately; avoid unnecessary cloning when borrowing or ownership transfer is clearer.
- **Error Handling**: Use `Result` and `Option` for recoverable conditions; avoid `unwrap()` and `panic!` in production request-processing paths.
- **Async Safety**: Do not block async runtimes with blocking or CPU-heavy work; isolate such work using appropriate blocking executors or worker mechanisms.
- **Restricted Visibility**: Keep module and item visibility as narrow as practical.

## References

- `references/cargo-workflows.md`
- `references/rust-async-patterns.md`
- `references/rust-best-practices.md`
- `references/rust-pro.md`
- `references/rust-profiling.md`
- `references/rust-security.md`
- `references/systems-programming-rust-project.md`

Load only the references relevant to the current task.

## Boundaries

- This skill covers Rust implementation guidance.
- Security-critical Rust design may require Security review.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
