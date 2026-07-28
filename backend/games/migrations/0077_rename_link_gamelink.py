"""Migration to rename Link to GameLink with a dedicated Game FK, dropping polymorphism."""

import django.db.models.deletion
from django.db import migrations, models


def populate_game_fk(apps, schema_editor):
    """Populate GameLink.game_id from object_id for every row whose content_type is Game."""
    GameLink = apps.get_model('games', 'GameLink')

    if not GameLink.objects.exists():
        return

    ContentType = apps.get_model('contenttypes', 'ContentType')
    game_ct = ContentType.objects.filter(app_label='games', model='game').first()
    if game_ct is None:
        return

    for link in GameLink.objects.filter(content_type=game_ct):
        link.game_id = link.object_id
        link.save(update_fields=['game_id'])


class Migration(migrations.Migration):
    """Rename Link to GameLink, add a dedicated `game` FK, and drop polymorphism."""

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('games', '0076_backfill_gamedocumentfile_name'),
    ]

    operations = [
        migrations.RenameModel(old_name='Link', new_name='GameLink'),
        migrations.AddField(
            model_name='gamelink',
            name='game',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='links',
                to='games.game',
            ),
        ),
        migrations.RunPython(populate_game_fk, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='gamelink',
            name='game',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='links',
                to='games.game',
            ),
        ),
        migrations.RemoveField(model_name='gamelink', name='content_type'),
        migrations.RemoveField(model_name='gamelink', name='object_id'),
    ]
