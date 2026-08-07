"""Repoint `games` at the `domains` app now that GameDomain/GameDomainGroup moved there.

The underlying `GameDomain`/`GameDomainGroup` tables were already renamed away by
`domains`'s own `0001_initial` migration — state-only here. `game_domain_groups`'s M2M
*through* table (`games_game_game_domain_groups`) itself is untouched, but its target-side
column is renamed to match Django's default naming for the new target model
(`domains.DomainGroup` → `domaingroup_id`, same as it was for `games.GameDomainGroup`
before the rename, just without the `game` prefix).
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('games', '0089_alter_characteritem_unique_together'),
        ('domains', '0001_initial'),
        # `versioning`'s 0019-0022 chain adds then removes a `historicalgame.game_domain_group`
        # FK targeting `games.gamedomaingroup`, and 0023 (which wipes the old GameDomain/
        # GameDomainGroup history) re-declares that same FK shape when reversed — that model
        # must still exist in migration state whenever any of those migrations (forward or
        # reversed) run, so this migration (which deletes it) must apply after all of them.
        ('versioning', '0023_move_domain_history_to_domains_app'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='game',
                    name='game_domain_groups',
                    field=models.ManyToManyField(
                        blank=True, related_name='games', to='domains.domaingroup'
                    ),
                ),
                migrations.DeleteModel(
                    name='GameDomain',
                ),
                migrations.DeleteModel(
                    name='GameDomainGroup',
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE games_game_game_domain_groups "
                        "CHANGE COLUMN gamedomaingroup_id domaingroup_id BIGINT NOT NULL;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE games_game_game_domain_groups "
                        "CHANGE COLUMN domaingroup_id gamedomaingroup_id BIGINT NOT NULL;"
                    ),
                ),
            ],
        ),
    ]
