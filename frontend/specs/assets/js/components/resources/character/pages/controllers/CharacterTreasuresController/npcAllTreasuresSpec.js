import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import NpcCharacterTreasuresController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterTreasuresController.js';
import PcCharacterTreasuresController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterTreasuresController.js';
import { buildCharacterClient } from './support.js';

const buildClient = (hash = '#/games/demo/npcs/2/treasures') => {
  const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

  client.currentHash.and.returnValue(hash);
  client.fetchIndex.and.returnValue(Promise.resolve({
    data: [{ id: 1, name: 'Sword', quantity: 1, value: 100 }],
    pagination: { page: 1, pages: 1, perPage: 10 },
  }));

  return client;
};

const buildAllResponse = (data, headers) => ({
  ok: true,
  json: () => Promise.resolve(data),
  headers: { get: (key) => headers[key] ?? null },
});

describe('NpcCharacterTreasuresController', function() {
  describe('viewing an NPC\'s own treasures as an editor', function() {
    it('fetches the hidden-inclusive treasures/all.json page when can_edit is true', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = buildClient('#/games/demo/npcs/2/treasures?page=2&per_page=5');
      const characterClient = buildCharacterClient({
        fetchTreasuresAllPage: jasmine.createSpy('fetchTreasuresAllPage').and.returnValue(Promise.resolve(
          buildAllResponse(
            [{ id: 1, name: 'Hidden Blade', quantity: 1, value: 200, hidden: true }],
            { page: '2', pages: '4', per_page: '5' },
          )
        )),
      });

      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const cleanup = new NpcCharacterTreasuresController(
        setTreasures, setPagination, setLoading, setError, client, undefined, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('npcs', 'demo', '2');
      expect(characterClient.fetchTreasuresAllPage).toHaveBeenCalledWith(
        'demo', '2', null, { page: 2, perPage: 5 }
      );
      expect(client.fetchIndex).not.toHaveBeenCalled();
      expect(setTreasures).toHaveBeenCalledWith([
        { id: 1, name: 'Hidden Blade', quantity: 1, value: 200, hidden: true },
      ]);
      expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 4, perPage: 5 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('forwards the min_value/max_value/name filter params from the hash', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = buildClient(
        '#/games/demo/npcs/2/treasures?page=2&per_page=5&min_value=10&max_value=100&name=blade',
      );
      const characterClient = buildCharacterClient({
        fetchTreasuresAllPage: jasmine.createSpy('fetchTreasuresAllPage').and.returnValue(Promise.resolve(
          buildAllResponse(
            [{ id: 1, name: 'Hidden Blade', quantity: 1, value: 200, hidden: true }],
            { page: '2', pages: '4', per_page: '5' },
          )
        )),
      });

      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const cleanup = new NpcCharacterTreasuresController(
        setTreasures, setPagination, setLoading, setError, client, undefined, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchTreasuresAllPage).toHaveBeenCalledWith(
        'demo', '2', null, {
          page: 2, perPage: 5, min_value: '10', max_value: '100', name: 'blade',
        }
      );

      cleanup();
    });

    it('falls back to the hidden-filtered treasures.json page when can_edit is false', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = buildClient();
      const characterClient = buildCharacterClient({
        fetchTreasuresAllPage: jasmine.createSpy('fetchTreasuresAllPage'),
      });

      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = new NpcCharacterTreasuresController(
        setTreasures, setPagination, setLoading, setError, client, undefined, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json', {});
      expect(characterClient.fetchTreasuresAllPage).not.toHaveBeenCalled();
      expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', quantity: 1, value: 100 }]);

      cleanup();
    });

    it('falls back to the hidden-filtered treasures.json page when the permission check rejects', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = buildClient();
      const characterClient = buildCharacterClient({
        fetchTreasuresAllPage: jasmine.createSpy('fetchTreasuresAllPage'),
      });

      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new NpcCharacterTreasuresController(
        setTreasures, setPagination, setLoading, setError, client, undefined, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json', {});
      expect(characterClient.fetchTreasuresAllPage).not.toHaveBeenCalled();
      expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', quantity: 1, value: 100 }]);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the treasures/all.json fetch itself fails', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = buildClient();
      const characterClient = buildCharacterClient({
        fetchTreasuresAllPage: jasmine.createSpy('fetchTreasuresAllPage').and.returnValue(
          Promise.resolve({ ok: false })
        ),
      });

      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const cleanup = new NpcCharacterTreasuresController(
        setTreasures, setPagination, setLoading, setError, client, undefined, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('defaults to an empty list and fallback pagination when the response is malformed', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = buildClient();
      const characterClient = buildCharacterClient({
        fetchTreasuresAllPage: jasmine.createSpy('fetchTreasuresAllPage').and.returnValue(Promise.resolve(
          buildAllResponse(null, {})
        )),
      });

      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const cleanup = new NpcCharacterTreasuresController(
        setTreasures, setPagination, setLoading, setError, client, undefined, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasures).toHaveBeenCalledWith([]);
      expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });
  });

  describe('PcCharacterTreasuresController', function() {
    it('never queries the treasures/all.json endpoint, regardless of can_edit', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue('#/games/demo/pcs/2/treasures');
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Sword', quantity: 1, value: 100 }],
        pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const characterClient = buildCharacterClient({
        fetchTreasuresAllPage: jasmine.createSpy('fetchTreasuresAllPage'),
      });

      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const cleanup = new PcCharacterTreasuresController(
        setTreasures, setPagination, setLoading, setError, client, undefined, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json', {});
      expect(characterClient.fetchTreasuresAllPage).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
