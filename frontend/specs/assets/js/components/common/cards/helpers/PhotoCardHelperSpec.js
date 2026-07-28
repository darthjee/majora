import { renderToStaticMarkup } from 'react-dom/server';
import PhotoCardHelper from '../../../../../../../assets/js/components/common/cards/helpers/PhotoCardHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

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

    it('does not render the delete action bar button by default', function() {
      const html = renderToStaticMarkup(PhotoCardHelper.render(photo, 'Demo Game', Noop.noop));

      expect(html).not.toContain('bi-trash-fill');
    });

    it('renders the delete action bar button when canDelete is true', function() {
      const html = renderToStaticMarkup(
        PhotoCardHelper.render(photo, 'Demo Game', Noop.noop, false, false, Noop.noop, true, Noop.noop)
      );

      expect(html).toContain('bi-trash-fill');
    });

    it('hides the delete action bar button when canDelete is false', function() {
      const html = renderToStaticMarkup(
        PhotoCardHelper.render(photo, 'Demo Game', Noop.noop, false, false, Noop.noop, false, Noop.noop)
      );

      expect(html).not.toContain('bi-trash-fill');
    });

    it('invokes onDelete (not onClick) with the photo id when the delete button is clicked', function() {
      const onClick = jasmine.createSpy('onClick');
      const onDelete = jasmine.createSpy('onDelete');

      const element = PhotoCardHelper.render(photo, 'Demo Game', onClick, false, false, Noop.noop, true, onDelete);
      const [, actionBar] = element.props.children.props.children;
      const [deleteButton] = actionBar.props.secondaryButtons;

      deleteButton.onClick();

      expect(onDelete).toHaveBeenCalledWith(photo.id);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('renders both the mark-as-profile and delete buttons when both are enabled', function() {
      const html = renderToStaticMarkup(
        PhotoCardHelper.render(photo, 'Demo Game', Noop.noop, true, false, Noop.noop, true, Noop.noop)
      );

      expect(html).toContain('bi-postage-fill');
      expect(html).toContain('bi-trash-fill');
    });
  });
});
