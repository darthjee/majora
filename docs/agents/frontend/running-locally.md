## Running Locally

```bash
# Start the full stack (proxy + backend + frontend dev server)

make dev-up

# Frontend tests

cd frontend && yarn test

# Frontend lint

cd frontend && yarn lint
```

The Vite dev server runs on port 8080 inside the container (`majora_fe`), exposed at port 3010.
When `FRONTEND_DEV_MODE=true` in `.env`, the Tent proxy (port 3000) forwards all front-end
requests to the Vite dev server with HMR enabled.

