"""Static resource-kind config for the frontend's page -> access-check mapping.

Backs `GET /access-route-config.json` (`source/games/views/access_route_config.py`). Mirrors
the page identifiers previously hardcoded in the frontend's
`frontend/assets/js/utils/accessRouteConfig.js` (keyed by the same page identifiers returned
by `HashRouteResolver#getPage`) — this module is now the single source of truth for which
resource kind(s) a given page must check; URL patterns and route param names remain
frontend-owned routing knowledge and are not part of this config.

Each page key maps to a list of descriptors (a page may require more than one check, e.g.
`treasureEdit`), each a dict with a `kind` key
(`'game'`, `'character'`, `'treasure'`, `'superuser'`, or `'staffOrSuperuser'`) and, only for
`'character'` descriptors, a `characterKind` key (`'pcs'` or `'npcs'`). Page keys with no
access check at all (e.g. `games`, `home`) have no entry, same as the original frontend file.
"""

ACCESS_ROUTE_CONFIG = {
    'game': [{'kind': 'game'}],
    'gameEdit': [{'kind': 'game'}],
    'gameNpcs': [{'kind': 'game'}],
    'gamePhotos': [{'kind': 'game'}],
    'gameTasks': [{'kind': 'game'}],
    'gameTreasures': [{'kind': 'game'}],
    'gameSessions': [{'kind': 'game'}],
    'gameNpcNew': [{'kind': 'game'}],
    'gameSessionNew': [{'kind': 'game'}],
    'gameTreasureNew': [{'kind': 'game'}],
    'gameTreasureEdit': [{'kind': 'game'}],
    'pcCharacter': [{'kind': 'character', 'characterKind': 'pcs'}],
    'npcCharacter': [{'kind': 'character', 'characterKind': 'npcs'}],
    'pcCharacterEdit': [{'kind': 'character', 'characterKind': 'pcs'}],
    'npcCharacterEdit': [{'kind': 'character', 'characterKind': 'npcs'}],
    'pcCharacterPhotos': [{'kind': 'character', 'characterKind': 'pcs'}],
    'npcCharacterPhotos': [{'kind': 'character', 'characterKind': 'npcs'}],
    'pcCharacterTreasures': [{'kind': 'character', 'characterKind': 'pcs'}],
    'npcCharacterTreasures': [{'kind': 'character', 'characterKind': 'npcs'}],
    'treasure': [{'kind': 'treasure'}],
    'treasureEdit': [{'kind': 'superuser'}, {'kind': 'treasure'}],
    'treasureNew': [{'kind': 'superuser'}],
    'treasures': [{'kind': 'superuser'}],
    'staffUsers': [{'kind': 'staffOrSuperuser'}],
    'staffUser': [{'kind': 'staffOrSuperuser'}],
    'staffUserEdit': [{'kind': 'staffOrSuperuser'}],
}
