"""Games app admin configuration."""

from django.contrib import admin

from .models import (
    Character,
    CharacterDocument,
    CharacterItem,
    CharacterLink,
    CharacterPhoto,
    CharacterTreasure,
    Game,
    GameDocument,
    GameDomain,
    GameDomainGroup,
    GameItem,
    GameLink,
    GamePhoto,
    GameSession,
    GameTreasure,
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
    filter_horizontal = ('game_domain_groups',)


admin.site.register(Game, GameAdmin)
admin.site.register(Player)
admin.site.register(Character)
admin.site.register(CharacterLink)
admin.site.register(CharacterPhoto)
admin.site.register(CharacterTreasure)
admin.site.register(GameLink)
admin.site.register(GamePhoto)
admin.site.register(GameItem)
admin.site.register(CharacterItem)
admin.site.register(GameDocument)
admin.site.register(CharacterDocument)
admin.site.register(Treasure)
admin.site.register(GameSession)
admin.site.register(Task)
admin.site.register(Upload)
admin.site.register(Poll)
admin.site.register(PollOption)
admin.site.register(PollVote)
admin.site.register(GameDomainGroup)
admin.site.register(GameDomain)
