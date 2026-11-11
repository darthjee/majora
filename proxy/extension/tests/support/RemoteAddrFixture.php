<?php

namespace Tent\RequestHandlers\Tests;

/**
 * Gives a test case a known `$_SERVER['REMOTE_ADDR']` (a documentation-range
 * address) for the duration of each test, and puts back whatever was there
 * before, so the value never leaks into another test.
 *
 * For tests going through code that reads the superglobal itself (e.g. a
 * handler building its own BackendClient). Not auto-loaded: `require_once`
 * it from the test file using it.
 */
trait RemoteAddrFixture
{
    /**
     * @var string|null Original REMOTE_ADDR, restored after each test.
     */
    private $originalRemoteAddr;

    /**
     * @return string The address tests see as the connecting client.
     */
    private static function clientAddress(): string
    {
        return '203.0.113.7';
    }

    /**
     * @before
     */
    protected function setRemoteAddr(): void
    {
        $this->originalRemoteAddr = $_SERVER['REMOTE_ADDR'] ?? null;
        $_SERVER['REMOTE_ADDR'] = self::clientAddress();
    }

    /**
     * @after
     */
    protected function restoreRemoteAddr(): void
    {
        if ($this->originalRemoteAddr === null) {
            unset($_SERVER['REMOTE_ADDR']);
        } else {
            $_SERVER['REMOTE_ADDR'] = $this->originalRemoteAddr;
        }
    }
}
