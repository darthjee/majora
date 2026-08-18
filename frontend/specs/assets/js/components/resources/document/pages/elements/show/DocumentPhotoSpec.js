import DocumentPhoto
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentPhoto.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

describe('DocumentPhoto', function() {
  const buildProps = (overrides = {}) => ({
    photo_path: 'http://example.com/document.png',
    name: 'Ancient Scroll',
    hidden: false,
    canUploadPhoto: false,
    handlers: { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') },
    ...overrides,
  });

  describe('.Show', function() {
    it('renders an ActionsOverlay with the document photo url and alt text', function() {
      const element = DocumentPhoto.Show(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('document');
      expect(element.props.url).toBe('http://example.com/document.png');
      expect(element.props.alt).toBe('Ancient Scroll');
    });

    it('gates editing by canUploadPhoto', function() {
      expect(DocumentPhoto.Show(buildProps({ canUploadPhoto: true })).props.canEdit).toBe(true);
      expect(DocumentPhoto.Show(buildProps({ canUploadPhoto: false })).props.canEdit).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = DocumentPhoto.Show(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });

    it('includes a Hidden info-bar item when hidden is true', function() {
      const element = DocumentPhoto.Show(buildProps({ hidden: true }));

      expect(element.props.overlayItems.infoBarItems.length).toBe(1);
    });

    it('has no info-bar items when hidden is false', function() {
      const element = DocumentPhoto.Show(buildProps({ hidden: false }));

      expect(element.props.overlayItems.infoBarItems).toEqual([]);
    });
  });

  describe('.Edit', function() {
    it('renders an ActionsOverlay with the document photo url and alt text, always editable', function() {
      const element = DocumentPhoto.Edit(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('document');
      expect(element.props.url).toBe('http://example.com/document.png');
      expect(element.props.alt).toBe('Ancient Scroll');
      expect(element.props.canEdit).toBe(true);
    });

    it('dims the photo when hidden is true', function() {
      expect(DocumentPhoto.Edit(buildProps({ hidden: true })).props.dimmed).toBe(true);
    });

    it('does not dim the photo when hidden is false', function() {
      expect(DocumentPhoto.Edit(buildProps({ hidden: false })).props.dimmed).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = DocumentPhoto.Edit(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });

  describe('.New', function() {
    it('renders an ActionsOverlay with the picked photo preview url and alt text, always editable', function() {
      const element = DocumentPhoto.New(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('document');
      expect(element.props.url).toBe('http://example.com/document.png');
      expect(element.props.alt).toBe('Ancient Scroll');
      expect(element.props.canEdit).toBe(true);
    });

    it('dims the photo when hidden is true', function() {
      expect(DocumentPhoto.New(buildProps({ hidden: true })).props.dimmed).toBe(true);
    });

    it('does not dim the photo when hidden is false', function() {
      expect(DocumentPhoto.New(buildProps({ hidden: false })).props.dimmed).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = DocumentPhoto.New(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });
});
