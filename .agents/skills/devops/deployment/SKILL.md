---
name: devops/deployment
---

# VPS Deployment & Reverse Proxy

> Core guidance for Linux VPS deployment, reverse proxying, process management, TLS termination, and operational hardening.

## Use When

- Deploying applications to Linux VPS infrastructure.
- Configuring reverse proxy behavior such as Nginx.
- Managing Node.js services with PM2 when PM2 is part of the chosen deployment architecture.

## Do Not Use For

- Container orchestration architecture.
- Cloud-platform deployment unrelated to VPS patterns.
- Production deployment without applicable workflow and approval.

## Core Rules

- **Reverse Proxy**: Use a dedicated reverse proxy such as Nginx when the deployment architecture requires TLS termination, routing, buffering, or edge controls.
- **Process Management**: Use an appropriate supervised process manager for long-running services; PM2 is suitable for Node.js deployments when chosen deliberately.
- **Availability**: Design deployment and restart behavior according to actual availability requirements.
- **Security**: Apply appropriate TLS, headers, access restrictions, patching, logging, and host hardening rather than relying on one tool as a complete security layer.

## References

- `references/pm2-nginx-vps.md`

Load only the references relevant to the current task.

## Boundaries

- This skill provides VPS deployment techniques.
- Actual production execution remains governed by `infra.deploy`, `release.engine`, and approval policy.
- This skill does not override agent ownership, workflows, Hub rules, or approval governance.
