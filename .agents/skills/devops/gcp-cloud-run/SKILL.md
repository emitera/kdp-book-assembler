---
name: devops/gcp-cloud-run
description: Containerized serverless deployment of web platforms (Next.js, FastAPI, Go, Node.js) on Google Cloud Run with Artifact Registry, Cloud Storage CDN, Secret Manager, and Cloud Armor WAF.
---

# Google Cloud Run Web Deployment & Architecture Playbook

This skill guides the DevOps Engineer in packaging containerized web applications and deploying them to Google Cloud Run with automated scaling, custom domains, and enterprise-grade security.

---

## 1. Multi-Stage Production Dockerfile (Next.js Standalone)

In Next.js, enable `output: 'standalone'` in `next.config.js` to create minimal Docker images (<120MB):

```dockerfile
# 1. Dependency installation stage
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 3. Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Non-root security user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
```

---

## 2. Cloud Run Deployment Pipeline

### 2.1. Build & Push to Artifact Registry
```bash
# Authenticate and set project
gcloud config set project MY_GCP_PROJECT_ID

# Build container via Google Cloud Build (no local Docker required)
gcloud builds submit --tag europe-west1-docker.pkg.dev/MY_PROJECT/my-repo/web-app:latest
```

### 2.2. Deploy to Cloud Run
```bash
gcloud run deploy web-app \
  --image europe-west1-docker.pkg.dev/MY_PROJECT/my-repo/web-app:latest \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 20 \
  --cpu 1 \
  --memory 1Gi \
  --concurrency 80 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=my-db-secret:latest,JWT_SECRET=jwt-secret:latest
```

---

## 3. Google Secret Manager Integration

Never store credentials, API keys, or database connection strings in environment files:
```bash
# Create secret in Secret Manager
echo -n "postgresql://user:pass@host:5432/dbname" | \
  gcloud secrets create my-db-secret --data-file=-

# Grant Cloud Run service account permission to read the secret
gcloud secrets add-iam-policy-binding my-db-secret \
  --member="serviceAccount:MY_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Storage for Static CDN Assets

For large files (video lessons, student attachments):
1. Create a Google Cloud Storage bucket with uniform bucket-level access.
2. Connect the bucket to **Cloud CDN** to cache media globally across Google's edge POPs.
3. Use Signed URLs (`storage.getSignedUrl`) for time-limited, authenticated student access to paid course videos.

---

## 5. Google Cloud Armor (DDoS & WAF Protection)

Protect your Cloud Run endpoints from automated attacks and credential stuffing:
- Apply rate limiting (e.g., maximum 100 requests per minute per IP on `/api/auth/*`).
- Filter SQL injection and cross-site scripting (XSS) at the load balancer using preconfigured Cloud Armor rules.
