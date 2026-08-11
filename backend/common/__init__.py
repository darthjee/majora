"""Small, cross-cutting helpers shared across apps (no models of its own).

Follows the same precedent as the `permissions` app: a top-level, no-model Django app whose
modules are imported directly by other apps (`games`, `miniatures`, ...) rather than duplicated.
"""
