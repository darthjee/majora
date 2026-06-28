# Plan: Add photo upload request handler

Issue: [164-photo-upload-request-handler.md](../issues/164-photo-upload-request-handler.md)

## Overview

Set up the Tent 0.8.0 extension mechanism in the proxy layer, migrate the existing
`TestHeaderMiddleware` into it, and add a custom `PhotoUploadHandler` that handles
`PATCH /uploads/:id/submit`. The handler validates the uploaded image, calls the backend
upload-finalize endpoint twice (to signal `uploading` then `uploaded`), and writes the
file to the shared photos volume.

Two agents are involved: `proxy` creates all PHP extension code, and `infra` updates
`docker-compose.yml` to mount the extension directory and adjust the test service.

## Agents involved

- [proxy](proxy.md)
- [infra](infra.md)

## Shared contracts

**Volume mount** — `infra` adds `./proxy/extension:/var/www/html/extension` to both the
`majora_proxy` and `proxy_tests` services in `docker-compose.yml`. `proxy` writes its
extension code under `proxy/extension/`, relying on this mount to be present.

**Test service command** — `proxy_tests` changes its `command` from
`vendor/bin/phpunit custom/tests` to `vendor/bin/phpunit extension/tests`.
The `./proxy/custom:/var/www/html/custom` volume is removed from `proxy_tests` once
all code has been moved out of `proxy/custom/`.

**Loader path** — Tent 0.8.0 auto-loads `/var/www/html/extension/loader.php` at startup.
`proxy` creates `proxy/extension/loader.php`; `infra` ensures the volume is mounted so
Tent can find it.

**Backend endpoint** — the handler calls `PATCH /uploads/:id.json` on the backend (at
`http://backend:8080`) with `status=uploading` (receives `{"file_path": "..."}`) and then
`status=uploaded`. Both requests forward the client's `Authorization` and `X-Upload-Token`
headers. No backend changes are needed.

**File destination** — uploaded files are written to `/var/www/html/photos/<file_path>`
inside the container, which corresponds to `./docker_volumes/photos/` on the host (already
mounted).
