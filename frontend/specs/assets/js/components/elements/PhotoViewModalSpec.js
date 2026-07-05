import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PhotoViewModal from '../../../../../assets/js/components/elements/PhotoViewModal.jsx';
import PhotoViewModalHelper from '../../../../../assets/js/components/elements/helpers/PhotoViewModalHelper.jsx';

describe('PhotoViewModal', function() {
  it('delegates rendering to PhotoViewModalHelper with default values for the new props', function() {
    spyOn(PhotoViewModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    const photo = { id: 1, path: 'photos/games/demo/photo.jpg' };
    const onClose = jasmine.createSpy('onClose');

    renderToStaticMarkup(
      React.createElement(PhotoViewModal, { show: true, photo, alt: 'Demo Game', onClose })
    );

    expect(PhotoViewModalHelper.render)
      .toHaveBeenCalledWith(true, photo, 'Demo Game', onClose, false, false, undefined);
  });

  it('threads canSetProfilePhoto, isProfilePhoto, and onSetProfilePhoto through to the helper', function() {
    spyOn(PhotoViewModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    const photo = { id: 1, path: 'photos/games/demo/photo.jpg' };
    const onClose = jasmine.createSpy('onClose');
    const onSetProfilePhoto = jasmine.createSpy('onSetProfilePhoto');

    renderToStaticMarkup(
      React.createElement(PhotoViewModal, {
        show: true,
        photo,
        alt: 'Demo Game',
        onClose,
        canSetProfilePhoto: true,
        isProfilePhoto: true,
        onSetProfilePhoto,
      })
    );

    expect(PhotoViewModalHelper.render)
      .toHaveBeenCalledWith(true, photo, 'Demo Game', onClose, true, true, onSetProfilePhoto);
  });
});
