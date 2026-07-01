"""Migration to add photo field to Game model."""

from django.db import migrations, models


class Migration(migrations.Migration):

    """Add photo URL field to Game."""

    dependencies = [
        ('games', '0005_create_link'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='photo',
            field=models.URLField(blank=True, null=True),
        ),
    ]
