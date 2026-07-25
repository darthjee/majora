import { renderToStaticMarkup } from 'react-dom/server';
import CharacterPhotosPreviewHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx';

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

    it('wraps each photo card in a clickable control when onSelectPhoto is provided', function() {
      const onSelectPhoto = jasmine.createSpy('onSelectPhoto');
      const html = renderToStaticMarkup(
        CharacterPhotosPreviewHelper.render(buildPhotos(2), title, seeAllHref, onSelectPhoto)
      );
      expect((html.match(/<button/g) || []).length).toBe(2);
    });

    it('invokes onSelectPhoto with the clicked photo', function() {
      const onSelectPhoto = jasmine.createSpy('onSelectPhoto');
      const photos = buildPhotos(2);
      const tree = CharacterPhotosPreviewHelper.render(photos, title, seeAllHref, onSelectPhoto);
      const button = findElement(tree, (node) => node.type === 'button' && typeof node.props?.onClick === 'function');

      expect(button).not.toBeNull();
      button.props.onClick();

      expect(onSelectPhoto).toHaveBeenCalledWith(photos[0]);
    });

    it('slices the photos to the max preview count', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render(buildPhotos(13), title, seeAllHref));
      expect(html).toContain('/photos/11.jpg');
      expect(html).not.toContain('/photos/12.jpg');
      expect(html).not.toContain('/photos/13.jpg');
    });

    it('renders a see all card with the provided href', function() {
      const html = renderToStaticMarkup(CharacterPhotosPreviewHelper.render(buildPhotos(1), title, seeAllHref));
      expect(html).toContain(`href="${seeAllHref}"`);
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

    it(
      'renders the mark-as-profile action bar button when canSetProfilePhoto is true and the ' +
        'photo is not already the profile photo',
      function() {
        const photos = buildPhotos(1);
        const html = renderToStaticMarkup(
          CharacterPhotosPreviewHelper.render(photos, title, seeAllHref, undefined, true, 999)
        );

        expect(html).toContain('bi-postage-fill');
      }
    );

    it('hides the mark-as-profile action bar button when canSetProfilePhoto is false', function() {
      const photos = buildPhotos(1);
      const html = renderToStaticMarkup(
        CharacterPhotosPreviewHelper.render(photos, title, seeAllHref, undefined, false, 999)
      );

      expect(html).not.toContain('bi-postage-fill');
    });

    it('hides the mark-as-profile action bar button when the photo is already the profile photo', function() {
      const photos = buildPhotos(1);
      const html = renderToStaticMarkup(
        CharacterPhotosPreviewHelper.render(photos, title, seeAllHref, undefined, true, photos[0].id)
      );

      expect(html).not.toContain('bi-postage-fill');
    });

    it('invokes onSetProfilePhoto with the photo id when the action bar button is clicked', function() {
      const onSetProfilePhoto = jasmine.createSpy('onSetProfilePhoto');
      const photos = buildPhotos(1);
      const tree = CharacterPhotosPreviewHelper.render(
        photos, title, seeAllHref, undefined, true, 999, onSetProfilePhoto,
      );
      const button = findElement(
        tree,
        (node) => node.type === 'button' && node.props?.['aria-label'] && typeof node.props?.onClick === 'function',
      );

      expect(button).not.toBeNull();
      button.props.onClick();

      expect(onSetProfilePhoto).toHaveBeenCalledWith(photos[0].id);
    });
  });
});
