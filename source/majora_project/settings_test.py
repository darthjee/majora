"""Test settings for Majora backend - uses SQLite in-memory database."""

from majora_project.settings import *  # noqa: F401, F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
