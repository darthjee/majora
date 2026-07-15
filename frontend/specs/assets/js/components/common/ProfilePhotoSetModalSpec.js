import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProfilePhotoSetModal from '../../../../../assets/js/components/common/ProfilePhotoSetModal.jsx';
import ProfilePhotoSetModalHelper from '../../../../../assets/js/components/common/helpers/ProfilePhotoSetModalHelper.jsx';

describe('ProfilePhotoSetModal', function() {
  it('delegates rendering to ProfilePhotoSetModalHelper with the given show/photo/alt state', function() {
    spyOn(ProfilePhotoSetModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const photo = { id: 1, path: 'photos/games/demo/photo.jpg' };
    const onClose = jasmine.createSpy('onClose');

    renderToStaticMarkup(
      React.createElement(ProfilePhotoSetModal, { show: true, photo, alt: 'Aragorn', onClose })
    );

    expect(ProfilePhotoSetModalHelper.render).toHaveBeenCalledWith(true, photo, 'Aragorn', onClose);
  });

  it('forwards a null photo and show false as-is to the helper', function() {
    spyOn(ProfilePhotoSetModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const onClose = jasmine.createSpy('onClose');

    renderToStaticMarkup(
      React.createElement(ProfilePhotoSetModal, { show: false, photo: null, alt: 'Aragorn', onClose })
    );

    expect(ProfilePhotoSetModalHelper.render).toHaveBeenCalledWith(false, null, 'Aragorn', onClose);
  });
});
