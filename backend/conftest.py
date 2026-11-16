"""Pytest configuration for Majora backend tests."""

import os

import pytest

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'majora_project.settings_test')


@pytest.fixture(autouse=True)
def clear_memory_cache():
    """Clear the process-wide memory cache before every test.

    The cache is shared across the whole process, so without this a test can see entries left by
    an earlier one. Clearing it here enforces the isolation policy (Epic #1785) in one place
    instead of in each test's setup.
    """
    from majora_project.cache import memory_cache

    memory_cache.clear()
    yield


@pytest.fixture(autouse=True)
def simple_history_recording(request):
    """Enable simple_history only for tests marked ``@pytest.mark.history`` (#1792)."""
    if request.node.get_closest_marker('history') is None:
        yield
        return
    from django.test import override_settings

    with override_settings(SIMPLE_HISTORY_ENABLED=True):
        yield
