import HeaderViewAsController from '../../../../../../assets/js/components/common/controllers/HeaderViewAsController.js';

describe('HeaderViewAsController', function() {
  let setCanViewAs, setShowViewAsModal, accessStore, controller;

  beforeEach(function() {
    setCanViewAs = jasmine.createSpy('setCanViewAs');
    setShowViewAsModal = jasmine.createSpy('setShowViewAsModal');
    accessStore = jasmine.createSpyObj('accessStore', ['isReallyAdminOrStaff']);
    controller = new HeaderViewAsController(setCanViewAs, setShowViewAsModal, accessStore);
  });

  describe('#checkAvailability', function() {
    it('sets canViewAs to true when the real identity is staff or a superuser', async function() {
      accessStore.isReallyAdminOrStaff.and.returnValue(Promise.resolve(true));

      await controller.checkAvailability();

      expect(setCanViewAs).toHaveBeenCalledWith(true);
    });

    it('sets canViewAs to false when the real identity is neither staff nor a superuser', async function() {
      accessStore.isReallyAdminOrStaff.and.returnValue(Promise.resolve(false));

      await controller.checkAvailability();

      expect(setCanViewAs).toHaveBeenCalledWith(false);
    });
  });

  describe('#handleViewAsClick', function() {
    it('opens the view-as modal', function() {
      controller.handleViewAsClick();

      expect(setShowViewAsModal).toHaveBeenCalledWith(true);
    });
  });

  describe('#handleViewAsModalClose', function() {
    it('closes the view-as modal', function() {
      controller.handleViewAsModalClose();

      expect(setShowViewAsModal).toHaveBeenCalledWith(false);
    });
  });
});
