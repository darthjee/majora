import PossessionPhoto
  from '../../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionPhoto.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

describe('PossessionPhoto', function() {
  const buildProps = (overrides = {}) => ({
    photo_path: 'http://example.com/possession.png',
    name: 'Old Tavern',
    hidden: false,
    canUploadPhoto: false,
    handlers: { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') },
    ...overrides,
  });

  describe('.Show', function() {
    it('renders an ActionsOverlay with the possession photo url and alt text', function() {
      const element = PossessionPhoto.Show(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('possession');
      expect(element.props.url).toBe('http://example.com/possession.png');
      expect(element.props.alt).toBe('Old Tavern');
    });

    it('gates editing by canUploadPhoto', function() {
      expect(PossessionPhoto.Show(buildProps({ canUploadPhoto: true })).props.canEdit).toBe(true);
      expect(PossessionPhoto.Show(buildProps({ canUploadPhoto: false })).props.canEdit).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = PossessionPhoto.Show(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });

    it('includes a Hidden info-bar item when hidden is true', function() {
      const element = PossessionPhoto.Show(buildProps({ hidden: true }));

      expect(element.props.overlayItems.infoBarItems.length).toBe(1);
    });

    it('has no info-bar items when hidden is false', function() {
      const element = PossessionPhoto.Show(buildProps({ hidden: false }));

      expect(element.props.overlayItems.infoBarItems).toEqual([]);
    });
  });

  describe('.Edit', function() {
    it('renders an ActionsOverlay with the possession photo url and alt text, always editable', function() {
      const element = PossessionPhoto.Edit(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('possession');
      expect(element.props.url).toBe('http://example.com/possession.png');
      expect(element.props.alt).toBe('Old Tavern');
      expect(element.props.canEdit).toBe(true);
    });

    it('dims the photo when hidden is true', function() {
      expect(PossessionPhoto.Edit(buildProps({ hidden: true })).props.dimmed).toBe(true);
    });

    it('does not dim the photo when hidden is false', function() {
      expect(PossessionPhoto.Edit(buildProps({ hidden: false })).props.dimmed).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = PossessionPhoto.Edit(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });

  describe('.New', function() {
    it('renders an ActionsOverlay with the picked photo preview url and alt text, always editable', function() {
      const element = PossessionPhoto.New(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('possession');
      expect(element.props.url).toBe('http://example.com/possession.png');
      expect(element.props.alt).toBe('Old Tavern');
      expect(element.props.canEdit).toBe(true);
    });

    it('dims the photo when hidden is true', function() {
      expect(PossessionPhoto.New(buildProps({ hidden: true })).props.dimmed).toBe(true);
    });

    it('does not dim the photo when hidden is false', function() {
      expect(PossessionPhoto.New(buildProps({ hidden: false })).props.dimmed).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = PossessionPhoto.New(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });
});
