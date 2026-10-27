---
name: devops/firebase
description: Deploying full-stack web applications (Next.js SSR, Angular), static SPAs, microservices, and preview channels using Firebase App Hosting, Firebase Hosting, and Cloud Firestore.
---

# Firebase Full-Stack Hosting & Cloud Playbook

This skill guides the DevOps Engineer in deploying applications to Google's Firebase infrastructure with automated CI/CD and production scaling.

---

## 1. Firebase App Hosting (Modern Next.js SSR)

**Firebase App Hosting** is Google's next-generation serverless platform built specifically for full-stack frameworks (Next.js App Router, Angular).

### 1.1. Configuration (`apphosting.yaml`)
Create `apphosting.yaml` in the root of the repository:

```yaml
# apphosting.yaml
runConfig:
  minInstances: 0 # Scales to zero when idle to minimize costs
  maxInstances: 50
  concurrency: 80
  cpu: 1
  memoryMiB: 1024

env:
  - variable: NODE_ENV
    value: production
  - variable: NEXT_PUBLIC_API_URL
    value: https://api.myplatform.com
  # Secure secret injected from Google Secret Manager:
  - variable: DATABASE_URL
    secret: my-prod-database-url
```

### 1.2. Automated GitHub CI/CD Deployment
App Hosting connects directly to your GitHub repository:
- Push to `main` branch automatically triggers a Cloud Build and atomic live rollout.
- Pull Requests automatically generate isolated **Preview URLs** for QA testing before merge.

---

## 2. Classic Firebase Hosting (Static Sites, SPAs & Edge Rewrites)

For pure client-side SPAs (Vite, React, static landing pages) or microservice reverse-proxies:

### 2.1. Configuration (`firebase.json`)
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          }
        ]
      }
    ]
  }
}
```

### 2.2. Deployment Commands
```bash
# Preview deployment (temporary isolated channel)
firebase hosting:channel:deploy pr-preview-12

# Production deployment
firebase deploy --only hosting
```

---

## 3. Firestore Security Rules Auditing & Deployment

When using Firestore, ensure the rules are tested and deployed alongside the code:
```bash
# Validate rules locally before deployment
firebase emulators:exec --only firestore "npm test"

# Deploy updated security rules
firebase deploy --only firestore:rules
```
