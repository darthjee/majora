<?php
/**
 * Proxy configuration entry point.
 * Loads routing rules in order: frontend, backend, admin, redirects.
 * Redirect is last so it never overrides frontend/backend/admin routes.
 */

require_once __DIR__ . '/rules/frontend.php';
require_once __DIR__ . '/rules/photos.php';
require_once __DIR__ . '/rules/uploads.php';
require_once __DIR__ . '/../extension/lib/configuration/cache_cleanup/cache_cleanup_map.php';
require_once __DIR__ . '/rules/backend.php';
require_once __DIR__ . '/rules/admin.php';
require_once __DIR__ . '/rules/redirects.php';
