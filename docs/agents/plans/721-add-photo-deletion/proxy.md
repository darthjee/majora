# Proxy Plan: Add photo deletion

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the backend endpoint table this handler calls (`deletable.json` then `DELETE`) and the orchestration steps. **Only `DELETE` needs a new rule/handler** — `GET`/`PATCH` to `.../photos/:photo_id.json` already ride the existing generic `backend.php` passthrough (its matcher is method-agnostic: `['uri' => '.json', 'type' => 'ends_with']`), so no change is needed there.

## Implementation Steps

### Step 1 — New rule files (prod + dev)

`proxy/prod_configuration/rules/delete.php` (new), modeled on `uploads.php`:

```php
<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'       => 'Tent\RequestHandlers\DeleteHandler',
        'host'        => $backendHost,
        'photos_path' => $photosPath,
    ],
    'matchers' => [
        [
            'method' => 'DELETE',
            'uri'    => '#^/games/[^/]+/(pcs|npcs)/\d+/photos/\d+\.json$#',
            'type'   => 'regex',
        ],
    ],
]);
```

`proxy/dev_configuration/rules/delete.php` (new) — identical shape, dev-hardcoded values (mirroring `dev_configuration/rules/uploads.php`):

```php
<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'       => 'Tent\RequestHandlers\DeleteHandler',
        'host'        => 'http://backend:8080',
        'photos_path' => '/var/www/html',
    ],
    'matchers' => [
        [
            'method' => 'DELETE',
            'uri'    => '#^/games/[^/]+/(pcs|npcs)/\d+/photos/\d+\.json$#',
            'type'   => 'regex',
        ],
    ],
]);
```

Confirm the exact regex-matcher key names (`type: 'regex'`) against `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md#redirectmiddleware` (referenced by the issue) before finalizing — adjust syntax if Tent's actual regex-matcher contract differs.

### Step 2 — Register the rule in both `configure.php`s

In both `proxy/prod_configuration/configure.php` and `proxy/dev_configuration/configure.php`, add:

```php
require_once __DIR__ . '/rules/delete.php';
```

**Immediately before** `require_once __DIR__ . '/rules/backend.php';` — same slot `uploads.php` occupies, so the narrower DELETE matcher is tried before the generic `.json`-ends-with passthrough (first-match-wins routing).

### Step 3 — `SecurePhotoStorage`: add a delete-safe method

`proxy/extension/lib/support/SecurePhotoStorage.php` currently only exposes `ensureDirectoryFor()` (write-path guard). Add a companion read/delete guard, e.g.:

```php
public function deleteFile(string $relativePath): void
{
    $absolutePath = $this->resolveWithinBase($relativePath); // reuse/extract the existing traversal-guard logic

    if (is_file($absolutePath)) {
        unlink($absolutePath);
    }
}
```

Reuse whatever private traversal-check logic `ensureDirectoryFor` already has (extract it into a shared private helper if it's currently inlined) rather than duplicating the guard. Missing file is not an error — proceed silently (an interrupted prior delete attempt, or a file that was already removed, should not block the DB-side delete that follows).

### Step 4 — `DeleteHandler`

New `proxy/extension/lib/handlers/DeleteHandler.php`, modeled on `UploadHandler.php`:

- `namespace Tent\RequestHandlers;`, extends `RequestHandler`.
- Static `build(array $params)` factory reading `host`/`photos_path` (same contract as `UploadHandler::build`).
- `protected function processsRequest(RequestInterface $request): Response` (three s's, matching the base class contract):
  1. Extract `game_slug`, `kind` (`pcs`/`npcs`), `character_id`, `photo_id` from `$request->requestPath()` via a `preg_match` against the same shape as the rule's matcher regex.
  2. Build the backend `deletable.json` URL and call it via `$this->httpClient->request('GET', $url, $headers)`.
  3. If the response is not 200, return a `Response` that passes the backend's `httpCode`/body straight through (404/422) — mirror how `UploadHandler` wraps backend failures via `BackendErrorException`, reusing that same exception class here (it's not upload-specific).
  4. Parse `path` from the 200 body; call `SecurePhotoStorage::deleteFile($path)` (Step 3) against `photos_path`.
  5. Call the backend `DELETE .../photos/:photo_id.json`; return its response (status/body) straight through.
- Filter/forward headers the same way `UploadHandler` does (`filterHeaders()` against `ALLOWED_FORWARD_HEADERS`, `Host`-header middlewares).

### Step 5 — Register in the loader

`proxy/extension/loader.php` — add, after the existing handler `require_once` lines:

```php
require_once __DIR__ . '/lib/handlers/DeleteHandler.php';
```

(`BackendErrorException.php` is already required earlier in the file — no new exception class needed since it's reused as-is.)

### Step 6 — Tests

New `proxy/extension/tests/handlers/DeleteHandlerTest.php`, modeled on `UploadHandlerTest.php`:
- `namespace Tent\RequestHandlers\Tests;`, real temp dir for `photos_path` (`setUp`/`tearDown`), mocked `HttpClientInterface` (`createMock`, asserting the `GET deletable.json` call then the `DELETE` call, in order, via `willReturnOnConsecutiveCalls`/`with`).
- Cases: happy path (200 deletable → file removed → 204 passthrough); 404 from `deletable.json` passthrough (no `DELETE` call made, no file-delete attempt); 422 from `deletable.json` passthrough (same); file already missing on disk (delete still proceeds to the backend `DELETE` call, no crash — covers the interrupted-flow case explicitly accepted during issue discussion).
- Extend/add a test for `SecurePhotoStorage::deleteFile` (path traversal rejected, missing file silently no-ops, existing file removed) — likely `proxy/extension/tests/support/SecurePhotoStorageTest.php` if that file already exists, else create it.

## Files to Change
- `proxy/prod_configuration/rules/delete.php` — new.
- `proxy/dev_configuration/rules/delete.php` — new.
- `proxy/prod_configuration/configure.php`, `proxy/dev_configuration/configure.php` — one `require_once` line each.
- `proxy/extension/lib/support/SecurePhotoStorage.php` — new `deleteFile` method.
- `proxy/extension/lib/handlers/DeleteHandler.php` — new.
- `proxy/extension/loader.php` — one `require_once` line.
- `proxy/extension/tests/handlers/DeleteHandlerTest.php` — new.
- `proxy/extension/tests/support/SecurePhotoStorageTest.php` — new or extended.

## CI Checks
No CircleCI job currently runs proxy PHPUnit tests or PHP lint (existing gap, out of scope here). Verify locally via `.claude/scripts/check_proxy.sh`, which runs:
- `php -l` over every `proxy/*.php` file (via the `darthjee/tent` image).
- `docker-compose run --rm --workdir /var/www/html/extension proxy_tests vendor/bin/phpunit tests`.

## Notes
- `backend.php`'s passthrough matcher (`.json ends_with`, any method) means ordering in `configure.php` is load-bearing — `delete.php` must load before `backend.php` or its narrower DELETE rule never gets a chance to match.
- The `RequestHandler` base class and `HttpClientInterface`/`CurlHttpClient` live inside the `darthjee/tent` Docker image, not in this repo — cannot be inspected directly; infer the contract from `UploadHandler.php`'s usage.
