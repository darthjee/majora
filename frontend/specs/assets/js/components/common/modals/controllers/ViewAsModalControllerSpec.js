import ViewAsModalController from '../../../../../../../assets/js/components/common/modals/controllers/ViewAsModalController.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('ViewAsModalController', function() {
  let setEnabled, setRoles, setNotLogged, onClose, controller;

  beforeEach(function() {
    setEnabled = jasmine.createSpy('setEnabled');
    setRoles = jasmine.createSpy('setRoles');
    setNotLogged = jasmine.createSpy('setNotLogged');
    onClose = jasmine.createSpy('onClose');
    controller = new ViewAsModalController(setEnabled, setRoles, setNotLogged, onClose);
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

  describe('#handleToggleNotLogged', function() {
    it('toggles the notLogged flag from false to true', function() {
      controller.handleToggleNotLogged();

      expect(setNotLogged).toHaveBeenCalledWith(jasmine.any(Function));
      expect(setNotLogged.calls.mostRecent().args[0](false)).toBe(true);
    });

    it('toggles the notLogged flag from true to false', function() {
      controller.handleToggleNotLogged();

      expect(setNotLogged.calls.mostRecent().args[0](true)).toBe(false);
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

      controller.handleSave(true, ['dm'], false);

      expect(AccessStore.setFacade).toHaveBeenCalledWith({
        enabled: true, roles: ['dm'], notLogged: false, gameSlug: undefined,
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('forwards the given gameSlug to AccessStore.setFacade', function() {
      spyOn(AccessStore, 'setFacade');

      controller.handleSave(true, ['dm'], false, 'epic-quest');

      expect(AccessStore.setFacade).toHaveBeenCalledWith({
        enabled: true, roles: ['dm'], notLogged: false, gameSlug: 'epic-quest',
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('forwards the notLogged flag to AccessStore.setFacade', function() {
      spyOn(AccessStore, 'setFacade');

      controller.handleSave(true, [], true, 'epic-quest');

      expect(AccessStore.setFacade).toHaveBeenCalledWith({
        enabled: true, roles: [], notLogged: true, gameSlug: 'epic-quest',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
