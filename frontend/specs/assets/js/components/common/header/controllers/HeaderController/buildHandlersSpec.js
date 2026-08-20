import { buildContext, buildHeaderController } from './support.js';

describe('HeaderController', function() {
  let setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client, controller;
  let viewAsController;

  const buildController = (overrides = {}) => buildHeaderController(
    { setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client }, overrides
  );

  beforeEach(function() {
    ({ setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client } = buildContext());
    controller = buildController();
    viewAsController = jasmine.createSpyObj('viewAsController', ['handleViewAsClick', 'handleViewAsModalClose']);
  });

  describe('#buildHandlers', function() {
    it('wires onLoginClick to handleLoginClick', function() {
      spyOn(controller, 'handleLoginClick');

      controller.buildHandlers(viewAsController, false).onLoginClick();

      expect(controller.handleLoginClick).toHaveBeenCalled();
    });

    it('wires onLogoffClick to handleLogoffClick', function() {
      spyOn(controller, 'handleLogoffClick');

      controller.buildHandlers(viewAsController, false).onLogoffClick();

      expect(controller.handleLogoffClick).toHaveBeenCalled();
    });

    it('wires onModalClose to handleModalClose', function() {
      spyOn(controller, 'handleModalClose');

      controller.buildHandlers(viewAsController, false).onModalClose();

      expect(controller.handleModalClose).toHaveBeenCalled();
    });

    it('wires onLoginSuccess to handleLoginSuccess', function() {
      spyOn(controller, 'handleLoginSuccess');

      controller.buildHandlers(viewAsController, false).onLoginSuccess();

      expect(controller.handleLoginSuccess).toHaveBeenCalled();
    });

    it('wires onSendTestEmailClick to handleSendTestEmailClick', function() {
      spyOn(controller, 'handleSendTestEmailClick');

      controller.buildHandlers(viewAsController, false).onSendTestEmailClick();

      expect(controller.handleSendTestEmailClick).toHaveBeenCalled();
    });

    it('wires onLanguageChange to handleLanguageChange with the given loggedIn value', function() {
      spyOn(controller, 'handleLanguageChange');

      controller.buildHandlers(viewAsController, true).onLanguageChange('pt');

      expect(controller.handleLanguageChange).toHaveBeenCalledWith('pt', true);
    });

    it('wires onViewAsClick to handleViewAsClick, delegating to the viewAsController on click', function() {
      const event = { preventDefault: jasmine.createSpy('preventDefault') };

      controller.buildHandlers(viewAsController, false).onViewAsClick(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(viewAsController.handleViewAsClick).toHaveBeenCalled();
    });

    it('wires onViewAsModalClose to viewAsController.handleViewAsModalClose', function() {
      controller.buildHandlers(viewAsController, false).onViewAsModalClose();

      expect(viewAsController.handleViewAsModalClose).toHaveBeenCalled();
    });
  });
});
