import HeaderViewAsController from '../../../../../../../assets/js/components/common/header/controllers/HeaderViewAsController.js';

describe('HeaderViewAsController', function() {
  let setCanViewAs, setShowViewAsModal, controller;

  beforeEach(function() {
    setCanViewAs = jasmine.createSpy('setCanViewAs');
    setShowViewAsModal = jasmine.createSpy('setShowViewAsModal');
    controller = new HeaderViewAsController(setCanViewAs, setShowViewAsModal);
  });

  describe('#checkAvailability', function() {
    it('sets canViewAs to true when the real identity is a superuser', async function() {
      await controller.checkAvailability(true, false);

      expect(setCanViewAs).toHaveBeenCalledWith(true);
    });

    it('sets canViewAs to true when the real identity is staff', async function() {
      await controller.checkAvailability(false, true);

      expect(setCanViewAs).toHaveBeenCalledWith(true);
    });

    it('sets canViewAs to false when the real identity is neither staff nor a superuser', async function() {
      await controller.checkAvailability(false, false);

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
