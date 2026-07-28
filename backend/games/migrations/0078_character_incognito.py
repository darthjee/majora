from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0077_rename_link_gamelink'),
    ]

    operations = [
        migrations.AddField(
            model_name='character',
            name='incognito',
            field=models.BooleanField(default=False),
        ),
    ]
