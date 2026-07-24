import CharacterContextController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterContextController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';

const KINDS = [
  { label: 'pcs', kind: 'pcs', isPc: true, money: 310 },
  { label: 'npcs', kind: 'npcs', isPc: false, money: 120 },
];

function buildCharacterClient(overrides = {}) {
  const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter']);

  characterClient.fetchCharacter.and.returnValue(Promise.resolve({ ok: false }));

  return Object.assign(characterClient, overrides);
}

function buildGameClient(overrides = {}) {
  const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);

  gameClient.fetchGame.and.returnValue(Promise.resolve({ ok: false }));

  if (overrides.fetchGame) {
    gameClient.fetchGame.and.callFake(overrides.fetchGame);
  }

  return gameClient;
}

function buildClient(kind) {
  const client = jasmine.createSpyObj('client', ['currentHash']);

  client.currentHash.and.returnValue(`#/games/demo/${kind}/2/treasures`);

  return client;
}

KINDS.forEach(({ label, kind, isPc, money }) => {
  describe(`CharacterContextController (${label})`, function() {
    describe('#buildEffect', function() {
      it('merges can_edit/game_can_edit/game_type onto the fetched character', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient({
          fetchCharacter: jasmine.createSpy('fetchCharacter').and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
          })),
        });
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const cleanup = new CharacterContextController(
          kind, setCharacter, buildClient(kind), characterClient, buildGameClient(),
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '2', null);
        expect(setCharacter).toHaveBeenCalledWith({
          id: 2, game_slug: 'demo', is_pc: isPc, money, game_type: 'dnd', can_edit: true, game_can_edit: true,
        });

        cleanup();
      });

      it('keeps game_can_edit false for a character-editing owner who is not a DM/superuser', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient({
          fetchCharacter: jasmine.createSpy('fetchCharacter').and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
          })),
        });
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const cleanup = new CharacterContextController(
          kind, setCharacter, buildClient(kind), characterClient, buildGameClient(),
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setCharacter).toHaveBeenCalledWith({
          id: 2, game_slug: 'demo', is_pc: isPc, money, game_type: 'dnd', can_edit: true, game_can_edit: false,
        });

        cleanup();
      });

      it('sets the character to null when the base fetch fails', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();

        const cleanup = new CharacterContextController(
          kind, setCharacter, buildClient(kind), characterClient, buildGameClient(),
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setCharacter).toHaveBeenCalledWith(null);

        cleanup();
      });

      it('does nothing when hash params are missing', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();
        const client = jasmine.createSpyObj('client', ['currentHash']);

        client.currentHash.and.returnValue('#/other');

        const cleanup = new CharacterContextController(
          kind, setCharacter, client, characterClient, buildGameClient(),
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(characterClient.fetchCharacter).not.toHaveBeenCalled();
        expect(setCharacter).not.toHaveBeenCalled();

        cleanup();
      });

      it('does not update state after unmount', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient({
          fetchCharacter: jasmine.createSpy('fetchCharacter').and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
          })),
        });
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const cleanup = new CharacterContextController(
          kind, setCharacter, buildClient(kind), characterClient, buildGameClient(),
        ).buildEffect()();

        cleanup();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setCharacter).not.toHaveBeenCalled();
      });

      it('merges game_type from the character\'s own game', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient({
          fetchCharacter: jasmine.createSpy('fetchCharacter').and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
          })),
        });
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        const gameClient = buildGameClient({
          fetchGame: () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ game_slug: 'demo', game_type: 'deadlands' }),
          }),
        });

        const cleanup = new CharacterContextController(
          kind, setCharacter, buildClient(kind), characterClient, gameClient,
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', null);
        expect(setCharacter).toHaveBeenCalledWith({
          id: 2, game_slug: 'demo', is_pc: isPc, money, game_type: 'deadlands', can_edit: true, game_can_edit: true,
        });

        cleanup();
      });
    });

    describe('#refreshCharacter', function() {
      it('re-fetches and sets the character independently of buildEffect', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient({
          fetchCharacter: jasmine.createSpy('fetchCharacter').and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
          })),
        });
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const controller = new CharacterContextController(
          kind, setCharacter, buildClient(kind), characterClient, buildGameClient(),
        );

        controller.refreshCharacter();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '2', null);
        expect(setCharacter).toHaveBeenCalledWith({
          id: 2, game_slug: 'demo', is_pc: isPc, money, game_type: 'dnd', can_edit: true, game_can_edit: true,
        });
      });

      it('does nothing when hash params are missing', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();
        const client = jasmine.createSpyObj('client', ['currentHash']);

        client.currentHash.and.returnValue('#/other');

        const controller = new CharacterContextController(kind, setCharacter, client, characterClient);

        controller.refreshCharacter();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(characterClient.fetchCharacter).not.toHaveBeenCalled();
        expect(setCharacter).not.toHaveBeenCalled();
      });

      it('does not update state once buildEffect has been cleaned up', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient({
          fetchCharacter: jasmine.createSpy('fetchCharacter').and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
          })),
        });
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const controller = new CharacterContextController(
          kind, setCharacter, buildClient(kind), characterClient, buildGameClient(),
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

    describe('pagePath param', function() {
      // Defaulting to "treasures" (preserving the original hash-extraction behavior) is already
      // exercised by every #buildEffect/#refreshCharacter test above, which all construct the
      // controller without passing pagePath.

      it('extracts params from a hash matching a custom pagePath (e.g. "items")', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient({
          fetchCharacter: jasmine.createSpy('fetchCharacter').and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc, money }),
          })),
        });
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        const client = jasmine.createSpyObj('client', ['currentHash']);
        client.currentHash.and.returnValue(`#/games/demo/${kind}/2/items`);

        const cleanup = new CharacterContextController(
          kind, setCharacter, client, characterClient, buildGameClient(), 'items',
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '2', null);

        cleanup();
      });

      it('does not match a hash for a different page path than the one configured', async function() {
        const setCharacter = jasmine.createSpy('setCharacter');
        const characterClient = buildCharacterClient();
        const client = jasmine.createSpyObj('client', ['currentHash']);
        client.currentHash.and.returnValue(`#/games/demo/${kind}/2/treasures`);

        const cleanup = new CharacterContextController(
          kind, setCharacter, client, characterClient, buildGameClient(), 'items',
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(characterClient.fetchCharacter).not.toHaveBeenCalled();
        expect(setCharacter).not.toHaveBeenCalled();

        cleanup();
      });
    });
  });
});
