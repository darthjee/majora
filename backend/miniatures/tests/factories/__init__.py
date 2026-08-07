"""Factory Boy factories for building miniatures model instances in tests."""

import factory

from miniatures.models import Source, StlModel, StlModelLink, StlModelPhoto, Tag


class StlModelFactory(factory.django.DjangoModelFactory):
    """Factory for StlModel."""

    class Meta:
        """Factory configuration."""

        model = StlModel

    name = 'Test Miniature'


class StlModelLinkFactory(factory.django.DjangoModelFactory):
    """Factory for StlModelLink."""

    class Meta:
        """Factory configuration."""

        model = StlModelLink

    stl_model = factory.SubFactory(StlModelFactory)
    text = 'Download'
    url = 'https://example.com/model.stl'


class StlModelPhotoFactory(factory.django.DjangoModelFactory):
    """Factory for StlModelPhoto."""

    class Meta:
        """Factory configuration."""

        model = StlModelPhoto

    stl_model = factory.SubFactory(StlModelFactory)
    path = 'photos/miniatures/1/photo.png'
    ready = True


class SourceFactory(factory.django.DjangoModelFactory):
    """Factory for Source."""

    class Meta:
        """Factory configuration."""

        model = Source

    name = factory.Sequence(lambda n: f'Source {n}')


class TagFactory(factory.django.DjangoModelFactory):
    """Factory for Tag."""

    class Meta:
        """Factory configuration."""

        model = Tag

    name = factory.Sequence(lambda n: f'Tag {n}')


__all__ = [
    'SourceFactory',
    'StlModelFactory',
    'StlModelLinkFactory',
    'StlModelPhotoFactory',
    'TagFactory',
]
