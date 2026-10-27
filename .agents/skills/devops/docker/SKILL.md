---
name: devops/docker
---

# Docker & Containers

> Core guidance for Dockerfiles, container images, Docker Compose, build efficiency, and container security.

## Use When

- Writing or reviewing Dockerfiles.
- Building application containers.
- Using Docker Compose for local service orchestration.

## Do Not Use For

- Kubernetes architecture.
- General VM deployment.
- Production deployment authorization.

## Core Rules

- **Purpose-Built Images**: Prefer small, maintainable base images appropriate to the workload; do not choose Alpine or distroless blindly.
- **Layer Efficiency**: Structure Dockerfiles to maximize deterministic caching and minimize unnecessary rebuilds.
- **Non-Root by Default**: Run application containers as a non-root user whenever the workload supports it; document and minimize justified root requirements.
- **Compose Scope**: Use Docker Compose where it is an appropriate local or controlled multi-service orchestration mechanism.

## References

- `references/docker-node-alpine.md`

Load only the references relevant to the current task.

## Boundaries

- This skill covers container implementation guidance.
- Production rollout and infrastructure architecture remain governed separately.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
