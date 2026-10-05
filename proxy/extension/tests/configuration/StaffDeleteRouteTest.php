<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Configuration;
use Tent\Models\Request;
use Tent\Models\Rule;
use Tent\RequestHandlers\DefaultProxyRequestHandler;
use Tent\RequestHandlers\DeleteHandler;

/**
 * `DELETE /staff/photos/<type>/<id>.json` must reach DeleteHandler (which
 * deletes the file) rather than the generic `default_proxy` `.json` rule in
 * `rules/backend.php` (issue #1472). Loads the real dev/prod `delete.php`
 * and `backend.php` rule files in configure.php's order, from temporary
 * copies (see BackendRuleCacheClearTest for why copies are required).
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class StaffDeleteRouteTest extends TestCase
{
    /** @var string Temporary folder holding the rule file copies and cache. */
    private string $tmpDir;

    protected function setUp(): void
    {
        Configuration::reset();
        $this->tmpDir = sys_get_temp_dir() . '/test_staff_delete_route_' . uniqid();
        mkdir($this->tmpDir, 0755, true);
    }

    protected function tearDown(): void
    {
        Configuration::reset();
        foreach (glob($this->tmpDir . '/*') as $file) {
            unlink($file);
        }
        rmdir($this->tmpDir);
    }

    public function testDevRoutesStaffPhotoDeleteToDeleteHandler(): void
    {
        $cacheFolder     = $this->tmpDir;
        $cacheCleanupMap = [];
        $proxySecret     = '';
        require $this->copyOf('/proxy/dev_configuration/rules/delete.php');
        require $this->copyOf('/proxy/dev_configuration/rules/backend.php');

        $this->assertRouting();
    }

    public function testProdRoutesStaffPhotoDeleteToDeleteHandler(): void
    {
        $cacheFolder     = $this->tmpDir;
        $backendHost     = 'https://localhost:3030/';
        $photosPath      = '/var/www/html';
        $cacheCleanupMap = [];
        $proxySecret     = '';
        require $this->copyOf('/proxy/prod_configuration/rules/delete.php');
        require $this->copyOf('/proxy/prod_configuration/rules/backend.php');

        $this->assertRouting();
    }

    private function assertRouting(): void
    {
        $this->assertInstanceOf(
            DeleteHandler::class,
            $this->matchedHandler('DELETE', '/staff/photos/main/3.json')
        );
        $this->assertInstanceOf(
            DeleteHandler::class,
            $this->matchedHandler('DELETE', '/games/my-game/pcs/4/photos/7.json')
        );
        $this->assertInstanceOf(
            DefaultProxyRequestHandler::class,
            $this->matchedHandler('GET', '/staff/photos/main/3/deletable.json')
        );
        $this->assertInstanceOf(
            DefaultProxyRequestHandler::class,
            $this->matchedHandler('DELETE', '/staff/photos/../3.json')
        );
    }

    private function copyOf(string $relativePath): string
    {
        $copy = $this->tmpDir . '/rule_' . uniqid() . '.php';
        copy(dirname(__DIR__, 3) . $relativePath, $copy);
        return $copy;
    }

    private function matchedHandler(string $method, string $path)
    {
        $request = new Request(['requestMethod' => $method, 'requestPath' => $path]);
        foreach (Configuration::getRules() as $rule) {
            /** @var Rule $rule */
            if ($rule->match($request)) {
                return $rule->handler();
            }
        }

        return null;
    }
}
