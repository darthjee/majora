# Tent Proxy (majora_proxy)

Tent ([GitHub](https://github.com/darthjee/tent), [Docker Hub](https://hub.docker.com/r/darthjee/tent)) is a PHP-based reverse proxy and static file server used to serve both frontend assets and to proxy backend API requests.

Repository layout (proxy-related files):
```
proxy/
├── dev_configuration/
│   ├── configure.php
│   └── rules/
│       ├── backend.php
│       ├── frontend.php
│       └── redirects.php
├── prod_configuration/
└── custom/
    ├── extend/
    └── tests/
```

### Routing modes

- Dev mode (`FRONTEND_DEV_MODE=true`): Tent proxies frontend requests to the Vite dev server (`majora_fe:8080`), including HMR paths (`/@vite/*`, `/@react-refresh`).
- Production (flag unset): Tent serves frontend assets statically from its static folder.
- Both modes: `*.json` paths route to the Django backend (cached via `default_proxy`); unmatched paths redirect to the SPA hash-routing entrypoint (`/#/<path>`).

See proxy/dev_configuration/rules/ and proxy/prod_configuration/ for exact rule definitions.
