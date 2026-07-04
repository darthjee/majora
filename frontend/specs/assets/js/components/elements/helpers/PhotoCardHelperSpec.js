import { renderToStaticMarkup } from 'react-dom/server';
import PhotoCardHelper from '../../../../../../assets/js/components/elements/helpers/PhotoCardHelper.jsx';

describe('PhotoCardHelper', function() {
  const photo = { id: 7, path: 'photos/games/demo/photo_ab12.jpg' };

  describe('.render', function() {
    it('renders the photo image using its path', function() {
      const html = renderToStaticMarkup(PhotoCardHelper.render(photo, 'Demo Game', () => {}));
      expect(html).toContain('photos/games/demo/photo_ab12.jpg');
    });

    it('applies the alt text to the image', function() {
      const html = renderToStaticMarkup(PhotoCardHelper.render(photo, 'Demo Game', () => {}));
      expect(html).toContain('alt="Demo Game"');
    });

    it('applies Bootstrap card classes', function() {
      const html = renderToStaticMarkup(PhotoCardHelper.render(photo, 'Demo Game', () => {}));
      expect(html).toContain('card');
    });

    it('invokes onClick with the photo when the button is clicked', function() {
      const onClick = jasmine.createSpy('onClick');
      const element = PhotoCardHelper.render(photo, 'Demo Game', onClick);

      element.props.children.props.onClick();

      expect(onClick).toHaveBeenCalledWith(photo);
    });
  });
});
