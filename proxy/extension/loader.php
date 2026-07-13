<?php

// Disable PHP's automatic session cache-limiter header before anything else
// runs. By default (`nocache` in the base darthjee/tent image), PHP injects
// its own `Cache-Control` header whenever a session is started, colliding
// with whatever the proxy's own middleware/backend sets and producing a
// duplicate `Cache-Control` header on the response. Disabling it here makes
// the proxy's own middleware/backend the single source of truth for
// `Cache-Control`.
session_cache_limiter('');

require_once __DIR__ . '/lib/middlewares/TestHeaderMiddleware.php';
require_once __DIR__ . '/lib/middlewares/CacheControlMiddleware.php';
require_once __DIR__ . '/lib/middlewares/CacheCleanupMapBuilder.php';
require_once __DIR__ . '/lib/exceptions/UnprocessableUploadException.php';
require_once __DIR__ . '/lib/exceptions/BackendErrorException.php';
require_once __DIR__ . '/lib/support/SecurePhotoStorage.php';
require_once __DIR__ . '/lib/support/UploadFilenameValidator.php';
require_once __DIR__ . '/lib/handlers/PhotoUploadHandler.php';
