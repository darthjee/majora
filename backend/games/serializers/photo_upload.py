"""Serializer for the photo upload init endpoint."""

import os

from rest_framework import serializers


class PhotoUploadSerializer(serializers.Serializer):
    """Validates the filename submitted to the photo upload init endpoint."""

    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

    filename = serializers.CharField(max_length=255, allow_blank=False)

    def validate_filename(self, value):
        """Reject filenames with disallowed extensions or no extension."""
        basename = os.path.basename(value)
        _, ext = os.path.splitext(basename)
        if ext.lower() not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                'file_extension_not_allowed', code='file_extension_not_allowed',
            )
        return basename  # return the sanitised basename, not the raw value


class FileUploadSerializer(PhotoUploadSerializer):
    """Validates the filename submitted to the (non-photo) file upload init endpoint."""

    ALLOWED_EXTENSIONS = {'.pdf'}

    name = serializers.CharField(max_length=255, allow_blank=True, required=False, default='')
