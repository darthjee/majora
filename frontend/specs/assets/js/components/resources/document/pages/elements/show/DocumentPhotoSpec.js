import DocumentPhoto
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentPhoto.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

describe('DocumentPhoto', function() {
  const buildProps = (overrides = {}) => ({
    photo_path: 'http://example.com/document.png',
    name: 'Ancient Scroll',
    hidden: false,
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

    it('is never editable (no upload affordance in this issue)', function() {
      expect(DocumentPhoto.Show(buildProps()).props.canEdit).toBe(false);
    });

    it('includes a Hidden info-bar item when hidden is true', function() {
      const element = DocumentPhoto.Show(buildProps({ hidden: true }));

      expect(element.props.infoBarItems.length).toBe(1);
    });

    it('has no info-bar items when hidden is false', function() {
      const element = DocumentPhoto.Show(buildProps({ hidden: false }));

      expect(element.props.infoBarItems).toEqual([]);
    });
  });

  it('has no New or Edit variant (no photo picker, no edit mode in this issue)', function() {
    expect(DocumentPhoto.New).toBeUndefined();
    expect(DocumentPhoto.Edit).toBeUndefined();
  });
});
