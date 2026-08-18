import CharacterDocumentPhoto
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentPhoto.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

describe('CharacterDocumentPhoto', function() {
  const buildProps = (overrides = {}) => ({
    photo_path: 'http://example.com/document.png',
    name: 'Ancient Tome',
    hidden: false,
    ...overrides,
  });

  it('renders an ActionsOverlay with the document photo url and alt text', function() {
    const element = CharacterDocumentPhoto(buildProps());

    expect(element.type).toBe(ActionsOverlay);
    expect(element.props.type).toBe('document');
    expect(element.props.url).toBe('http://example.com/document.png');
    expect(element.props.alt).toBe('Ancient Tome');
  });

  it('never renders an upload affordance, since CharacterDocument has no photo of its own', function() {
    const element = CharacterDocumentPhoto(buildProps());

    expect(element.props.canEdit).toBe(false);
  });

  it('does not throw when the overlay invokes its onClick', function() {
    const element = CharacterDocumentPhoto(buildProps());

    expect(() => element.props.onClick()).not.toThrow();
  });

  it('includes a Hidden info-bar item when hidden is true', function() {
    const element = CharacterDocumentPhoto(buildProps({ hidden: true }));

    expect(element.props.overlayItems.infoBarItems.length).toBe(1);
  });

  it('has no info-bar items when hidden is false', function() {
    const element = CharacterDocumentPhoto(buildProps({ hidden: false }));

    expect(element.props.overlayItems.infoBarItems).toEqual([]);
  });
});
