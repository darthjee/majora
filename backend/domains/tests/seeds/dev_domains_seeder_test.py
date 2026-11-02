"""Tests for the dev domains seed guard."""

from domains.seeds.dev_domains_seeder import DevDomainsSeedGuard


class TestDevDomainsSeedGuard:
    """Tests for `DevDomainsSeedGuard`."""

    def test_allows_when_flag_is_true_outside_production(self):
        """Test that the seed may run with the flag set and a non-production stage."""
        guard = DevDomainsSeedGuard({'SEED_DEV_DOMAINS': 'true', 'STAGE': 'development'})
        assert guard.skip_reason() is None

    def test_allows_when_stage_is_unset(self):
        """Test that a missing STAGE does not block the seed."""
        assert DevDomainsSeedGuard({'SEED_DEV_DOMAINS': 'true'}).skip_reason() is None

    def test_blocks_without_flag(self):
        """Test that a missing flag blocks the seed."""
        assert DevDomainsSeedGuard({}).skip_reason() == 'SEED_DEV_DOMAINS is not "true"'

    def test_production_wins_over_flag(self):
        """Test that production blocks the seed even with the flag set."""
        guard = DevDomainsSeedGuard({'SEED_DEV_DOMAINS': 'true', 'STAGE': 'production'})
        assert guard.skip_reason() == 'STAGE is production'
