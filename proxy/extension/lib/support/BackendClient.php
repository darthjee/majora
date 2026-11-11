<?php

namespace Tent\RequestHandlers;

use Tent\Http\CurlHttpClient;
use Tent\Http\HttpClientInterface;
use Tent\Utils\CurlUtils;

/**
 * Owns everything a proxy handler needs to call the Django backend, so that
 * logic isn't hand-rolled (and duplicated) by every handler that talks to
 * it: URL joining, forwarded-header allow-listing (via
 * ForwardedHeaderFilter), Host/X-Forwarded-Host remapping, the signed
 * client IP (X-Forwarded-For + X-Proxy-Secret, via ClientIpHeaders), and
 * gzip response decoding.
 *
 * Host/X-Forwarded-Host remapping replaces the RenameHeaderMiddleware +
 * SetHeadersMiddleware pair every backend-proxying handler used to wire up
 * identically in its constructor: the incoming request's original Host
 * (e.g. the browser-facing `moria.ffavs.net`) must never be forwarded as-is
 * when the backend lives behind a different host (e.g.
 * `moria-api.ffavs.net`) — edge providers like Cloudflare reject that
 * mismatch with a 403 before the request ever reaches the application.
 *
 * The signed client IP is what SetClientIpMiddleware sets on ordinary
 * proxied requests: X-Forwarded-For carrying Tent's own view of the client
 * (`$_SERVER['REMOTE_ADDR']`) and, when a secret is configured,
 * X-Proxy-Secret authenticating it. Handler rules don't run that
 * middleware over these backend calls, so without it the backend would
 * record the proxy's own address while still attaching the call to the
 * visitor's statistics session through the forwarded cookie. Neither
 * header is ever taken from the client: both stay off
 * ForwardedHeaderFilter's allow-list and any occurrence is stripped before
 * Tent's own values are set.
 *
 * Gzip handling exists because Tent\Http\CurlHttpExecutor\Base (in the
 * separate darthjee/tent framework repo) never decompresses a response
 * body itself. Since a raw curl decoding option isn't reachable from here,
 * this is done entirely with what HttpClientInterface::request() already
 * exposes: Accept-Encoding: gzip is added to every outgoing request, and
 * the response is gzdecode()-d after the fact when its headers report
 * Content-Encoding: gzip.
 */
class BackendClient
{

    /** @var string Backend host URL (e.g. http://backend:8080) */
    private string $host;

    /** @var HttpClientInterface HTTP client used for backend calls */
    private HttpClientInterface $httpClient;

    /** @var string Shared secret sent in X-Proxy-Secret; empty sends none */
    private string $secret;

    /** @var string|null Fixed client address; null reads REMOTE_ADDR per request */
    private ?string $remoteAddress;

    /**
     * @param string                   $host          Backend host URL.
     * @param HttpClientInterface|null $httpClient    HTTP client (defaults to CurlHttpClient).
     * @param string                   $secret        Shared secret sent in X-Proxy-Secret; an
     *                                                empty string means no secret header is sent.
     * @param string|null              $remoteAddress Client address sent in X-Forwarded-For.
     *                                                Defaults to null, meaning PHP's
     *                                                `$_SERVER['REMOTE_ADDR']` is read on every
     *                                                request; tests inject a fixed value instead.
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient=null,
        string $secret='',
        ?string $remoteAddress=null
    ) {
        $this->host = $host;
        $this->httpClient = ($httpClient ?? new CurlHttpClient());
        $this->secret = $secret;
        $this->remoteAddress = $remoteAddress;
    }

    /**
     * Joins the configured backend host and $path with exactly one slash,
     * regardless of whether $host has a trailing slash or $path has a
     * leading one — fixing the double-slash bug at its one true source.
     *
     * @param string $path The backend path, e.g. '/users/status.json'.
     * @return string The joined URL, e.g. 'http://backend:8080/users/status.json'.
     */
    public function url(string $path): string
    {
        return rtrim($this->host, '/') . '/' . ltrim($path, '/');
    }

