"""Tests for the StlModelRole model."""

from django.db import IntegrityError
from django.test import TestCase

from miniatures.models import StlModel, StlModelRole
from miniatures.tests.factories import StlModelFactory


class TestStlModelRole(TestCase):
    """Tests for the StlModelRole model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.stl_model = StlModelFactory(name='Dragon Miniature')

    def test_stl_model_role_creation(self):
        """Test that a role can be created and linked to an STL model."""
        role = StlModelRole.objects.create(stl_model=self.stl_model, role=StlModel.ROLE_WIZARD)
        assert role.role == StlModel.ROLE_WIZARD
        assert role.stl_model == self.stl_model

    def test_stl_model_roles_related_name(self):
        """Test that roles can be accessed via the STL model's related name."""
        StlModelRole.objects.create(stl_model=self.stl_model, role=StlModel.ROLE_WIZARD)
        StlModelRole.objects.create(stl_model=self.stl_model, role=StlModel.ROLE_ARCHER)
        assert self.stl_model.roles.count() == 2

    def test_deleting_stl_model_cascades_to_roles(self):
        """Test that deleting an STL model deletes its roles."""
        role = StlModelRole.objects.create(stl_model=self.stl_model, role=StlModel.ROLE_WIZARD)
        self.stl_model.delete()
        assert not StlModelRole.objects.filter(id=role.id).exists()

    def test_duplicate_role_for_same_stl_model_raises(self):
        """Test that attaching the same role twice to an STL model is rejected."""
        StlModelRole.objects.create(stl_model=self.stl_model, role=StlModel.ROLE_WIZARD)
        with self.assertRaises(IntegrityError):
            StlModelRole.objects.create(stl_model=self.stl_model, role=StlModel.ROLE_WIZARD)
