<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\ClientIpHeaders;

/**
 * Unit tests for ClientIpHeaders.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class ClientIpHeadersTest extends TestCase
{
    /**
     * @var string|null Original REMOTE_ADDR, restored after each test.
     */
    private $originalRemoteAddr;

    protected function setUp(): void
    {
        $this->originalRemoteAddr = $_SERVER['REMOTE_ADDR'] ?? null;
    }

    protected function tearDown(): void
    {
        if ($this->originalRemoteAddr === null) {
            unset($_SERVER['REMOTE_ADDR']);
        } else {
            $_SERVER['REMOTE_ADDR'] = $this->originalRemoteAddr;
        }
    }

    public function testNamesListsBothHeaders(): void
    {
        $this->assertSame(['X-Forwarded-For', 'X-Proxy-Secret'], ClientIpHeaders::names());
    }

    /**
     * With a secret, both headers are returned.
     */
    public function testBuildWithSecretReturnsBothHeaders(): void
    {
        $this->assertSame(
            [
                'X-Forwarded-For' => '203.0.113.7',
                'X-Proxy-Secret'  => 'dummy-secret',
            ],
            ClientIpHeaders::build('203.0.113.7', 'dummy-secret')
        );
    }

    /**
     * An empty secret sends no X-Proxy-Secret.
     */
    public function testBuildWithEmptySecretReturnsOnlyForwardedFor(): void
    {
        $this->assertSame(
            ['X-Forwarded-For' => '203.0.113.7'],
            ClientIpHeaders::build('203.0.113.7', '')
        );
    }

    /**
     * The secret defaults to empty.
     */
    public function testBuildWithoutSecretReturnsOnlyForwardedFor(): void
    {
        $this->assertSame(
            ['X-Forwarded-For' => '192.0.2.10'],
            ClientIpHeaders::build('192.0.2.10')
        );
    }

    /**
     * An empty remote address still yields the header (with an empty
     * value), matching SetClientIpMiddleware's behaviour.
     */
    public function testBuildWithEmptyRemoteAddress(): void
    {
        $this->assertSame(
            [
                'X-Forwarded-For' => '',
                'X-Proxy-Secret'  => 'dummy-secret',
            ],
            ClientIpHeaders::build('', 'dummy-secret')
        );
    }

    /**
     * Both headers are removed whatever their casing; everything else is
     * kept untouched, in order.
     */
    public function testStripRemovesBothHeadersRegardlessOfCase(): void
    {
        $headers = [
            'Cookie'          => 'session=abc',
            'X-Forwarded-For' => '192.0.2.1',
            'x-forwarded-for' => '192.0.2.2',
            'X-PROXY-SECRET'  => 'guess',
            'x-proxy-secret'  => 'other-guess',
            'Accept'          => 'application/json',
        ];

        $this->assertSame(
            [
                'Cookie' => 'session=abc',
                'Accept' => 'application/json',
            ],
            ClientIpHeaders::strip($headers)
        );
    }

    public function testStripLeavesUnrelatedHeadersUntouched(): void
    {
        $headers = ['Host' => 'client-host', 'X-Forwarded-Host' => 'orig-host'];

        $this->assertSame($headers, ClientIpHeaders::strip($headers));
    }

    /**
     * Client-supplied values are replaced, never appended to.
     */
    public function testApplyReplacesClientSuppliedValues(): void
    {
        $headers = [
            'Cookie'          => 'session=abc',
            'x-forwarded-for' => '192.0.2.1',
            'X-Proxy-Secret'  => 'guess',
        ];

        $this->assertSame(
            [
                'Cookie'          => 'session=abc',
                'X-Forwarded-For' => '203.0.113.7',
                'X-Proxy-Secret'  => 'dummy-secret',
            ],
            ClientIpHeaders::apply($headers, '203.0.113.7', 'dummy-secret')
        );
    }

    /**
     * With an empty secret a client-supplied X-Proxy-Secret is dropped and
     * nothing is sent in its place.
     */
    public function testApplyWithEmptySecretDropsClientSecret(): void
    {
        $this->assertSame(
            ['X-Forwarded-For' => '203.0.113.7'],
            ClientIpHeaders::apply(['x-Proxy-Secret' => 'guess'], '203.0.113.7')
        );
    }

    public function testRemoteAddressReadsServerSuperglobal(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';

        $this->assertSame('203.0.113.7', ClientIpHeaders::remoteAddress());
    }

    public function testRemoteAddressIsEmptyWhenUnset(): void
    {
        unset($_SERVER['REMOTE_ADDR']);

        $this->assertSame('', ClientIpHeaders::remoteAddress());
    }
}
