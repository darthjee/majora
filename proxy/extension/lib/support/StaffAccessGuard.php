<?php

namespace Tent\RequestHandlers;

/**
 * Gates access to a staff-only proxy endpoint behind the backend's
 * admin/staff check.
 *
 * Extracted out of CacheSizeHandler (see issue #994) so the same check can
 * be reused by other staff-only handlers (e.g. CacheClearHandler) without
 * duplicating the logic.
 */
class StaffAccessGuard
{
    /**
     * Calls the backend's users/status.json endpoint and ensures the caller
     * is logged in and is either staff or a superuser.
     *
     * @param BackendClient $client  Client used to call the backend.
     * @param array         $headers Raw, unfiltered incoming request headers.
     * @return void
     * @throws BackendErrorException When the backend call itself fails
     *                                (forwarded as-is), or the caller isn't
     *                                admin/staff (403).
     */
    public static function requireStaffAccess(BackendClient $client, array $headers): void
    {
        $result = $client->request('GET', '/users/status.json', $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }

        $body = json_decode($result['body'], true);

        $loggedIn    = (($body['logged_in'] ?? false) === true);
        $isStaff     = (($body['is_staff'] ?? false) === true);
        $isSuperuser = (($body['is_superuser'] ?? false) === true);

        if (!$loggedIn || (!$isStaff && !$isSuperuser)) {
            throw new BackendErrorException(403, '{"error":"Forbidden"}');
        }
    }
}
