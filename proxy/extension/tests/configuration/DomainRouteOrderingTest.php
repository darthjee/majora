<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Configuration;
use Tent\Models\Request;
use Tent\Models\RequestInterface;
use Tent\Models\Rule;
use Tent\RequestHandlers\DefaultProxyRequestHandler;
use Tent\RequestHandlers\StaticFileHandler;

/**
 * Guards against a regression where `rules/domain.php`'s
 * `['method' => 'GET', 'uri' => '/domain', 'type' => 'begins_with']` static
 * handler — if registered before `rules/backend.php`'s
 * `['uri' => '.json', 'type' => 'ends_with']` proxy rule — swallows
 * `GET /domain/config.json` (the backend `/domain/config.json` API endpoint
 * added alongside domain.php in issue #759), since Tent picks the first
 * matching rule and `/domain/config.json` matches both.
 *
 * Both `dev_configuration/configure.php` and `prod_configuration/configure.php`
 * must `require` `rules/backend.php` before `rules/domain.php` so `.json`
 * requests under `/domain/` reach Django, while non-`.json` requests (the
 * manually-uploaded favicon static files, e.g. `/domain/<domain>/favicon.png`)
 * still fall through to the static handler.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class DomainRouteOrderingTest extends TestCase
{
    private const DEV_CONFIGURE = '/var/www/html/proxy/dev_configuration/configure.php';
    private const PROD_DOMAIN_RULE = '/var/www/html/proxy/prod_configuration/rules/domain.php';
    private const PROD_BACKEND_RULE = '/var/www/html/proxy/prod_configuration/rules/backend.php';

    protected function tearDown(): void
    {
        Configuration::reset();
    }

    /**
     * Requiring dev_configuration/configure.php directly exercises the exact
     * require order it defines, so this test fails the same way the reported
     * bug would (before the fix) if `rules/domain.php` were required before
     * `rules/backend.php` again.
     *
     * Both assertions live in a single test: configure.php requires each
     * rule file with `require_once`, so a second top-level `require` of
     * configure.php within the same PHP process (as a second test method
     * would trigger) is a no-op and re-registers nothing after
     * Configuration::reset() clears the rule list.
     */
    public function testDevConfigurationRoutesDomainRequests(): void
    {
        Configuration::reset();
        require self::DEV_CONFIGURE;

        $jsonHandler = $this->matchedHandler($this->request('/domain/config.json'));
        $this->assertInstanceOf(DefaultProxyRequestHandler::class, $jsonHandler);

        // Non-`.json` requests under `/domain/` (the manually-uploaded
        // favicon static files) must still be served by the static domain
        // handler.
        $faviconHandler = $this->matchedHandler($this->request('/domain/example.com/favicon.png'));
        $this->assertInstanceOf(StaticFileHandler::class, $faviconHandler);
    }

    /**
     * Same regression, exercised against prod_configuration's actual rule
     * files (which differ from dev's — they read `$backendHost`/
     * `$staticRoot`/`$cacheFolder`/`$cacheCleanupMap` instead of hard-coded
     * values). prod's own `configure.php` can't be required directly in this
     * suite: its `locals.php` is generated at deploy time and isn't part of
     * the repo (only `locals.php.sample` is committed), so this loads the
     * two rule files it wires together — in the same order `configure.php`
     * requires them post-fix (`backend.php` before `domain.php`) — with
     * equivalent locals supplied inline.
     *
     * Both assertions live in one test for the same require_once reason as
     * testDevConfigurationRoutesDomainRequests().
     */
    public function testProdRuleFilesRouteDomainRequests(): void
    {
        Configuration::reset();
        $cacheFolder = './cache';
        $backendHost = 'https://localhost:3030/';
        $staticRoot = '/home/moria_user/moria.ffavs.net';
        $cacheCleanupMap = [];
        require self::PROD_BACKEND_RULE;
        require self::PROD_DOMAIN_RULE;

        $jsonHandler = $this->matchedHandler($this->request('/domain/config.json'));
        $this->assertInstanceOf(DefaultProxyRequestHandler::class, $jsonHandler);

        // Same non-`.json` favicon carve-out, against prod_configuration's
        // rule files.
        $faviconHandler = $this->matchedHandler($this->request('/domain/example.com/favicon.png'));
        $this->assertInstanceOf(StaticFileHandler::class, $faviconHandler);
    }

    private function request(string $path): RequestInterface
    {
        return new Request(['requestMethod' => 'GET', 'requestPath' => $path]);
    }

    /**
     * Mirrors Tent\Service\RequestProcessor::getRequestHandler(): iterates
     * the configured rules in registration order and returns the handler of
     * the first one whose matchers apply to the request.
     */
    private function matchedHandler(RequestInterface $request)
    {
        foreach (Configuration::getRules() as $rule) {
            /** @var Rule $rule */
            if ($rule->match($request)) {
                return $rule->handler();
            }
        }

        return null;
    }
}
