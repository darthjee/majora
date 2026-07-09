"""Writable CharacterLink serializer for nested create/update payloads."""

from django.db import transaction
from rest_framework import serializers

from games.models import CharacterLink

#: Maximum number of `links` entries accepted in a single create/update payload, to bound
#: the number of synchronous per-entry DB queries `CharacterLinksSync` issues per request.
MAX_LINKS = 50


class CharacterLinkWriteSerializer(serializers.ModelSerializer):
    """Serializer for a single link entry inside a character create/update payload.

    Distinct from the read-only `CharacterLinkSerializer`: this serializer accepts an
    optional `id` (identifying an existing link to update/delete) and a transient
    `delete` flag (not a model field) signaling that the link should be removed.
    """

    # Overridden as writable: ModelSerializer treats the pk field as read-only by default,
    # but this serializer needs `id` in validated_data to identify which link to update/delete.
    id = serializers.IntegerField(required=False)
    delete = serializers.BooleanField(required=False, default=False)

    class Meta:
        """Metadata for the CharacterLinkWriteSerializer."""

        model = CharacterLink
        fields = ['id', 'text', 'url', 'link_type', 'delete']
        extra_kwargs = {
            'text': {'required': False},
            'url': {'required': False},
            'link_type': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        """Require `id` when deleting, and `url` for any new (id-less), non-deleted entry.

        An entry with an `id` is updating an existing link, whose `url` is already set —
        omitting `url` there just leaves the existing value untouched (see
        `CharacterLinksSync._update`), so it must not be forced here.
        """
        if attrs.get('delete') and not attrs.get('id'):
            raise serializers.ValidationError({'id': ['This field is required when deleting.']})
        if not attrs.get('delete') and not attrs.get('id') and not attrs.get('url'):
            raise serializers.ValidationError({'url': ['This field is required.']})
        return attrs


class CharacterLinksSync:
    """Applies a validated list of `CharacterLinkWriteSerializer` entries to a character."""

    def __init__(self, character, entries):
        """Store the target `character` and the validated `entries` list to apply."""
        self.character = character
        self.entries = entries

    def apply(self):
        """Create, update, or delete each entry's `CharacterLink`, per its id/delete flag.

        Wrapped in a transaction so a mid-batch failure (e.g. an unknown link id) rolls back
        every entry already applied in this call, instead of leaving a partial update.
        """
        with transaction.atomic():
            for entry in self.entries:
                self._apply_entry(entry)

    def create_all(self):
        """Create a new `CharacterLink` for every entry, ignoring any `id`/`delete` flags.

        Wrapped in a transaction so a mid-batch failure rolls back every entry already
        created in this call, instead of leaving a partial set of links.
        """
        with transaction.atomic():
            for entry in self.entries:
                self._create(entry)

    def _apply_entry(self, entry):
        """Route a single entry to its create/update/delete handler."""
        if entry.get('delete'):
            self._delete(entry)
        elif entry.get('id'):
            self._update(entry)
        else:
            self._create(entry)

    def _create(self, entry):
        """Create a new `CharacterLink` for `self.character` from `entry`."""
        CharacterLink.objects.create(
            character=self.character,
            text=entry.get('text', ''),
            url=entry.get('url', ''),
            link_type=entry.get('link_type', ''),
        )

    def _update(self, entry):
        """Update the existing, character-owned `CharacterLink` matching `entry['id']`."""
        link = self._find(entry['id'])
        link.text = entry.get('text', link.text)
        link.url = entry.get('url', link.url)
        link.link_type = entry.get('link_type', link.link_type)
        link.save()

    def _delete(self, entry):
        """Delete the existing, character-owned `CharacterLink` matching `entry['id']`."""
        self._find(entry['id']).delete()

    def _find(self, link_id):
        """Return the character-owned `CharacterLink` for `link_id`, or raise a 400."""
        link = self.character.links.filter(id=link_id).first()
        if link is None:
            raise serializers.ValidationError({'links': [f'Unknown link id {link_id}.']})
        return link


def validate_links_count(value):
    """Raise a 400 when `value` (a list of link entries) exceeds `MAX_LINKS`.

    Shared by `CharacterCreateSerializer` and `CharacterUpdateSerializer`'s `validate_links`,
    to bound the number of per-entry DB queries `CharacterLinksSync` issues per request.
    """
    if len(value) > MAX_LINKS:
        raise serializers.ValidationError(f'A character may have at most {MAX_LINKS} links.')
    return value
