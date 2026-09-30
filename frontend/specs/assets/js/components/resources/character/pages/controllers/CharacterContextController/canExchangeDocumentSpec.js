import CharacterContextController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterContextController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

const KINDS = [
  { label: 'pcs', kind: 'pcs', isPc: true },
  { label: 'npcs', kind: 'npcs', isPc: false },
];

function buildCharacterClient(isPc) {
  const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter']);

  characterClient.fetchCharacter.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: isPc }),
  }));

  return characterClient;
}

function buildGameClient() {
  const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);

  gameClient.fetchGame.and.returnValue(Promise.resolve({ ok: false }));

  return gameClient;
}

function buildClient(kind) {
  const client = jasmine.createSpyObj('client', ['currentHash']);

  client.currentHash.and.returnValue(`#/games/demo/${kind}/2/documents`);

  return client;
}

async function runEffect(kind, isPc) {
  const setCharacter = jasmine.createSpy('setCharacter');
  const cleanup = new CharacterContextController(
    kind, setCharacter, buildClient(kind), buildCharacterClient(isPc), buildGameClient(), 'documents',
  ).buildEffect()();

  await new Promise((resolve) => setTimeout(resolve, 0));
  cleanup();

  return setCharacter;
}

KINDS.forEach(({ label, kind, isPc }) => {
  describe(`CharacterContextController (${label}) can_exchange_document`, function() {
    it('merges can_exchange_document true when the character permissions grant it', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(
        Promise.resolve({ can_edit: false, can_exchange_document: true }),
      );
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      const setCharacter = await runEffect(kind, isPc);

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, game_slug: 'demo', is_pc: isPc, game_type: 'dnd',
        can_edit: false, can_exchange_document: true, game_can_edit: false,
      });
    });

    it('merges can_exchange_document false when the character permissions deny it', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(
        Promise.resolve({ can_edit: true, can_exchange_document: false }),
      );
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const setCharacter = await runEffect(kind, isPc);

      expect(setCharacter).toHaveBeenCalledWith(jasmine.objectContaining({
        can_edit: true, can_exchange_document: false, game_can_edit: true,
      }));
    });

    it('defaults can_exchange_document to false when the flag is missing', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const setCharacter = await runEffect(kind, isPc);

      expect(setCharacter).toHaveBeenCalledWith(jasmine.objectContaining({ can_exchange_document: false }));
    });

    it('fails closed on can_edit/can_exchange_document when the permissions fetch fails', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.reject(new Error('boom')));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const setCharacter = await runEffect(kind, isPc);

      expect(setCharacter).toHaveBeenCalledWith(jasmine.objectContaining({
        can_edit: false, can_exchange_document: false, game_can_edit: true,
      }));
    });
  });
});
