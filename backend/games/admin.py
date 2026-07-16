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
    GameTreasure,
    Link,
    Player,
    Poll,
    PollOption,
    PollVote,
    Task,
    Treasure,
    Upload,
)


class GameTreasureInline(admin.TabularInline):
    """Inline admin for managing a game's shared treasure links and their stock caps."""

    model = GameTreasure
    extra = 0
    fields = ('treasure', 'value', 'max_units', 'acquired_units')
    readonly_fields = ('acquired_units',)


class GameAdmin(admin.ModelAdmin):
    """Admin configuration for Game, managing shared treasure links via an inline."""

    inlines = [GameTreasureInline]


admin.site.register(Game, GameAdmin)
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
admin.site.register(Task)
admin.site.register(Upload)
admin.site.register(Poll)
admin.site.register(PollOption)
admin.site.register(PollVote)
