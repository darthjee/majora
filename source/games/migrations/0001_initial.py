"""Initial migration for the games app."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create initial database tables for the games app."""

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                    ),
                ),
                ('name', models.CharField(max_length=200)),
                ('game_slug', models.SlugField(max_length=200, unique=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                    ),
                ),
                ('name', models.CharField(max_length=200)),
                (
                    'games',
                    models.ManyToManyField(blank=True, related_name='players', to='games.game'),
                ),
            ],
            options={
                'ordering': ['name'],
            },
        ),
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
