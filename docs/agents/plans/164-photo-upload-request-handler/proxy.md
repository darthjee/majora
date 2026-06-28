# Proxy Plan: Add photo upload request handler

Main plan: [plan.md](plan.md)

## Shared contracts

This agent creates all PHP extension code under `proxy/extension/`. The `infra` agent
mounts this directory into the Tent container at `/var/www/html/extension/`. Tent 0.8.0
auto-loads `loader.php` from that path.

The handler calls `PATCH /uploads/:id.json` on `http://backend:8080` twice:
1. With `status=uploading` — receives `{"file_path": "..."}` in the response body.
2. With `status=uploaded` — signals the file is written.

Both backend calls forward the client's `Authorization` and `X-Upload-Token` headers.

The proxy test service (`proxy_tests`) will run `vendor/bin/phpunit extension/tests`
after `infra` updates `docker-compose.yml`.

## Implementation Steps

### Step 1 — Create the extension directory and loader

Create `proxy/extension/loader.php`. This file is auto-loaded by Tent 0.8.0 at startup
via the `/var/www/html/extension` mount. It `require_once`s every custom class file:

```php
<?php

require_once __DIR__ . '/TestHeaderMiddleware.php';
require_once __DIR__ . '/PhotoUploadHandler.php';
```

### Step 2 — Move TestHeaderMiddleware

Copy `proxy/custom/extend/TestHeaderMiddleware.php` to `proxy/extension/TestHeaderMiddleware.php`.
Keep the namespace (`Tent\Middlewares`) and content unchanged.

Copy `proxy/custom/tests/TestHeaderMiddlewareTest.php` to
`proxy/extension/tests/TestHeaderMiddlewareTest.php`. Keep namespace
(`Tent\Middlewares\Tests`) and content unchanged.

Delete `proxy/custom/extend/TestHeaderMiddleware.php` and
`proxy/custom/tests/TestHeaderMiddlewareTest.php`. If the directories `proxy/custom/extend/`
and `proxy/custom/tests/` are now empty, remove them too.

### Step 3 — Create PhotoUploadHandler

Create `proxy/extension/PhotoUploadHandler.php`:

```php
<?php

namespace Tent\RequestHandlers;

use Tent\Http\CurlHttpClient;
use Tent\RequestHandler;
use Tent\Request;
use Tent\Response;

class PhotoUploadHandler extends RequestHandler
{
    private string $host;

    public static function build(array $params): self
    {
        $handler = new self();
        $handler->host = $params['host'];
        return $handler;
    }

    public function processRequest(Request $request): Response
    {
        // 1. Extract upload id from path: /uploads/:id/submit
        $path = $request->path();
        if (!preg_match('#^/uploads/(\d+)/submit$#', $path, $matches)) {
            return new Response(400, 'Bad Request');
        }
        $uploadId = $matches[1];

        // 2. Validate file
        $file = $request->uploadedFiles()['file'] ?? null;
        if ($file === null || !$this->isValidImage($file)) {
            return new Response(422, 'Unprocessable Entity');
        }

        // 3. Extract forwarded headers
        $authorization = $request->header('Authorization') ?? '';
        $uploadToken   = $request->header('X-Upload-Token') ?? '';

        // 4. Call backend: status=uploading
        $client = new CurlHttpClient();
        $uploading = $client->patch(
            $this->host . '/uploads/' . $uploadId . '.json',
            ['status' => 'uploading'],
            ['Authorization' => $authorization, 'X-Upload-Token' => $uploadToken]
        );
        if ($uploading->statusCode() !== 200) {
            return new Response($uploading->statusCode(), $uploading->body());
        }

        $body = json_decode($uploading->body(), true);
        $filePath = $body['file_path'] ?? null;
        if ($filePath === null) {
            return new Response(500, 'Internal Server Error');
        }

        // 5. Write file to photos volume
        $destination = '/var/www/html/photos/' . $filePath;
        $dir = dirname($destination);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $stream = $file->getStream();
        file_put_contents($destination, (string) $stream);

        // 6. Call backend: status=uploaded
        $uploaded = $client->patch(
            $this->host . '/uploads/' . $uploadId . '.json',
            ['status' => 'uploaded'],
            ['Authorization' => $authorization, 'X-Upload-Token' => $uploadToken]
        );
        if ($uploaded->statusCode() !== 200) {
            return new Response($uploaded->statusCode(), $uploaded->body());
        }

        return new Response(200, '');
    }

    private function isValidImage(mixed $file): bool
    {
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        $mimeType = $file->getClientMediaType();
        $ext = strtolower(pathinfo($file->getClientFilename(), PATHINFO_EXTENSION));

        return in_array($mimeType, $allowedMimeTypes, true)
            && in_array($ext, $allowedExtensions, true);
    }
}
```

