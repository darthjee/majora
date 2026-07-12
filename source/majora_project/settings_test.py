"""Test settings for Majora backend - uses a fast password hasher."""

from majora_project.settings import *  # noqa: F401, F403

PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
