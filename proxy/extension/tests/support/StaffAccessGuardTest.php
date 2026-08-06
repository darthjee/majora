<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\RequestHandlers\BackendClient;
use Tent\RequestHandlers\BackendErrorException;
use Tent\RequestHandlers\StaffAccessGuard;

/**
 * Unit tests for StaffAccessGuard.
 *
 * Covers the staff-gating logic extracted out of CacheSizeHandler (see
 * issue #994): logged-out, staff-only, superuser-only, and a non-200
 * backend response being forwarded as-is.
 */
class StaffAccessGuardTest extends TestCase
{
    /**
     * Builds a fake /users/status.json response body.
     */
    private function statusBody(bool $loggedIn, bool $isStaff = false, bool $isSuperuser = false): string
    {
        return json_encode([
            'logged_in'    => $loggedIn,
            'is_staff'     => $isStaff,
            'is_superuser' => $isSuperuser,
        ]);
    }

    /**
     * A staff user (is_staff: true) passes silently (no exception).
     */
    public function testStaffUserIsAllowed(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with('GET', 'http://backend:8080/users/status.json', $this->anything())
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        StaffAccessGuard::requireStaffAccess($client, ['Authorization' => 'Bearer tok']);

        $this->addToAssertionCount(1);
    }

    /**
     * A superuser (is_superuser: true, is_staff: false) also passes: either
     * flag alone is sufficient.
     */
    public function testSuperuserAloneIsAllowed(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, false, true),
                'headers'  => [],
            ]);

        StaffAccessGuard::requireStaffAccess($client, ['Authorization' => 'Bearer tok']);

        $this->addToAssertionCount(1);
    }

    /**
     * Not logged in: 403, regardless of the (irrelevant) staff/superuser
     * flags.
     */
    public function testNotLoggedInThrowsForbidden(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(false, true, true),
                'headers'  => [],
            ]);

        try {
            StaffAccessGuard::requireStaffAccess($client, []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame(403, $e->httpCode());
            $this->assertSame('{"error":"Forbidden"}', $e->body());
        }
    }

    /**
     * Logged in, but neither staff nor superuser: 403.
     */
    public function testLoggedInWithoutStaffOrSuperuserThrowsForbidden(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, false, false),
                'headers'  => [],
            ]);

        try {
            StaffAccessGuard::requireStaffAccess($client, []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame(403, $e->httpCode());
        }
    }

    /**
     * A non-200 response from /users/status.json (e.g. a backend 500) is
     * propagated as-is, not collapsed to 403.
     */
    public function testUpstreamFailureIsPropagatedAsIs(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 500,
                'body'     => 'Internal Server Error',
                'headers'  => [],
            ]);

        try {
            StaffAccessGuard::requireStaffAccess($client, []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame(500, $e->httpCode());
            $this->assertSame('Internal Server Error', $e->body());
        }
    }
}
