"""Add the copy origin, `failed` status and `source_path`/`is_cover`/`error` to `Upload`."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('uploads', '0002_upload_origin_and_index'),
    ]

    operations = [
        migrations.AddField(
            model_name='upload',
            name='error',
            field=models.CharField(
                blank=True,
                choices=[
                    ('source_missing', 'source_missing'),
                    ('path_rejected', 'path_rejected'),
                    ('cross_device', 'cross_device'),
                    ('target_exists', 'target_exists'),
                    ('permission', 'permission'),
                    ('unknown', 'unknown'),
                ],
                max_length=32,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='upload',
            name='is_cover',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='upload',
            name='source_path',
            field=models.CharField(blank=True, max_length=512, null=True),
        ),
        migrations.AlterField(
            model_name='upload',
            name='origin',
            field=models.CharField(
                choices=[('regular', 'regular'), ('staff', 'staff'), ('copy', 'copy')],
                default='regular',
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='upload',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('uploading', 'Uploading'),
                    ('uploaded', 'Uploaded'),
                    ('failed', 'Failed'),
                ],
                default='pending',
                max_length=16,
            ),
        ),
    ]
