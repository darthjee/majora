import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MyAccount from '../../../../../assets/js/components/pages/MyAccount.jsx';
import MyAccountHelper from '../../../../../assets/js/components/pages/helpers/MyAccountHelper.jsx';
import MyAccountController from '../../../../../assets/js/components/pages/controllers/MyAccountController.js';

describe('MyAccount', function() {
  it('renders the loading state while fetching', function() {
    spyOn(MyAccountController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(MyAccountHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(MyAccount));

    expect(html).toContain('loading');
  });

  it('renders the account form via MyAccountHelper.render', function() {
    spyOn(MyAccountController.prototype, 'buildEffect').and.returnValue(() => () => {});

    const html = renderToStaticMarkup(
      MyAccountHelper.render(
        {
          name: 'Jane', email: 'jane@example.com', password: '', passwordConfirmation: '',
          status: 'idle', fieldErrors: {},
        },
        {
          onSubmit: () => {},
          onNameChange: () => {},
          onEmailChange: () => {},
          onPasswordChange: () => {},
          onPasswordConfirmationChange: () => {},
        },
      )
    );

    expect(html).toContain('value="Jane"');
  });
});
