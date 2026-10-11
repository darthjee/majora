"""Staff copy link serializer: one pending/failed link of `GET staff/copies/links.json`."""

from rest_framework import serializers

from uploads.models import Upload


class StaffCopyLinkSerializer(serializers.ModelSerializer):
    """Serializer for a copy link: its upload id/type/status/error and the copied entity.

    Paths, the token and the user are never exposed. The entity descriptions are passed in
    `context['entities']` (`{upload_id: description}`), batch-loaded by `CopyLinkEntities`.
    """

    upload_id = serializers.IntegerField(source='pk')
    entity = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the StaffCopyLinkSerializer."""

        model = Upload
        fields = ['upload_id', 'upload_type', 'status', 'error', 'entity']

    def get_entity(self, obj):
        """Return the `{type, id, name, kind, game}` description of the copied entity."""
        return self.context['entities'].get(obj.pk)
