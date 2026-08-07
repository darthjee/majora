"""Add a nullable `domain` FK to `Session`, resolved from the request host per-visit."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('domains', '0001_initial'),
        ('statistics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='session',
            name='domain',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='statistics_sessions',
                to='domains.domain',
            ),
        ),
    ]
