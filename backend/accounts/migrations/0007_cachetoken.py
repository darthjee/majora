import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import accounts.models.cache_token


class Migration(migrations.Migration):
    """Create the `CacheToken` model, own table, one row per user."""

    dependencies = [
        ('accounts', '0006_auth_user_email_unique'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CacheToken',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                    ),
                ),
                (
                    'key',
                    models.CharField(
                        default=accounts.models.cache_token._generate_key,
                        max_length=40,
                        unique=True,
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='cache_token',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'db_table': 'accounts_cachetoken',
            },
        ),
    ]
