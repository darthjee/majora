<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\ForwardedHeaderFilter;

/**
 * Unit tests for ForwardedHeaderFilter.
 */
class ForwardedHeaderFilterTest extends TestCase
{
    /**
     * Headers on the base allow-list are kept, and no $extraAllowed is
     * needed for that.
     */
    public function testKeepsBaseAllowListedHeaders(): void
    {
        $headers = [
            'Host'             => 'client-host',
            'X-Forwarded-Host' => 'orig-host',
            'Cookie'           => 'session=abc',
            'X-Skip-Cache'     => '1',
            'Referer'          => 'http://client/page',
            'Accept-Language'  => 'en-US',
            'Accept'           => 'application/json',
            'Content-Type'     => 'application/json',
            'Authorization'    => 'Bearer tok',
        ];

        $this->assertSame($headers, ForwardedHeaderFilter::filter($headers));
    }

    /**
     * A header absent from both the base list and $extraAllowed is dropped.
     */
    public function testDropsHeaderNotOnBaseOrExtraList(): void
    {
        $headers = [
            'Authorization' => 'Bearer tok',
            'X-Trace-Id'    => 'trace-abc',
        ];

        $this->assertSame(
            ['Authorization' => 'Bearer tok'],
            ForwardedHeaderFilter::filter($headers)
        );
    }

    /**
     * A header supplied via $extraAllowed (e.g. UploadHandler's
     * X-Upload-Token) is kept, in addition to the base list.
     */
    public function testKeepsExtraAllowedHeader(): void
    {
        $headers = [
            'Authorization'  => 'Bearer tok',
            'X-Upload-Token' => 'up-tok',
            'X-Trace-Id'     => 'trace-abc',
        ];

        $this->assertSame(
            [
                'Authorization'  => 'Bearer tok',
                'X-Upload-Token' => 'up-tok',
            ],
            ForwardedHeaderFilter::filter($headers, ['X-Upload-Token'])
        );
    }

    /**
     * Matching (both base and extra list) is case-insensitive, and the
     * original casing of the incoming header name is preserved in the
     * result.
     */
    public function testMatchesCaseInsensitivelyAndPreservesOriginalCasing(): void
    {
        $headers = [
            'cookie'         => 'session=abc',
            'REFERER'        => 'http://client/page',
            'x-upload-token' => 'up-tok',
            'x-trace-id'     => 'trace-abc',
        ];

        $this->assertSame(
            [
                'cookie'         => 'session=abc',
                'REFERER'        => 'http://client/page',
                'x-upload-token' => 'up-tok',
            ],
            ForwardedHeaderFilter::filter($headers, ['X-Upload-Token'])
        );
    }

    /**
     * With no $extraAllowed argument, a header that would only be allowed
     * via an extra list (e.g. X-Upload-Token) is dropped.
     */
    public function testDropsExtraCandidateHeaderWhenNoExtraAllowedGiven(): void
    {
        $headers = ['X-Upload-Token' => 'up-tok'];

        $this->assertSame([], ForwardedHeaderFilter::filter($headers));
    }
}
