<?php

$cacheFolder = './cache';
// Shared secret sent to Django in X-Proxy-Secret (SetClientIpMiddleware);
// must match the backend's PROXY_SECRET. Empty disables it.
$proxySecret = getenv('PROXY_SECRET') ?: '';
