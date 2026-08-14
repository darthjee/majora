"""StlModel create serializer for the miniatures app."""

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from common.serializer_fields import http_url_field
from miniatures.models import Collection, Source, StlModel

from ._stl_model_races_roles_sync import RacesSync, RolesSync
from ._tags_sync import TagsSync, validate_tag_lengths, validate_tags_count


class StlModelCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new STL model, with a free-typed `tags` list.

    `source_ids`/`collection_ids` are optional and, when given, link the new `StlModel` to
    the given `Source`s/`Collection`s; when omitted, both M2Ms start empty.
    """

    # Declared explicitly (rather than left to auto-mapping) so the http/https-only
    # `URLValidator` actually runs at `is_valid()` time -- see `common.serializer_fields`.
    # The explicit `UniqueValidator` replaces the one DRF would otherwise auto-attach from
    # `StlModel.url`'s `unique=True`, which auto-mapping would also stop adding once the
    # field is declared explicitly.
    url = http_url_field(
        max_length=200, required=False, default=None, allow_null=True, allow_blank=True,
        validators=[UniqueValidator(queryset=StlModel.objects.all())],
    )
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    source_ids = serializers.PrimaryKeyRelatedField(
        source='sources', queryset=Source.objects.all(), many=True, required=False, default=list,
    )
    collection_ids = serializers.PrimaryKeyRelatedField(
        source='collections', queryset=Collection.objects.all(), many=True, required=False,
        default=list,
    )
    races = serializers.ListField(
        child=serializers.ChoiceField(choices=StlModel.RACE_CHOICES), required=False,
        default=list,
    )
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=StlModel.ROLE_CHOICES), required=False,
        default=list,
    )

    class Meta:
        """Metadata for the StlModelCreateSerializer."""

        model = StlModel
        fields = [
            'name', 'owned', 'type', 'url', 'size', 'races', 'roles', 'tags', 'source_ids',
            'collection_ids',
        ]
        extra_kwargs = {
            'name': {'required': True},
            'owned': {'required': False, 'default': True},
            'type': {'required': True},
            'size': {'required': False, 'default': None},
        }

    def validate_tags(self, value):
        """Reject a `tags` list exceeding `MAX_TAGS` entries or containing an over-long tag."""
        validate_tag_lengths(value)
        return validate_tags_count(value)

    def create(self, validated_data):
        """Create the `StlModel`, attach tags/races/roles, and link sources/collections."""
        tag_names = validated_data.pop('tags', [])
        sources = validated_data.pop('sources', [])
        collections = validated_data.pop('collections', [])
        races = validated_data.pop('races', [])
        roles = validated_data.pop('roles', [])
        stl_model = StlModel.objects.create(**validated_data)
        TagsSync(stl_model, tag_names).apply()
        RacesSync(stl_model, races).apply()
        RolesSync(stl_model, roles).apply()
        stl_model.sources.set(sources)
        stl_model.collections.set(collections)
        return stl_model
