# ITCA V1.3 .NET API Deployment Notes

This note covers the first deployment phase only: make `backend/Itca.Api` deployable online and callable from Vercel Preview. It does not migrate business flows, database schema, Storage, payment, PDF, notifications, users, certificate issuance, or certificate verification tokens.

## Runtime

- Project: `backend/Itca.Api`
- Framework: `.NET 10`
- Local URL: `http://localhost:5001`
- Health check: `GET /api/health`
- Dockerfile: `backend/Itca.Api/Dockerfile`

Build from the repository root:

```bash
docker build -f backend/Itca.Api/Dockerfile -t itca-api .
```

Run locally with an explicit container port:

```bash
docker run --rm -p 5001:8080 -e PORT=8080 itca-api
```

## Required Environment Variables

Set these in the API hosting platform:

```env
ITCA_SUPABASE_DB_CONNECTION_STRING=...
ITCA_ADMIN_API_TOKEN=...
ITCA_ALLOWED_ORIGINS=https://your-vercel-preview-url.vercel.app,https://your-production-domain
```

`PORT` is read when the hosting platform provides it. If `PORT` is absent, local `launchSettings.json` keeps `dotnet run --project backend/Itca.Api` on `http://localhost:5001`.

For Vercel, set this in the Preview environment:

```env
NEXT_PUBLIC_ITCA_API_BASE_URL=https://your-api-host
```

## CORS

`ITCA_ALLOWED_ORIGINS` is a comma-separated allowlist. Use exact origins when possible:

```env
ITCA_ALLOWED_ORIGINS=https://itca-web-git-branch-team.vercel.app,https://www.example.org
```

For short-lived Vercel Preview checks, wildcard origins are supported with a single `*`:

```env
ITCA_ALLOWED_ORIGINS=https://*.vercel.app
```

Use wildcard Preview access only during deployment validation. Keep production origins explicit.

## Health Check

The health endpoint returns non-sensitive process status only:

```json
{
  "status": "ok",
  "service": "ITCA API",
  "environment": "Production",
  "utcTime": "2026-05-27T00:00:00+00:00"
}
```

It does not verify database connectivity. Database validation should be done with a controlled API request after `ITCA_SUPABASE_DB_CONNECTION_STRING` is configured.

## Platform Notes

### Azure App Service

Use Azure App Service for Container if the first phase should stay close to Microsoft hosting and built-in App Service health checks. Manual setup:

- Create an Azure App Service Linux container app.
- Build and publish the image to a registry, or connect App Service to the repository with the Dockerfile path.
- Configure `ITCA_SUPABASE_DB_CONNECTION_STRING`, `ITCA_ADMIN_API_TOKEN`, and `ITCA_ALLOWED_ORIGINS`.
- Set the health check path to `/api/health`.
- Confirm the public API URL, then set Vercel Preview `NEXT_PUBLIC_ITCA_API_BASE_URL` to that URL.

### Render

Use Render Web Service with Docker when the priority is a simple Preview-stage deployment. Manual setup:

- Create a Web Service from the Git repository.
- Use Docker runtime.
- Set Dockerfile path to `backend/Itca.Api/Dockerfile`.
- Use repository root as the Docker build context.
- Configure `ITCA_SUPABASE_DB_CONNECTION_STRING`, `ITCA_ADMIN_API_TOKEN`, and `ITCA_ALLOWED_ORIGINS`.
- Confirm `/api/health`, then set Vercel Preview `NEXT_PUBLIC_ITCA_API_BASE_URL`.

### Railway

Use Railway with Docker when fast disposable environments matter. Manual setup:

- Create a Railway service from the Git repository.
- Configure Dockerfile path as `backend/Itca.Api/Dockerfile`.
- Configure `ITCA_SUPABASE_DB_CONNECTION_STRING`, `ITCA_ADMIN_API_TOKEN`, and `ITCA_ALLOWED_ORIGINS`.
- Confirm Railway exposes the service on its generated public domain.
- Confirm `/api/health`, then set Vercel Preview `NEXT_PUBLIC_ITCA_API_BASE_URL`.

## Recommended First Phase Choice

For V1.3 first-phase validation, Render or Railway with Docker is the lowest-friction path because the repository now owns the API runtime through Docker. Azure App Service is a good production-leaning option, but it usually requires more Azure setup and registry decisions before the first Preview validation.

Recommended sequence:

1. Deploy the Dockerized API to Render or Railway.
2. Set API environment variables.
3. Open `/api/health` on the generated API domain.
4. Add that API domain to Vercel Preview as `NEXT_PUBLIC_ITCA_API_BASE_URL`.
5. Add the Vercel Preview origin to `ITCA_ALLOWED_ORIGINS`.
6. Redeploy Vercel Preview and verify browser requests call the online .NET API.
