"""Games app admin configuration."""

from django.contrib import admin

from .models import (
    Character,
    CharacterLink,
    CharacterPhoto,
    CharacterTreasure,
    Game,
    GameMaster,
    GamePhoto,
    GameSession,
    Link,
    Player,
    Treasure,
    Upload,
)

admin.site.register(Game)
admin.site.register(Player)
admin.site.register(Character)
admin.site.register(CharacterLink)
admin.site.register(CharacterPhoto)
admin.site.register(CharacterTreasure)
admin.site.register(Link)
admin.site.register(GameMaster)
admin.site.register(GamePhoto)
admin.site.register(Treasure)
admin.site.register(GameSession)
admin.site.register(Upload)
