# Shared Volume: Frontend Build Output

`docker_volumes/static/` is mounted into both `majora_fe` and `majora_proxy`:

- In `majora_fe`: mounted as `/home/node/app/dist` — Vite's `outDir`, so `npm run build` writes here.
- In `majora_proxy`: mounted into `/var/www/html/static/` — Tent serves these files directly.

This makes a frontend build immediately available to Tent without any copying step.
