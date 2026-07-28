from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('versioning', '0014_rename_historicallink_historicalgamelink'),
    ]

    operations = [
        migrations.AddField(
            model_name='historicalcharacter',
            name='incognito',
            field=models.BooleanField(default=False),
        ),
    ]
