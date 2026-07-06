/**
 * @description Builds a fresh characterClient spy shared by every PcCharacterPhotosController spec file.
 * @returns {object} a characterClient spy with default successful fetchPc/fetchPcAccess/setPcPhotoRoles.
 */
export function buildCharacterClient() {
  const characterClient = jasmine.createSpyObj(
    'characterClient', ['fetchPc', 'fetchPcAccess', 'setPcPhotoRoles'],
  );
  characterClient.fetchPc.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ name: 'Aragorn' }),
  }));
  characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ can_edit: false }),
  }));
  characterClient.setPcPhotoRoles.and.returnValue(Promise.resolve({ ok: true }));
  return characterClient;
}
