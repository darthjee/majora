import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MyAccount from '../../../../../../../assets/js/components/resources/account/pages/MyAccount.jsx';
import MyAccountHelper from '../../../../../../../assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx';
import MyAccountController from '../../../../../../../assets/js/components/resources/account/pages/controllers/MyAccountController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('MyAccount', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(MyAccountController);
    stubRenderLoading(MyAccountHelper);

    const html = renderToStaticMarkup(React.createElement(MyAccount));

    expect(html).toContain('loading');
  });

  it('renders the account form via MyAccountHelper.render', function() {
    stubBuildEffect(MyAccountController);

    const html = renderToStaticMarkup(
      MyAccountHelper.render(
        {
          name: 'Jane', email: 'jane@example.com', avatarUrl: null, password: '',
          passwordConfirmation: '', status: 'idle', fieldErrors: {},
        },
        {
          onSubmit: Noop.noop,
          onNameChange: Noop.noop,
          onEmailChange: Noop.noop,
          onPasswordChange: Noop.noop,
          onPasswordConfirmationChange: Noop.noop,
        },
      )
    );

    expect(html).toContain('value="Jane"');
  });
});
