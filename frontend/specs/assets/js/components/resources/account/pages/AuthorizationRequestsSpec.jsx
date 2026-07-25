import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AuthorizationRequests from '../../../../../../../assets/js/components/resources/account/pages/AuthorizationRequests.jsx';
import AuthorizationRequestsHelper from '../../../../../../../assets/js/components/resources/account/pages/helpers/AuthorizationRequestsHelper.jsx';
import AuthorizationRequestsController from '../../../../../../../assets/js/components/resources/account/pages/controllers/AuthorizationRequestsController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

describe('AuthorizationRequests', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(AuthorizationRequestsController);
    stubRenderLoading(AuthorizationRequestsHelper);

    const html = renderToStaticMarkup(React.createElement(AuthorizationRequests));

    expect(html).toContain('loading');
  });

  it('wires the real state setters into AuthorizationRequestsController and fetches on mount', async function() {
    const fields = ['setRequests', 'setPagination', 'setLoading'];
    const capture = captureConstructorFields(AuthorizationRequestsController, fields);
    const client = jasmine.createSpyObj('client', ['listAuthorizationRequests']);

    client.listAuthorizationRequests.and.returnValue(Promise.resolve({
      ok: true,
      headers: { get: () => null },
      json: () => Promise.resolve([{ uuid: 'a', status: 'open' }]),
    }));

    try {
      renderToStaticMarkup(React.createElement(AuthorizationRequests));

      const instance = capture.getInstance();
      instance.client = client;
      const cleanup = instance.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();

      expect(capture.spies.setRequests).toHaveBeenCalledWith([{ uuid: 'a', status: 'open' }]);
      expect(capture.spies.setLoading).toHaveBeenCalledWith(false);
    } finally {
      capture.restore();
    }
  });

  it('renders the requests table via AuthorizationRequestsHelper.render', function() {
    stubBuildEffect(AuthorizationRequestsController);

    const requests = [{
      uuid: 'some-uuid', created_at: '2024-01-15T10:30:00Z', status: 'open', ip: '203.0.113.5', browser: 'Firefox',
    }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      AuthorizationRequestsHelper.render(
        requests,
        pagination,
        {
          denyTarget: null, authorizeTarget: null, password: '', authorizeError: false,
        },
        {
          onOpenDeny: Noop.noop,
          onOpenAuthorize: Noop.noop,
          onCloseModals: Noop.noop,
          onDenyConfirm: Noop.noop,
          onAuthorizeConfirm: Noop.noop,
          onPasswordChange: Noop.noop,
        },
      )
    );

    expect(html).toContain('some-uuid');
  });
});
