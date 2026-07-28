import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DeletePhotoConfirmModal from '../../../../../../../../assets/js/components/resources/character/pages/elements/DeletePhotoConfirmModal.jsx';
import DeletePhotoConfirmModalHelper from '../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/DeletePhotoConfirmModalHelper.jsx';

describe('DeletePhotoConfirmModal', function() {
  it('delegates rendering to DeletePhotoConfirmModalHelper with the given show/photo state', function() {
    spyOn(DeletePhotoConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const photo = { id: 3, path: 'photos/games/demo/photo.jpg' };
    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');

    renderToStaticMarkup(
      React.createElement(DeletePhotoConfirmModal, {
        show: true,
        photo,
        onConfirm,
        onCancel,
      })
    );

    expect(DeletePhotoConfirmModalHelper.render).toHaveBeenCalledWith(
      true,
      photo,
      jasmine.objectContaining({ onConfirm, onCancel }),
    );
  });

  it('forwards a null photo as-is to the helper', function() {
    spyOn(DeletePhotoConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    renderToStaticMarkup(
      React.createElement(DeletePhotoConfirmModal, {
        show: false,
        photo: null,
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
      })
    );

    expect(DeletePhotoConfirmModalHelper.render).toHaveBeenCalledWith(
      false, null, jasmine.any(Object),
    );
  });
});
