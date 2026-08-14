"""Tests for the StlModelRace model."""

from django.db import IntegrityError
from django.test import TestCase

from miniatures.models import StlModel, StlModelRace
from miniatures.tests.factories import StlModelFactory


class TestStlModelRace(TestCase):
    """Tests for the StlModelRace model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.stl_model = StlModelFactory(name='Dragon Miniature')

    def test_stl_model_race_creation(self):
        """Test that a race can be created and linked to an STL model."""
        race = StlModelRace.objects.create(stl_model=self.stl_model, creature=StlModel.RACE_ELF)
        assert race.creature == StlModel.RACE_ELF
        assert race.stl_model == self.stl_model

    def test_stl_model_races_related_name(self):
        """Test that races can be accessed via the STL model's related name."""
        StlModelRace.objects.create(stl_model=self.stl_model, creature=StlModel.RACE_ELF)
        StlModelRace.objects.create(stl_model=self.stl_model, creature=StlModel.RACE_DRAGON)
        assert self.stl_model.races.count() == 2

    def test_deleting_stl_model_cascades_to_races(self):
        """Test that deleting an STL model deletes its races."""
        race = StlModelRace.objects.create(stl_model=self.stl_model, creature=StlModel.RACE_ELF)
        self.stl_model.delete()
        assert not StlModelRace.objects.filter(id=race.id).exists()

    def test_duplicate_creature_for_same_stl_model_raises(self):
        """Test that attaching the same creature twice to an STL model is rejected."""
        StlModelRace.objects.create(stl_model=self.stl_model, creature=StlModel.RACE_ELF)
        with self.assertRaises(IntegrityError):
            StlModelRace.objects.create(stl_model=self.stl_model, creature=StlModel.RACE_ELF)
