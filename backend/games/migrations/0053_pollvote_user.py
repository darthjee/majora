# Generated manually for issue #548 (no data migration needed — no votes exist yet)

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0052_poll_content_type_poll_object_id'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='pollvote',
            unique_together=set(),
        ),
        migrations.RemoveField(
            model_name='pollvote',
            name='player',
        ),
        migrations.AddField(
            model_name='pollvote',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='poll_votes',
                to=settings.AUTH_USER_MODEL,
                default=None,
            ),
            preserve_default=False,
        ),
        migrations.AlterUniqueTogether(
            name='pollvote',
            unique_together={('user', 'option')},
        ),
    ]
