from django.db import migrations, models


class Migration(migrations.Migration):
    """Migration to make GameTreasure.value NOT NULL now that it has been backfilled."""

    dependencies = [
        ('games', '0055_gametreasure_value'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gametreasure',
            name='value',
            field=models.IntegerField(),
        ),
    ]
