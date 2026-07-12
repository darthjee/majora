import ViewAsModalController from '../../../../../../assets/js/components/elements/controllers/ViewAsModalController.js';
import AccessStore from '../../../../../../assets/js/utils/AccessStore.js';

describe('ViewAsModalController', function() {
  let setEnabled, setRoles, onClose, controller;

  beforeEach(function() {
    setEnabled = jasmine.createSpy('setEnabled');
    setRoles = jasmine.createSpy('setRoles');
    onClose = jasmine.createSpy('onClose');
    controller = new ViewAsModalController(setEnabled, setRoles, onClose);
  });

  describe('#handleToggleEnabled', function() {
    it('toggles the enabled flag from false to true', function() {
      controller.handleToggleEnabled();

      expect(setEnabled).toHaveBeenCalledWith(jasmine.any(Function));
      expect(setEnabled.calls.mostRecent().args[0](false)).toBe(true);
    });

    it('toggles the enabled flag from true to false', function() {
      controller.handleToggleEnabled();

      expect(setEnabled.calls.mostRecent().args[0](true)).toBe(false);
    });
  });

  describe('#handleToggleRole', function() {
    it('adds the role when not already present', function() {
      controller.handleToggleRole('dm');

      expect(setRoles).toHaveBeenCalledWith(jasmine.any(Function));
      expect(setRoles.calls.mostRecent().args[0](['player'])).toEqual(['player', 'dm']);
    });

    it('removes the role when already present', function() {
      controller.handleToggleRole('dm');

      expect(setRoles.calls.mostRecent().args[0](['dm', 'player'])).toEqual(['player']);
    });
  });

  describe('#handleCancel', function() {
    it('closes the modal without touching AccessStore', function() {
      spyOn(AccessStore, 'setFacade');

      controller.handleCancel();

      expect(onClose).toHaveBeenCalled();
      expect(AccessStore.setFacade).not.toHaveBeenCalled();
    });
  });

  describe('#handleSave', function() {
    it('commits the in-progress edit to AccessStore and closes the modal', function() {
      spyOn(AccessStore, 'setFacade');

      controller.handleSave(true, ['dm']);

      expect(AccessStore.setFacade).toHaveBeenCalledWith({ enabled: true, roles: ['dm'] });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
