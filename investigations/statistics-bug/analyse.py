"""Analyse the statistics export: group probable duplicate sessions and classify their cause.

Statistics bug investigation (Epic #1696, issue #1703). See README.md and
docs/agents/specs/statistics-bug/scripts.md.

Safety:

- read-only: the script only creates and polls a device-authorization request and pages
  sequentially through `GET /staff/statistics/export.json`; it makes no other request;
- targets: without `--production` every URL must be on `LOCAL_HOSTS`; with `--production`
  the only target is `STATISTICS_PROD_URL` from the environment (https only, never an
  argument value). Any other host is refused, with no override;
- `STATISTICS_SKIP_SECRET` is optional and only ever sent to local targets, never to
  production; `STATISTICS_PROD_URL` and every secret are never printed, logged or written;
- the `statistics:read` token lives in memory only and is never printed, logged or written;
  the script reminds the user to revoke it and does not revoke it itself;
- a denied or expired authorization, or a token rejected later, stops the run with no
  partial report;
- reports are written to the git-ignored `reports/` folder;
- validation mode (`--validate`) runs against the local stack only.

Standard library only. It re-implements the small HTTP / authorization / export helpers of
`emulate.py` (same shapes) instead of importing it: `python -I` keeps this folder off
`sys.path`, and production needs a different allowlist and no skip header.
"""

from __future__ import annotations

import argparse
import os
import sys
import urllib.error
import urllib.parse
from dataclasses import dataclass
from datetime import date

# ---------------------------------------------------------------------------
# Safety: local hosts, or the configured production URL only
# ---------------------------------------------------------------------------

LOCAL_HOSTS = frozenset({
    'localhost', '127.0.0.1',
    # compose service / container names of the local stack
    'majora_proxy', 'majora_app', 'proxy', 'backend',
})

DEFAULT_BASE_URL = 'http://majora_proxy'
DEFAULT_HOST = 'localhost:3000'
DEFAULT_APPROVAL_URL = 'http://localhost:3000/#/account/authorization_requests'
APPROVAL_FRAGMENT = '/#/account/authorization_requests'
PROD_URL_VARIABLE = 'STATISTICS_PROD_URL'
DEFAULT_RACE_WINDOW = 2

# Exit codes (same as emulate.py, plus 1 for a validation mismatch).
EXIT_OK, EXIT_MISMATCH, EXIT_REFUSED, EXIT_AUTH, EXIT_NETWORK = 0, 1, 2, 3, 4


class Refused(Exception):
    """Raised when the script must not run (disallowed target, bad arguments, ...)."""


class AuthorizationFailed(Exception):
    """Raised when the authorization is denied or expired, or the token / export is refused."""


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
            f'{label} host {host!r} is not a local host; without --production analyse.py '
            f'only runs against the local stack ({", ".join(sorted(LOCAL_HOSTS))}).'
        )


@dataclass(frozen=True)
class Target:
    """The single set of hosts this run may talk to.

    Local: `LOCAL_HOSTS`. Production: exactly the host of `STATISTICS_PROD_URL`. The repr
    never shows the production host.
    """

    production: bool
    allowed: frozenset

    @classmethod
    def local(cls):
        """Return the local target (the local stack's host names)."""
        return cls(production=False, allowed=LOCAL_HOSTS)

    @classmethod
    def from_production_url(cls, url):
        """Return the production target for `url` (already checked to be https)."""
        return cls(production=True, allowed=frozenset({host_of(url)}))

    def check(self, label, value):
        """Refuse `value` unless its host is allowed for this run."""
        if not self.production:
            ensure_local(label, value)
            return
        if host_of(value) not in self.allowed:
            # Never name the production host: only say the URL is not the configured one.
            raise Refused(f'{label} is not the configured production URL; refused.')

    def __repr__(self):
        """Never show the production host."""
        return f'<Target {"production (host hidden)" if self.production else "local"}>'


def production_url(environ):
    """Return `STATISTICS_PROD_URL` from the environment, refusing a missing or non-https one."""
    value = (environ.get(PROD_URL_VARIABLE) or '').strip().rstrip('/')
    if not value:
        raise Refused(f'--production needs {PROD_URL_VARIABLE} in the root .env; it is not set.')
    parts = urllib.parse.urlsplit(value)
    if parts.scheme != 'https' or not parts.hostname:
        raise Refused(f'{PROD_URL_VARIABLE} must be an https URL; refused.')
    if parts.path not in ('', '/') or parts.query or parts.fragment:
        raise Refused(f'{PROD_URL_VARIABLE} must be a bare origin (https://host); refused.')
    return value


# ---------------------------------------------------------------------------
# Secrets: environment only, never printed
# ---------------------------------------------------------------------------


class Secrets:
    """Reads the secrets from the environment. Values never leave this object.

    `repr` / `str` never show a value; callers only get a value to put in a header.
    """

    SKIP = 'STATISTICS_SKIP_SECRET'

    def __init__(self, environ=None):
        """Keep a reference to the environment (no value is copied eagerly)."""
        self._environ = os.environ if environ is None else environ

    def available(self, name):
        """Return whether `name` is set to a non-empty value."""
        return bool(self._environ.get(name))

    def optional(self, name):
        """Return the value of `name`, or `None` when unset."""
        return self._environ.get(name) or None

    def __repr__(self):
        """Never show values."""
        return '<Secrets (values hidden)>'

    __str__ = __repr__


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


