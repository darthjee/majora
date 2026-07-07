/**
 * @description Builds a fresh characterClient spy shared by every NpcCharacterPhotosController spec file.
 * @returns {object} a characterClient spy with default successful fetchCharacter/fetchCharacterAccess/setPhotoRoles.
 */
export function buildCharacterClient() {
  const characterClient = jasmine.createSpyObj(
    'characterClient', ['fetchCharacter', 'fetchCharacterAccess', 'setPhotoRoles'],
  );
  characterClient.fetchCharacter.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ name: 'Aragorn' }),
  }));
  characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ can_edit: false }),
  }));
  characterClient.setPhotoRoles.and.returnValue(Promise.resolve({ ok: true }));
  return characterClient;
}
