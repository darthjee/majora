"""Miniatures app admin configuration."""

from django.contrib import admin

from .models import (
    Collection,
    CollectionPhoto,
    Source,
    SourcePhoto,
    StlModel,
    StlModelLink,
    StlModelPhoto,
    Tag,
)

admin.site.register(StlModel)
admin.site.register(StlModelLink)
admin.site.register(StlModelPhoto)
admin.site.register(Source)
admin.site.register(SourcePhoto)
admin.site.register(Tag)
admin.site.register(Collection)
admin.site.register(CollectionPhoto)
