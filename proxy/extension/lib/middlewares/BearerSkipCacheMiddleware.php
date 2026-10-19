<?php

namespace Tent\Middlewares;

use Tent\Models\ProcessingRequest;

/**
 * Marks requests authenticated with a scoped API token (`Authorization:
 * Bearer ...`) so that Tent's cache neither serves nor stores them.
 *
 * ## Why this exists
 *
 * Tent matchers cannot select a rule by request header, so a Bearer request
 * would otherwise hit the same cached rule as an anonymous or session-based
 * request. A token's scopes can differ from the session user's permissions,
 * which means a cached response must never be shared with, or produced by,
 * a Bearer request.
 *
 * This middleware sets a marker request header (default `X-Skip-Cache`) to
 * `true` whenever the request carries a Bearer `Authorization` header. The
 * rule then lists the same header as its `skip_cache_header`, so Tent
 * bypasses the cache for that request.
 *
 * Detection joins every `Authorization` header value (matched
 * case-insensitively) with `,` and tests the result against
 * `/(^|,)\s*bearer(\s|$)/i`. That pattern must stay identical to the
 * backend's `accounts.authentication.BEARER_PATTERN`.
 *
 * When `skipWhenMissing` names a request header, the marker is also set
 * when that header is absent or blank, providing a second guard for rules
 * that must never store or serve an entry without it (e.g. `X-Cache-Token`).
 *
 * No header is ever stripped or modified other than setting the marker; an
 * inbound copy of the marker header is left as it is.
 *
 * ## Usage in configuration
 *
 * ```php
 * Configuration::buildRule([
 *     'handler' => [...],
 *     'matchers' => [...],
 *     'middlewares' => [
 *         [
 *             'class'           => 'Tent\\Middlewares\\BearerSkipCacheMiddleware',
 *             'header'          => 'X-Bearer-Request',
 *             'skipWhenMissing' => 'X-Cache-Token'
 *         ]
 *     ]
 * ]);
 * ```
 */
class BearerSkipCacheMiddleware extends Middleware
{
    public const DEFAULT_HEADER = 'X-Skip-Cache';

    private const AUTHORIZATION_HEADER = 'Authorization';

    private const BEARER_PATTERN = '/(^|,)\s*bearer(\s|$)/i';

    /**
     * @var string Marker header set to `true` on matching requests.
     */
    private string $header;

    /**
     * @var string Request header whose absence also sets the marker; empty
     *             disables that check.
     */
    private string $skipWhenMissing;

    /**
     * @param string $header          Marker header set to `true`.
     * @param string $skipWhenMissing Request header whose absence (or blank
     *                                value) also sets the marker; an empty
     *                                string disables the check.
     */
    public function __construct(string $header=self::DEFAULT_HEADER, string $skipWhenMissing='')
    {
        $this->header = $header;
        $this->skipWhenMissing = $skipWhenMissing;
    }

    /**
     * Builds a BearerSkipCacheMiddleware instance.
     *
     * @param array $attributes Optional `header` (string, default
     *                          `X-Skip-Cache`) and `skipWhenMissing`
     *                          (string, default `''`).
     * @return BearerSkipCacheMiddleware The constructed middleware instance.
     */
    public static function build(array $attributes): BearerSkipCacheMiddleware
    {
        $header = (string) ($attributes['header'] ?? '');

        return new self(
            $header === '' ? self::DEFAULT_HEADER : $header,
            (string) ($attributes['skipWhenMissing'] ?? '')
        );
    }

    /**
     * Sets the marker header to `true` when the request is a Bearer request
     * or, if configured, when the `skipWhenMissing` header is absent or
     * blank. Every other header is left untouched.
     *
     * @param ProcessingRequest $request The request to process.
     * @return ProcessingRequest The request, possibly carrying the marker.
     */
    public function processRequest(ProcessingRequest $request): ProcessingRequest
    {
        if ($this->isBearer($request) || $this->isMissingRequiredHeader($request)) {
            $request->setHeader($this->header, 'true');
        }

        return $request;
    }

    /**
     * Checks whether the joined `Authorization` values carry a Bearer token.
     *
     * @param ProcessingRequest $request The request to inspect.
     * @return boolean True when the request uses a Bearer token.
     */
    private function isBearer(ProcessingRequest $request): bool
    {
        $values = $this->headerValues($request, self::AUTHORIZATION_HEADER);

        if (empty($values)) {
            return false;
        }

        return preg_match(self::BEARER_PATTERN, implode(',', $values)) === 1;
    }

    /**
     * Checks whether the configured `skipWhenMissing` header is absent or
     * blank.
     *
     * @param ProcessingRequest $request The request to inspect.
     * @return boolean True when the check is enabled and the header is
     *                 missing or blank.
     */
    private function isMissingRequiredHeader(ProcessingRequest $request): bool
    {
        if ($this->skipWhenMissing === '') {
            return false;
        }

        $values = $this->headerValues($request, $this->skipWhenMissing);

        return trim(implode('', $values)) === '';
    }

    /**
     * Collects every value of $headerName, case-insensitively.
     *
     * @param ProcessingRequest $request    The request to inspect.
     * @param string            $headerName The header name to collect.
     * @return array List of string values.
     */
    private function headerValues(ProcessingRequest $request, string $headerName): array
    {
        $targetName = strtolower($headerName);
        $values = [];

        foreach ($request->headers() as $name => $value) {
            if (strtolower((string) $name) !== $targetName) {
                continue;
            }

            foreach ((array) $value as $item) {
                $values[] = (string) $item;
            }
        }

        return $values;
    }
}
