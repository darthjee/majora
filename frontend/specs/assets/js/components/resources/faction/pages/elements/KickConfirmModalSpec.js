import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import KickConfirmModal
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/KickConfirmModal.jsx';
import KickConfirmModalHelper
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/KickConfirmModalHelper.jsx';

describe('KickConfirmModal', function() {
  it('delegates rendering to KickConfirmModalHelper with the given props', function() {
    spyOn(KickConfirmModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');

    renderToStaticMarkup(
      React.createElement(KickConfirmModal, {
        show: true,
        characterName: 'Aragorn',
        factionName: 'The Silver Hand',
        submitting: true,
        onConfirm,
        onCancel,
      })
    );

    expect(KickConfirmModalHelper.render).toHaveBeenCalledWith(
      true, 'Aragorn', 'The Silver Hand', true, jasmine.objectContaining({ onConfirm, onCancel }),
    );
  });

  it('defaults submitting to false', function() {
    spyOn(KickConfirmModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    renderToStaticMarkup(
      React.createElement(KickConfirmModal, {
        show: false,
        characterName: 'Aragorn',
        factionName: 'The Silver Hand',
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
      })
    );

    expect(KickConfirmModalHelper.render).toHaveBeenCalledWith(
      false, 'Aragorn', 'The Silver Hand', false, jasmine.any(Object),
    );
  });
});
