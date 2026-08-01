[← Back to How to Use darthjee/tent](../HOW_TO_USE_DARTHJEE-TENT.md)

## Quick Start with Docker

Pull the image and run it:

```yaml
services:
  proxy:
    image: darthjee/tent:latest
    ports:
      - "0.0.0.0:80:80"
    volumes:
      - ./proxy/static/:/var/www/html/static/
      - ./proxy_configuration/:/var/www/html/configuration/
    links:
      - my_backend:backend
      - my_frontend:frontend
    env_file: .env
```

The two key mounts are:
- `/var/www/html/static/` — static files Tent will serve directly.
- `/var/www/html/configuration/` — PHP rule files that define routing behavior.

---

## Configuration Folder Layout

Tent reads from `/var/www/html/configuration/` inside the container. The expected entry point is `configure.php`. A typical layout:

```
proxy_configuration/
├── configure.php          # entry point — loads rule files
└── rules/
    ├── backend.php        # routing rules for the API
    └── frontend.php       # routing rules for the frontend
```

### `configure.php`

This is the file Tent boots from. Its only job is to include the rule files:

```php
<?php

use Tent\Configuration;

require_once __DIR__ . '/rules/frontend.php';
require_once __DIR__ . '/rules/backend.php';
```

You can split rules into as many files as makes sense for your project — the only requirement is that `configure.php` requires them all.

---

## Defining Rules

Each rule is registered with `Configuration::buildRule()`. A rule has three parts:

- **`handler`** — what to do with the request (proxy it, serve a file, serve a folder).
- **`matchers`** — which requests this rule applies to.
- **`middlewares`** (optional) — transformations applied before or after the handler.

### Matcher types

| `type`        | Behavior                                          |
|---------------|---------------------------------------------------|
| `exact`       | Matches only if the URI is exactly equal          |
| `begins_with` | Matches if the URI starts with the given prefix   |
| `ends_with`   | Matches if the URI ends with the given suffix     |
| `regex`       | Matches if the URI matches a regular expression   |

Matchers also accept a `method` field (`GET`, `POST`, `PUT`, `DELETE`, etc.). When `method` is omitted, the rule matches any HTTP method for the given URI pattern.

---

[← Back to How to Use darthjee/tent](../HOW_TO_USE_DARTHJEE-TENT.md) · Next: [Request Handlers](request-handlers.md)
