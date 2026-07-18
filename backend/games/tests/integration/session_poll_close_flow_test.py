"""Integration test for the full session poll create -> vote -> close flow."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameSession, Poll
from games.tests.factories import GameFactory, PlayerFactory, UserFactory


class TestSessionPollCloseFlow(TestCase):
    """Drive the real endpoints end to end to confirm the session's date is set on close."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, and a DM able to create/vote/close the poll."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

    def _auth_headers(self):
        """Return the request kwargs authenticating as the game's DM."""
        return {'HTTP_AUTHORIZATION': f'Token {self.dm_token.key}'}

    def _create_poll(self, dates):
        """POST to the session poll create endpoint and return the parsed response body."""
        response = self.client.post(
            f'/games/{self.game.game_slug}/sessions/{self.session.id}/poll.json',
            data=json.dumps({'dates': dates}),
            content_type='application/json',
            **self._auth_headers(),
        )
        assert response.status_code == 201
        return json.loads(response.content)

    def _cast_vote(self, poll_id, option_id):
        """PUT a vote for `option_id` on the poll identified by `poll_id`."""
        response = self.client.put(
            f'/games/{self.game.game_slug}/polls/{poll_id}/votes.json',
            data=json.dumps({'option_ids': [option_id]}),
            content_type='application/json',
            **self._auth_headers(),
        )
        assert response.status_code == 200

    def _close_poll(self, poll_id):
        """PATCH the close endpoint for the poll identified by `poll_id` and return the response."""
        return self.client.patch(
            f'/games/{self.game.game_slug}/polls/{poll_id}/close.json',
            data=json.dumps({}),
            content_type='application/json',
            **self._auth_headers(),
        )

    def test_full_flow_sets_session_date_from_voted_option(self):
        """Test create -> vote -> close sets the session's date to the voted-for option."""
        poll_data = self._create_poll(['2026-08-01', '2026-08-08'])
        poll_id = poll_data['id']
        options_by_value = {option['option']: option['id'] for option in poll_data['options']}
        voted_option_id = options_by_value['2026-08-08']

        self._cast_vote(poll_id, voted_option_id)

        response = self._close_poll(poll_id)

        assert response.status_code == 200
        close_data = json.loads(response.content)
        assert close_data['status'] == Poll.STATUS_CLOSED
        options_by_id = {option['id']: option for option in close_data['options']}
        assert options_by_id[voted_option_id]['selected'] is True

        self.session.refresh_from_db()
        assert self.session.date.isoformat() == '2026-08-08'
