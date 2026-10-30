"""Replay navigation scenarios against the LOCAL stack and report the statistics they create.

Statistics bug investigation (Epic #1696, issue #1702). See README.md and
docs/agents/specs/statistics-bug/scripts.md.

Safety:

- local stack only: every base URL / host must be on `LOCAL_HOSTS`, with no override;
- `PROXY_SECRET` / `STATISTICS_SKIP_SECRET` come from the environment only and are never
  printed, logged or written;
- the `statistics:read` token lives in memory only;
- reports are written to the git-ignored `reports/` folder.

Standard library only.
"""

import argparse
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from http.cookies import SimpleCookie

# ---------------------------------------------------------------------------
# Safety: local hosts only
# ---------------------------------------------------------------------------

LOCAL_HOSTS = frozenset({
    'localhost', '127.0.0.1',
    # compose service / container names of the local stack
    'majora_proxy', 'majora_app', 'proxy', 'backend',
})

DEFAULT_BASE_URL = 'http://majora_proxy'
DEFAULT_BACKEND_URL = 'http://majora_app:8080'
DEFAULT_HOST = 'localhost:3000'
DEFAULT_APPROVAL_URL = 'http://localhost:3000/#/account/authorization_requests'

STATISTICS_COOKIE = 'majora_statistics'
EXPORT_PATH = '/staff/statistics/export.json'
EXPORT_PER_PAGE = 100
AUTH_CREATE_PATH = '/users/authorization_requests.json'
AUTH_POLL_PATH = '/users/authorization_requests/{uuid}.json'
# Route patterns (as stored in the tracking columns) of the script's own requests.
SELF_ROUTES = frozenset({
    'users/authorization_requests.json',
    'users/authorization_requests/<uuid:uuid>.json',
    'staff/statistics/export.json',
})
# Export timestamps are whole seconds: the scenario window is widened by this much on
# each side before filtering sessions by `created_at`.
WINDOW_SLACK = timedelta(seconds=1)
USER_AGENT = 'majora-statistics-bug-emulate/1.0 (local investigation)'


class Refused(Exception):
    """Raised when the script must not run (non-local target, missing secret, ...)."""


class AuthorizationFailed(Exception):
    """Raised when the device authorization is denied, expired or otherwise unusable."""


def host_of(value):
    """Return the lowercase hostname of a URL or a `host[:port]` value."""
    if '://' not in value:
        value = f'http://{value}'
    return (urllib.parse.urlsplit(value).hostname or '').lower()


def ensure_local(label, value):
    """Refuse anything whose host is not on `LOCAL_HOSTS`. There is no override."""
    host = host_of(value)
    if host not in LOCAL_HOSTS:
        raise Refused(
            f'{label} host {host!r} is not a local host; emulate.py only runs against the '
            f'local stack ({", ".join(sorted(LOCAL_HOSTS))}).'
        )


# ---------------------------------------------------------------------------
# Secrets: environment only, never printed
# ---------------------------------------------------------------------------


class Secrets:
    """Reads the local secrets from the environment. Values never leave this object.

    `repr` / `str` never show a value; callers only get a value to put in a header.
    """

    PROXY = 'PROXY_SECRET'
    SKIP = 'STATISTICS_SKIP_SECRET'

    def __init__(self, environ=None):
        """Keep a reference to the environment (no value is copied eagerly)."""
        self._environ = os.environ if environ is None else environ

    def available(self, name):
        """Return whether `name` is set to a non-empty value."""
        return bool(self._environ.get(name))

    def require(self, name, purpose):
        """Return the value of `name`, or raise `Refused` naming it (never its value)."""
        value = self._environ.get(name)
        if not value:
            raise Refused(f'{name} is not set (needed for {purpose}); add it to the root .env.')
        return value

    def __repr__(self):
        """Never show values."""
        return '<Secrets (values hidden)>'

    __str__ = __repr__


