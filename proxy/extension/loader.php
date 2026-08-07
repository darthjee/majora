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
require_once __DIR__ . '/lib/middlewares/SetClientIpMiddleware.php';
require_once __DIR__ . '/lib/middlewares/CacheCleanupMapBuilder.php';
require_once __DIR__ . '/lib/cache/DomainHash.php';
require_once __DIR__ . '/lib/exceptions/UnprocessableUploadException.php';
require_once __DIR__ . '/lib/exceptions/BackendErrorException.php';
require_once __DIR__ . '/lib/support/PathTraversalGuard.php';
require_once __DIR__ . '/lib/support/SecurePhotoStorage.php';
require_once __DIR__ . '/lib/support/ForwardedHeaderFilter.php';
require_once __DIR__ . '/lib/support/BackendClient.php';
require_once __DIR__ . '/lib/support/StaffAccessGuard.php';
require_once __DIR__ . '/lib/support/UploadFilenameValidator.php';
require_once __DIR__ . '/lib/handlers/UploadHandler.php';
require_once __DIR__ . '/lib/handlers/DeleteHandler.php';
require_once __DIR__ . '/lib/exceptions/ShellCommandFailedException.php';
require_once __DIR__ . '/lib/support/ShellExecutorInterface.php';
require_once __DIR__ . '/lib/support/NativeShellExecutor.php';
require_once __DIR__ . '/lib/support/DirectorySizeStrategyInterface.php';
require_once __DIR__ . '/lib/support/DuDirectorySizeStrategy.php';
require_once __DIR__ . '/lib/support/PhpWalkDirectorySizeStrategy.php';
require_once __DIR__ . '/lib/support/DirectorySizeStrategyRegistry.php';
require_once __DIR__ . '/lib/support/DirectorySizeCalculator.php';
require_once __DIR__ . '/lib/handlers/CacheSizeHandler.php';
require_once __DIR__ . '/lib/handlers/CacheClearHandler.php';
