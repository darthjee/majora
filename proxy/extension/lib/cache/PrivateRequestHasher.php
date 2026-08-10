<?php

namespace Tent\Cache;

use Tent\Models\RequestInterface;

/**
 * `RequestHasher` implementation that keys the cache entry on a
 * caller-specific header instead of (or in addition to) the query string,
 * enabling private per-caller response caching for restricted endpoints.
 *
 * Follows Tent's own documented `HeaderAwareRequestHasher` pattern
 * (`docs/agents/external/tent/creating-request-hashers.md`): the header
 * value and the query string are concatenated with a mandatory `|`
 * delimiter before hashing, closing the concatenation-boundary-ambiguity gap
 * a naive concatenation would leave open (e.g. header `"AB"` + query `"C"`
 * colliding with header `"A"` + query `"BC"`).
 *
 * The header this hasher reads (`X-Cache-Token` by default) is expected to
 * carry a dedicated, non-authenticating cache token — never the real auth
 * token/session credential — so that an unhashed leak of the cache
 * artifact's filename can never be traced back to real backend
 * authentication material. The token itself is always hashed, never
 * embedded raw; only the static `"private_"` prefix stays unhashed, for
 * readability when browsing the cache directory on disk.
 *
 * When the configured header is absent from the request, the hasher falls
 * back to hashing an empty string in its place, so all header-less callers
 * share one cache entry. This is only safe for endpoints whose response
 * doesn't vary per caller — see
 * `docs/agents/plans/949-use-custom-cache-hash-for-some-restricted-endpoints/proxy.md`
 * for the endpoint this was piloted against and why.
 */
class PrivateRequestHasher implements RequestHasher
{
    private string $headerName;

    public function __construct(string $headerName = 'X-Cache-Token')
    {
        $this->headerName = $headerName;
    }

    /**
     * Computes the private cache-key hash for the given request.
     *
     * @param RequestInterface $request The request to derive the hash from.
     * @return string The `"private_"`-prefixed SHA-256 hash of the
     *                 configured header's value and the request's query
     *                 string, joined by a `|` delimiter.
     */
    public function hash(RequestInterface $request): string
    {
        $headers = array_change_key_case($request->headers(), CASE_LOWER);
        $token = $headers[strtolower($this->headerName)] ?? '';

        return 'private_' . hash('sha256', $token . '|' . $request->query());
    }

    /**
     * Builds a PrivateRequestHasher from a rule's `request_hasher` config
     * array.
     *
     * @param array $params Options array; recognizes `headerName` (defaults
     *                       to `X-Cache-Token` when omitted).
     * @return self
     */
    public static function build(array $params): self
    {
        return new self($params['headerName'] ?? 'X-Cache-Token');
    }
}
