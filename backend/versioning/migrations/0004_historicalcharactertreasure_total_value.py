from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('versioning', '0003_historicaltreasure_game_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='historicalcharactertreasure',
            name='total_value',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
