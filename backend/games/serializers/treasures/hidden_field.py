"""One-field serializer validating the `hidden` flag shared by treasure-writing views."""

from rest_framework import serializers


class HiddenFieldSerializer(serializers.Serializer):
    """Validate an optional `hidden` boolean, rejecting non-boolean input with a 400.

    Used at every call site that writes `GameTreasure.hidden` from raw request data, so
    DRF's strict `BooleanField` parsing (accepting real booleans and the conventional
    `"true"`/`"false"` strings, but rejecting ambiguous values like `"maybe"` or `123`)
    applies uniformly instead of Python truthiness coercion.
    """

    hidden = serializers.BooleanField(required=False)
