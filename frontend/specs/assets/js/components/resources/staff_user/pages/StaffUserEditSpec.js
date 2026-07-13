import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUserEdit from '../../../../../../../assets/js/components/resources/staff_user/pages/StaffUserEdit.jsx';
import StaffUserEditHelper from '../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserEditHelper.jsx';
import StaffUserEditController from '../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserEditController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('StaffUserEdit', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(StaffUserEditController);
    stubRenderLoading(StaffUserEditHelper);

    const html = renderToStaticMarkup(React.createElement(StaffUserEdit));

    expect(html).toContain('loading');
  });

  it('renders the edit form via StaffUserEditHelper.render', function() {
    stubBuildEffect(StaffUserEditController);

    const html = renderToStaticMarkup(
      StaffUserEditHelper.render(
        { name: 'Jane', email: 'jane@example.com', status: 'idle', fieldErrors: {} },
        { onSubmit: Noop.noop, onNameChange: Noop.noop, onEmailChange: Noop.noop },
      )
    );

    expect(html).toContain('value="Jane"');
  });
});
