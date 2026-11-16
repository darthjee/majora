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
