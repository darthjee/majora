"""Tests for the STL models list view (GET list / POST create)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import StlModel, StlModelRace, StlModelRole
from miniatures.tests.factories import CollectionFactory, SourceFactory, StlModelFactory, TagFactory

LIST_URL = '/miniatures/stl_models.json'


@pytest.mark.django_db
class TestStlModelsListView(TokenAuthRequestMixin):
    """Tests for GET /miniatures/stl_models.json."""

    def setup_method(self):
        """Set up an authenticated user."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated request is rejected."""
        response = self.get(client, LIST_URL)
        assert response.status_code == 401

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no STL models exist."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_name_photo_url(self, client):
        """Test that list items include id, name, and photo_url fields."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.get(client, LIST_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0] == {'id': stl_model.id, 'name': 'Dragon Miniature', 'photo_url': None}

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response['page'] == '1'

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response['X-Skip-Cache'] == 'true'

    def test_filters_by_name_case_insensitive_partial_match(self, client):
        """Test that name filters case-insensitively on a partial match."""
        StlModelFactory(name='Dragon Miniature')
        StlModelFactory(name='Goblin Miniature')
        response = self.get(client, f'{LIST_URL}?name=dragon', token=self.token)
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon Miniature']

    def test_filters_by_type_exact_match(self, client):
        """Test that type filters to an exact match."""
        StlModelFactory(name='Dragon', type=StlModel.TYPE_CREATURE)
        StlModelFactory(name='Table', type=StlModel.TYPE_PROP)
        response = self.get(client, f'{LIST_URL}?type={StlModel.TYPE_CREATURE}', token=self.token)
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon']

    def test_ignores_unrecognized_type(self, client):
        """Test that an unrecognized type value returns the unfiltered list."""
        StlModelFactory(name='Dragon', type=StlModel.TYPE_CREATURE)
        StlModelFactory(name='Table', type=StlModel.TYPE_PROP)
        response = self.get(client, f'{LIST_URL}?type=bogus', token=self.token)
        data = json.loads(response.content)
        assert len(data) == 2

    def test_filters_by_size_exact_match(self, client):
        """Test that size filters to an exact match."""
        StlModelFactory(name='Dragon', size=StlModel.SIZE_HUGE)
        StlModelFactory(name='Pixie', size=StlModel.SIZE_TINY)
        response = self.get(client, f'{LIST_URL}?size={StlModel.SIZE_HUGE}', token=self.token)
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon']

    def test_ignores_unrecognized_size(self, client):
        """Test that an unrecognized size value returns the unfiltered list."""
        StlModelFactory(name='Dragon', size=StlModel.SIZE_HUGE)
        StlModelFactory(name='Pixie', size=StlModel.SIZE_TINY)
        response = self.get(client, f'{LIST_URL}?size=bogus', token=self.token)
        data = json.loads(response.content)
        assert len(data) == 2

    def test_filters_by_single_race(self, client):
        """Test that race filters to STL models with a matching race."""
        dragon = StlModelFactory(name='Dragon')
        StlModelRace.objects.create(stl_model=dragon, creature=StlModel.RACE_DRAGON)
        elf = StlModelFactory(name='Elf')
        StlModelRace.objects.create(stl_model=elf, creature=StlModel.RACE_ELF)
        response = self.get(client, f'{LIST_URL}?race={StlModel.RACE_DRAGON}', token=self.token)
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon']

    def test_filters_by_multiple_races(self, client):
        """Test that multiple race values are combined with OR."""
        dragon = StlModelFactory(name='Dragon')
        StlModelRace.objects.create(stl_model=dragon, creature=StlModel.RACE_DRAGON)
        elf = StlModelFactory(name='Elf')
        StlModelRace.objects.create(stl_model=elf, creature=StlModel.RACE_ELF)
        StlModelFactory(name='Human')
        response = self.get(
            client, f'{LIST_URL}?race={StlModel.RACE_DRAGON}&race={StlModel.RACE_ELF}',
            token=self.token,
        )
        data = json.loads(response.content)
        assert {item['name'] for item in data} == {'Dragon', 'Elf'}

    def test_ignores_unrecognized_race(self, client):
        """Test that an unrecognized race value is dropped, leaving valid races applied."""
        dragon = StlModelFactory(name='Dragon')
        StlModelRace.objects.create(stl_model=dragon, creature=StlModel.RACE_DRAGON)
        StlModelFactory(name='Elf')
        response = self.get(
            client, f'{LIST_URL}?race={StlModel.RACE_DRAGON}&race=bogus', token=self.token,
        )
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon']

    def test_unrecognized_race_only_returns_unfiltered_list(self, client):
        """Test that when the only race value given is unrecognized, no race filter is applied."""
        StlModelFactory(name='Dragon')
        StlModelFactory(name='Elf')
        response = self.get(client, f'{LIST_URL}?race=bogus', token=self.token)
        data = json.loads(response.content)
        assert len(data) == 2

    def test_filters_by_single_role(self, client):
        """Test that roles filters to STL models with a matching role."""
        wizard = StlModelFactory(name='Wizard')
        StlModelRole.objects.create(stl_model=wizard, role=StlModel.ROLE_WIZARD)
        fighter = StlModelFactory(name='Fighter')
        StlModelRole.objects.create(stl_model=fighter, role=StlModel.ROLE_FIGHTER)
        response = self.get(client, f'{LIST_URL}?roles={StlModel.ROLE_WIZARD}', token=self.token)
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Wizard']

    def test_filters_by_multiple_roles(self, client):
        """Test that multiple roles values are combined with OR."""
        wizard = StlModelFactory(name='Wizard')
        StlModelRole.objects.create(stl_model=wizard, role=StlModel.ROLE_WIZARD)
        fighter = StlModelFactory(name='Fighter')
        StlModelRole.objects.create(stl_model=fighter, role=StlModel.ROLE_FIGHTER)
        StlModelFactory(name='Bard')
        response = self.get(
            client, f'{LIST_URL}?roles={StlModel.ROLE_WIZARD}&roles={StlModel.ROLE_FIGHTER}',
            token=self.token,
        )
        data = json.loads(response.content)
        assert {item['name'] for item in data} == {'Wizard', 'Fighter'}

    def test_ignores_unrecognized_role(self, client):
        """Test that an unrecognized role value is dropped, leaving valid roles applied."""
        wizard = StlModelFactory(name='Wizard')
        StlModelRole.objects.create(stl_model=wizard, role=StlModel.ROLE_WIZARD)
        StlModelFactory(name='Fighter')
        response = self.get(
            client, f'{LIST_URL}?roles={StlModel.ROLE_WIZARD}&roles=bogus', token=self.token,
        )
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Wizard']

    def test_unrecognized_role_only_returns_unfiltered_list(self, client):
        """Test that when the only role value given is unrecognized, no role filter is applied."""
        StlModelFactory(name='Wizard')
        StlModelFactory(name='Fighter')
        response = self.get(client, f'{LIST_URL}?roles=bogus', token=self.token)
        data = json.loads(response.content)
        assert len(data) == 2

    def test_filters_by_single_source(self, client):
        """Test that source filters to STL models linked to the given source id."""
        source = SourceFactory(name='MyMiniFactory')
        linked = StlModelFactory(name='Dragon')
        linked.sources.add(source)
        StlModelFactory(name='Goblin')
        response = self.get(client, f'{LIST_URL}?source={source.id}', token=self.token)
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon']

    def test_filters_by_multiple_sources(self, client):
        """Test that multiple source ids are combined with OR."""
        source_a = SourceFactory(name='MyMiniFactory')
        source_b = SourceFactory(name='Thingiverse')
        dragon = StlModelFactory(name='Dragon')
        dragon.sources.add(source_a)
        goblin = StlModelFactory(name='Goblin')
        goblin.sources.add(source_b)
        StlModelFactory(name='Human')
        response = self.get(
            client, f'{LIST_URL}?source={source_a.id}&source={source_b.id}', token=self.token,
        )
        data = json.loads(response.content)
        assert {item['name'] for item in data} == {'Dragon', 'Goblin'}

    def test_filters_by_single_collection(self, client):
        """Test that collection filters to STL models linked to the given collection id."""
        collection = CollectionFactory(name='Monster Pack')
        linked = StlModelFactory(name='Dragon')
        linked.collections.add(collection)
        StlModelFactory(name='Goblin')
        response = self.get(client, f'{LIST_URL}?collection={collection.id}', token=self.token)
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon']

    def test_filters_by_multiple_collections(self, client):
        """Test that multiple collection ids are combined with OR."""
        collection_a = CollectionFactory(name='Monster Pack')
        collection_b = CollectionFactory(name='Hero Pack')
        dragon = StlModelFactory(name='Dragon')
        dragon.collections.add(collection_a)
        goblin = StlModelFactory(name='Goblin')
        goblin.collections.add(collection_b)
        StlModelFactory(name='Human')
        response = self.get(
            client,
            f'{LIST_URL}?collection={collection_a.id}&collection={collection_b.id}',
            token=self.token,
        )
        data = json.loads(response.content)
        assert {item['name'] for item in data} == {'Dragon', 'Goblin'}

    def test_filters_by_single_tag(self, client):
        """Test that tags filters to STL models labeled with the given tag name."""
        tag = TagFactory(name='dragon')
        tagged = StlModelFactory(name='Dragon')
        tagged.tags.add(tag)
        StlModelFactory(name='Goblin')
        response = self.get(client, f'{LIST_URL}?tags={tag.name}', token=self.token)
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon']

    def test_filters_by_multiple_tags(self, client):
        """Test that multiple tags values are combined with OR."""
        tag_a = TagFactory(name='dragon')
        tag_b = TagFactory(name='goblin')
        dragon = StlModelFactory(name='Dragon')
        dragon.tags.add(tag_a)
        goblin = StlModelFactory(name='Goblin')
        goblin.tags.add(tag_b)
        StlModelFactory(name='Human')
        response = self.get(
            client, f'{LIST_URL}?tags={tag_a.name}&tags={tag_b.name}', token=self.token,
        )
        data = json.loads(response.content)
        assert {item['name'] for item in data} == {'Dragon', 'Goblin'}

    def test_combined_filters_apply_with_and(self, client):
        """Test that combining filters narrows the list via AND, not OR."""
        StlModelFactory(name='Dragon Miniature', type=StlModel.TYPE_CREATURE)
        StlModelFactory(name='Dragon Prop', type=StlModel.TYPE_PROP)
        StlModelFactory(name='Goblin Miniature', type=StlModel.TYPE_CREATURE)
        response = self.get(
            client, f'{LIST_URL}?name=dragon&type={StlModel.TYPE_CREATURE}', token=self.token,
        )
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Dragon Miniature']

    def test_race_filter_with_duplicate_matches_returns_row_once(self, client):
        """Test that an STL model matching two race values appears once, not duplicated."""
        dragon = StlModelFactory(name='Dragon')
        StlModelRace.objects.create(stl_model=dragon, creature=StlModel.RACE_DRAGON)
        StlModelRace.objects.create(stl_model=dragon, creature=StlModel.RACE_ELF)
        response = self.get(
            client, f'{LIST_URL}?race={StlModel.RACE_DRAGON}&race={StlModel.RACE_ELF}',
            token=self.token,
        )
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Dragon'


@pytest.mark.django_db
class TestStlModelsCreateView(TokenAuthRequestMixin):
    """Tests for POST /miniatures/stl_models.json."""

    def setup_method(self):
        """Set up a superuser, a staff user, and a regular authenticated user."""
        self.superuser = SuperUserFactory(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True,
        )
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.regular_user = UserFactory(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated POST is rejected with 401."""
        response = self.post(client, LIST_URL, {'name': 'Dragon Miniature'})
        assert response.status_code == 401

    def test_returns_403_for_non_staff_user(self, client):
        """Test that an authenticated non-staff user is rejected with 403."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature'}, token=self.regular_token,
        )
        assert response.status_code == 403

    def test_superuser_can_create(self, client):
        """Test that a superuser can create an STL model and receives 201."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE},
            token=self.superuser_token,
        )
        assert response.status_code == 201

    def test_staff_can_create(self, client):
        """Test that a staff user can create an STL model and receives 201."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE},
            token=self.staff_token,
        )
        assert response.status_code == 201

    def test_missing_name_returns_400(self, client):
        """Test that a POST without a name returns 400."""
        response = self.post(
            client, LIST_URL, {'type': StlModel.TYPE_CREATURE}, token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_missing_type_returns_400(self, client):
        """Test that a POST without a type returns 400."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature'}, token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'type' in data['errors']

    def test_overlong_tag_returns_400_with_tag_name_too_long_code(self, client):
        """Test that a tag longer than Tag.NAME_MAX_LENGTH returns 400, not a raw DB error."""
        response = self.post(
            client, LIST_URL,
            {'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE, 'tags': ['x' * 201]},
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert data['errors']['tags'] == ['tag_name_too_long']

    def test_too_many_tags_returns_400_with_max_tags_exceeded_code(self, client):
        """Test that more than MAX_TAGS tags returns 400 with the max_tags_exceeded code."""
        response = self.post(
            client, LIST_URL,
            {
                'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE,
                'tags': [f'tag{i}' for i in range(21)],
            },
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert data['errors']['tags'] == ['max_tags_exceeded']

    def test_returns_stl_model_detail_shape(self, client):
        """Test that the response body matches the StlModelDetailSerializer shape."""
        response = self.post(
            client,
            LIST_URL,
            {
                'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE,
                'tags': ['Dragon', 'Monster'],
            },
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert 'id' in data
        assert set(data['tags']) == {'dragon', 'monster'}
        assert {
            'name': data['name'],
            'owned': data['owned'],
            'type': data['type'],
            'url': data['url'],
            'size': data['size'],
            'races': data['races'],
            'roles': data['roles'],
            'photo_url': data['photo_url'],
            'links': data['links'],
            'sources': data['sources'],
        } == {
            'name': 'Dragon Miniature',
            'owned': True,
            'type': StlModel.TYPE_CREATURE,
            'url': None,
            'size': None,
            'races': [],
            'roles': [],
            'photo_url': None,
            'links': [],
            'sources': [],
        }

    def test_create_with_source_ids_links_given_sources(self, client):
        """Test that source_ids links the created STL model to the given sources."""
        source = SourceFactory(name='MyMiniFactory')
        response = self.post(
            client,
            LIST_URL,
            {
                'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE,
                'source_ids': [source.id],
            },
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert data['sources'] == [{'name': 'MyMiniFactory'}]

    def test_create_with_collection_ids_links_given_collections(self, client):
        """Test that collection_ids links the created STL model to the given collections."""
        collection = CollectionFactory(name='Monster Pack')
        response = self.post(
            client,
            LIST_URL,
            {
                'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE,
                'collection_ids': [collection.id],
            },
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert data['collections'] == [{'name': 'Monster Pack'}]

    def test_unknown_source_id_returns_400(self, client):
        """Test that an unknown source_ids entry returns 400."""
        response = self.post(
            client,
            LIST_URL,
            {
                'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE,
                'source_ids': [999999],
            },
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'source_ids' in data['errors']

    def test_unknown_collection_id_returns_400(self, client):
        """Test that an unknown collection_ids entry returns 400."""
        response = self.post(
            client,
            LIST_URL,
            {
                'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE,
                'collection_ids': [999999],
            },
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'collection_ids' in data['errors']

    def test_unknown_type_returns_400(self, client):
        """Test that an unknown type value returns 400."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature', 'type': 'not-a-type'},
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'type' in data['errors']

    def test_create_persists_stl_model(self, client):
        """Test that a successful POST persists a new StlModel row."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE},
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert StlModel.objects.filter(pk=data['id'], name='Dragon Miniature').exists()

    def test_returns_skip_cache_header(self, client):
        """Test that the create response includes the X-Skip-Cache: true header."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature', 'type': StlModel.TYPE_CREATURE},
            token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'
