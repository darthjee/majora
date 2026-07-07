<?php

// Disable PHP's automatic session cache-limiter header before anything else
// runs. By default (`nocache` in the base darthjee/tent image), PHP injects
// its own `Cache-Control` header whenever a session is started, colliding
// with whatever the proxy's own middleware/backend sets and producing a
// duplicate `Cache-Control` header on the response. Disabling it here makes
// the proxy's own middleware/backend the single source of truth for
// `Cache-Control`.
session_cache_limiter('');

require_once __DIR__ . '/lib/TestHeaderMiddleware.php';
require_once __DIR__ . '/lib/CacheControlMiddleware.php';
require_once __DIR__ . '/lib/UnprocessableUploadException.php';
require_once __DIR__ . '/lib/BackendErrorException.php';
require_once __DIR__ . '/lib/SecurePhotoStorage.php';
require_once __DIR__ . '/lib/UploadFilenameValidator.php';
require_once __DIR__ . '/lib/PhotoUploadHandler.php';
