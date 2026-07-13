import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUsers from '../../../../../../../assets/js/components/resources/staff_user/pages/StaffUsers.jsx';
import StaffUsersHelper from '../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelper.jsx';
import StaffUsersController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUsersController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('StaffUsers', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(StaffUsersController);
    stubRenderLoading(StaffUsersHelper);

    const html = renderToStaticMarkup(React.createElement(StaffUsers));

    expect(html).toContain('loading');
  });

  it('renders the users table via StaffUsersHelper.render', function() {
    stubBuildEffect(StaffUsersController);

    const users = [{ id: 1, name: 'Jane', email: 'jane@example.com' }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      StaffUsersHelper.render(users, pagination, {}, {
        onGenerateRecoveryLink: Noop.noop,
        onCopyRecoveryLink: Noop.noop,
      })
    );

    expect(html).toContain('Jane');
  });
});
