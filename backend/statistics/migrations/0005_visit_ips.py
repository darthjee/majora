"""Add the first and last client IP of a visit (nullable, no backfill)."""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('statistics', '0004_session_visit_tracking_columns'),
    ]

    operations = [
        migrations.AddField(
            model_name='visit',
            name='first_ip',
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='visit',
            name='last_ip',
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
    ]
