"""Tests for the read-only historical admin entries of common items and their photos."""

import pytest
from django.test import Client
from django.urls import reverse

from games.tests.factories import SuperUserFactory


@pytest.mark.django_db
class TestHistoricalGameCommonItemAdmin:
    """Tests for the historical GameCommonItem and GameCommonItemPhoto admin changelists."""

    def setup_method(self):
        """Log in a superuser."""
        self.client = Client()
        self.client.force_login(SuperUserFactory())

    def test_historical_common_item_changelist_returns_ok(self):
        """Test that the HistoricalGameCommonItem changelist renders for a superuser."""
        url = reverse('admin:versioning_historicalgamecommonitem_changelist')
        response = self.client.get(url)
        assert response.status_code == 200

    def test_historical_common_item_photo_changelist_returns_ok(self):
        """Test that the HistoricalGameCommonItemPhoto changelist renders for a superuser."""
        url = reverse('admin:versioning_historicalgamecommonitemphoto_changelist')
        response = self.client.get(url)
        assert response.status_code == 200
