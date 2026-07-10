import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';
import { KINDS, buildCharacterClient } from './support.js';

KINDS.forEach(({ label, Controller, kind, isPc, money }) => {
  describe(label, function() {
    describe('character context', function() {
      const buildClient = () => {
        const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

        client.currentHash.and.returnValue(`#/games/demo/${kind}/2/treasures`);
        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        return client;
      };

      it('merges can_edit from AccessStore onto the fetched character', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();

        characterClient.fetchCharacter.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
        }));
        spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ can_edit: true }));

        const cleanup = new Controller(
          jasmine.createSpy('setTreasures'),
          jasmine.createSpy('setPagination'),
          jasmine.createSpy('setLoading'),
          jasmine.createSpy('setError'),
          buildClient(),
          setCharacter,
          characterClient,
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setCharacter).toHaveBeenCalledWith({
          id: 2, game_slug: 'demo', is_pc: isPc, money, can_edit: true,
        });

        cleanup();
      });

      it('sets the character to null when the base fetch fails', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();

        characterClient.fetchCharacter.and.returnValue(Promise.resolve({ ok: false }));

        const cleanup = new Controller(
          jasmine.createSpy('setTreasures'),
          jasmine.createSpy('setPagination'),
          jasmine.createSpy('setLoading'),
          jasmine.createSpy('setError'),
          buildClient(),
          setCharacter,
          characterClient,
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setCharacter).toHaveBeenCalledWith(null);

        cleanup();
      });

      it('falls back to the base character with can_edit false when access resolves with the fail-closed default',
        async function() {
          const setCharacter = jasmine.createSpy('setCharacter');
          const characterClient = buildCharacterClient();

          characterClient.fetchCharacter.and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
          }));
          spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ can_edit: false }));

          const cleanup = new Controller(
            jasmine.createSpy('setTreasures'),
            jasmine.createSpy('setPagination'),
            jasmine.createSpy('setLoading'),
            jasmine.createSpy('setError'),
            buildClient(),
            setCharacter,
            characterClient,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(setCharacter).toHaveBeenCalledWith({
            id: 2, game_slug: 'demo', is_pc: isPc, money, can_edit: false,
          });

          cleanup();
        });
    });
  });
});
