"""Migration to create Photo model."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    """Create Photo table."""

    dependencies = [
        ('games', '0003_create_character'),
    ]

    operations = [
        migrations.CreateModel(
            name='Photo',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                    ),
                ),
                ('url', models.URLField()),
                (
                    'character',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='photos',
                        to='games.character',
                    ),
                ),
            ],
        ),
    ]
