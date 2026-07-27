# Proxy Plan: Add file photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

The new backend route `/games/:game_slug/documents/:document_id/files/:file_id/photo_upload.json` (see [backend.md](backend.md)) must be one of the trigger routes clearing the documents-family cache below.

## Implementation Steps

### Step 1 — Create `documents.php`

New file `proxy/extension/lib/configuration/cache_cleanup/documents.php`, following the exact shape of `items.php`/`sessions.php` (a `<?php` file returning an array of `{ 'targets' => [...], 'routes' => [...] }` groups). Cover the whole documents family (not just this issue's new routes), per the issue's decision to match `items.php`'s breadth:

```php
<?php
/**
 * Cache-cleanup groups for the documents resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * @return array List of documents-family cache-cleanup groups.
 */

return [
    // documents entity family — routes mutating a GameDocument or its files/photos.
    [
        'targets' => [
            '/games/:game_slug/documents.json',
            '/games/:game_slug/documents/all.json',
            '/games/:game_slug/documents/:document_id.json',
            '/games/:game_slug/documents/:document_id/full.json',
            '/games/:game_slug/documents/:document_id/photos.json',
            '/games/:game_slug/documents/:document_id/photos/all.json',
            '/games/:game_slug/documents/:document_id/files.json',
            '/games/:game_slug/documents/:document_id/files/all.json',
        ],
        'routes' => [
            '/games/:game_slug/documents/:document_id.json',
            '/games/:game_slug/documents/:document_id/photo_upload.json',
            '/games/:game_slug/documents/:document_id/file_upload.json',
            '/games/:game_slug/documents/:document_id/photos/:photo_id/set.json',
            '/games/:game_slug/documents/:document_id/files/:file_id/photo_upload.json',
        ],
    ],
];
```

Double-check the exact target/route path strings against `backend/games/urls/games.py`'s current document routes before landing (list them again at implementation time in case new document routes were added since this plan was written), and confirm whether a document *create* route (if a separate `POST /games/:game_slug/documents.json` exists beyond `game_documents`/`_document_create.py`) also needs to be added to `routes`.

### Step 2 — Register it in `cache_cleanup_map.php`

In `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php`, add:

```php
$documentsCacheCleanupGroups = require __DIR__ . '/documents.php';
```

and include it in the `array_merge(...)` call alongside the existing five family arrays.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/documents.php` — new file.
- `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` — require + merge the new group.

## CI Checks

- No CircleCI job runs proxy tests or lint today (confirmed: only proxy deploy-related jobs exist in `.circleci/config.yml`). Local verification only: `docker-compose run --rm proxy_tests` (runs `vendor/bin/phpunit extension/tests`, image `darthjee/tent:0.9.1`, mounting `./proxy/extension` → `/var/www/html/extension`).

## Notes

- Check `proxy/extension/tests/` for any existing test coverage of `cache_cleanup_map.php`/`CacheCleanupMapBuilder` (e.g. a test asserting the full merged map's shape or count of groups) that would need updating once `documents.php` is added.
