"""Wipe old GameDomain/GameDomainGroup history, create fresh Domain/DomainGroup history.

Per issue #1015, the audit trail for `GameDomain`/`GameDomainGroup` is intentionally
wiped rather than migrated across the app move — the live `Domain`/`DomainGroup` row
data itself is preserved separately, by `domains`'s own `0001_initial` migration
(`RENAME TABLE`), only their *history* is lost here.
"""

import django.core.validators
import django.db.models.deletion
import simple_history.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('domains', '0001_initial'),
        ('versioning', '0022_remove_historicalgame_game_domain_group_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='HistoricalGameDomain',
        ),
        migrations.DeleteModel(
            name='HistoricalGameDomainGroup',
        ),
        migrations.CreateModel(
            name='HistoricalDomainGroup',
            fields=[
                (
                    'id',
                    models.BigIntegerField(
                        auto_created=True, blank=True, db_index=True, verbose_name='ID'
                    ),
                ),
                ('name', models.CharField(max_length=200)),
                ('history_id', models.AutoField(primary_key=True, serialize=False)),
                ('history_date', models.DateTimeField(db_index=True)),
                ('history_change_reason', models.CharField(max_length=100, null=True)),
                (
                    'history_type',
                    models.CharField(
                        choices=[('+', 'Created'), ('~', 'Changed'), ('-', 'Deleted')],
                        max_length=1,
                    ),
                ),
                (
                    'history_user',
                    models.ForeignKey(
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'historical domain group',
                'verbose_name_plural': 'historical domain groups',
                'ordering': ('-history_date', '-history_id'),
                'get_latest_by': ('history_date', 'history_id'),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
        migrations.CreateModel(
            name='HistoricalDomain',
            fields=[
                (
                    'id',
                    models.BigIntegerField(
                        auto_created=True, blank=True, db_index=True, verbose_name='ID'
                    ),
                ),
                (
                    'domain',
                    models.CharField(
                        db_index=True,
                        max_length=200,
                        validators=[
                            django.core.validators.RegexValidator(
                                message='domain must be a valid hostname (labels of letters,'
                                ' digits and hyphens separated by dots, no wildcards or'
                                ' whitespace).',
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
                                message='schemes must be a comma-separated list made only of'
                                ' "http"/"https".',
                                regex='^(http|https)(,(http|https))*$',
                            )
                        ],
                    ),
                ),
                ('title', models.CharField(blank=True, default='', max_length=200)),
                ('history_id', models.AutoField(primary_key=True, serialize=False)),
                ('history_date', models.DateTimeField(db_index=True)),
                ('history_change_reason', models.CharField(max_length=100, null=True)),
                (
                    'history_type',
                    models.CharField(
                        choices=[('+', 'Created'), ('~', 'Changed'), ('-', 'Deleted')],
                        max_length=1,
                    ),
                ),
                (
                    'domain_group',
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name='+',
                        to='domains.domaingroup',
                    ),
                ),
                (
                    'history_user',
                    models.ForeignKey(
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'historical domain',
                'verbose_name_plural': 'historical domains',
                'ordering': ('-history_date', '-history_id'),
                'get_latest_by': ('history_date', 'history_id'),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
    ]
