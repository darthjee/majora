<?php
/**
 * Proxy configuration entry point.
 * Loads routing rules in order: frontend, backend, redirects.
 * Redirect is last so it never overrides frontend/backend routes.
 */

require_once __DIR__ . '/rules/frontend.php';
require_once __DIR__ . '/rules/backend.php';
require_once __DIR__ . '/rules/redirects.php';
