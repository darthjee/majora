"""Move GameDomain/GameDomainGroup out of `games` into the standalone `domains` app.

State-only model creation paired with a `RENAME TABLE` so existing rows survive the move
intact — a plain `CreateModel` would create empty tables instead of reusing the data
already sitting in `games_gamedomain`/`games_gamedomaingroup`.
"""

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('games', '0089_alter_characteritem_unique_together'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='DomainGroup',
                    fields=[
                        (
                            'id',
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name='ID',
                            ),
                        ),
                        ('name', models.CharField(max_length=200)),
                    ],
                ),
                migrations.CreateModel(
                    name='Domain',
                    fields=[
                        (
                            'id',
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name='ID',
                            ),
                        ),
                        (
                            'domain',
                            models.CharField(
                                max_length=200,
                                unique=True,
                                validators=[
                                    django.core.validators.RegexValidator(
                                        message='domain must be a valid hostname (labels of '
                                        'letters, digits and hyphens separated by dots, no '
                                        'wildcards or whitespace).',
                                        regex=(
                                            r'\A([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)'
                                            r'(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+\Z'
                                        ),
                                    )
                                ],
                            ),
                        ),
                        (
                            'schemes',
                            models.CharField(
                                default='https',
                                max_length=20,
                                validators=[
                                    django.core.validators.RegexValidator(
                                        message='schemes must be a comma-separated list made'
                                        ' only of "http"/"https".',
                                        regex='^(http|https)(,(http|https))*$',
                                    )
                                ],
                            ),
                        ),
                        ('title', models.CharField(blank=True, default='', max_length=200)),
                        (
                            'domain_group',
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name='domains',
                                to='domains.domaingroup',
                            ),
                        ),
                    ],
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "RENAME TABLE games_gamedomaingroup TO domains_domaingroup, "
                        "games_gamedomain TO domains_domain;"
                    ),
                    reverse_sql=(
                        "RENAME TABLE domains_domaingroup TO games_gamedomaingroup, "
                        "domains_domain TO games_gamedomain;"
                    ),
                ),
                # The table rename above doesn't rename columns — `domain_group`'s FK column
                # is still named after the old `game_domain_group` field, so it must be
                # renamed explicitly to match the new model state (`domain_group_id`).
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE domains_domain "
                        "CHANGE COLUMN game_domain_group_id domain_group_id BIGINT NOT NULL;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE domains_domain "
                        "CHANGE COLUMN domain_group_id game_domain_group_id BIGINT NOT NULL;"
                    ),
                ),
            ],
        ),
    ]
