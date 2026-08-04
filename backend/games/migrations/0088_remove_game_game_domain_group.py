from django.db import migrations


class Migration(migrations.Migration):
    """Drop the old Game.game_domain_group FK, now superseded by game_domain_groups."""

    dependencies = [
        ('games', '0087_migrate_game_domain_group_to_m2m'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='game',
            name='game_domain_group',
        ),
    ]
