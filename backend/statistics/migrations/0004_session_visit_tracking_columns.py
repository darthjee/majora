"""Add the creation path, reason and logged-state tracking columns to sessions and visits."""

from django.db import migrations, models

CREATION_REASON_CHOICES = [
    ('no_cookie', 'No cookie'),
    ('invalid_cookie', 'Invalid cookie'),
    ('cookie_session_not_found', 'Cookie session not found'),
    ('domain_changed', 'Domain changed'),
    ('ip_changed', 'IP changed'),
    ('login_rotation', 'Login rotation'),
]


class Migration(migrations.Migration):
    dependencies = [
        ('statistics', '0003_visit'),
    ]

    operations = [
        migrations.AddField(
            model_name='session',
            name='creation_reason',
            field=models.CharField(
                blank=True, choices=CREATION_REASON_CHOICES, max_length=32, null=True,
            ),
        ),
        migrations.AddField(
            model_name='session',
            name='first_path',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='session',
            name='first_seen_logged',
            field=models.BooleanField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='visit',
            name='first_path',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='visit',
            name='last_path',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
