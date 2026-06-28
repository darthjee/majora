"""Migration to create CharacterLink model."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create CharacterLink table."""

    dependencies = [
        ('games', '0020_character_hidden'),
    ]

    operations = [
        migrations.CreateModel(
            name='CharacterLink',
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
                    'character',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='links',
                        to='games.character',
                    ),
                ),
            ],
        ),
    ]
