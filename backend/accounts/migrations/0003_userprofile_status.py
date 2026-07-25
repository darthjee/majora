from django.db import migrations, models


class Migration(migrations.Migration):
    """Add the `status` field to `UserProfile`, defaulting new rows to `pending`."""

    dependencies = [
        ('accounts', '0002_authorizationrequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')],
                db_default='pending',
                default='pending',
                max_length=16,
            ),
        ),
    ]