# ---------------------------------------------------------------------------
# HTTP primitives
# ---------------------------------------------------------------------------


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Return redirects as responses instead of following them."""

    def redirect_request(self, *args, **kwargs):  # noqa: D102
        return None


_OPENER = urllib.request.build_opener(_NoRedirect)


@dataclass
class Response:
    """One HTTP exchange, with its send and arrival times."""

    method: str
    path: str
    status: int
    headers: dict
    set_cookies: list
    body: bytes
    sent_at: float
    arrived_at: float
    arrival_seq: int = 0
    label: str = ''

    def json(self):
        """Return the decoded JSON body, or `None`."""
        try:
            return json.loads(self.body.decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            return None

    def header(self, name, default=None):
        """Return a response header, case-insensitively."""
        return self.headers.get(name.lower(), default)


def send(base_url, method, path, headers=None, body=None, timeout=30):
    """Send one request and return a `Response` (4xx/5xx included, never raised)."""
    ensure_local('request', base_url)
    url = base_url.rstrip('/') + path
    data = None
    headers = dict(headers or {})
    headers.setdefault('User-Agent', USER_AGENT)
    headers.setdefault('Accept', 'application/json')
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        headers.setdefault('Content-Type', 'application/json')
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    sent_at = time.time()
    try:
        raw = _OPENER.open(request, timeout=timeout)
    except urllib.error.HTTPError as error:
        raw = error
    with raw:
        content = raw.read()
        status = raw.status if hasattr(raw, 'status') else raw.code
        message = raw.headers
    arrived_at = time.time()
    return Response(
        method=method, path=path, status=status,
        headers={key.lower(): value for key, value in message.items()},
        set_cookies=message.get_all('Set-Cookie') or [],
        body=content, sent_at=sent_at, arrived_at=arrived_at,
    )


# ---------------------------------------------------------------------------
# Browser: cookie jar applying Set-Cookie in response ARRIVAL order
# ---------------------------------------------------------------------------


class Browser:
    """A per-scenario browser: one cookie jar, `Set-Cookie` applied in arrival order.

    The `Cookie` header is a snapshot of the jar when the request is sent; the response's
    `Set-Cookie` is applied when it arrives, under a lock, in arrival order. In a parallel
    burst a slower response therefore overwrites a newer cookie, as in a browser
    (hypothesis 2c). Cookies are keyed by name only: the jar is host-agnostic on purpose, so
    the host-change scenario can send the same cookie to another host.
    """

    def __init__(self, config, secrets, name='browser'):
        """Start with an empty jar."""
        self.config = config
        self.secrets = secrets
        self.name = name
        self.cookies = {}
        self.responses = []
        self._lock = threading.Lock()
        self._seq = 0

    # -- jar ------------------------------------------------------------------

    def cookie_header(self):
        """Return the `Cookie` header for the current jar, or `None` when empty."""
        with self._lock:
            if not self.cookies:
                return None
            return '; '.join(f'{name}={value}' for name, value in self.cookies.items())

    def clear_cookies(self):
        """Forget every cookie (e.g. a new private window)."""
        with self._lock:
            self.cookies.clear()

    def _apply(self, response):
        """Apply `response`'s cookies and stamp its arrival sequence number."""
        with self._lock:
            self._seq += 1
            response.arrival_seq = self._seq
            for header in response.set_cookies:
                self._apply_one(header)
            self.responses.append(response)

    def _apply_one(self, header):
        """Apply one `Set-Cookie` header value (deletion when max-age<=0 or expired)."""
        parsed = SimpleCookie()
        try:
            parsed.load(header)
        except Exception:  # noqa: BLE001 - a malformed cookie is ignored, like a browser
            return
        for name, morsel in parsed.items():
            if _cookie_deleted(morsel):
                self.cookies.pop(name, None)
            else:
                self.cookies[name] = morsel.value

    # -- requests -------------------------------------------------------------

    def request(self, method, path, headers=None, body=None, host=None, target='proxy',
                label=''):
        """Send one request with the jar's cookies; apply its `Set-Cookie` on arrival."""
        all_headers = {'Host': host or self.config.host}
        cookie = self.cookie_header()
        if cookie:
            all_headers['Cookie'] = cookie
        all_headers.update(headers or {})
        base_url = self.config.base_url if target == 'proxy' else self.config.backend_url
        response = send(base_url, method, path, headers=all_headers, body=body)
        response.label = label or path
        self._apply(response)
        return response

    def burst(self, requests):
        """Fire `requests` (dicts of `request` kwargs) in parallel, released together.

        All requests take their `Cookie` snapshot before the release, like a page refresh
        firing its API calls at once. Returns the responses in arrival order.
        """
        if not requests:
            return []
        barrier = threading.Barrier(len(requests))
        cookie = self.cookie_header()

        def fire(spec):
            spec = dict(spec)
            headers = {'Host': spec.pop('host', None) or self.config.host}
            if cookie:
                headers['Cookie'] = cookie
            headers.update(spec.pop('headers', None) or {})
            target = spec.pop('target', 'proxy')
            label = spec.pop('label', '') or spec['path']
            base_url = self.config.base_url if target == 'proxy' else self.config.backend_url
            barrier.wait()
            response = send(base_url, spec.pop('method', 'GET'), spec.pop('path'),
                            headers=headers, body=spec.pop('body', None))
            response.label = label
            self._apply(response)
            return response

        with ThreadPoolExecutor(max_workers=len(requests)) as pool:
            responses = list(pool.map(fire, requests))
        return sorted(responses, key=lambda response: response.arrival_seq)


