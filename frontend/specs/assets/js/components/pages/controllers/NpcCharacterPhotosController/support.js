/**
 * @description Builds a fresh characterClient spy shared by every NpcCharacterPhotosController spec file.
 * @returns {object} a characterClient spy with default successful fetchNpc/fetchNpcAccess/setNpcPhotoRoles.
 */
export function buildCharacterClient() {
  const characterClient = jasmine.createSpyObj(
    'characterClient', ['fetchNpc', 'fetchNpcAccess', 'setNpcPhotoRoles'],
  );
  characterClient.fetchNpc.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ name: 'Aragorn' }),
  }));
  characterClient.fetchNpcAccess.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ can_edit: false }),
  }));
  characterClient.setNpcPhotoRoles.and.returnValue(Promise.resolve({ ok: true }));
  return characterClient;
}
