"""CrawlerDebugEmission model for the staff app."""

from django.db import models


class CrawlerDebugEmission(models.Model):
    """A single raw JSON record emitted by a crawler run, for debugging (temporary harness).

    Deliberately source-agnostic (see `docs/agents/specs/crawler-test-harness.md`): every
    future crawler POSTs its raw scraped candidates here before #1262's real import endpoint
    is trusted end-to-end, at which point this model, its migration, and the endpoints backed
    by it are all deleted.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=100)
    type = models.CharField(max_length=100)
    payload = models.JSONField()

    class Meta:
        """Model options."""

        #: Ascending `id` order, relied on by the cursor paginator (step 02) so it can page
        #: through `id > last_id` without an explicit `order_by` on every call.
        ordering = ['id']

    def __str__(self):
        """Return a short human-readable label for admin/debugging."""
        return f'{self.source}:{self.type}#{self.id}'
