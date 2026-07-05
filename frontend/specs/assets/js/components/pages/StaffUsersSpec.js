import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUsers from '../../../../../assets/js/components/pages/StaffUsers.jsx';
import StaffUsersHelper from '../../../../../assets/js/components/pages/helpers/StaffUsersHelper.jsx';
import StaffUsersController from '../../../../../assets/js/components/pages/controllers/StaffUsersController.js';

describe('StaffUsers', function() {
  it('renders the loading state while fetching', function() {
    spyOn(StaffUsersController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(StaffUsersHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(StaffUsers));

    expect(html).toContain('loading');
  });

  it('renders the users table via StaffUsersHelper.render', function() {
    spyOn(StaffUsersController.prototype, 'buildEffect').and.returnValue(() => () => {});

    const users = [{ id: 1, name: 'Jane', email: 'jane@example.com' }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      StaffUsersHelper.render(users, pagination, {}, {
        onGenerateRecoveryLink: () => {},
        onCopyRecoveryLink: () => {},
      })
    );

    expect(html).toContain('Jane');
  });
});
