import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUser from '../../../../../../../assets/js/components/resources/staff_user/pages/StaffUser.jsx';
import StaffUserHelper from '../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx';
import StaffUserController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserController.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('StaffUser', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(StaffUserController);
    stubRenderLoading(StaffUserHelper);

    const html = renderToStaticMarkup(React.createElement(StaffUser));

    expect(html).toContain('loading');
  });

  it('renders the user detail via StaffUserHelper.render', function() {
    stubBuildEffect(StaffUserController);

    const html = renderToStaticMarkup(
      StaffUserHelper.render({ id: 1, name: 'Jane', email: 'jane@example.com' })
    );

    expect(html).toContain('Jane');
  });
});
