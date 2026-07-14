"""Migration to create Link model."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create Link table."""

    dependencies = [
        ('games', '0004_create_photo'),
    ]

    operations = [
        migrations.CreateModel(
            name='Link',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                    ),
                ),
                ('text', models.CharField(max_length=200)),
                ('url', models.URLField()),
                (
                    'game',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='links',
                        to='games.game',
                    ),
                ),
            ],
        ),
    ]
