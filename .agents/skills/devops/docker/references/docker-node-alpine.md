# Docker Node Alpine Base

1. **Alpine Over Debian**: Use `node:alpine` for minimal image size.
2. **Multi-Stage Builds**: Compile TS/Vite in a builder stage, copy only `dist/` and production `node_modules` to the runner stage.
3. **Non-Root User**: Always run `USER node` at the end of the Dockerfile.
4. **Layer Caching**: Copy `package.json` and lockfile, run `install`, then copy the rest of the code.
