"""Migration to make Link model polymorphic using ContentType framework."""

import django.db.models.deletion
from django.db import migrations, models


def populate_content_type(apps, schema_editor):
    """Populate content_type and object_id from existing game FK."""
    Link = apps.get_model('games', 'Link')

    if not Link.objects.exists():
        return

    ContentType = apps.get_model('contenttypes', 'ContentType')
    game_ct, _ = ContentType.objects.get_or_create(app_label='games', model='game')

    for link in Link.objects.all():
        if link.game_id is not None:
            link.content_type = game_ct
            link.object_id = link.game_id
            link.save(update_fields=['content_type', 'object_id'])


class Migration(migrations.Migration):

    """Make Link polymorphic: replace game FK with ContentType/object_id."""

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('games', '0021_characterlink'),
    ]

    operations = [
        migrations.AddField(
            model_name='link',
            name='content_type',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to='contenttypes.contenttype',
            ),
        ),
        migrations.AddField(
            model_name='link',
            name='object_id',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.RunPython(populate_content_type, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='link',
            name='game',
        ),
    ]
