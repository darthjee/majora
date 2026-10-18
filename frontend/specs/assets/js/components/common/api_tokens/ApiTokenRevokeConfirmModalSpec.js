import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenRevokeConfirmModal
  from '../../../../../../assets/js/components/common/api_tokens/ApiTokenRevokeConfirmModal.jsx';
import ApiTokenRevokeConfirmModalHelper
  from '../../../../../../assets/js/components/common/api_tokens/helpers/ApiTokenRevokeConfirmModalHelper.jsx';

describe('ApiTokenRevokeConfirmModal', function() {
  it('delegates rendering to its helper', function() {
    spyOn(ApiTokenRevokeConfirmModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));
    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');

    renderToStaticMarkup(
      React.createElement(ApiTokenRevokeConfirmModal, {
        show: true, tokenName: 'CI', ownerName: 'Ann', onConfirm, onCancel,
      }),
    );

    expect(ApiTokenRevokeConfirmModalHelper.render).toHaveBeenCalledWith(
      { show: true, tokenName: 'CI', ownerName: 'Ann', submitting: false },
      { onConfirm, onCancel },
    );
  });
});
