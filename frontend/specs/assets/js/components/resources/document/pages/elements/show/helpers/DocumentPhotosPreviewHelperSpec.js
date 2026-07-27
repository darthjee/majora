import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPhotosPreviewHelper
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/show/helpers/DocumentPhotosPreviewHelper.jsx';

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

describe('DocumentPhotosPreviewHelper', function() {
  const title = 'Photos';
  const seeAllHref = '#/games/epic-quest/documents/9/photos';

  const buildPhotos = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    path: `/photos/${index + 1}.jpg`,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(DocumentPhotosPreviewHelper.render(buildPhotos(2), title, seeAllHref));
      expect(html).toContain('Photos');
    });

    it('renders a card for each photo', function() {
      const html = renderToStaticMarkup(DocumentPhotosPreviewHelper.render(buildPhotos(3), title, seeAllHref));
      expect(html).toContain('/photos/1.jpg');
      expect(html).toContain('/photos/2.jpg');
      expect(html).toContain('/photos/3.jpg');
    });

    it('invokes onSelectPhoto with the clicked photo', function() {
      const onSelectPhoto = jasmine.createSpy('onSelectPhoto');
      const photos = buildPhotos(2);
      const tree = DocumentPhotosPreviewHelper.render(photos, title, seeAllHref, onSelectPhoto);
      const button = findElement(tree, (node) => node.type === 'button' && typeof node.props?.onClick === 'function');

      expect(button).not.toBeNull();
      button.props.onClick();

      expect(onSelectPhoto).toHaveBeenCalledWith(photos[0]);
    });

    it('renders a see all card with the provided href and camera icon', function() {
      const html = renderToStaticMarkup(DocumentPhotosPreviewHelper.render(buildPhotos(1), title, seeAllHref));
      expect(html).toContain(`href="${seeAllHref}"`);
      expect(html).toContain('bi-camera-fill');
    });

    it('renders an empty-state message and keeps the see all link when there are no photos', function() {
      const html = renderToStaticMarkup(DocumentPhotosPreviewHelper.render([], title, seeAllHref));
      expect(html).toContain('Photos');
      expect(html).toContain(`href="${seeAllHref}"`);
    });

    it('does not render the mark-as-profile action bar button', function() {
      const html = renderToStaticMarkup(DocumentPhotosPreviewHelper.render(buildPhotos(1), title, seeAllHref));
      expect(html).not.toContain('bi-postage-fill');
    });
  });
});
