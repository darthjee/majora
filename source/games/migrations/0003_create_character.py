"""Migration to create Character model."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    """Create Character table."""

    dependencies = [
        ('games', '0002_create_player'),
    ]

    operations = [
        migrations.CreateModel(
            name='Character',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                    ),
                ),
                ('name', models.CharField(max_length=200)),
                ('avatar_url', models.URLField(blank=True, null=True)),
                ('character_class', models.CharField(blank=True, max_length=200)),
                ('level', models.IntegerField(blank=True, null=True)),
                ('description', models.TextField(blank=True)),
                (
                    'game',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='characters',
                        to='games.game',
                    ),
                ),
                (
                    'player',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='characters',
                        to='games.player',
                    ),
                ),
            ],
            options={
                'ordering': ['name'],
            },
        ),
    ]
