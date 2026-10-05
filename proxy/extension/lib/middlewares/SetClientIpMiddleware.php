<?php

namespace Tent\Middlewares;

use Tent\Models\ProcessingRequest;

/**
 * Overwrites the `X-Forwarded-For` request header with Tent's own view of
 * the client's remote address, and authenticates it to the backend with a
 * shared secret sent in the `X-Proxy-Secret` header.
 *
 * ## Why this exists
 *
 * Django is not only reachable through Tent: in production it is a public
 * Render host, and Render itself may append entries to `X-Forwarded-For`.
 * Anyone can therefore send a request straight to Django carrying an
 * arbitrary `X-Forwarded-For`, so the header alone proves nothing about
 * the real visitor IP (e.g. the one recorded by
 * `statistics.middleware.StatisticsSessionMiddleware`).
 *
 * This middleware makes the value trustworthy in two steps:
 *
 * 1. It unconditionally replaces any client-supplied `X-Forwarded-For`
 *    (case-insensitively) with a single value: Tent's own view of the
 *    connecting peer (PHP's `$_SERVER['REMOTE_ADDR']`). It never appends,
 *    so the leftmost entry Django sees is always the one Tent set.
 * 2. It strips any client-supplied `X-Proxy-Secret` (case-insensitively)
 *    and, when a non-empty `secret` is configured, sets `X-Proxy-Secret` to
 *    it. Django only trusts `X-Forwarded-For` when that header matches its
 *    own `PROXY_SECRET`; otherwise it falls back to `REMOTE_ADDR`.
 *
 * Both headers live in one middleware so a rule can never set the client IP
 * without also authenticating it. An empty (or missing) `secret` disables
 * authentication: no `X-Proxy-Secret` is sent, and Django ignores
 * `X-Forwarded-For`.
 *
 * ## Usage in configuration
 *
 * ```php
 * Configuration::buildRule([
 *     'handler' => [...],
 *     'matchers' => [...],
 *     'middlewares' => [
 *         [
 *             'class'  => 'Tent\\Middlewares\\SetClientIpMiddleware',
 *             'secret' => $proxySecret
 *         ]
 *     ]
 * ]);
 * ```
 */
class SetClientIpMiddleware extends Middleware
{
    private const FORWARDED_FOR_HEADER = 'X-Forwarded-For';

    private const PROXY_SECRET_HEADER = 'X-Proxy-Secret';

    /**
     * @var string Shared secret sent to the backend; empty disables it.
     */
    private string $secret;

    /**
     * @param string $secret Shared secret sent in `X-Proxy-Secret`; an empty
     *                       string means no secret header is sent.
     */
    public function __construct(string $secret='')
    {
        $this->secret = $secret;
    }

    /**
     * Builds a SetClientIpMiddleware instance.
     *
     * @param array $attributes Optional `secret` (string, default `''`): the
     *                          shared secret sent in `X-Proxy-Secret`.
     * @return SetClientIpMiddleware The constructed middleware instance.
     */
    public static function build(array $attributes): SetClientIpMiddleware
    {
        return new self((string) ($attributes['secret'] ?? ''));
    }

    /**
     * Replaces any existing `X-Forwarded-For` header (case-insensitively)
     * with a single occurrence carrying the request's own remote address,
     * strips any client-supplied `X-Proxy-Secret`, and sets Tent's own
     * secret when one is configured. Every other header is left untouched.
     *
     * @param ProcessingRequest $request The request to process.
     * @return ProcessingRequest The request, with a single, trustworthy
     *                            `X-Forwarded-For` header set and, when
     *                            configured, the `X-Proxy-Secret` header.
     * @SuppressWarnings(PHPMD.Superglobals)
     */
    public function processRequest(ProcessingRequest $request): ProcessingRequest
    {
        $this->removeHeader($request, self::FORWARDED_FOR_HEADER);
        $this->removeHeader($request, self::PROXY_SECRET_HEADER);

        $request->setHeader(self::FORWARDED_FOR_HEADER, (string) ($_SERVER['REMOTE_ADDR'] ?? ''));

        if ($this->secret !== '') {
            $request->setHeader(self::PROXY_SECRET_HEADER, $this->secret);
        }

        return $request;
    }

    /**
     * Removes every occurrence of $headerName from the request,
     * case-insensitively.
     *
     * @param ProcessingRequest $request    The request to modify.
     * @param string            $headerName The header name to remove.
     * @return void
     */
    private function removeHeader(ProcessingRequest $request, string $headerName): void
    {
        $targetName = strtolower($headerName);

        foreach (array_keys($request->headers()) as $name) {
            if (strtolower($name) === $targetName) {
                $request->removeHeader($name);
            }
        }
    }
}