@dataclass
class Config:
    """Resolved, validated configuration. Its repr never shows the production URL."""

    base_url: str
    host: str
    approval_url: str
    username: str
    from_date: date
    to_date: date
    tz: str = 'UTC'
    domain: str = None
    race_window: float = DEFAULT_RACE_WINDOW
    validate_path: str = None
    reports_dir: str = 'reports'
    dry_run: bool = False
    production: bool = False
    target: Target = None

    def __repr__(self):
        """Hide the URLs (the production one must never be printed)."""
        return (f'<Config {"production" if self.production else "local"} '
                f'{self.from_date}..{self.to_date} tz={self.tz} (URLs hidden)>')

    def validate(self):
        """Refuse any disallowed target or inconsistent argument. There is no override."""
        if self.from_date > self.to_date:
            raise Refused('--from must not be after --to.')
        if self.race_window <= 0:
            raise Refused('--race-window must be greater than 0.')
        if self.validate_path and self.production:
            raise Refused('--validate runs against the local stack only; it cannot be combined '
                          'with --production.')
        self.target.check('base URL', self.base_url)
        self.target.check('approval URL', self.approval_url)
        if self.host:
            self.target.check('Host header', self.host)
        return self


def _iso_date(value):
    """argparse type: a `YYYY-MM-DD` day."""
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f'{value!r} is not a YYYY-MM-DD date') from error


def build_parser(environ):
    """Return the argument parser (local defaults come from the environment)."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--from', dest='from_date', type=_iso_date, required=True,
                        help='first local day of the range (YYYY-MM-DD, required)')
    parser.add_argument('--to', dest='to_date', type=_iso_date, required=True,
                        help='last local day of the range (YYYY-MM-DD, required)')
    parser.add_argument('--tz', default='UTC', help='time zone of --from / --to (default UTC)')
    parser.add_argument('--domain', default=None,
                        help='optional Domain id (or "unknown") to restrict the export to')
    parser.add_argument('--production', action='store_true',
                        help=f'analyse production: the base URL is {PROD_URL_VARIABLE} from the '
                             'environment (https), never an argument')
    parser.add_argument('--base-url', default=None,
                        help='proxy base URL (local only; default MAJORA_BASE_URL or '
                             f'{DEFAULT_BASE_URL})')
    parser.add_argument('--host', default=None,
                        help='Host header sent to the local proxy (local only)')
    parser.add_argument('--username', default=environ.get('MAJORA_USERNAME', ''),
                        help='staff username (or e-mail) that approves the request')
    parser.add_argument('--race-window', type=float, default=DEFAULT_RACE_WINDOW,
                        help='parallel-race window in seconds (default 2)')
    parser.add_argument('--validate', dest='validate_path', default=None, metavar='REPORT',
                        help="an emulate.py JSON report: validate against each scenario's window "
                             '(local only)')
    parser.add_argument('--reports-dir', default='reports')
    parser.add_argument('--dry-run', action='store_true',
                        help='validate the configuration only; send nothing')
    return parser


def parse_args(argv=None, environ=None):
    """Build the `Config` from arguments, then the environment, then local defaults."""
    environ = os.environ if environ is None else environ
    args = build_parser(environ).parse_args(argv)
    common = {
        'username': args.username, 'from_date': args.from_date, 'to_date': args.to_date,
        'tz': args.tz, 'domain': args.domain, 'race_window': args.race_window,
        'validate_path': args.validate_path, 'reports_dir': args.reports_dir,
        'dry_run': args.dry_run, 'production': args.production,
    }
    if args.production:
        if args.validate_path:
            raise Refused('--validate runs against the local stack only; it cannot be combined '
                          'with --production.')
        if args.base_url or args.host:
            raise Refused(f'--production takes its URL from {PROD_URL_VARIABLE} only; '
                          '--base-url / --host are refused.')
        url = production_url(environ)
        return Config(
            base_url=url, host=None, approval_url=url + APPROVAL_FRAGMENT,
            target=Target.from_production_url(url), **common,
        ).validate()
    return Config(
        base_url=args.base_url or environ.get('MAJORA_BASE_URL') or DEFAULT_BASE_URL,
        host=args.host or environ.get('MAJORA_HOST') or DEFAULT_HOST,
        approval_url=environ.get('MAJORA_APPROVAL_URL') or DEFAULT_APPROVAL_URL,
        target=Target.local(), **common,
    ).validate()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def describe_dry_run(config, secrets):
    """Return the dry-run summary (never the production URL or any secret value)."""
    if config.production:
        return ('Dry run: production target; production URL present: yes. '
                'The skip secret is never sent to production. Nothing sent.')
    mode = 'validation' if config.validate_path else 'analysis'
    return (f'Dry run: local {mode}; every URL is local. '
            f'{Secrets.SKIP} present: {"yes" if secrets.available(Secrets.SKIP) else "no"}. '
            'Nothing sent.')


def run(config, secrets, out=sys.stdout):
    """Authorize, fetch, analyse and report. Returns the exit code."""
    raise Refused('not implemented yet')


def main(argv=None, environ=None):
    """Entry point."""
    environ = os.environ if environ is None else environ
    try:
        config = parse_args(argv, environ)
        secrets = Secrets(environ)
        if config.dry_run:
            print(describe_dry_run(config, secrets))
            return EXIT_OK
        return run(config, secrets)
    except Refused as error:
        print(f'Refused: {error}', file=sys.stderr)
        return EXIT_REFUSED
    except AuthorizationFailed as error:
        print(f'Authorization or export failed: {error}. No report written.', file=sys.stderr)
        return EXIT_AUTH
    except (urllib.error.URLError, OSError) as error:
        print(f'Run failed (network): {error.__class__.__name__}. No report written.',
              file=sys.stderr)
        return EXIT_NETWORK


if __name__ == '__main__':
    sys.exit(main())
