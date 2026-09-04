import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUser from '../../../../../../../assets/js/components/resources/staff_user/pages/StaffUser.jsx';
import StaffUserHelper from '../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx';
import StaffUserController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserController.js';
import StaffUserRecoveryTokensController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import { stubBuildEffect, stubRenderLoading, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

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
      )
    );

    expect(html).toContain('Jane');
  });

  it('renders the user detail block via StaffUserHelper.render even when the token fetch failed', function() {
    const html = renderToStaticMarkup(
      StaffUserHelper.render(
        { id: 1, name: 'Jane', email: 'jane@example.com', status: 'approved' },
        { tokens: [], tokensLoading: false, tokensError: true },
      )
    );

    expect(html).toContain('Jane');
    expect(html).toContain('jane@example.com');
  });

  describe('wiring into StaffUserRecoveryTokensController', function() {
    const fields = ['setTokens', 'setLoading', 'setError'];
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
  });
});
