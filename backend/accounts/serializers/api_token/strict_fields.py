"""Mixin rejecting request keys a scoped API token serializer does not accept."""

from collections.abc import Mapping

from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail

NOT_EDITABLE = 'not_editable'


class StrictFieldsMixin:
    """Report every unknown key as `not_editable`, together with the other field errors."""

    def to_internal_value(self, data):
        """Validate the fields, merging `not_editable` errors for unknown keys into one 400."""
        unknown_errors = self._unknown_field_errors(data)
        try:
            value = super().to_internal_value(data)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({**exc.detail, **unknown_errors}) from exc
        if unknown_errors:
            raise serializers.ValidationError(unknown_errors)
        return value

    def _unknown_field_errors(self, data):
        """Return `{key: [not_editable]}` for every key outside the serializer's fields."""
        if not isinstance(data, Mapping):
            return {}
        return {
            key: [ErrorDetail(NOT_EDITABLE, code=NOT_EDITABLE)]
            for key in data if key not in self.fields
        }
