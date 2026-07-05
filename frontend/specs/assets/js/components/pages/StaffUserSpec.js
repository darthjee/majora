import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUser from '../../../../../assets/js/components/pages/StaffUser.jsx';
import StaffUserHelper from '../../../../../assets/js/components/pages/helpers/StaffUserHelper.jsx';
import StaffUserController from '../../../../../assets/js/components/pages/controllers/StaffUserController.js';

describe('StaffUser', function() {
  it('renders the loading state while fetching', function() {
    spyOn(StaffUserController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(StaffUserHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(StaffUser));

    expect(html).toContain('loading');
  });

  it('renders the user detail via StaffUserHelper.render', function() {
    spyOn(StaffUserController.prototype, 'buildEffect').and.returnValue(() => () => {});

    const html = renderToStaticMarkup(
      StaffUserHelper.render({ id: 1, name: 'Jane', email: 'jane@example.com' })
    );

    expect(html).toContain('Jane');
  });
});
