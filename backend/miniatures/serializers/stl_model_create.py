"""StlModel create serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import StlModel

from ._tags_sync import TagsSync, validate_tag_lengths, validate_tags_count


class StlModelCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new STL model, with a free-typed `tags` list.

    `sources` is out of scope on creation (see the issue): new `StlModel`s are always
    created with an empty `sources` list, attached later via a separate feature.
    """

    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        """Metadata for the StlModelCreateSerializer."""

        model = StlModel
        fields = ['name', 'tags']
        extra_kwargs = {
            'name': {'required': True},
        }

    def validate_tags(self, value):
        """Reject a `tags` list exceeding `MAX_TAGS` entries or containing an over-long tag."""
        validate_tag_lengths(value)
        return validate_tags_count(value)

    def create(self, validated_data):
        """Create the `StlModel` from `name`, then get-or-create/attach the given `tags`."""
        tag_names = validated_data.pop('tags', [])
        stl_model = StlModel.objects.create(**validated_data)
        TagsSync(stl_model, tag_names).apply()
        return stl_model
