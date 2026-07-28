"""Rename HistoricalLink to HistoricalGameLink, matching the GameLink model rename."""

import django.db.models.deletion
from django.db import migrations, models


def populate_historical_game_fk(apps, schema_editor):
    """Populate HistoricalGameLink.game_id from object_id for rows whose content_type is Game."""
    HistoricalGameLink = apps.get_model('versioning', 'HistoricalGameLink')

    if not HistoricalGameLink.objects.exists():
        return

    ContentType = apps.get_model('contenttypes', 'ContentType')
    game_ct = ContentType.objects.filter(app_label='games', model='game').first()
    if game_ct is None:
        return

    for record in HistoricalGameLink.objects.filter(content_type=game_ct):
        record.game_id = record.object_id
        record.save()


class Migration(migrations.Migration):
    """Rename HistoricalLink to HistoricalGameLink; add `game`, drop `content_type`/`object_id`."""

    dependencies = [
        ('games', '0077_rename_link_gamelink'),
        ('versioning', '0013_historicalgamedocumentfile_name_and_more'),
    ]

    operations = [
        migrations.RenameModel(old_name='HistoricalLink', new_name='HistoricalGameLink'),
        migrations.AlterModelOptions(
            name='historicalgamelink',
            options={
                'get_latest_by': ('history_date', 'history_id'),
                'ordering': ('-history_date', '-history_id'),
                'verbose_name': 'historical game link',
                'verbose_name_plural': 'historical game links',
            },
        ),
        migrations.AddField(
            model_name='historicalgamelink',
            name='game',
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name='+',
                to='games.game',
            ),
        ),
        migrations.RunPython(populate_historical_game_fk, migrations.RunPython.noop),
        migrations.RemoveField(model_name='historicalgamelink', name='content_type'),
        migrations.RemoveField(model_name='historicalgamelink', name='object_id'),
    ]
