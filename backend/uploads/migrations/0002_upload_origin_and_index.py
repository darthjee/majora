"""Add `Upload.origin` and a composite `(content_type, object_id)` index."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('uploads', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='upload',
            name='origin',
            field=models.CharField(
                choices=[('regular', 'regular'), ('staff', 'staff')],
                default='regular',
                max_length=10,
            ),
        ),
        migrations.AddIndex(
            model_name='upload',
            index=models.Index(
                fields=['content_type', 'object_id'], name='games_upload_ct_obj_idx'
            ),
        ),
    ]
