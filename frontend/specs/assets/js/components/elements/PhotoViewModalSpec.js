import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PhotoViewModal from '../../../../../assets/js/components/elements/PhotoViewModal.jsx';
import PhotoViewModalHelper from '../../../../../assets/js/components/elements/helpers/PhotoViewModalHelper.jsx';

describe('PhotoViewModal', function() {
  it('delegates rendering to PhotoViewModalHelper', function() {
    spyOn(PhotoViewModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    const photo = { id: 1, path: 'photos/games/demo/photo.jpg' };
    const onClose = jasmine.createSpy('onClose');

    renderToStaticMarkup(
      React.createElement(PhotoViewModal, { show: true, photo, alt: 'Demo Game', onClose })
    );

    expect(PhotoViewModalHelper.render).toHaveBeenCalledWith(true, photo, 'Demo Game', onClose);
  });
});
