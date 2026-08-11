"""Factory Boy factories for building miniatures model instances in tests."""

import factory

from miniatures.models import (
    Collection,
    CollectionPhoto,
    Source,
    SourcePhoto,
    StlModel,
    StlModelLink,
    StlModelPhoto,
    Tag,
)


class StlModelFactory(factory.django.DjangoModelFactory):
    """Factory for StlModel."""

    class Meta:
        """Factory configuration."""

        model = StlModel

    name = 'Test Miniature'
    type = StlModel.TYPE_OTHER


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


class SourcePhotoFactory(factory.django.DjangoModelFactory):
    """Factory for SourcePhoto."""

    class Meta:
        """Factory configuration."""

        model = SourcePhoto

    source = factory.SubFactory(SourceFactory)
    path = 'photos/sources/1/photo.png'
    ready = True


class TagFactory(factory.django.DjangoModelFactory):
    """Factory for Tag."""

    class Meta:
        """Factory configuration."""

        model = Tag

    name = factory.Sequence(lambda n: f'Tag {n}')


class CollectionFactory(factory.django.DjangoModelFactory):
    """Factory for Collection."""

    class Meta:
        """Factory configuration."""

        model = Collection

    name = factory.Sequence(lambda n: f'Collection {n}')


class CollectionPhotoFactory(factory.django.DjangoModelFactory):
    """Factory for CollectionPhoto."""

    class Meta:
        """Factory configuration."""

        model = CollectionPhoto

    collection = factory.SubFactory(CollectionFactory)
    path = 'photos/collections/1/photo.png'
    ready = True


__all__ = [
    'CollectionFactory',
    'CollectionPhotoFactory',
    'SourceFactory',
    'SourcePhotoFactory',
    'StlModelFactory',
    'StlModelLinkFactory',
    'StlModelPhotoFactory',
    'TagFactory',
]
