"""Migration to create Game model."""

from django.db import migrations, models


class Migration(migrations.Migration):

    """Create Game table."""

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                    ),
                ),
                ('name', models.CharField(max_length=200)),
                ('game_slug', models.SlugField(max_length=200, unique=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
    ]