    /**
     * Issues a backend HTTP request on behalf of a handler.
     *
     * 1. Builds the URL via url($path).
     * 2. Filters $incomingHeaders down to ForwardedHeaderFilter's base
     *    allow-list plus $extraAllowedHeaders.
     * 3. Overrides Host to the backend's own host, and sets
     *    X-Forwarded-Host from the original (case-insensitively looked up)
     *    incoming Host header, when present.
     * 4. Removes any X-Forwarded-For/X-Proxy-Secret (case-insensitively;
     *    neither is on the base allow-list, so this only matters if a
     *    caller lists one in $extraAllowedHeaders) and sets Tent's own:
     *    X-Forwarded-For from the client's remote address and, when a
     *    secret is configured, X-Proxy-Secret.
     * 5. Applies $overrideHeaders last (e.g. a forced Content-Type).
     * 6. Adds Accept-Encoding: gzip to the outgoing headers.
     * 7. Calls the underlying HttpClientInterface.
     * 8. gzdecode()s the response body when its headers report
     *    Content-Encoding: gzip.
     *
     * @param string      $method              The HTTP method (e.g. 'GET', 'PATCH', 'DELETE').
     * @param string      $path                The backend path, e.g. '/users/status.json'.
     * @param array       $incomingHeaders     The raw, unfiltered headers off the original
     *                                         client request.
     * @param string|null $body                Optional request body.
     * @param string[]    $extraAllowedHeaders Per-call additions to the base forwarded-header
     *                                         allow-list.
     * @param array       $overrideHeaders     Headers forced on the outgoing request, applied
     *                                         after filtering/host-remap (e.g. a forced
     *                                         Content-Type).
     * @return array{body: string, httpCode: int, headers: string[]}
     */
    public function request(
        string $method,
        string $path,
        array $incomingHeaders,
        ?string $body=null,
        array $extraAllowedHeaders=[],
        array $overrideHeaders=[]
    ): array {
        $url = $this->url($path);

        $headers = ForwardedHeaderFilter::filter($incomingHeaders, $extraAllowedHeaders);

        $originalHost = $this->headerValue($incomingHeaders, 'Host');

        $headers = $this->withoutHeader($headers, 'Host');
        $headers['Host'] = $this->backendHost();

        $headers = $this->withoutHeader($headers, 'X-Forwarded-Host');
        if ($originalHost !== null) {
            $headers['X-Forwarded-Host'] = $originalHost;
        }

        $headers = ClientIpHeaders::apply($headers, $this->clientAddress(), $this->secret);

        foreach ($overrideHeaders as $name => $value) {
            $headers[$name] = $value;
        }

        $headers['Accept-Encoding'] = 'gzip';

        $result = $this->httpClient->request($method, $url, $headers, $body);

        if ($this->isGzipEncoded(($result['headers'] ?? []))) {
            $result['body'] = gzdecode($result['body']);
        }

        return $result;
    }

    /**
     * The client address sent in X-Forwarded-For: the one injected at
     * construction, or Tent's own view of the connecting peer.
     *
     * @return string The address; empty when none is known.
     */
    private function clientAddress(): string
    {
        return ($this->remoteAddress ?? ClientIpHeaders::remoteAddress());
    }

    /**
     * Derives the bare host (no scheme, no trailing path) the backend
     * actually expects in the Host header.
     *
     * @return string The backend host, e.g. 'moria-api.ffavs.net'.
     */
    private function backendHost(): string
    {
        return (parse_url($this->host, PHP_URL_HOST) ?? $this->host);
    }

    /**
     * Looks up a header's value in $headers by name, case-insensitively.
     *
     * @param array  $headers Associative array of header name => value.
     * @param string $name    The header name to look up.
     * @return string|null The header's value, or null when absent.
     */
    private function headerValue(array $headers, string $name): ?string
    {
        foreach ($headers as $headerName => $value) {
            if (strcasecmp($headerName, $name) === 0) {
                return $value;
            }
        }

        return null;
    }

    /**
     * Returns $headers with any entry whose name matches $name
     * case-insensitively removed, so a header can be re-added under a
     * single, canonically-cased key.
     *
     * @param array  $headers Associative array of header name => value.
     * @param string $name    The header name to remove.
     * @return array $headers, without any case-insensitive match for $name.
     */
    private function withoutHeader(array $headers, string $name): array
    {
        return array_filter(
            $headers,
            fn (string $headerName): bool => strcasecmp($headerName, $name) !== 0,
            ARRAY_FILTER_USE_KEY
        );
    }

    /**
     * Checks whether a backend response's headers report
     * Content-Encoding: gzip.
     *
     * @param string[] $headerLines Response headers as "Name: Value" lines.
     * @return bool
     */
    private function isGzipEncoded(array $headerLines): bool
    {
        $headers = CurlUtils::mapHeaderLines($headerLines);

        return (($headers['content-encoding'] ?? '') === 'gzip');
    }
}
