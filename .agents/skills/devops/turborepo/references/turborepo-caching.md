# Turborepo Caching Strategy

1. **Exact Inputs**: Define exact inputs in `turbo.json` (e.g. `^production` dependencies, `src/**`, `tsconfig.json`).
2. **Environment Variables**: Declare all build-time environment variables in `env` array. If you miss one, caching will break across environments.
3. **Output Artifacts**: Explicitly specify output folders (`dist/**`, `.next/**`).
4. **Pruning**: Use `turbo prune --scope=<app>` before building Docker images.
