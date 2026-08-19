"""Shared TestCase mixin for recurring upload-finalize test fixtures.

The upload finalize view tests (`uploads/tests/views_*_test.py`) share the same
actor shape across almost every subject: a DM, a player of the game, and a staff
user, each with their own auth token, plus a pending `Upload` paired with a
`content_object` photo/file model waiting to be finalized. This mixin extracts
that recurring boilerplate so each test module only has to build the fixtures
specific to its own subject.
"""

from rest_framework.authtoken.models import Token

from games.tests.factories import PlayerFactory, UserFactory
from uploads.models import Upload


class UploadFinalizeFixtureMixin:
    """Mixin providing shared actor and upload/photo fixture builders for `TestCase`s."""

    @classmethod
    def _create_dm(cls, game, username='dm_user'):
        """Create a DM user (and Player/Token) for `game`, returning `(user, token)`."""
        dm_user = UserFactory(username=username, password='secret-password')
        PlayerFactory(game=game, user=dm_user, is_dm=True)
        dm_token = Token.objects.create(user=dm_user)
        return dm_user, dm_token

    @classmethod
    def _create_player_of_game(cls, game, username='player_of_game', name='Pippin'):
        """Create a non-DM player (and Player/Token) for `game`, returning `(user, token)`."""
        player_of_game_user = UserFactory(username=username, password='secret-password')
        PlayerFactory(name=name, user=player_of_game_user, game=game)
        player_of_game_token = Token.objects.create(user=player_of_game_user)
        return player_of_game_user, player_of_game_token

    @classmethod
    def _create_staff_user(cls, username='staff_user'):
        """Create a staff user (and Token), returning `(user, token)`."""
        staff_user = UserFactory(username=username, password='secret-password', is_staff=True)
        staff_token = Token.objects.create(user=staff_user)
        return staff_user, staff_token

    @classmethod
    def _create_upload_and_photo(cls, photo_model, user, file_path, **photo_kwargs):
        """Create an `Upload` and a `photo_model` instance, linked via `content_object`."""
        upload = Upload.objects.create(user=user, file_path=file_path)
        photo = photo_model.objects.create(path=file_path, **photo_kwargs)
        upload.content_object = photo
        upload.save()
        return upload, photo
