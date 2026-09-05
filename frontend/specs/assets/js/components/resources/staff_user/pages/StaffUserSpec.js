import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUser from '../../../../../../../assets/js/components/resources/staff_user/pages/StaffUser.jsx';
import StaffUserHelper from '../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx';
import RecoveryTokenActionConfirmModalHelper from '../../../../../../../assets/js/components/resources/staff_user/pages/elements/helpers/RecoveryTokenActionConfirmModalHelper.jsx';
import StaffUserController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserController.js';
import StaffUserRecoveryTokensController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

const loadedUser = {
  id: 1, name: 'Jane', email: 'jane@example.com', status: 'approved',
};

const buildNoopHandlers = () => ({
  onUnexpire: Noop.noop,
  onForceExpirePrompt: Noop.noop,
  onDeletePrompt: Noop.noop,
  onGenerateRecoveryLink: Noop.noop,
});

/** Stub controller that synchronously loads a user during construction. */
class LoadedController {
  constructor(setUser, setLoading) {
    setUser(loadedUser);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('StaffUser', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(StaffUserController);
    stubBuildEffect(StaffUserRecoveryTokensController);
    stubRenderLoading(StaffUserHelper);

    const html = renderToStaticMarkup(React.createElement(StaffUser));

    expect(html).toContain('loading');
  });

  it('renders the user detail via StaffUserHelper.render', function() {
    stubBuildEffect(StaffUserController);

    const html = renderToStaticMarkup(
      StaffUserHelper.render(
        { id: 1, name: 'Jane', email: 'jane@example.com' },
        { tokens: [], tokensLoading: false, tokensError: false },
        buildNoopHandlers(),
      )
    );

    expect(html).toContain('Jane');
  });

  it('renders the user detail block via StaffUserHelper.render even when the token fetch failed', function() {
    const html = renderToStaticMarkup(
      StaffUserHelper.render(
        { id: 1, name: 'Jane', email: 'jane@example.com', status: 'approved' },
        { tokens: [], tokensLoading: false, tokensError: true },
        buildNoopHandlers(),
      )
    );

    expect(html).toContain('Jane');
    expect(html).toContain('jane@example.com');
  });

  describe('wiring into StaffUserRecoveryTokensController', function() {
    const fields = ['setTokens', 'setLoading', 'setError', 'setActionError'];
    let capture;

    beforeEach(function() {
      stubBuildEffect(StaffUserController);
      capture = captureConstructorFields(StaffUserRecoveryTokensController, fields);
    });

    afterEach(function() {
      capture.restore();
    });

    it('passes the real token state setters into their matching constructor slots', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
        Promise.resolve({ data: [{ id: 1, status: 'valid' }] }),
      );

      renderToStaticMarkup(React.createElement(StaffUser));

      const cleanup = capture.getInstance().buildEffect('7')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffUserRecoveryTokensController',
        resource: 'staffUser',
        quantityType: 'recoveryTokens',
        params: { id: '7' },
      });
      expect(capture.spies.setTokens).toHaveBeenCalledWith([{ id: 1, status: 'valid' }]);
      expect(capture.spies.setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('wires setActionError so the controller can clear/set the action-error flag', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: [] }));
      spyOn(RequestStore, 'purge');

      renderToStaticMarkup(React.createElement(StaffUser));

      await capture.getInstance().refresh('7');

      expect(capture.spies.setActionError).toHaveBeenCalledWith(false);
    });
  });

  describe('once the user has loaded', function() {
    let handlers;
    let modalProps;

    beforeEach(function() {
      spyOn(StaffUserHelper, 'render').and.callFake((user, tokensState, actionHandlers) => {
        handlers = actionHandlers;
        return null;
      });
      spyOn(RecoveryTokenActionConfirmModalHelper, 'render').and.callFake((show, action, modalHandlers) => {
        modalProps = { show, action, ...modalHandlers };
        return null;
      });
      stubBuildEffect(StaffUserRecoveryTokensController);

      renderToStaticMarkup(React.createElement(StaffUser, { ControllerClass: LoadedController }));
    });

    it('delegates to StaffUserHelper.render with the loaded user and action handlers', function() {
      expect(handlers.onUnexpire).toEqual(jasmine.any(Function));
      expect(handlers.onForceExpirePrompt).toEqual(jasmine.any(Function));
      expect(handlers.onDeletePrompt).toEqual(jasmine.any(Function));
      expect(handlers.onGenerateRecoveryLink).toEqual(jasmine.any(Function));
    });

    it('renders the confirm modal initially hidden', function() {
      expect(modalProps.show).toBe(false);
    });

    it('dispatches onUnexpire straight to the tokens controller (one-click, no prompt)', function() {
      const unexpireSpy = spyOn(StaffUserRecoveryTokensController.prototype, 'handleUnexpire');

      handlers.onUnexpire(3);

      expect(unexpireSpy).toHaveBeenCalledWith(1, 3);
    });

    it('opens the force-expire confirm prompt without throwing', function() {
      expect(() => handlers.onForceExpirePrompt(3)).not.toThrow();
    });

    it('opens the delete confirm prompt without throwing', function() {
      expect(() => handlers.onDeletePrompt(3)).not.toThrow();
    });

    it('cancelling the confirm modal does not call any mutation handler', function() {
      const deleteSpy = spyOn(StaffUserRecoveryTokensController.prototype, 'handleDelete');
      const forceExpireSpy = spyOn(StaffUserRecoveryTokensController.prototype, 'handleForceExpire');

      expect(() => modalProps.onCancel()).not.toThrow();

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(forceExpireSpy).not.toHaveBeenCalled();
    });

    it('generates a recovery link through RequestStore then refreshes the token list', async function() {
      const mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true }));
      const refreshSpy = spyOn(StaffUserRecoveryTokensController.prototype, 'refresh').and.returnValue(
        Promise.resolve(),
      );

      await handlers.onGenerateRecoveryLink();

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'StaffUser',
        resource: 'staffUser',
        method: 'POST',
        quantityType: 'recoveryLink',
        params: { id: 1 },
      });
      expect(refreshSpy).toHaveBeenCalledWith(1);
    });
  });
});