def _cookie_deleted(morsel):
    """Return whether a parsed cookie deletes itself (max-age <= 0 or expires in the past)."""
    max_age = morsel['max-age']
    if max_age != '':
        try:
            return int(max_age) <= 0
        except ValueError:
            return False
    expires = morsel['expires']
    if expires:
        try:
            moment = datetime.strptime(expires, '%a, %d %b %Y %H:%M:%S GMT')
        except ValueError:
            return False
        return moment.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc)
    return False


# ---------------------------------------------------------------------------
# The script's own requests: untracked (skip secret), token in memory
# ---------------------------------------------------------------------------


class SelfClient:
    """Sends the script's own requests: no cookie, always with the statistics skip header."""

    def __init__(self, config, secrets):
        """Require the skip secret up front: the script must never track itself."""
        self.config = config
        self._skip = secrets.require(Secrets.SKIP, "the script's own untracked requests")
        self._token = None

    def set_token(self, token):
        """Keep the scoped token in memory only."""
        self._token = token

    @property
    def has_token(self):
        """Return whether a token is held."""
        return self._token is not None

    def request(self, method, path, headers=None, body=None, authenticated=False):
        """Send an untracked request through the proxy."""
        all_headers = {'Host': self.config.host, 'X-Statistics-Skip-Secret': self._skip}
        if authenticated:
            all_headers['Authorization'] = f'Bearer {self._token}'
        all_headers.update(headers or {})
        return send(self.config.base_url, method, path, headers=all_headers, body=body)

    def __repr__(self):
        """Never show the secret or the token."""
        return '<SelfClient (secrets hidden)>'


