## Running Locally

```bash
# Start the full stack (proxy + backend + frontend dev server), with host ports

make dev-up

# Frontend tests

cd frontend && yarn test

# Frontend lint

cd frontend && yarn lint
```

The Vite dev server runs on port 8080 inside the container (`majora_fe`), exposed on the host at
`127.0.0.1:3010` only when started via `make dev-up` (the opt-in `docker-compose.ports.yml`); a
plain `docker-compose up majora_fe` publishes no host port.
When `FRONTEND_DEV_MODE=true` in `.env`, the Tent proxy (port 3000) forwards all front-end
requests to the Vite dev server with HMR enabled.
