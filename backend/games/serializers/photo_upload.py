"""Serializer for the photo upload init endpoint."""

import os

from rest_framework import serializers

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}


class PhotoUploadSerializer(serializers.Serializer):
    """Validates the filename submitted to the photo upload init endpoint."""

    filename = serializers.CharField(max_length=255, allow_blank=False)

    def validate_filename(self, value):
        """Reject filenames with disallowed extensions or no extension."""
        basename = os.path.basename(value)
        _, ext = os.path.splitext(basename)
        if ext.lower() not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f'File extension "{ext}" is not allowed. '
                f'Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}'
            )
        return basename  # return the sanitised basename, not the raw value
