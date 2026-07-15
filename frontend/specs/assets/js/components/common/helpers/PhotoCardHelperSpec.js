import { renderToStaticMarkup } from 'react-dom/server';
import PhotoCardHelper from '../../../../../../assets/js/components/common/helpers/PhotoCardHelper.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('PhotoCardHelper', function() {
  const photo = { id: 7, path: 'photos/games/demo/photo_ab12.jpg' };

  describe('.render', function() {
    it('renders the photo image using its path', function() {
      const html = renderToStaticMarkup(PhotoCardHelper.render(photo, 'Demo Game', Noop.noop));
      expect(html).toContain('photos/games/demo/photo_ab12.jpg');
    });

    it('applies the alt text to the image', function() {
      const html = renderToStaticMarkup(PhotoCardHelper.render(photo, 'Demo Game', Noop.noop));
      expect(html).toContain('alt="Demo Game"');
    });

    it('applies Bootstrap card classes', function() {
      const html = renderToStaticMarkup(PhotoCardHelper.render(photo, 'Demo Game', Noop.noop));
      expect(html).toContain('card');
    });

    it('invokes onClick with the photo when the button is clicked', function() {
      const onClick = jasmine.createSpy('onClick');
      const element = PhotoCardHelper.render(photo, 'Demo Game', onClick);
      const [button] = element.props.children.props.children;

      button.props.onClick();

      expect(onClick).toHaveBeenCalledWith(photo);
    });

    it('applies the green profile-photo border when isProfilePhoto is true', function() {
      const html = renderToStaticMarkup(
        PhotoCardHelper.render(photo, 'Demo Game', Noop.noop, false, true)
      );

      expect(html).toContain('border border-success');
    });

    it('does not apply the profile-photo border when isProfilePhoto is false', function() {
      const html = renderToStaticMarkup(
        PhotoCardHelper.render(photo, 'Demo Game', Noop.noop, false, false)
      );

      expect(html).not.toContain('border-success');
    });
  });
});
