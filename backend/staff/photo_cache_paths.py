"""Proxy cache paths made stale when an owner's photo changes.

Each builder turns a photo owner into the literal `.json` request paths whose cached
responses embed that owner's photo (entity + collection paths). They mirror the target lists
of the proxy's route-driven cleanup map (`proxy/extension/lib/configuration/cache_cleanup/`).
"""


class ResourceCachePaths:
    """Collection and member paths of a resource family rooted at a base path."""

    def __init__(self, collection=('.json',), member=('.json',)):
        """Store the suffixes appended to the collection base and to the member base."""
        self._collection = collection
        self._member = member

    def paths(self, owner):
        """Return the collection paths followed by the member paths of `owner`."""
        base = self._base(owner)
        member_base = f'{base}/{owner.pk}'
        return (
            [f'{base}{suffix}' for suffix in self._collection_suffixes(owner)]
            + [f'{member_base}{suffix}' for suffix in self._member]
            + self._extra_paths(owner)
        )

    def _base(self, owner):
        """Return the collection base path (without `.json`) of `owner`."""
        raise NotImplementedError

    def _collection_suffixes(self, owner):
        """Return the suffixes appended to the collection base."""
        return self._collection

    def _extra_paths(self, owner):
        """Return any additional path outside the resource family."""
        return []


class GameResourceCachePaths(ResourceCachePaths):
    """A resource family nested under its owner's game: `/games/<slug>/<resource>`."""

    def __init__(self, resource, **kwargs):
        """Store the resource segment and the family suffixes."""
        super().__init__(**kwargs)
        self._resource = resource

    def _base(self, owner):
        """Return `/games/<slug>/<resource>`."""
        return f'/games/{owner.game.game_slug}/{self._resource}'


class MiniaturesCachePaths(ResourceCachePaths):
    """A miniatures resource family: `/miniatures/<resource>`."""

    def __init__(self, resource):
        """Store the resource segment."""
        super().__init__()
        self._resource = resource

    def _base(self, owner):
        """Return `/miniatures/<resource>`."""
        return f'/miniatures/{self._resource}'


class CharacterCachePaths(ResourceCachePaths):
    """The `pcs`/`npcs` family of a character, plus its factions' character lists."""

    def __init__(self):
        """Configure the character member suffixes."""
        super().__init__(member=('.json', '/full.json', '/photos.json', '/factions.json'))

    def _base(self, owner):
        """Return `/games/<slug>/pcs` or `/games/<slug>/npcs`."""
        return f'/games/{owner.game.game_slug}/{character_kind(owner)}'

    def _collection_suffixes(self, owner):
        """Return the list suffixes: only npcs have an `all.json` list."""
        return ('.json', '/all.json') if owner.npc else ('.json',)

    def _extra_paths(self, owner):
        """Return the character lists of every faction the character belongs to."""
        return FactionCharactersCachePaths(owner).paths()


class FactionCharactersCachePaths:
    """The character lists of every faction a character is a member of."""

    def __init__(self, character):
        """Store the character and its game slug."""
        self._character = character
        self._slug = character.game.game_slug

    def paths(self):
        """Return the `characters` list paths of each of the character's factions."""
        paths = []
        for faction_id in self._faction_ids():
            paths.extend(self._faction_paths(faction_id))
        return paths

    def _faction_paths(self, faction_id):
        """Return `characters.json` and `characters/all.json` of one faction."""
        base = f'/games/{self._slug}/factions/{faction_id}/characters'
        return [f'{base}.json', f'{base}/all.json']

    def _faction_ids(self):
        """Return the ids of the factions the character is a member of."""
        return self._character.character_factions.order_by('id').values_list(
            'game_faction_id', flat=True
        )


class CharacterItemCachePaths(ResourceCachePaths):
    """The items family of the holding character: `/games/<slug>/<kind>/<id>/items`."""

    def __init__(self):
        """Configure the items family suffixes."""
        super().__init__(collection=('.json', '/all.json'), member=('.json', '/full.json'))

    def _base(self, owner):
        """Return the character-scoped items base path."""
        character = owner.character
        kind = character_kind(character)
        return f'/games/{character.game.game_slug}/{kind}/{character.pk}/items'


class GameDocumentFileCachePaths:
    """The documents family of the document owning a file."""

    def __init__(self, documents):
        """Store the documents family builder."""
        self._documents = documents

    def paths(self, owner):
        """Return the documents family paths of the file's document."""
        return self._documents.paths(owner.game_document)


class GameCachePaths:
    """The game lists and the game's own detail and photos."""

    def paths(self, owner):
        """Return the game lists, detail and photos paths."""
        slug = owner.game_slug
        return ['/games.json', '/my-games.json', f'/games/{slug}.json',
                f'/games/{slug}/photos.json']


class TreasureCachePaths:
    """The top-level treasure paths, plus the game-scoped ones when the treasure has a game."""

    def paths(self, owner):
        """Return the treasure's top-level and game-scoped paths."""
        return self._global_paths(owner) + self._game_paths(owner)

    @staticmethod
    def _global_paths(owner):
        """Return `/treasures.json` and `/treasures/<id>.json`."""
        return ['/treasures.json', f'/treasures/{owner.pk}.json']

    @staticmethod
    def _game_paths(owner):
        """Return the game-scoped treasure paths, or none for a game-less treasure."""
        if owner.game is None:
            return []
        base = f'/games/{owner.game.game_slug}/treasures'
        return [f'{base}.json', f'{base}/all.json', f'{base}/{owner.pk}.json']


def character_kind(character):
    """Return the `npcs` or `pcs` URL segment of `character`."""
    return 'npcs' if character.npc else 'pcs'


DOCUMENTS = GameResourceCachePaths(
    'documents', collection=('.json', '/all.json'),
    member=('.json', '/full.json', '/photos.json', '/photos/all.json', '/files.json',
            '/files/all.json'),
)

FULL_FAMILY = {'collection': ('.json', '/all.json'), 'member': ('.json', '/full.json')}
