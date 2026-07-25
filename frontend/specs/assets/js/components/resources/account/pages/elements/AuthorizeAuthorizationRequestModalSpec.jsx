import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AuthorizeAuthorizationRequestModal from '../../../../../../../../assets/js/components/resources/account/pages/elements/AuthorizeAuthorizationRequestModal.jsx';
import AuthorizeAuthorizationRequestModalHelper from '../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/AuthorizeAuthorizationRequestModalHelper.jsx';

describe('AuthorizeAuthorizationRequestModal', function() {
  it('delegates rendering to AuthorizeAuthorizationRequestModalHelper with the given state', function() {
    spyOn(AuthorizeAuthorizationRequestModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');
    const onPasswordChange = jasmine.createSpy('onPasswordChange');
    const request = { uuid: 'some-uuid', ip: '203.0.113.5', browser: 'Firefox' };

    renderToStaticMarkup(
      React.createElement(AuthorizeAuthorizationRequestModal, {
        show: true,
        request,
        password: 'secret',
        error: true,
        onPasswordChange,
        onConfirm,
        onCancel,
      })
    );

    expect(AuthorizeAuthorizationRequestModalHelper.render).toHaveBeenCalledWith(
      true,
      request,
      { password: 'secret', error: true },
      jasmine.objectContaining({ onPasswordChange, onConfirm, onCancel }),
    );
  });
});
