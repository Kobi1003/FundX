# Uploads root — local testing storage

Demo fixtures (committed):
- `demo_cvs/` — sample investor CVs
- `demo_docs/` — sample startup incorporation text

Runtime uploads (gitignored):
- `investors/<investor_id>/` — uploaded CVs
- `startups/<startup_id>/` — incorporation / pitch docs

Docker bind-mounts this folder to `/app/uploads` in investor-service,
startup-service, and ai-service.
