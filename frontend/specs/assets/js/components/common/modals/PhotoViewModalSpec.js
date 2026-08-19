import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PhotoViewModal from '../../../../../../assets/js/components/common/modals/PhotoViewModal.jsx';
import PhotoViewModalHelper from '../../../../../../assets/js/components/common/modals/helpers/PhotoViewModalHelper.jsx';

describe('PhotoViewModal', function() {
  it('delegates rendering to PhotoViewModalHelper with default values for the new props', function() {
    spyOn(PhotoViewModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    const photo = { id: 1, path: 'photos/games/demo/photo.jpg' };
    const onClose = jasmine.createSpy('onClose');

    renderToStaticMarkup(
      React.createElement(PhotoViewModal, { show: true, photo, alt: 'Demo Game', onClose })
    );

    expect(PhotoViewModalHelper.render)
      .toHaveBeenCalledWith(true, photo, 'Demo Game', onClose, {}, {});
  });

  it('threads canSetProfilePhoto, isProfilePhoto, and onSetProfilePhoto through to the helper', function() {
    spyOn(PhotoViewModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    const photo = { id: 1, path: 'photos/games/demo/photo.jpg' };
    const onClose = jasmine.createSpy('onClose');
    const onSetProfilePhoto = jasmine.createSpy('onSetProfilePhoto');
    const setProfilePhoto = { canSetProfilePhoto: true, isProfilePhoto: true, onSetProfilePhoto };

    renderToStaticMarkup(
      React.createElement(PhotoViewModal, {
        show: true,
        photo,
        alt: 'Demo Game',
        onClose,
        setProfilePhoto,
      })
    );

    expect(PhotoViewModalHelper.render)
      .toHaveBeenCalledWith(true, photo, 'Demo Game', onClose, setProfilePhoto, {});
  });

  it('threads canDelete and onDelete through to the helper', function() {
    spyOn(PhotoViewModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    const photo = { id: 1, path: 'photos/games/demo/photo.jpg' };
    const onClose = jasmine.createSpy('onClose');
    const onDelete = jasmine.createSpy('onDelete');
    const deletePhoto = { canDelete: true, onDelete };

    renderToStaticMarkup(
      React.createElement(PhotoViewModal, {
        show: true,
        photo,
        alt: 'Demo Game',
        onClose,
        deletePhoto,
      })
    );

    expect(PhotoViewModalHelper.render)
      .toHaveBeenCalledWith(true, photo, 'Demo Game', onClose, {}, deletePhoto);
  });
});
