import CommonItemPhoto
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemPhoto.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

describe('CommonItemPhoto', function() {
  const buildProps = (overrides = {}) => ({
    photo_path: 'http://example.com/common_item.png',
    name: 'Healing Potion',
    hidden: false,
    canUploadPhoto: false,
    handlers: { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') },
    ...overrides,
  });

  describe('.Show', function() {
    it('renders an ActionsOverlay with the common item photo url and alt text', function() {
      const element = CommonItemPhoto.Show(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('commonItem');
      expect(element.props.url).toBe('http://example.com/common_item.png');
      expect(element.props.alt).toBe('Healing Potion');
    });

    it('gates editing by canUploadPhoto', function() {
      expect(CommonItemPhoto.Show(buildProps({ canUploadPhoto: true })).props.canEdit).toBe(true);
      expect(CommonItemPhoto.Show(buildProps({ canUploadPhoto: false })).props.canEdit).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = CommonItemPhoto.Show(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });

    it('includes a Hidden info-bar item when hidden is true', function() {
      const element = CommonItemPhoto.Show(buildProps({ hidden: true }));

      expect(element.props.infoBarItems.length).toBe(1);
    });

    it('has no info-bar items when hidden is false', function() {
      const element = CommonItemPhoto.Show(buildProps({ hidden: false }));

      expect(element.props.infoBarItems).toEqual([]);
    });
  });

  describe('.Edit', function() {
    it('renders an ActionsOverlay with the common item photo url and alt text, always editable', function() {
      const element = CommonItemPhoto.Edit(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('commonItem');
      expect(element.props.url).toBe('http://example.com/common_item.png');
      expect(element.props.alt).toBe('Healing Potion');
      expect(element.props.canEdit).toBe(true);
    });

    it('dims the photo when hidden is true', function() {
      expect(CommonItemPhoto.Edit(buildProps({ hidden: true })).props.dimmed).toBe(true);
    });

    it('does not dim the photo when hidden is false', function() {
      expect(CommonItemPhoto.Edit(buildProps({ hidden: false })).props.dimmed).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = CommonItemPhoto.Edit(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });

  describe('.New', function() {
    it('renders an ActionsOverlay with the picked photo preview url and alt text, always editable', function() {
      const element = CommonItemPhoto.New(buildProps());

      expect(element.type).toBe(ActionsOverlay);
      expect(element.props.type).toBe('commonItem');
      expect(element.props.url).toBe('http://example.com/common_item.png');
      expect(element.props.alt).toBe('Healing Potion');
      expect(element.props.canEdit).toBe(true);
    });

    it('dims the photo when hidden is true', function() {
      expect(CommonItemPhoto.New(buildProps({ hidden: true })).props.dimmed).toBe(true);
    });

    it('does not dim the photo when hidden is false', function() {
      expect(CommonItemPhoto.New(buildProps({ hidden: false })).props.dimmed).toBe(false);
    });

    it('wires the upload click handler to handlers.onOpenUploadModal', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const element = CommonItemPhoto.New(buildProps({ handlers }));

      element.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });
});
