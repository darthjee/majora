import os
import re

from django.db import migrations

_UUID_SUFFIX_RE = re.compile(
    r'_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE,
)


def _extract_name_from_path(path):
    """Derive the original file name from `path`, stripping its trailing uuid4 suffix."""
    if not path:
        return ''
    basename = os.path.basename(path)
    stem, ext = os.path.splitext(basename)
    stem = _UUID_SUFFIX_RE.sub('', stem)
    return f'{stem}{ext}'


def _backfill_gamedocumentfile_name(apps, schema_editor):
    """Set GameDocumentFile.name from each row's path, for rows created before `name` existed."""
    GameDocumentFile = apps.get_model('games', 'GameDocumentFile')

    for document_file in GameDocumentFile.objects.all():
        document_file.name = _extract_name_from_path(document_file.path)
        document_file.save(update_fields=['name'])


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — name removal is handled by name's own AddField reversal."""


class Migration(migrations.Migration):
    """Migration to backfill GameDocumentFile.name from its path."""

    dependencies = [
        ('games', '0075_gamedocumentfilephoto_gamedocumentfile_name_and_more'),
    ]

    operations = [
        migrations.RunPython(_backfill_gamedocumentfile_name, _noop_reverse),
    ]
