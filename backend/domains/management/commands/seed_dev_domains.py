"""Management command registering `localhost`/`127.0.0.1` as dev domains (issue #1727)."""

from django.core.management.base import BaseCommand

from domains.seeds.dev_domains_seeder import DevDomainsSeeder, DevDomainsSeedGuard


class Command(BaseCommand):
    """Seed the local development domains, when `SEED_DEV_DOMAINS=true` outside production."""

    help = (
        'Register localhost and 127.0.0.1 as Domain rows and attach every game to their '
        'domain groups. Runs only with SEED_DEV_DOMAINS=true and STAGE != production.'
    )

    def handle(self, *args, **options):
        """Print a skipped notice, or run the seed and print one line per change."""
        reason = DevDomainsSeedGuard().skip_reason()
        if reason:
            self.stdout.write(f'seed_dev_domains skipped: {reason}')
            return
        for report in DevDomainsSeeder().seed():
            self.stdout.write(report)
