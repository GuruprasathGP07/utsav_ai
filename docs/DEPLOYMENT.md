# Deployment Guide — UtsavAI

## Overview

UtsavAI packages both the Express 4 backend and the Vite-built React single-page application into a single deployable container for **Google Cloud Run**.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `8080` | Port for the HTTP server |
| `NODE_ENV` | Optional | `production` | Node environment |
| `GEMINI_API_KEY` | Optional | `""` | Google Gemini API key. If unset, app operates in deterministic Demo Mode |
| `ALLOWED_ORIGINS` | Optional | `http://localhost:5173,http://localhost:8080` | Comma-delimited list of permitted CORS/Same-origin origins |

---

## Docker Deployment

Build and run locally:

```bash
# Build Docker image
docker build -t utsavai .

# Run container on port 8080
docker run -p 8080:8080 -e GEMINI_API_KEY="your-api-key" utsavai
```

---

## Google Cloud Run Deployment

Deploy directly using Google Cloud SDK:

```bash
# Submit build to Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Deploy to Cloud Run
gcloud run deploy utsavai \
  --image gcr.io/$PROJECT_ID/utsavai:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,ALLOWED_ORIGINS=https://utsavai.app"
```

