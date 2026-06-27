"""Games app admin configuration."""

from django.contrib import admin

from .models import Character, Game, GameMaster, GamePhoto, Link, Photo, Player, Upload

admin.site.register(Game)
admin.site.register(Player)
admin.site.register(Character)
admin.site.register(Photo)
admin.site.register(Link)
admin.site.register(GameMaster)
admin.site.register(GamePhoto)
admin.site.register(Upload)
