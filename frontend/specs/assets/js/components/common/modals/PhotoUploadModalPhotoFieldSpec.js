import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PhotoUploadModal from '../../../../../../assets/js/components/common/modals/PhotoUploadModal.jsx';
import PhotoUploadModalHelper from '../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController from '../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';

/**
 * Split out of `PhotoUploadModalSpec.js` (issue #878) to keep that file under the 300-line limit
 * — mirrors `resourceConfigMutationsSpec.js` being split out of `resourceConfigSpec.js` for the
 * same reason (issue #841).
 */
describe('PhotoUploadModal showPhotoField (issue #878)', function() {
  it('defaults showPhotoField to false', function() {
    let capturedState;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
      capturedState = state;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(PhotoUploadModal, {
        show: true,
        uploadPath: '/games/my-game/photo_upload.json',
        onClose: jasmine.createSpy('onClose'),
        onSuccess: jasmine.createSpy('onSuccess'),
      })
    );

    expect(capturedState.showPhotoField).toBe(false);
  });

  it('forwards showPhotoField={true} to the helper state', function() {
    let capturedState;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
      capturedState = state;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(PhotoUploadModal, {
        show: true,
        uploadPath: '/games/my-game/documents/9/file_upload.json',
        translationPrefix: 'file_upload_modal',
        showNameField: true,
        showPhotoField: true,
        onClose: jasmine.createSpy('onClose'),
        onSuccess: jasmine.createSpy('onSuccess'),
      })
    );

    expect(capturedState.showPhotoField).toBe(true);
  });

  it('does not forward a photoUpload to handleSubmit when no photo file was picked', function() {
    spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
    let capturedHandlers;

    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(PhotoUploadModal, {
        show: true,
        uploadPath: '/games/my-game/documents/9/file_upload.json',
        showNameField: true,
        showPhotoField: true,
        photoUploadPathBuilder: () => '/photo_upload.json',
        onClose: jasmine.createSpy('onClose'),
        onSuccess: jasmine.createSpy('onSuccess'),
      })
    );

    capturedHandlers.onSubmit();

    expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
      '/games/my-game/documents/9/file_upload.json',
      null,
      null,
      ''
    );
  });

  it('wires the photo file change handler', function() {
    let capturedHandlers;

    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(PhotoUploadModal, {
        show: true,
        uploadPath: '/games/my-game/documents/9/file_upload.json',
        showNameField: true,
        showPhotoField: true,
        photoUploadPathBuilder: () => '/photo_upload.json',
        onClose: jasmine.createSpy('onClose'),
        onSuccess: jasmine.createSpy('onSuccess'),
      })
    );

    expect(() => {
      capturedHandlers.onPhotoFileChange({ target: { files: [{ name: 'cover.png' }] } });
    }).not.toThrow();
  });
});
