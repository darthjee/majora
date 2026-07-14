"""Add description field to Game model."""

from django.db import migrations, models


class Migration(migrations.Migration):
    """Add description TextField to Game."""

    dependencies = [
        ('games', '0006_game_photo'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
    ]
