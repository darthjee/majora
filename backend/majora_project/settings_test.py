"""Test settings for Majora backend - uses a fast password hasher."""

from majora_project.settings import *  # noqa: F401, F403

PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# django-simple-history writes a row per save; skip it in tests unless a test opts in with
# ``@pytest.mark.history`` (see conftest.py, #1792).
SIMPLE_HISTORY_ENABLED = False
