"""Helper assembling the my-games list data: role, character, and conversation counts."""

from django.db.models import Count, Prefetch, Q

from conversations.models import Conversation
from games.models import Character, Player


class MyGamesBuilder:
    """Builds one my-games item per `Player` row belonging to a given user."""

    def __init__(self, user):
        """Store the `user` whose games/roles/characters/conversations are being assembled."""
        self.user = user

    def build(self):
        """Return a list of `{game, role, character, conversations}` dicts, one per game."""
        players = list(self._players())
        counts = self._conversation_counts([player.game_id for player in players])
        return [self._build_item(player, counts) for player in players]

    def _players(self):
        """Return the user's `Player` rows, with game and owned PC preloaded (no N+1)."""
        return (
            Player.objects.filter(user=self.user)
            .select_related('game')
            .prefetch_related(
                Prefetch(
                    'characters',
                    queryset=Character.objects.filter(npc=False),
                    to_attr='pc_list',
                )
            )
        )

    def _conversation_counts(self, game_ids):
        """Return `{game_id: {'count': n, 'unread_count': n}}` for the given games."""
        counts = {game_id: {'count': 0, 'unread_count': 0} for game_id in game_ids}
        for conversation in self._conversations():
            self._tally(conversation, counts)
        return counts

    def _conversations(self):
        """Return the distinct conversations the user follows, annotated with unread count."""
        return (
            Conversation.objects.filter(participants__player__user=self.user)
            .annotate(
                unread=Count(
                    'messages__visualisations',
                    filter=Q(
                        messages__visualisations__player__user=self.user,
                        messages__visualisations__not_seen=True,
                    ),
                    distinct=True,
                ),
            )
            .prefetch_related('participants__player')
            .distinct()
        )

    def _tally(self, conversation, counts):
        """Increment `counts` for every one of the user's games among `conversation`'s players."""
        game_ids = {participant.player.game_id for participant in conversation.participants.all()}
        for game_id in game_ids & counts.keys():
            counts[game_id]['count'] += 1
            if conversation.unread > 0:
                counts[game_id]['unread_count'] += 1

    def _build_item(self, player, counts):
        """Build the my-games item dict for a single player row."""
        return {
            'game': player.game,
            'role': 'dm' if player.is_dm else 'player',
            'character': player.pc_list[0] if player.pc_list else None,
            'conversations': counts[player.game_id],
        }
