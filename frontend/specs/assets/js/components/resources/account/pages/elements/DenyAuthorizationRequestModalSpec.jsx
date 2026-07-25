import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DenyAuthorizationRequestModal from '../../../../../../../../assets/js/components/resources/account/pages/elements/DenyAuthorizationRequestModal.jsx';
import DenyAuthorizationRequestModalHelper from '../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/DenyAuthorizationRequestModalHelper.jsx';

describe('DenyAuthorizationRequestModal', function() {
  it('delegates rendering to DenyAuthorizationRequestModalHelper with the given show/request state', function() {
    spyOn(DenyAuthorizationRequestModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');
    const request = { uuid: 'some-uuid', ip: '203.0.113.5', browser: 'Firefox' };

    renderToStaticMarkup(
      React.createElement(DenyAuthorizationRequestModal, {
        show: true,
        request,
        onConfirm,
        onCancel,
      })
    );

    expect(DenyAuthorizationRequestModalHelper.render).toHaveBeenCalledWith(
      true,
      request,
      jasmine.objectContaining({ onConfirm, onCancel }),
    );
  });
});
