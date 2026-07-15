<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\FixedFileHandler;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Handlers\StaticFileHandler;
use Tent\Models\Server;
use Tent\Models\FolderLocation;
use Tent\Models\RequestMatcher;

require_once __DIR__ . '/locals.php';

require_once __DIR__ . '/rules/frontend.php';
require_once __DIR__ . '/rules/photos.php';
require_once __DIR__ . '/rules/uploads.php';
require_once __DIR__ . '/../extension/lib/configuration/cache_cleanup/cache_cleanup_map.php';
require_once __DIR__ . '/rules/backend.php';
require_once __DIR__ . '/rules/admin.php';
require_once __DIR__ . '/rules/redirects.php';
