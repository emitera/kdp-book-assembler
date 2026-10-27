---
name: devops/ci-cd
---

# CI/CD

> Core guidance for CI/CD validation, testing, build pipelines, delivery stages, secrets, and automation boundaries.

## Use When

- Designing CI/CD pipelines.
- Configuring automated lint, test, build, or delivery stages.
- Reviewing GitHub Actions or comparable CI behavior.

## Do Not Use For

- Production deployment authorization.
- Application release governance.
- General infrastructure architecture.

## Core Rules

- **Automated Checks**: Run appropriate static checks and automated tests at meaningful integration points such as pull requests.
- **Parallelism**: Parallelize independent jobs when it improves feedback time without compromising isolation.
- **Secrets Management**: Never hardcode secrets; inject them through protected platform secrets, OIDC, or an approved secret manager.
- **Production Boundary**: CI success does not itself authorize production execution.

## References

- `references/bash-defensive-patterns.md`

Load only the references relevant to the current task.

## Boundaries

- CI/CD guidance does not authorize production execution.
- Production release and deployment remain governed by `release.engine`, `infra.deploy`, and approval policy.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
