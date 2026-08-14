"""Races/roles-sync helpers for the `StlModel` create/update serializers."""

from django.db import transaction

from miniatures.models import StlModelRace, StlModelRole


class RacesSync:
    """Attaches a validated, de-duplicated list of race values to a `StlModel`."""

    def __init__(self, stl_model, creatures):
        """Store the target `stl_model` and the validated `creatures` list to apply."""
        self.stl_model = stl_model
        self.creatures = creatures

    def apply(self):
        """Create one `StlModelRace` per de-duplicated entry in `self.creatures`.

        Wrapped in a transaction so a mid-batch failure rolls back every race already
        attached in this call, instead of leaving a partial set.
        """
        with transaction.atomic():
            for creature in set(self.creatures):
                StlModelRace.objects.create(stl_model=self.stl_model, creature=creature)


class RolesSync:
    """Attaches a validated, de-duplicated list of role values to a `StlModel`."""

    def __init__(self, stl_model, roles):
        """Store the target `stl_model` and the validated `roles` list to apply."""
        self.stl_model = stl_model
        self.roles = roles

    def apply(self):
        """Create one `StlModelRole` per de-duplicated entry in `self.roles`.

        Wrapped in a transaction so a mid-batch failure rolls back every role already
        attached in this call, instead of leaving a partial set.
        """
        with transaction.atomic():
            for role in set(self.roles):
                StlModelRole.objects.create(stl_model=self.stl_model, role=role)
