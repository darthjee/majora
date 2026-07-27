import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocument from '../../../../../../../assets/js/components/resources/document/pages/GameDocument.jsx';
import DocumentDetailHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx';
import PhotoViewModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoViewModalHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedDocument = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };

/** Stub controller that synchronously loads a document (with upload permission) during construction. */
class LoadedController {
  constructor(setDocument, setLoading, setError, setCanUploadPhoto) {
    setDocument(loadedDocument);
    setCanUploadPhoto(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameDocument photo shortlist wiring (issue #873)', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('passes the game slug through to DocumentDetailHelper.render', function() {
    let capturedGameSlug;
    spyOn(DocumentDetailHelper, 'render').and.callFake((
      document, backHref, editHref, canUploadPhoto, onUploadClick, onFileUploadClick, gameSlug,
    ) => {
      capturedGameSlug = gameSlug;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(capturedGameSlug).toBe('demo');
  });

  it('opens the photo view modal via the onSelectPhoto handler passed to DocumentDetailHelper', function() {
    let capturedOnSelectPhoto;
    spyOn(DocumentDetailHelper, 'render').and.callFake((
      document, backHref, editHref, canUploadPhoto, onUploadClick, onFileUploadClick, gameSlug, onSelectPhoto,
    ) => {
      capturedOnSelectPhoto = onSelectPhoto;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(() => capturedOnSelectPhoto({ id: 1, path: '/photos/1.jpg' })).not.toThrow();
  });

  it('renders the photo view modal initially closed', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    let capturedShow;
    spyOn(PhotoViewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(capturedShow).toBe(false);
  });

  it('renders the photo view modal with photo=null before any photo is selected', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    let capturedPhoto;
    spyOn(PhotoViewModalHelper, 'render').and.callFake((show, photo) => {
      capturedPhoto = photo;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(capturedPhoto).toBeNull();
  });

  it('does not throw when the photo view modal is closed', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    let capturedOnClose;
    spyOn(PhotoViewModalHelper, 'render').and.callFake((show, photo, alt, onClose) => {
      capturedOnClose = onClose;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(() => capturedOnClose()).not.toThrow();
  });

  it('never offers to set the selected photo as a profile photo', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    let capturedCanSetProfilePhoto;
    spyOn(PhotoViewModalHelper, 'render').and.callFake((show, photo, alt, onClose, canSetProfilePhoto) => {
      capturedCanSetProfilePhoto = canSetProfilePhoto;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(capturedCanSetProfilePhoto).toBe(false);
  });
});