Adapt the exact method signatures and class names to match what Tent 0.8.0 actually
exposes — inspect the `RequestHandler` abstract class and `Request`/`Response` inside the
Tent container image (`docker-compose run proxy_tests php -r "..."`) if needed.

### Step 4 — Create PHPUnit test for PhotoUploadHandler

Create `proxy/extension/tests/PhotoUploadHandlerTest.php` in the
`Tent\RequestHandlers\Tests` namespace. Tests must cover:

- Valid image upload: mock the `CurlHttpClient`, `Request`, and uploaded file; assert two
  PATCH calls are made in order and a 200 response is returned.
- Invalid file type: assert a 422 response is returned without any backend calls.
- Invalid path (no id match): assert a 400 response.
- Backend error on first PATCH: assert the backend's error code is forwarded and no file
  is written.

### Step 5 — Create upload routing rules

Create `proxy/dev_configuration/rules/uploads.php`:

```php
<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class' => 'Tent\RequestHandlers\PhotoUploadHandler',
        'host'  => 'http://backend:8080',
    ],
    'matchers' => [
        ['method' => 'PATCH', 'uri' => '/uploads/', 'type' => 'begins_with'],
    ],
]);
```

Create `proxy/prod_configuration/rules/uploads.php` with the same content (the host
`http://backend:8080` is the Docker service name, correct in both environments).

### Step 6 — Register the uploads rule in configure.php

Add `require_once __DIR__ . '/rules/uploads.php';` to both
`proxy/dev_configuration/configure.php` and `proxy/prod_configuration/configure.php`.
Place it before the `backend.php` require so the uploads handler takes precedence over
the generic `.json` backend rule.

## Files to Change

- `proxy/extension/loader.php` — new; auto-loaded by Tent from `/var/www/html/extension/`
- `proxy/extension/TestHeaderMiddleware.php` — moved from `proxy/custom/extend/`
- `proxy/extension/tests/TestHeaderMiddlewareTest.php` — moved from `proxy/custom/tests/`
- `proxy/extension/PhotoUploadHandler.php` — new; custom request handler
- `proxy/extension/tests/PhotoUploadHandlerTest.php` — new; PHPUnit test
- `proxy/custom/extend/TestHeaderMiddleware.php` — deleted
- `proxy/custom/tests/TestHeaderMiddlewareTest.php` — deleted
- `proxy/dev_configuration/rules/uploads.php` — new; upload routing rule
- `proxy/prod_configuration/rules/uploads.php` — new; upload routing rule
- `proxy/dev_configuration/configure.php` — add uploads.php require
- `proxy/prod_configuration/configure.php` — add uploads.php require

## CI Checks

- `proxy/`: `docker-compose run proxy_tests` (CI job: `checks`)

## Notes

- Inspect the actual Tent 0.8.0 API (`RequestHandler`, `Request`, `Response`,
  `CurlHttpClient`) inside the container before finalizing method names. The pseudocode
  above shows intent; adapt to real class/method signatures.
- The `proxy/custom/` directory will be empty after Step 2 moves all files out.
  `infra` removes the `proxy_tests` volume mount for it; the directory itself can be left
  as a no-op empty folder or deleted — coordinate with the infra agent.
- On file-write failure, no rollback of the backend state is attempted (the `Upload`
  record stays in `uploading` status). This is acceptable for the initial implementation.
