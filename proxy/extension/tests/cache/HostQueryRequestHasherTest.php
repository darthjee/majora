<?php

namespace Tent\Cache\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Cache\HostQueryRequestHasher;
use Tent\Models\RequestInterface;

/**
 * Unit tests for HostQueryRequestHasher.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class HostQueryRequestHasherTest extends TestCase
{
    /**
     * Builds a minimal RequestInterface double carrying only the given
     * domain and query string, decoupled from Tent's own Request/
     * ProcessingRequest implementations (whose `domain()` support varies
     * across Tent versions).
     */
    private function makeRequest(string $domain, string $query): RequestInterface
    {
        return new HostQueryRequestHasherTestRequest($domain, $query);
    }

    /**
     * The returned hash is exactly `hash('sha256', "$domain|$query")` — the
     * documented, reproducible format callers (and cache invalidation
     * tooling) can rely on.
     */
    public function testHashMatchesExpectedSha256Format(): void
    {
        $hasher = new HostQueryRequestHasher();
        $request = $this->makeRequest('game-a.example.com', 'id=1');

        $result = $hasher->hash($request);

        $this->assertSame(hash('sha256', 'game-a.example.com|id=1'), $result);
    }

    /**
     * The same domain and query string always hash identically.
     */
    public function testSameDomainAndQueryHashIdentically(): void
    {
        $hasher = new HostQueryRequestHasher();
        $first = $hasher->hash($this->makeRequest('game-a.example.com', 'id=1'));
        $second = $hasher->hash($this->makeRequest('game-a.example.com', 'id=1'));

        $this->assertSame($first, $second);
    }

    /**
     * Different domains requesting the same query string must not collide —
     * this is the whole point of combining domain and query, since both
     * domains now share one physical cache folder.
     */
    public function testDifferentDomainsWithSameQueryHashDifferently(): void
    {
        $hasher = new HostQueryRequestHasher();
        $domainA = $hasher->hash($this->makeRequest('game-a.example.com', 'id=1'));
        $domainB = $hasher->hash($this->makeRequest('game-b.example.com', 'id=1'));

        $this->assertNotSame($domainA, $domainB);
    }

    /**
     * The same domain with different query strings also hashes differently.
     */
    public function testSameDomainWithDifferentQueryHashDifferently(): void
    {
        $hasher = new HostQueryRequestHasher();
        $queryOne = $hasher->hash($this->makeRequest('game-a.example.com', 'id=1'));
        $queryTwo = $hasher->hash($this->makeRequest('game-a.example.com', 'id=2'));

        $this->assertNotSame($queryOne, $queryTwo);
    }

    /**
     * build() ignores its params argument and always returns a usable
     * instance, since this hasher is not configurable.
     */
    public function testBuildReturnsUsableInstance(): void
    {
        $hasher = HostQueryRequestHasher::build([]);
        $request = $this->makeRequest('game-a.example.com', 'id=1');

        $result = $hasher->hash($request);

        $this->assertSame(hash('sha256', 'game-a.example.com|id=1'), $result);
    }
}

/**
 * Minimal RequestInterface double carrying a fixed domain and query string.
 *
 * Deliberately independent of Tent's own Request/ProcessingRequest classes:
 * `domain()` support on those varies across Tent versions (it's part of the
 * production `darthjee/tent` image this proxy runs on, but absent from the
 * `darthjee/tent-test` image's bundled Tent source used to run this suite),
 * so this double is the only reliable way to exercise
 * HostQueryRequestHasher's use of `RequestInterface::domain()` here.
 */
class HostQueryRequestHasherTestRequest implements RequestInterface
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
