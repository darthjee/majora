from django.db import migrations


class Migration(migrations.Migration):
    """Remove UserProfile/PasswordResetToken from games' migration state only.

    Both models moved to the `accounts` app (see `accounts.0001_initial`); the underlying
    `games_userprofile`/`games_passwordresettoken` MySQL tables and their rows are untouched.
    """

    dependencies = [
        ('games', '0070_character_unique_player_character'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='UserProfile'),
                migrations.DeleteModel(name='PasswordResetToken'),
            ],
        ),
    ]
