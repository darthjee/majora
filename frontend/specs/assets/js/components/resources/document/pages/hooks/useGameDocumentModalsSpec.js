import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useGameDocumentModals, { buildDocumentModals, buildUploadSuccessHandler }
  from '../../../../../../../../assets/js/components/resources/document/pages/hooks/useGameDocumentModals.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

/**
 * Minimal component exercising `useGameDocumentModals`, capturing what the hook returns.
 *
 * @param {object} props - Component props.
 * @param {object} props.controller - Controller passed through to the hook.
 * @param {Function} props.onResult - Callback invoked with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ controller, onResult }) {
  onResult(useGameDocumentModals(controller));
  return React.createElement('div', null, 'ok');
}

describe('useGameDocumentModals', function() {
  let result;

  beforeEach(function() {
    const controller = { buildEffect: jasmine.createSpy('buildEffect') };

    renderToStaticMarkup(React.createElement(TestHost, {
      controller, onResult: (value) => { result = value; },
    }));
  });

  it('exposes the click handlers', function() {
    expect(Object.keys(result.clickHandlers).sort()).toEqual([
      'onFileUploadClick', 'onGiveDocumentClick', 'onUploadClick',
    ]);
  });

  it('starts with every modal hidden', function() {
    const props = result.buildModalProps({});

    expect(props.uploadModal.show).toBe(false);
    expect(props.fileUploadModal.show).toBe(false);
    expect(props.giveDocumentModal.show).toBe(false);
  });
});

describe('buildUploadSuccessHandler', function() {
  let reload, setShow;

  beforeEach(function() {
    reload = jasmine.createSpy('reload');
    setShow = jasmine.createSpy('setShow');
    spyOn(RequestStore, 'purge');

    buildUploadSuccessHandler({ buildEffect: () => reload }, setShow)();
  });

  it('closes the modal', function() {
    expect(setShow).toHaveBeenCalledWith(false);
  });

  it('purges the document cache', function() {
    expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'document' });
  });

  it('refetches the document', function() {
    expect(reload).toHaveBeenCalled();
  });
});

describe('buildDocumentModals', function() {
  let reload, setVisible, modals, buildFilePhotoUploadPath;

  beforeEach(function() {
    reload = jasmine.createSpy('reload');
    buildFilePhotoUploadPath = jasmine.createSpy('buildFilePhotoUploadPath');
    setVisible = {
      upload: jasmine.createSpy('setUpload'),
      fileUpload: jasmine.createSpy('setFileUpload'),
      giveDocument: jasmine.createSpy('setGiveDocument'),
    };
    spyOn(RequestStore, 'purge');

    modals = buildDocumentModals({
      controller: { buildEffect: () => reload },
      visible: { upload: true, fileUpload: false, giveDocument: true },
      setVisible,
    });
  });

  describe('clickHandlers', function() {
    it('opens the upload modal', function() {
      modals.clickHandlers.onUploadClick();

      expect(setVisible.upload).toHaveBeenCalledWith(true);
    });

    it('opens the file upload modal', function() {
      modals.clickHandlers.onFileUploadClick();

      expect(setVisible.fileUpload).toHaveBeenCalledWith(true);
    });

    it('opens the give document modal', function() {
      modals.clickHandlers.onGiveDocumentClick();

      expect(setVisible.giveDocument).toHaveBeenCalledWith(true);
    });
  });

  describe('buildModalProps', function() {
    let props;

    beforeEach(function() {
      props = modals.buildModalProps({
        uploadPath: '/up', fileUploadPath: '/file-up', buildFilePhotoUploadPath, canGiveHidden: true,
      });
    });

    it('builds the upload modal props', function() {
      expect(props.uploadModal).toEqual(jasmine.objectContaining({ show: true, path: '/up' }));
    });

    it('closes the upload modal', function() {
      props.uploadModal.onClose();

      expect(setVisible.upload).toHaveBeenCalledWith(false);
    });

    it('upload success closes the modal and refetches', function() {
      props.uploadModal.onSuccess();

      expect(setVisible.upload).toHaveBeenCalledWith(false);
      expect(reload).toHaveBeenCalled();
    });

    it('builds the file upload modal props', function() {
      expect(props.fileUploadModal).toEqual(jasmine.objectContaining({
        show: false, path: '/file-up', buildFilePhotoUploadPath,
      }));
    });

    it('closes the file upload modal', function() {
      props.fileUploadModal.onClose();

      expect(setVisible.fileUpload).toHaveBeenCalledWith(false);
    });

    it('file upload success closes the modal and refetches', function() {
      props.fileUploadModal.onSuccess();

      expect(setVisible.fileUpload).toHaveBeenCalledWith(false);
      expect(reload).toHaveBeenCalled();
    });

    it('builds the give document modal props', function() {
      expect(props.giveDocumentModal).toEqual(jasmine.objectContaining({
        show: true, canGiveHidden: true,
      }));
    });

    it('closes the give document modal', function() {
      props.giveDocumentModal.onClose();

      expect(setVisible.giveDocument).toHaveBeenCalledWith(false);
    });
  });
});
