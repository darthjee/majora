import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Add UserProfile/PasswordResetToken to accounts' migration state only.

    Both models moved here from the `games` app (see `games.0071_...`); the underlying
    `games_userprofile`/`games_passwordresettoken` MySQL tables and their rows are untouched —
    the `db_table` Meta option on each model keeps writes going to the same physical tables.
    """

    initial = True

    dependencies = [
        ('games', '0071_move_userprofile_passwordresettoken_to_accounts'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='PasswordResetToken',
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
                        ('token', models.CharField(max_length=64, unique=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('used_at', models.DateTimeField(blank=True, null=True)),
                        (
                            'user',
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name='password_reset_tokens',
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        'db_table': 'games_passwordresettoken',
                    },
                ),
                migrations.CreateModel(
                    name='UserProfile',
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
                        ('favorite_language', models.CharField(default='en', max_length=10)),
                        ('email_hash', models.CharField(blank=True, max_length=64, null=True)),
                        (
                            'display_name',
                            models.CharField(max_length=150, null=True, unique=True),
                        ),
                        (
                            'user',
                            models.OneToOneField(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name='profile',
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        'db_table': 'games_userprofile',
                    },
                ),
            ],
        ),
    ]
