from django.db import migrations


class Migration(migrations.Migration):
    """Add a DB-level unique constraint on `auth_user.email`.

    Raw SQL against the `auth_user` table, since `auth.User` belongs to
    `django.contrib.auth`, not one of this project's own apps, so it has no
    `AlterField`/`unique=True` model-state operation available here. Depends on
    `0005_lowercase_username_email` so the constraint is only added once existing data has
    been normalized; confirmed (see issue #1039) there are no pre-existing duplicate/blank
    emails, so no cleanup/backfill step is needed before this lands.
    """

    dependencies = [
        ('accounts', '0005_lowercase_username_email'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE auth_user ADD CONSTRAINT auth_user_email_unique UNIQUE (email);",
            reverse_sql="ALTER TABLE auth_user DROP INDEX auth_user_email_unique;",
        ),
    ]
