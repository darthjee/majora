import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentPhotosPreviewHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/show/helpers/CharacterDocumentPhotosPreviewHelper.jsx';

const findElement = (node, matcher) => {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);
      if (match) return match;
    }
    return null;
  }

  if (typeof node !== 'object') return null;
  if (matcher(node)) return node;
  if (typeof node.type === 'function') return findElement(node.type(node.props), matcher);

  return findElement(node.props?.children, matcher);
};

describe('CharacterDocumentPhotosPreviewHelper', function() {
  const title = 'Photos';

  const buildPhotos = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    character_document_id: 9,
    path: `/photos/${index + 1}.jpg`,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(CharacterDocumentPhotosPreviewHelper.render(buildPhotos(2), title));
      expect(html).toContain('Photos');
    });

    it('renders a card for each photo', function() {
      const html = renderToStaticMarkup(CharacterDocumentPhotosPreviewHelper.render(buildPhotos(3), title));
      expect(html).toContain('/photos/1.jpg');
      expect(html).toContain('/photos/2.jpg');
      expect(html).toContain('/photos/3.jpg');
    });

    it('invokes onSelectPhoto with the clicked photo', function() {
      const onSelectPhoto = jasmine.createSpy('onSelectPhoto');
      const photos = buildPhotos(2);
      const tree = CharacterDocumentPhotosPreviewHelper.render(photos, title, onSelectPhoto);
      const button = findElement(tree, (node) => node.type === 'button' && typeof node.props?.onClick === 'function');

      expect(button).not.toBeNull();
      button.props.onClick();

      expect(onSelectPhoto).toHaveBeenCalledWith(photos[0]);
    });

    it('renders no "see all" card, since no full-list page exists for a CharacterDocument\'s photos', function() {
      const html = renderToStaticMarkup(CharacterDocumentPhotosPreviewHelper.render(buildPhotos(1), title));
      expect(html).not.toContain('bi-camera-fill');
    });

    it('renders an empty-state message when there are no photos', function() {
      const html = renderToStaticMarkup(CharacterDocumentPhotosPreviewHelper.render([], title));
      expect(html).toContain('Photos');
    });
  });
});
