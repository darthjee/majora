"""Upload model for Majora RPG Campaign Management System."""

import secrets
from datetime import timedelta

from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone

from games.settings import Settings


class Upload(models.Model):

    """Model tracking the lifecycle of a game photo upload."""

    STATUS_PENDING = 'pending'
    STATUS_UPLOADING = 'uploading'
    STATUS_UPLOADED = 'uploaded'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_UPLOADING, 'Uploading'),
        (STATUS_UPLOADED, 'Uploaded'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='uploads'
    )
    token = models.CharField(max_length=64, unique=True)
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    file_path = models.CharField(max_length=512)
    expiration_time = models.DateTimeField()
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    def save(self, *args, **kwargs):
        """Persist the upload record, enforcing immutability after upload."""
        if self.pk is not None:
            existing = Upload.objects.filter(pk=self.pk).values('status').first()
            if existing and existing['status'] == self.STATUS_UPLOADED:
                raise ValueError('Upload record cannot be modified once status is uploaded.')
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.expiration_time:
            self.expiration_time = timezone.now() + timedelta(
                minutes=Settings.upload_expiration_minutes()
            )
        super().save(*args, **kwargs)

    def __str__(self):
        """Return string representation of the upload."""
        return f'Upload(user={self.user.username}, status={self.status})'
