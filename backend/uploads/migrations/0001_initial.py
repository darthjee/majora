"""Move the `Upload` model's state out of `games` into the standalone `uploads` app.

State-only model creation -- `database_operations` is empty because the underlying
`games_upload` table (and its data) is left completely untouched; the `Upload` model
keeps pointing at it via an explicit `db_table = 'games_upload'` Meta override (see
`uploads/models.py`). This mirrors the `domains`/`games` app-split precedent
(`domains/migrations/0001_initial.py` /
`games/migrations/0090_move_domain_models_to_domains_app.py`), except that precedent
also renamed its underlying tables via `RunSQL`, which this move deliberately does not
do -- there is no data-migration risk here since upload records are short-lived and
expiring, not durable data.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('games', '0090_move_domain_models_to_domains_app'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='Upload',
                    fields=[
                        (
                            'id',
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name='ID',
                            ),
                        ),
                        ('token', models.CharField(max_length=64, unique=True)),
                        (
                            'status',
                            models.CharField(
                                choices=[
                                    ('pending', 'Pending'),
                                    ('uploading', 'Uploading'),
                                    ('uploaded', 'Uploaded'),
                                ],
                                default='pending',
                                max_length=16,
                            ),
                        ),
                        (
                            'upload_type',
                            models.CharField(
                                choices=[('image', 'image'), ('file', 'file')],
                                default='image',
                                max_length=10,
                            ),
                        ),
                        ('file_path', models.CharField(max_length=512)),
                        ('expiration_time', models.DateTimeField()),
                        (
                            'content_type',
                            models.ForeignKey(
                                blank=True,
                                null=True,
                                on_delete=django.db.models.deletion.CASCADE,
                                to='contenttypes.contenttype',
                            ),
                        ),
                        ('object_id', models.PositiveIntegerField(blank=True, null=True)),
                        (
                            'user',
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name='uploads',
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        'db_table': 'games_upload',
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
