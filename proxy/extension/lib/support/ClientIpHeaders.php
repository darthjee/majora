<?php

namespace Tent\RequestHandlers;

/**
 * Single implementation of the "signed client IP" headers Tent sends to the
 * backend: `X-Forwarded-For` carrying Tent's own view of the client and
 * `X-Proxy-Secret` authenticating it.
 *
 * Shared by SetClientIpMiddleware (ordinary proxied requests) and
 * BackendClient (backend calls made by the custom handlers), so both kinds
 * of request reach the backend with exactly the same values.
 *
 * The backend only trusts `X-Forwarded-For` when `X-Proxy-Secret` matches
 * its own secret, so a client-supplied value of either header must never be
 * passed through: callers remove both (see ClientIpHeaders::strip()) before
 * applying the ones built here.
 */
class ClientIpHeaders
{
    public const FORWARDED_FOR_HEADER = 'X-Forwarded-For';

    public const PROXY_SECRET_HEADER = 'X-Proxy-Secret';

    /**
     * Names of the headers owned by Tent, which a client must never be able
     * to supply.
     *
     * @return string[]
     */
    public static function names(): array
    {
        return [self::FORWARDED_FOR_HEADER, self::PROXY_SECRET_HEADER];
    }

    /**
     * Builds the headers to set on a request going to the backend.
     *
     * @param string $remoteAddress Tent's view of the client's address.
     * @param string $secret        Shared secret; an empty string means no
     *                              `X-Proxy-Secret` header is sent.
     * @return array<string, string> `X-Forwarded-For` always and, when
     *                               $secret is non-empty, `X-Proxy-Secret`.
     */
    public static function build(string $remoteAddress, string $secret=''): array
    {
        $headers = [self::FORWARDED_FOR_HEADER => $remoteAddress];

        if ($secret !== '') {
            $headers[self::PROXY_SECRET_HEADER] = $secret;
        }

        return $headers;
    }

    /**
     * Removes every occurrence of both headers from $headers,
     * case-insensitively.
     *
     * @param array $headers Associative array of header name => value.
     * @return array The array without any `X-Forwarded-For` or
     *               `X-Proxy-Secret` entry; other entries keep their casing
     *               and order.
     */
    public static function strip(array $headers): array
    {
        $names = array_map('strtolower', self::names());

        return array_filter(
            $headers,
            fn ($name): bool => !in_array(strtolower((string) $name), $names, true),
            ARRAY_FILTER_USE_KEY
        );
    }

    /**
     * Strips any existing occurrence of both headers from $headers and
     * appends the ones built from $remoteAddress and $secret.
     *
     * @param array  $headers       Associative array of header name => value.
     * @param string $remoteAddress Tent's view of the client's address.
     * @param string $secret        Shared secret; empty sends none.
     * @return array The headers, carrying only Tent's own values of both.
     */
    public static function apply(array $headers, string $remoteAddress, string $secret=''): array
    {
        return array_merge(self::strip($headers), self::build($remoteAddress, $secret));
    }

    /**
     * Tent's view of the connecting client: PHP's `$_SERVER['REMOTE_ADDR']`,
     * or an empty string when it is not set (e.g. on the command line).
     *
     * @return string
     * @SuppressWarnings(PHPMD.Superglobals)
     */
    public static function remoteAddress(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    }
}
