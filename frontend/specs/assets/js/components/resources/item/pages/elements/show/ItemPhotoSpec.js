import ItemPhoto
  from '../../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemPhoto.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

describe('ItemPhoto', function() {
  const buildProps = (overrides = {}) => ({
    photo_path: 'http://example.com/item.png',
    name: 'Cloak of Elvenkind',
    hidden: false,
    canUploadPhoto: false,
    handlers: { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') },
    ...overrides,
  });

  describe('.Show', function() {
    it('renders an ActionsOverlay with the item photo url and alt text', function() {
      const element = ItemPhoto.Show(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('item');
      expect(element.props.url).toBe('http://example.com/item.png');
      expect(element.props.alt).toBe('Cloak of Elvenkind');
    });

    it('gates editing by canUploadPhoto', function() {
      expect(ItemPhoto.Show(buildProps({ canUploadPhoto: true })).props.canEdit).toBe(true);
      expect(ItemPhoto.Show(buildProps({ canUploadPhoto: false })).props.canEdit).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = ItemPhoto.Show(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });

    it('includes a Hidden info-bar item when hidden is true', function() {
      const element = ItemPhoto.Show(buildProps({ hidden: true }));

      expect(element.props.infoBarItems.length).toBe(1);
    });

    it('has no info-bar items when hidden is false', function() {
      const element = ItemPhoto.Show(buildProps({ hidden: false }));

      expect(element.props.infoBarItems).toEqual([]);
    });
  });

  describe('.Edit', function() {
    it('renders an ActionsOverlay with the item photo url and alt text, always editable', function() {
      const element = ItemPhoto.Edit(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('item');
      expect(element.props.url).toBe('http://example.com/item.png');
      expect(element.props.alt).toBe('Cloak of Elvenkind');
      expect(element.props.canEdit).toBe(true);
    });

    it('dims the photo when hidden is true', function() {
      expect(ItemPhoto.Edit(buildProps({ hidden: true })).props.dimmed).toBe(true);
    });

    it('does not dim the photo when hidden is false', function() {
      expect(ItemPhoto.Edit(buildProps({ hidden: false })).props.dimmed).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = ItemPhoto.Edit(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });
});
