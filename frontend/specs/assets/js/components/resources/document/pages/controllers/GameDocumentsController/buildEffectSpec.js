import GameDocumentsController
  from '../../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentsController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameDocumentsController', function() {
  let setCanCreateDocument;
  let client;

  beforeEach(function() {
    setCanCreateDocument = jasmine.createSpy('setCanCreateDocument');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/documents');
  });

  describe('#buildEffect', function() {
    it('calls ensureGamePermissions with the game slug', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(
        Promise.resolve({ can_create_document: true }),
      );

      const cleanup = new GameDocumentsController(setCanCreateDocument, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      cleanup();
    });

    it('sets canCreateDocument to true when the requester may create documents', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(
        Promise.resolve({ can_create_document: true }),
      );

      const cleanup = new GameDocumentsController(setCanCreateDocument, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateDocument).toHaveBeenCalledWith(true);
      cleanup();
    });

    it('sets canCreateDocument to false when the requester may not create documents', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(
        Promise.resolve({ can_create_document: false }),
      );

      const cleanup = new GameDocumentsController(setCanCreateDocument, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateDocument).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('fails closed to false when the permissions check rejects', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = new GameDocumentsController(setCanCreateDocument, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateDocument).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(
        Promise.resolve({ can_create_document: true }),
      );

      const cleanup = new GameDocumentsController(setCanCreateDocument, client).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateDocument).not.toHaveBeenCalled();
    });
  });
});
