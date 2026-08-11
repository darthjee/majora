"""StlModel update serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import StlModel


class StlModelUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partially updating an STL model's scalar fields.

    `photo`/`tags`/`sources`/`collections` are intentionally excluded -- they already have
    their own dedicated flows (photo upload endpoint; no edit UI in scope for the others).
    """

    class Meta:
        """Metadata for the StlModelUpdateSerializer."""

        model = StlModel
        fields = ['name', 'owned', 'type', 'race', 'role']
        extra_kwargs = {field: {'required': False} for field in fields}
