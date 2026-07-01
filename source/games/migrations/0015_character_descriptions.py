"""Migration to rename description to public_description and add private_description."""

from django.db import migrations, models


class Migration(migrations.Migration):

    """Rename description field and add private_description to Character."""

    dependencies = [
        ('games', '0014_gamemaster'),
    ]

    operations = [
        migrations.RenameField(
            model_name='character',
            old_name='description',
            new_name='public_description',
        ),
        migrations.AddField(
            model_name='character',
            name='private_description',
            field=models.TextField(blank=True),
        ),
    ]
