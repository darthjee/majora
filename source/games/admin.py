"""Games app admin configuration."""

from django.contrib import admin

from .models import Character, Game, Link, Photo, Player

admin.site.register(Game)
admin.site.register(Player)
admin.site.register(Character)
admin.site.register(Photo)
admin.site.register(Link)
