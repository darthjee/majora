import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUserEdit from '../../../../../assets/js/components/pages/StaffUserEdit.jsx';
import StaffUserEditHelper from '../../../../../assets/js/components/pages/helpers/StaffUserEditHelper.jsx';
import StaffUserEditController from '../../../../../assets/js/components/pages/controllers/StaffUserEditController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('StaffUserEdit', function() {
  it('renders the loading state while fetching', function() {
    spyOn(StaffUserEditController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(StaffUserEditHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(StaffUserEdit));

    expect(html).toContain('loading');
  });

  it('renders the edit form via StaffUserEditHelper.render', function() {
    spyOn(StaffUserEditController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);

    const html = renderToStaticMarkup(
      StaffUserEditHelper.render(
        { name: 'Jane', email: 'jane@example.com', status: 'idle', fieldErrors: {} },
        { onSubmit: Noop.noop, onNameChange: Noop.noop, onEmailChange: Noop.noop },
      )
    );

    expect(html).toContain('value="Jane"');
  });
});
