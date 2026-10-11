"""Upload model for Majora RPG Campaign Management System."""

import secrets
from datetime import timedelta

from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone

from games.settings import Settings


class UploadQuerySet(models.QuerySet):
    """QuerySet helpers for Upload records."""

    def active(self):
        """Return uploads still in flight: pending/uploading and not expired."""
        return self.filter(
            status__in=(Upload.STATUS_PENDING, Upload.STATUS_UPLOADING),
            expiration_time__gt=timezone.now(),
        )

    def for_objects(self, model, object_ids):
        """Return uploads linked to the given ids of the given model."""
        return self.filter(
            content_type=ContentType.objects.get_for_model(model),
            object_id__in=list(object_ids),
        )

    def for_object(self, instance):
        """Return uploads linked to the given model instance."""
        return self.for_objects(type(instance), [instance.pk])


class Upload(models.Model):
    """Model tracking the lifecycle of a game photo upload."""

    STATUS_PENDING = 'pending'
    STATUS_UPLOADING = 'uploading'
    STATUS_UPLOADED = 'uploaded'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_UPLOADING, 'Uploading'),
        (STATUS_UPLOADED, 'Uploaded'),
        (STATUS_FAILED, 'Failed'),
    ]

    UPLOAD_TYPE_IMAGE = 'image'
    UPLOAD_TYPE_FILE = 'file'

    UPLOAD_TYPE_CHOICES = [
        (UPLOAD_TYPE_IMAGE, 'image'),
        (UPLOAD_TYPE_FILE, 'file'),
    ]

    ORIGIN_REGULAR = 'regular'
    ORIGIN_STAFF = 'staff'
    ORIGIN_COPY = 'copy'

    ORIGIN_CHOICES = [
        (ORIGIN_REGULAR, 'regular'),
        (ORIGIN_STAFF, 'staff'),
        (ORIGIN_COPY, 'copy'),
    ]

    ERROR_SOURCE_MISSING = 'source_missing'
    ERROR_PATH_REJECTED = 'path_rejected'
    ERROR_CROSS_DEVICE = 'cross_device'
    ERROR_TARGET_EXISTS = 'target_exists'
    ERROR_PERMISSION = 'permission'
    ERROR_UNKNOWN = 'unknown'

    ERROR_CHOICES = [
        (ERROR_SOURCE_MISSING, 'source_missing'),
        (ERROR_PATH_REJECTED, 'path_rejected'),
        (ERROR_CROSS_DEVICE, 'cross_device'),
        (ERROR_TARGET_EXISTS, 'target_exists'),
        (ERROR_PERMISSION, 'permission'),
        (ERROR_UNKNOWN, 'unknown'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='uploads'
    )
    token = models.CharField(max_length=64, unique=True)
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    upload_type = models.CharField(
        max_length=10, choices=UPLOAD_TYPE_CHOICES, default=UPLOAD_TYPE_IMAGE
    )
    file_path = models.CharField(max_length=512)
    expiration_time = models.DateTimeField()
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    origin = models.CharField(
        max_length=10, choices=ORIGIN_CHOICES, default=ORIGIN_REGULAR
    )
    source_path = models.CharField(max_length=512, null=True, blank=True)
    is_cover = models.BooleanField(default=False)
    error = models.CharField(max_length=32, choices=ERROR_CHOICES, null=True, blank=True)

    objects = UploadQuerySet.as_manager()

    class Meta:
        """Model metadata for Upload."""

        db_table = 'games_upload'
        indexes = [
            models.Index(
                fields=['content_type', 'object_id'],
                name='games_upload_ct_obj_idx',
            ),
        ]

    @property
    def is_staff_origin(self):
        """Return True when the upload was initiated from the staff photos page."""
        return self.origin == self.ORIGIN_STAFF

    @property
    def is_copy_origin(self):
        """Return True when the upload is a hard-link job created by a game content copy."""
        return self.origin == self.ORIGIN_COPY

    def renew(self, user):
        """Re-issue the token and expiry, reset to pending, clear the error and reassign user."""
        self.token = self._new_token()
        self.expiration_time = self._new_expiration_time()
        self.status = self.STATUS_PENDING
        self.error = None
        self.user = user
        self.save()

    def save(self, *args, **kwargs):
        """Persist the upload record, enforcing immutability after upload."""
        self._ensure_not_uploaded()
        if not self.token:
            self.token = self._new_token()
        if not self.expiration_time:
            self.expiration_time = self._new_expiration_time()
        super().save(*args, **kwargs)

    def _ensure_not_uploaded(self):
        """Raise ValueError when the stored record is already `uploaded`."""
        if self.pk is None:
            return
        existing = Upload.objects.filter(pk=self.pk).values('status').first()
        if existing and existing['status'] == self.STATUS_UPLOADED:
            raise ValueError('Upload record cannot be modified once status is uploaded.')

    @staticmethod
    def _new_token():
        """Return a fresh random upload token."""
        return secrets.token_urlsafe(32)

    @staticmethod
    def _new_expiration_time():
        """Return the expiration time for an upload issued now."""
        return timezone.now() + timedelta(minutes=Settings.upload_expiration_minutes())

    def __str__(self):
        """Return string representation of the upload."""
        return f'Upload(user={self.user.username}, status={self.status})'
