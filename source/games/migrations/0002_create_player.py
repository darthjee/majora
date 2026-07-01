"""Migration to create Player model."""

from django.db import migrations, models


class Migration(migrations.Migration):

    """Create Player table."""

    dependencies = [
        ('games', '0001_create_game'),
    ]

    operations = [
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
    ]
