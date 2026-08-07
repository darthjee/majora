<?php

namespace Tent\Cache;

use Tent\Models\RequestInterface;

/**
 * Standalone static helper that derives a per-domain cache **folder** name
 * from a request's domain (`Host` header).
 *
 * Unlike a `RequestHasher` implementation, this doesn't produce a cache-key
 * hash — it produces a filesystem path segment. Domain partitioning lives in
 * the cache directory layout (one folder per domain) rather than being mixed
 * into the cache key itself, keeping the cache directory structure legible:
 * each domain's entries sit in their own `domain_<sha256>` folder instead of
 * being interleaved, indistinguishable, inside one shared folder.
 *
 * Only the domain feeds the hash — not the query string — since the query
 * string still belongs in the cache key (computed separately, by whichever
 * `RequestHasher` the handler already uses), not in the folder name. Mixing
 * it in here would needlessly fragment the per-domain folder further.
 *
 * The domain is read via {@see RequestInterface::domain()}, the same
 * accessor {@see \Tent\Matchers\RequestMatcher} uses to decide "which
 * domain" a rule matches, for consistency between rule matching and cache
 * partitioning.
 *
 * SHA-256 hex output is always a fixed-length, filesystem-safe string
 * regardless of input. The `"domain_"` prefix makes the folder's purpose
 * self-documenting when browsing the cache directory on disk, and keeps the
 * name from ever being mistaken for a cache-key hash produced by a
 * `RequestHasher`.
 */
class DomainHash
{
    /**
     * Computes the per-domain cache folder name from the request's domain.
     *
     * @param RequestInterface $request The request to derive the folder
     *                                  name from.
     * @return string The `"domain_"`-prefixed SHA-256 hash of the request's
     *                 domain.
     */
    public static function hash(RequestInterface $request): string
    {
        return 'domain_' . hash('sha256', $request->domain());
    }
}
