"""Games app admin configuration."""

from django.contrib import admin

from .models import (
    Character,
    CharacterLink,
    CharacterPhoto,
    Game,
    GameMaster,
    GamePhoto,
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
admin.site.register(Link)
admin.site.register(GameMaster)
admin.site.register(GamePhoto)
admin.site.register(Treasure)
admin.site.register(Upload)
