import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUser from '../../../../../../../assets/js/components/resources/staff_user/pages/StaffUser.jsx';
import StaffUserHelper from '../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx';
import StaffUserController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserController.js';
import StaffUserRecoveryTokensController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensController.js';
import StaffUserApiTokensController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserApiTokensController.js';
import RecoveryTokenActionConfirmModalHelper from '../../../../../../../assets/js/components/resources/staff_user/pages/elements/helpers/RecoveryTokenActionConfirmModalHelper.jsx';
import ApiTokenRevokeConfirmModalHelper from '../../../../../../../assets/js/components/common/api_tokens/helpers/ApiTokenRevokeConfirmModalHelper.jsx';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

const loadedUser = {
  id: 1, name: 'Jane', email: 'jane@example.com', status: 'approved',
};

/** Stub controller that synchronously loads a user during construction. */
class LoadedController {
  constructor(setUser, setLoading) {
    setUser(loadedUser);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously fails the user fetch during construction. */
class FailedController {
  constructor(setUser, setLoading, setError) {
    setError(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('StaffUser API-token panel (issue #1606)', function() {
  beforeEach(function() {
    stubBuildEffect(StaffUserRecoveryTokensController);
  });

  describe('before the user has loaded', function() {
    let apiTokensEffectSpy;

    beforeEach(function() {
      apiTokensEffectSpy = stubBuildEffect(StaffUserApiTokensController);
      spyOn(ApiTokenRevokeConfirmModalHelper, 'render').and.returnValue(null);
    });

    it('does not render the panel or its modal while the user is loading', function() {
      stubBuildEffect(StaffUserController);

      const html = renderToStaticMarkup(React.createElement(StaffUser));

      expect(html).not.toContain('staff-user-api-tokens');
      expect(ApiTokenRevokeConfirmModalHelper.render).not.toHaveBeenCalled();
      expect(apiTokensEffectSpy).not.toHaveBeenCalled();
    });

    it('does not render the panel or its modal when the user fetch failed (the non-staff path)', function() {
      const html = renderToStaticMarkup(React.createElement(StaffUser, { ControllerClass: FailedController }));

      expect(html).toContain('Failed to load user. Please try again.');
      expect(html).not.toContain('staff-user-api-tokens');
      expect(ApiTokenRevokeConfirmModalHelper.render).not.toHaveBeenCalled();
    });
  });

  describe('wiring into StaffUserApiTokensController', function() {
    const fields = ['setTokens', 'setLoading', 'setError', 'setNotice'];
    let capture;

    beforeEach(function() {
      stubBuildEffect(StaffUserController);
      capture = captureConstructorFields(StaffUserApiTokensController, fields);
    });

    afterEach(function() {
      capture.restore();
    });

    it('passes the real API-token state setters into their matching constructor slots', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: [{ id: 2 }] }));
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      renderToStaticMarkup(React.createElement(StaffUser));

      const cleanup = capture.getInstance().buildEffect('7')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffUserApiTokensController',
        resource: 'staffUser',
        quantityType: 'apiTokens',
        params: { id: '7' },
      });
      expect(capture.spies.setTokens).toHaveBeenCalledWith([{ id: 2 }]);
      expect(capture.spies.setLoading).toHaveBeenCalledWith(false);

      await capture.getInstance().revoke('7', 2);

      expect(capture.spies.setNotice).toHaveBeenCalledWith('token_gone');

      cleanup();
    });
  });

  describe('once the user has loaded', function() {
    let apiTokensPanel;
    let modalState;
    let modalHandlers;

    beforeEach(function() {
      stubBuildEffect(StaffUserApiTokensController);
      spyOn(RecoveryTokenActionConfirmModalHelper, 'render').and.returnValue(null);
      spyOn(StaffUserHelper, 'render').and.callFake((user, tokensState, handlers, panel) => {
        apiTokensPanel = panel;
        return null;
      });
      spyOn(ApiTokenRevokeConfirmModalHelper, 'render').and.callFake((state, handlers) => {
        modalState = state;
        modalHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(StaffUser, { ControllerClass: LoadedController }));
    });

    it('passes the initial panel state and a revoke prompt handler to StaffUserHelper.render', function() {
      expect(apiTokensPanel.state).toEqual({
        tokens: [], loading: true, error: false, notice: null,
      });
      expect(() => apiTokensPanel.handlers.onRevokePrompt({ id: 2, name: 'CI bot' })).not.toThrow();
    });

    it('renders the revoke modal hidden, with the owner name for the staff copy', function() {
      expect(modalState.show).toBe(false);
      expect(modalState.ownerName).toBe('Jane');
    });

    it('revokes through the API-token controller when the modal is confirmed', async function() {
      const revokeSpy = spyOn(StaffUserApiTokensController.prototype, 'revoke').and.returnValue(Promise.resolve());

      await modalHandlers.onConfirm();

      expect(revokeSpy).toHaveBeenCalledWith(1, undefined);
    });

    it('does not revoke when the modal is cancelled', function() {
      const revokeSpy = spyOn(StaffUserApiTokensController.prototype, 'revoke');

      expect(() => modalHandlers.onCancel()).not.toThrow();

      expect(revokeSpy).not.toHaveBeenCalled();
    });
  });
});
