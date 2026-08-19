<?php

namespace Tent\RequestHandlers;

/**
 * Shared allow-list filter for headers forwarded to backend calls made by
 * DeleteHandler and UploadHandler.
 *
 * Both handlers need to strip down the incoming request's headers to a
 * small, known-safe allow-list before forwarding them to the backend, so
 * that arbitrary client-supplied headers (e.g. X-Trace-Id) never reach it.
 * The base allow-list here covers the 9 headers common to both handlers;
 * callers that need a couple of extra headers on top of the base list (e.g.
 * UploadHandler forwarding X-Upload-Token) can pass them via $extraAllowed
 * instead of duplicating the whole list.
 */
class ForwardedHeaderFilter
{
    /**
     * Allow-list of header names common to every caller. Matching is
     * case-insensitive; any incoming header not on this list (nor on a
     * caller-supplied $extraAllowed list) is dropped.
     *
     * @var string[]
     */
    private const BASE_ALLOWED_FORWARD_HEADERS = [
        'Host',
        'X-Forwarded-Host',
        'Cookie',
        'X-Skip-Cache',
        'Referer',
        'Accept-Language',
        'Accept',
        'Content-Type',
        'Authorization',
    ];

    /**
     * Filters $headers down to the entries whose name matches (case-
     * insensitively) one of ForwardedHeaderFilter::BASE_ALLOWED_FORWARD_HEADERS
     * or $extraAllowed.
     *
     * @param array    $headers      Associative array of header name => value,
     *                               as returned by $request->headers().
     * @param string[] $extraAllowed Additional header names allowed on top of
     *                               the base list, for callers that need a
     *                               few extra headers (e.g. UploadHandler's
     *                               X-Upload-Token). Matched case-insensitively,
     *                               same as the base list.
     * @return array The filtered associative array, preserving the original
     *                casing of the keys that pass the filter.
     */
    public static function filter(array $headers, array $extraAllowed=[]): array
    {
        $allowed = array_map(
            'strtolower',
            array_merge(self::BASE_ALLOWED_FORWARD_HEADERS, $extraAllowed)
        );

        return array_filter(
            $headers,
            fn (string $name): bool => in_array(strtolower($name), $allowed, true),
            ARRAY_FILTER_USE_KEY
        );
    }
}
