"""Tests for the `list_unused_endpoints` management command."""

import shutil
import tempfile
from io import StringIO
from pathlib import Path

from django.core.management import call_command


class TestListUnusedEndpointsCommand:
    """Tests for the `list_unused_endpoints` management command."""

    HARDCODED_ROUTE = 'ready.json'
    CONFIG_ROUTE = 'access-route-config.json'
    UNMATCHED_ROUTE = 'staff/cache/summary.json'

    def setup_method(self):
        """Build an isolated frontend fixture and run the command once against it."""
        self.frontend_root = Path(tempfile.mkdtemp())
        self._write_frontend_fixture()
        self.output = self._run_command()

    def teardown_method(self):
        """Remove the temporary frontend fixture directory."""
        shutil.rmtree(self.frontend_root, ignore_errors=True)

    def test_route_used_only_via_hardcoded_client_path_is_excluded(self):
        """A route only reachable via a hardcoded `client/*.js` path is not listed."""
        assert self.HARDCODED_ROUTE not in self.output

    def test_route_used_only_via_resource_config_is_excluded(self):
        """A route only reachable via `resourceConfig.js`/`config/*.js` is not listed."""
        assert self.CONFIG_ROUTE not in self.output

    def test_route_matching_neither_source_is_included(self):
        """A route with no matching frontend usage anywhere is listed."""
        assert self.UNMATCHED_ROUTE in self.output

    def test_admin_route_is_never_included(self):
        """Django's own `/admin/` routes are excluded regardless of frontend usage."""
        assert 'admin/' not in self.output

    def _write_frontend_fixture(self):
        """Write a minimal client + resourceConfig fixture under `self.frontend_root`."""
        client_dir = self.frontend_root / 'assets' / 'js' / 'client'
        requests_dir = self.frontend_root / 'assets' / 'js' / 'utils' / 'requests'
        config_dir = requests_dir / 'config'
        client_dir.mkdir(parents=True)
        config_dir.mkdir(parents=True)

        (client_dir / 'FakeClient.js').write_text(
            'export default class FakeClient {\n'
            '  fetchReady() {\n'
            "    return fetch('/ready.json');\n"
            '  }\n'
            '}\n'
        )
        (requests_dir / 'resourceConfig.js').write_text('export default {};\n')
        (config_dir / 'fakeConfig.js').write_text(
            "const single = { path: () => '/access-route-config.json', permission: null };\n\n"
            'export default {\n'
            '  GET: { single: { regular: single, private: single } },\n'
            '};\n'
        )

    def _run_command(self):
        """Run the command against the fixture frontend root and return its captured stdout."""
        out = StringIO()
        call_command(
            'list_unused_endpoints', f'--frontend-root={self.frontend_root}', stdout=out,
        )
        return out.getvalue()
