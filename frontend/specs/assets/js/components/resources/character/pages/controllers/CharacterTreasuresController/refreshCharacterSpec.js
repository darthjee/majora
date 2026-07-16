import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { KINDS, buildCharacterClient, buildGameClient } from './support.js';

KINDS.forEach(({ label, Controller, kind, isPc, money }) => {
  describe(label, function() {
    describe('#refreshCharacter', function() {
      const buildClient = () => {
        const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

        client.currentHash.and.returnValue(`#/games/demo/${kind}/2/treasures`);
        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        return client;
      };

      it('re-fetches and sets the character independently of buildEffect', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();

        characterClient.fetchCharacter.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
        }));
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const controller = new Controller(
          jasmine.createSpy('setTreasures'),
          jasmine.createSpy('setPagination'),
          jasmine.createSpy('setLoading'),
          jasmine.createSpy('setError'),
          buildClient(),
          setCharacter,
          characterClient,
          buildGameClient(),
        );

        controller.refreshCharacter();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '2', null);
        expect(setCharacter).toHaveBeenCalledWith({
          id: 2, game_slug: 'demo', is_pc: isPc, money, game_type: 'dnd', can_edit: true,
        });
      });

      it('does nothing when hash params are missing', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();
        const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

        client.currentHash.and.returnValue('#/other');

        const controller = new Controller(
          jasmine.createSpy('setTreasures'),
          jasmine.createSpy('setPagination'),
          jasmine.createSpy('setLoading'),
          jasmine.createSpy('setError'),
          client,
          setCharacter,
          characterClient,
          buildGameClient(),
        );

        controller.refreshCharacter();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(characterClient.fetchCharacter).not.toHaveBeenCalled();
        expect(setCharacter).not.toHaveBeenCalled();
      });

      it('does not update state once buildEffect has been cleaned up', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();

        characterClient.fetchCharacter.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
        }));
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const controller = new Controller(
          jasmine.createSpy('setTreasures'),
          jasmine.createSpy('setPagination'),
          jasmine.createSpy('setLoading'),
          jasmine.createSpy('setError'),
          buildClient(),
          setCharacter,
          characterClient,
          buildGameClient(),
        );

        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));
        setCharacter.calls.reset();
        characterClient.fetchCharacter.calls.reset();
        cleanup();

        controller.refreshCharacter();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setCharacter).not.toHaveBeenCalled();
      });
    });
  });
});
