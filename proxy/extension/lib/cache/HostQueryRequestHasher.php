<?php

namespace Tent\Cache;

use Tent\Models\RequestInterface;

/**
 * RequestHasher implementation that derives the cache-key hash from both the
 * request's domain (`Host` header) and its query string.
 *
 * Used to let multiple domains share a single physical cache folder while
 * still keeping each domain's cached responses isolated from one another —
 * domain isolation moves from the filesystem layout (one cache directory per
 * domain) into the cache key itself. The query string is combined with (not
 * replaced by) the domain, since two different domains requesting the same
 * query string must not collide now that they no longer sit in separate
 * directories.
 *
 * The domain is read via {@see RequestInterface::domain()}, the same
 * accessor {@see \Tent\Matchers\RequestMatcher} uses to decide "which
 * domain" a rule matches, for consistency between rule matching and cache
 * partitioning.
 *
 * SHA-256 hex output is always a fixed-length, filesystem-safe string
 * regardless of input, satisfying {@see RequestHasher}'s contract that
 * implementations are fully responsible for producing a filesystem-safe
 * value — Tent itself performs no sanitization on the returned hash before
 * interpolating it into a cache filename.
 */
class HostQueryRequestHasher implements RequestHasher
{
    /**
     * Computes the cache-key hash from the request's domain and query
     * string.
     *
     * @param RequestInterface $request The request to derive the hash from.
     * @return string The SHA-256 hash of the request's domain and query
     *                string.
     */
    public function hash(RequestInterface $request): string
    {
        return hash('sha256', $request->domain() . '|' . $request->query());
    }

    /**
     * Builds a HostQueryRequestHasher instance. Ignores `$params`.
     *
     * @param array $params Unused.
     * @return self The constructed hasher.
     */
    public static function build(array $params): self
    {
        return new self();
    }
}
