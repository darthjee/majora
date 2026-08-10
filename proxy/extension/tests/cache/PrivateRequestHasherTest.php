<?php

namespace Tent\Cache\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Cache\PrivateRequestHasher;
use Tent\Models\RequestInterface;

/**
 * Unit tests for PrivateRequestHasher.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class PrivateRequestHasherTest extends TestCase
{
    /**
     * Builds a minimal RequestInterface double carrying only the given
     * headers and query string, decoupled from Tent's own Request/
     * ProcessingRequest implementations (see DomainHashTest.php for the
     * same rationale).
     */
    private function makeRequest(array $headers, string $query = ''): RequestInterface
    {
        return new PrivateRequestHasherTestRequest($headers, $query);
    }

    /**
     * The same token + query always produces the same hash.
     */
    public function testSameTokenAndQueryHashIdentically(): void
    {
        $hasher = new PrivateRequestHasher();

        $first = $hasher->hash($this->makeRequest(['X-Cache-Token' => 'token-a'], 'id=1'));
        $second = $hasher->hash($this->makeRequest(['X-Cache-Token' => 'token-a'], 'id=1'));

        $this->assertSame($first, $second);
    }

    /**
     * Different X-Cache-Token values produce different hashes — the whole
     * point of keying the cache privately, per caller.
     */
    public function testDifferentTokensHashDifferently(): void
    {
        $hasher = new PrivateRequestHasher();

        $tokenA = $hasher->hash($this->makeRequest(['X-Cache-Token' => 'token-a'], 'id=1'));
        $tokenB = $hasher->hash($this->makeRequest(['X-Cache-Token' => 'token-b'], 'id=1'));

        $this->assertNotSame($tokenA, $tokenB);
    }

    /**
     * The `|` delimiter correctly separates the token from the query
     * string, so boundary-ambiguous concatenations don't collide: a naive
     * `$token . $query` concatenation would make token="AB"+query="C"
     * indistinguishable from token="A"+query="BC".
     */
    public function testDelimiterPreventsBoundaryAmbiguousCollisions(): void
    {
        $hasher = new PrivateRequestHasher();

        $abC = $hasher->hash($this->makeRequest(['X-Cache-Token' => 'AB'], 'C'));
        $aBc = $hasher->hash($this->makeRequest(['X-Cache-Token' => 'A'], 'BC'));

        $this->assertNotSame($abC, $aBc);
    }

    /**
     * A missing X-Cache-Token header (empty headers array) still produces
     * a valid, non-crashing hash — the documented "shared entry for
     * header-less callers" fallback, acceptable only for endpoints whose
     * response doesn't vary per caller.
     */
    public function testMissingHeaderProducesValidHash(): void
    {
        $hasher = new PrivateRequestHasher();

        $result = $hasher->hash($this->makeRequest([], 'id=1'));

        $this->assertSame('private_' . hash('sha256', '|id=1'), $result);
    }

    /**
     * The returned hash follows the documented, reproducible format:
     * `'private_' . hash('sha256', $token . '|' . $query)`.
     */
    public function testHashMatchesExpectedFormat(): void
    {
        $hasher = new PrivateRequestHasher();

        $result = $hasher->hash($this->makeRequest(['X-Cache-Token' => 'token-a'], 'id=1'));

        $this->assertSame('private_' . hash('sha256', 'token-a|id=1'), $result);
    }

    /**
     * build() reads the `headerName` option from the rule config array,
     * defaulting to `X-Cache-Token` when omitted.
     */
    public function testBuildUsesDefaultHeaderNameWhenOmitted(): void
    {
        $hasher = PrivateRequestHasher::build([]);

        $result = $hasher->hash($this->makeRequest(['X-Cache-Token' => 'token-a'], 'id=1'));

        $this->assertSame('private_' . hash('sha256', 'token-a|id=1'), $result);
    }

    /**
     * build() honors a custom `headerName` option.
     */
    public function testBuildUsesConfiguredHeaderName(): void
    {
        $hasher = PrivateRequestHasher::build(['headerName' => 'X-Custom-Token']);

        $result = $hasher->hash($this->makeRequest(['X-Custom-Token' => 'token-a'], 'id=1'));

        $this->assertSame('private_' . hash('sha256', 'token-a|id=1'), $result);
    }

    /**
     * The header lookup is case-insensitive, matching HTTP semantics and
     * the documented HeaderAwareRequestHasher pattern.
     */
    public function testHeaderLookupIsCaseInsensitive(): void
    {
        $hasher = new PrivateRequestHasher();

        $result = $hasher->hash($this->makeRequest(['x-cache-token' => 'token-a'], 'id=1'));

        $this->assertSame('private_' . hash('sha256', 'token-a|id=1'), $result);
    }
}

/**
 * Minimal RequestInterface double carrying fixed headers and a query
 * string.
 *
 * Deliberately independent of Tent's own Request/ProcessingRequest classes
 * (see DomainHashTestRequest's docblock for the same rationale).
 */
class PrivateRequestHasherTestRequest implements RequestInterface
{
    public function __construct(private array $headers, private string $query)
    {
    }

    public function requestMethod()
    {
        return 'GET';
    }

    public function body()
    {
        return '';
    }

    public function headers()
    {
        return $this->headers;
    }

    public function requestPath(): string
    {
        return '/staff/cache/summary.json';
    }

    public function query()
    {
        return $this->query;
    }

    public function uploadedFiles(): array
    {
        return [];
    }

    public function postFields(): array
    {
        return [];
    }

    public function domain(): string
    {
        return 'majora.example.com';
    }
}
