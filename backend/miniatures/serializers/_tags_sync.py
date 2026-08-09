"""Tag-sync helper for the `StlModel` create serializer."""

from django.db import transaction
from rest_framework import serializers

from miniatures.models import Tag

#: Maximum number of `tags` entries accepted in a single create payload, to bound the number
#: of synchronous per-entry DB queries `TagsSync` issues per request.
MAX_TAGS = 20


class TagsSync:
    """Attaches a validated list of tag strings to a `StlModel`, get-or-creating each `Tag`."""

    def __init__(self, stl_model, tag_names):
        """Store the target `stl_model` and the validated `tag_names` list to apply."""
        self.stl_model = stl_model
        self.tag_names = tag_names

    def apply(self):
        """Get-or-create and attach a `Tag` for each name, lowercased.

        Wrapped in a transaction so a mid-batch failure rolls back every tag already
        attached in this call, instead of leaving a partial set of tags.
        """
        with transaction.atomic():
            for name in self.tag_names:
                self._attach(name)

    def _attach(self, name):
        """Get-or-create the lowercased `Tag` for `name` and attach it to `self.stl_model`."""
        tag, _created = Tag.objects.get_or_create(name=name.lower())
        self.stl_model.tags.add(tag)


def validate_tags_count(value):
    """Raise a 400 when `value` (a list of tag strings) exceeds `MAX_TAGS`.

    Shared by `StlModelCreateSerializer.validate_tags`, to bound the number of per-entry DB
    queries `TagsSync` issues per request.
    """
    if len(value) > MAX_TAGS:
        raise serializers.ValidationError('max_tags_exceeded', code='max_tags_exceeded')
    return value


def validate_tag_lengths(value):
    """Raise a 400 when any tag in `value` exceeds `Tag.NAME_MAX_LENGTH`.

    A plain `CharField(max_length=...)` on the `tags` child would instead surface DRF's
    generic, index-keyed `max_length` code; this keeps the shape consistent with
    `validate_tags_count`'s flat `tags` error and names the specific field at fault.
    """
    if any(len(name) > Tag.NAME_MAX_LENGTH for name in value):
        raise serializers.ValidationError('tag_name_too_long', code='tag_name_too_long')
    return value
