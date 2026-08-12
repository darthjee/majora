import FactionPhoto
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/show/FactionPhoto.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

describe('FactionPhoto', function() {
  const buildProps = (overrides = {}) => ({
    photo_path: 'http://example.com/faction.png',
    name: 'The Silver Hand',
    canUploadPhoto: false,
    handlers: { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') },
    ...overrides,
  });

  describe('.Show', function() {
    it('renders an ActionsOverlay with the faction photo url and alt text', function() {
      const element = FactionPhoto.Show(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('faction');
      expect(element.props.url).toBe('http://example.com/faction.png');
      expect(element.props.alt).toBe('The Silver Hand');
    });

    it('gates editing by canUploadPhoto', function() {
      expect(FactionPhoto.Show(buildProps({ canUploadPhoto: true })).props.canEdit).toBe(true);
      expect(FactionPhoto.Show(buildProps({ canUploadPhoto: false })).props.canEdit).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = FactionPhoto.Show(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });

  describe('.Edit', function() {
    it('renders an ActionsOverlay with the faction photo url and alt text, always editable', function() {
      const element = FactionPhoto.Edit(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('faction');
      expect(element.props.url).toBe('http://example.com/faction.png');
      expect(element.props.alt).toBe('The Silver Hand');
      expect(element.props.canEdit).toBe(true);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = FactionPhoto.Edit(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });
});
