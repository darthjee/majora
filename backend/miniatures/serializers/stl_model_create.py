"""StlModel create serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Collection, Source, StlModel

from ._tags_sync import TagsSync, validate_tag_lengths, validate_tags_count


class StlModelCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new STL model, with a free-typed `tags` list.

    `source_ids`/`collection_ids` are optional and, when given, link the new `StlModel` to
    the given `Source`s/`Collection`s; when omitted, both M2Ms start empty.
    """

    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    source_ids = serializers.PrimaryKeyRelatedField(
        source='sources', queryset=Source.objects.all(), many=True, required=False, default=list,
    )
    collection_ids = serializers.PrimaryKeyRelatedField(
        source='collections', queryset=Collection.objects.all(), many=True, required=False,
        default=list,
    )

    class Meta:
        """Metadata for the StlModelCreateSerializer."""

        model = StlModel
        fields = ['name', 'tags', 'source_ids', 'collection_ids']
        extra_kwargs = {
            'name': {'required': True},
        }

    def validate_tags(self, value):
        """Reject a `tags` list exceeding `MAX_TAGS` entries or containing an over-long tag."""
        validate_tag_lengths(value)
        return validate_tags_count(value)

    def create(self, validated_data):
        """Create the `StlModel`, get-or-create/attach `tags`, and link `sources`/`collections`."""
        tag_names = validated_data.pop('tags', [])
        sources = validated_data.pop('sources', [])
        collections = validated_data.pop('collections', [])
        stl_model = StlModel.objects.create(**validated_data)
        TagsSync(stl_model, tag_names).apply()
        stl_model.sources.set(sources)
        stl_model.collections.set(collections)
        return stl_model