class DeviceAuthorization:
    """Gets a `statistics:read` scoped token through the device-authorization flow (#1708)."""

    POLL_INTERVAL_SECONDS = 3
    SCOPES = ['statistics:read']

    def __init__(self, client, config, out=sys.stdout):
        """Store the untracked client."""
        self.client = client
        self.config = config
        self.out = out

    def obtain(self):
        """Create the request, print the approval link, poll; return the token (memory only)."""
        uuid, poll_secret, expires_at = self._create()
        print(
            f'\nApprove the device authorization as the local staff user '
            f'{self.config.username!r} at:\n\n    {self.config.approval_url}\n\n'
            f'(waiting until {expires_at or "it expires"}; do not browse the local site '
            f'during the run)\n',
            file=self.out, flush=True,
        )
        return self._poll(uuid, poll_secret)

    def _create(self):
        response = self.client.request(
            'POST', AUTH_CREATE_PATH,
            body={'username': self.config.username, 'scopes': self.SCOPES},
        )
        payload = response.json() or {}
        if response.status != 201 or 'uuid' not in payload or 'token' not in payload:
            raise AuthorizationFailed(
                f'could not create the authorization request (HTTP {response.status}, '
                f'{_error_code(payload)})'
            )
        return payload['uuid'], payload['token'], payload.get('expiration')

    def _poll(self, uuid, poll_secret):
        path = AUTH_POLL_PATH.format(uuid=urllib.parse.quote(uuid))
        headers = {'X-Authorize-Token': poll_secret, 'X-Skip-Cache': 'true'}
        while True:
            response = self.client.request('GET', path, headers=headers)
            payload = response.json() or {}
            if response.status == 202 and payload.get('status') == 'approved':
                token = payload.get('token') or ''
                if not token.startswith('mjr_'):
                    raise AuthorizationFailed('the approval did not issue a scoped mjr_ token')
                print('Authorization approved; token kept in memory only.', file=self.out,
                      flush=True)
                return token
            if response.status == 200 and payload.get('status') == 'open':
                time.sleep(self.POLL_INTERVAL_SECONDS)
                continue
            if response.status == 422:
                raise AuthorizationFailed('the authorization request expired')
            if response.status == 403:
                raise AuthorizationFailed('the authorization request was denied or consumed')
            raise AuthorizationFailed(f'unexpected poll response (HTTP {response.status})')


def _error_code(payload):
    """Return a short, safe description of an error payload."""
    if isinstance(payload, dict):
        if 'error' in payload:
            return str(payload['error'])
        if 'errors' in payload:
            return json.dumps(payload['errors'])[:200]
    return 'no error code'


# ---------------------------------------------------------------------------
# Export reader
# ---------------------------------------------------------------------------


def parse_iso(value):
    """Parse an ISO 8601 UTC timestamp from the export."""
    if value is None:
        return None
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


@dataclass
class Window:
    """A scenario's time window (UTC)."""

    start: datetime
    end: datetime = None

    @classmethod
    def open_now(cls):
        """Start a window now."""
        return cls(start=datetime.now(timezone.utc))

    def close(self):
        """End the window now."""
        self.end = datetime.now(timezone.utc)
        return self

    def widened(self):
        """Return `(start, end)` widened by `WINDOW_SLACK` (whole-second export timestamps)."""
        start = self.start.replace(microsecond=0) - WINDOW_SLACK
        end = self.end.replace(microsecond=0) + WINDOW_SLACK
        return start, end


class ExportReader:
    """Pages sequentially through `GET /staff/statistics/export.json` with the token.

    The export filters by local day (`from` / `to`, `tz=UTC`); the sessions are then filtered
    by `created_at` inside the scenario window widened by `WINDOW_SLACK` on each side, since
    the export's timestamps are whole seconds.
    """

    def __init__(self, client):
        """Store the authenticated, untracked client."""
        self.client = client

    def sessions(self, window):
        """Return the sessions created inside `window` (widened), each with its visits."""
        start, end = window.widened()
        return [
            session for session in self._all_pages(start.date(), end.date())
            if start <= parse_iso(session['created_at']) <= end
        ]

    def _all_pages(self, from_date, to_date):
        page, pages = 1, 1
        while page <= pages:
            query = urllib.parse.urlencode({
                'from': from_date.isoformat(), 'to': to_date.isoformat(), 'tz': 'UTC',
                'page': page, 'per_page': EXPORT_PER_PAGE,
            })
            response = self.client.request('GET', f'{EXPORT_PATH}?{query}', authenticated=True)
            if response.status != 200:
                raise AuthorizationFailed(
                    f'export refused (HTTP {response.status}, '
                    f'{_error_code(response.json())})'
                )
            yield from response.json() or []
            pages = int(response.header('pages', '1') or 1)
            page += 1


