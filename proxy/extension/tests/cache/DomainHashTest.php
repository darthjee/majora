<?php

namespace Tent\Cache\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Cache\DomainHash;
use Tent\Models\RequestInterface;

/**
 * Unit tests for DomainHash.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class DomainHashTest extends TestCase
{
    /**
     * Builds a minimal RequestInterface double carrying only the given
     * domain and query string, decoupled from Tent's own Request/
     * ProcessingRequest implementations (whose `domain()` support varies
     * across Tent versions).
     */
    private function makeRequest(string $domain, string $query = ''): RequestInterface
    {
        return new DomainHashTestRequest($domain, $query);
    }

    /**
     * The returned hash is exactly `'domain_' . hash('sha256', $domain)` —
     * the documented, reproducible format callers (and cache invalidation
     * tooling) can rely on.
     */
    public function testHashMatchesExpectedFormat(): void
    {
        $request = $this->makeRequest('game-a.example.com', 'id=1');

        $result = DomainHash::hash($request);

        $this->assertSame('domain_' . hash('sha256', 'game-a.example.com'), $result);
    }

    /**
     * The same domain always hashes identically.
     */
    public function testSameDomainHashesIdentically(): void
    {
        $first = DomainHash::hash($this->makeRequest('game-a.example.com', 'id=1'));
        $second = DomainHash::hash($this->makeRequest('game-a.example.com', 'id=1'));

        $this->assertSame($first, $second);
    }

    /**
     * Different domains hash differently — this is the whole point of
     * partitioning the cache by domain via the folder name.
     */
    public function testDifferentDomainsHashDifferently(): void
    {
        $domainA = DomainHash::hash($this->makeRequest('game-a.example.com', 'id=1'));
        $domainB = DomainHash::hash($this->makeRequest('game-b.example.com', 'id=1'));

        $this->assertNotSame($domainA, $domainB);
    }

    /**
     * The query string does not affect the hash — explicit contrast with the
     * old HostQueryRequestHasher, which mixed domain and query into the
     * cache-key hash. Domain-only partitioning via the folder (not
     * domain+query mixed into the key) is the whole point of this change.
     */
    public function testQueryStringDoesNotAffectHash(): void
    {
        $queryOne = DomainHash::hash($this->makeRequest('game-a.example.com', 'id=1'));
        $queryTwo = DomainHash::hash($this->makeRequest('game-a.example.com', 'id=2'));

        $this->assertSame($queryOne, $queryTwo);
    }
}

/**
 * Minimal RequestInterface double carrying a fixed domain and query string.
 *
 * Deliberately independent of Tent's own Request/ProcessingRequest classes:
 * `domain()` support on those varies across Tent versions (it's part of the
 * production `darthjee/tent` image this proxy runs on, but absent from the
 * `darthjee/tent-test` image's bundled Tent source used to run this suite),
 * so this double is the only reliable way to exercise DomainHash's use of
 * `RequestInterface::domain()` here.
 */
class DomainHashTestRequest implements RequestInterface
{
    public function __construct(private string $domain, private string $query)
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
        return [];
    }

    public function requestPath(): string
    {
        return '/games.json';
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
        return $this->domain;
    }
}
