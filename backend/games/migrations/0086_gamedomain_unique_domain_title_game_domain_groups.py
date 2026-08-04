import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    """Make GameDomain.domain globally unique, add title, and add Game.game_domain_groups.

    This intentionally keeps the old `Game.game_domain_group` FK column around for now — the
    next migration copies its data into the new `game_domain_groups` M2M before a later
    migration drops the old column.
    """

    dependencies = [
        ('games', '0085_alter_gamedomain_domain_and_more'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='gamedomain',
            name='unique_domain_per_group',
        ),
        migrations.AlterField(
            model_name='gamedomain',
            name='domain',
            field=models.CharField(
                max_length=200,
                unique=True,
                validators=[
                    django.core.validators.RegexValidator(
                        message='domain must be a valid hostname (labels of letters, digits '
                        'and hyphens separated by dots, no wildcards or whitespace).',
                        regex=(
                            r'\A([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)'
                            r'(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+\Z'
                        ),
                    )
                ],
            ),
        ),
        migrations.AddField(
            model_name='gamedomain',
            name='title',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='game',
            name='game_domain_groups',
            field=models.ManyToManyField(
                blank=True, related_name='games', to='games.gamedomaingroup'
            ),
        ),
    ]
