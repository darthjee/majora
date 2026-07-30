"""Role-based authorization: UI/endpoint access checks driven by YAML config per resource.

Replaces the previous one-class-per-action `games/permissions.py`: `Roles` resolves a small
set of explicit roles (`admin`, `staff`, `logged_user`, `dm`, `player`, `owner`) for a given
user/game/pc, and `UIPermission`/`EndpointPermission` check those roles against the allowed
roles configured in `config/<resource>/{ui,endpoints}.yml` (loaded via `PermissionConfigStore`).
"""

from .config_store import PermissionConfigStore
from .endpoint import EndpointPermission
from .roles import Roles
from .ui import UIPermission

__all__ = ['PermissionConfigStore', 'Roles', 'UIPermission', 'EndpointPermission']
