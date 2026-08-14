"""StlModel update serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import StlModel

from ._stl_model_races_roles_sync import RacesSync, RolesSync


class StlModelUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partially updating an STL model's scalar fields.

    `photo`/`tags`/`sources`/`collections` are intentionally excluded -- they already have
    their own dedicated flows (photo upload endpoint; no edit UI in scope for the others).
    """

    races = serializers.ListField(
        child=serializers.ChoiceField(choices=StlModel.RACE_CHOICES), required=False,
    )
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=StlModel.ROLE_CHOICES), required=False,
    )

    class Meta:
        """Metadata for the StlModelUpdateSerializer."""

        model = StlModel
        fields = ['name', 'owned', 'type', 'url', 'size', 'races', 'roles']
        extra_kwargs = {
            field: {'required': False} for field in fields if field not in ('races', 'roles')
        }

    def update(self, instance, validated_data):
        """Update scalar fields as usual, and replace `races`/`roles` when given."""
        races = validated_data.pop('races', None)
        roles = validated_data.pop('roles', None)
        instance = super().update(instance, validated_data)
        if races is not None:
            self._resync_races(instance, races)
        if roles is not None:
            self._resync_roles(instance, roles)
        return instance

    def _resync_races(self, instance, races):
        """Replace `instance`'s existing races with the given list."""
        instance.races.all().delete()
        RacesSync(instance, races).apply()

    def _resync_roles(self, instance, roles):
        """Replace `instance`'s existing roles with the given list."""
        instance.roles.all().delete()
        RolesSync(instance, roles).apply()
