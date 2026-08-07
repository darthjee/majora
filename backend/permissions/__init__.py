"""Generic, YAML-config-driven permission engine: role-shortcut checks per resource/action.

A resource-agnostic engine: `PermissionConfigStore` (loads `config/<resource>/{ui,endpoints}.yml`),
`UIPermission`/`EndpointPermission` (check an injectable `roles` object against a YAML entry),
`PagePermissionConfigStore`/`PermissionsBuilder` (build a full `permissions.json` response from a
page-level YAML config). Role resolution itself (`Roles`) is games-specific and lives in
`games.roles`, injected into (or defaulted from) this engine's checks rather than owned by it.
"""

from .builder import PermissionsBuilder
from .config_store import PermissionConfigStore
from .endpoint import EndpointPermission
from .page_config_store import PagePermissionConfigStore
from .resource_resolver import ResourcePermissionsResolver
from .ui import UIPermission

__all__ = [
    'PermissionConfigStore',
    'UIPermission',
    'EndpointPermission',
    'PagePermissionConfigStore',
    'ResourcePermissionsResolver',
    'PermissionsBuilder',
]
