"""Add the `Visit` model, tracking each burst of activity of a statistics `Session`."""

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('statistics', '0002_session_domain'),
    ]

    operations = [
        migrations.CreateModel(
            name='Visit',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID',
                    ),
                ),
                ('started_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('last_seen_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('hits', models.PositiveIntegerField(default=1)),
                (
                    'session',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='visits',
                        to='statistics.session',
                    ),
                ),
            ],
            options={
                'indexes': [
                    models.Index(fields=['started_at'], name='statistics__started_1ce40b_idx'),
                    models.Index(
                        fields=['session', 'last_seen_at'],
                        name='statistics__session_9107d5_idx',
                    ),
                ],
            },
        ),
    ]