def self_pollution_check(reader, window):
    """Return the result of checking that the script's own requests created no statistics.

    Looks, inside `window`, for sessions created by one of the script's own routes and for
    visits opened or last touched on one of them.
    """
    sessions = reader.sessions(window)
    polluted_sessions = [s for s in sessions if s.get('first_path') in SELF_ROUTES]
    polluted_visits = [
        visit for session in sessions for visit in session.get('visits', [])
        if visit.get('first_path') in SELF_ROUTES or visit.get('last_path') in SELF_ROUTES
    ]
    return {
        'window_sessions': len(sessions),
        'self_sessions': len(polluted_sessions),
        'self_visits': len(polluted_visits),
        'ok': not polluted_sessions and not polluted_visits,
    }


# ---------------------------------------------------------------------------
# Configuration and entry point
# ---------------------------------------------------------------------------


@dataclass
class Config:
    """Resolved, validated configuration."""

    base_url: str
    backend_url: str
    host: str
    approval_url: str
    username: str
    reports_dir: str
    scenarios: list = field(default_factory=list)
    dry_run: bool = False

    def validate(self):
        """Refuse any non-local target. There is no override flag."""
        ensure_local('base URL', self.base_url)
        ensure_local('backend URL', self.backend_url)
        ensure_local('Host header', self.host)
        ensure_local('approval URL', self.approval_url)
        return self


def parse_args(argv=None, environ=None):
    """Build the `Config` from arguments, then the environment, then local defaults."""
    environ = os.environ if environ is None else environ
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--base-url', default=environ.get('MAJORA_BASE_URL', DEFAULT_BASE_URL),
                        help='proxy base URL (local only)')
    parser.add_argument('--backend-url',
                        default=environ.get('MAJORA_BACKEND_URL', DEFAULT_BACKEND_URL),
                        help='backend base URL (local only)')
    parser.add_argument('--host', default=environ.get('MAJORA_HOST', DEFAULT_HOST),
                        help='Host header of the emulated browser (local only)')
    parser.add_argument('--approval-url',
                        default=environ.get('MAJORA_APPROVAL_URL', DEFAULT_APPROVAL_URL),
                        help='local page where the staff user approves the request')
    parser.add_argument('--username', default=environ.get('MAJORA_USERNAME', ''),
                        help='local staff username (or e-mail) that approves the request')
    parser.add_argument('--reports-dir', default='reports')
    parser.add_argument('--scenario', action='append', default=[],
                        help='run only this scenario (repeatable)')
    parser.add_argument('--dry-run', action='store_true',
                        help='validate configuration and secrets only; send nothing')
    args = parser.parse_args(argv)
    return Config(
        base_url=args.base_url, backend_url=args.backend_url, host=args.host,
        approval_url=args.approval_url, username=args.username,
        reports_dir=args.reports_dir, scenarios=args.scenario, dry_run=args.dry_run,
    ).validate()


def authorize(config, secrets):
    """Return `(client, reader, self_check)`: an authorized client and the pollution check."""
    if not config.username:
        raise Refused('no local staff username: pass --username or set MAJORA_USERNAME.')
    client = SelfClient(config, secrets)
    window = Window.open_now()
    client.set_token(DeviceAuthorization(client, config).obtain())
    window.close()
    reader = ExportReader(client)
    return client, reader, self_pollution_check(reader, window)


def main(argv=None):
    """Entry point."""
    try:
        config = parse_args(argv)
        secrets = Secrets()
        SelfClient(config, secrets)  # fails early when the skip secret is missing
        if config.dry_run:
            print('Dry run: configuration is local-only and the skip secret is present. '
                  f'{Secrets.PROXY} present: {secrets.available(Secrets.PROXY)}.')
            return 0
        _client, _reader, self_check = authorize(config, secrets)
        print(f'Self-pollution check: {"ok" if self_check["ok"] else "FAILED"} '
              f'({self_check["self_sessions"]} session(s), {self_check["self_visits"]} '
              'visit(s) from the script\'s own routes).')
        return 0
    except Refused as error:
        print(f'Refused: {error}', file=sys.stderr)
        return 2
    except AuthorizationFailed as error:
        print(f'Authorization failed: {error}. No report written.', file=sys.stderr)
        return 3


if __name__ == '__main__':
    sys.exit(main())
