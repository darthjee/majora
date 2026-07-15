import { renderToStaticMarkup } from 'react-dom/server';
import CharacterPhotosPreviewHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx';

describe('CharacterPhotosPreviewHelper', function() {
  const title = 'Photos';
  const seeAllHref = '#/games/epic-quest/pcs/1/photos';

  const buildPhotos = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    path: `/photos/${index + 1}.jpg`,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render(buildPhotos(2), title, seeAllHref));
      expect(html).toContain('Photos');
    });

    it('renders a card for each photo when within the preview limit', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render(buildPhotos(3), title, seeAllHref));
      expect(html).toContain('/photos/1.jpg');
      expect(html).toContain('/photos/2.jpg');
      expect(html).toContain('/photos/3.jpg');
    });

    it('does not wrap the photo cards in a clickable control', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render(buildPhotos(1), title, seeAllHref));
      expect(html).not.toContain('<button');
    });

    it('slices the photos to the max preview count', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render(buildPhotos(8), title, seeAllHref));
      expect(html).toContain('/photos/6.jpg');
      expect(html).not.toContain('/photos/7.jpg');
      expect(html).not.toContain('/photos/8.jpg');
    });

    it('renders a see all card with the provided href', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render(buildPhotos(1), title, seeAllHref));
      expect(html).toContain(`href="${seeAllHref}"`);
      expect(html).toContain('See all Photos');
    });

    it('renders the see all card with the camera icon', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render(buildPhotos(1), title, seeAllHref));
      expect(html).toContain('bi-camera-fill');
    });

    it('renders an empty-state message and keeps the see all link when there are no photos', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render([], title, seeAllHref));
      expect(html).toContain('Photos');
      expect(html).toContain(`href="${seeAllHref}"`);
    });
  });
});
