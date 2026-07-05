import PhotoViewModalHelper from '../../../../../../assets/js/components/elements/helpers/PhotoViewModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('PhotoViewModalHelper', function() {
  const photo = { id: 3, path: 'photos/games/demo/photo.jpg' };

  describe('.render', function() {
    it('renders a Modal with the given show flag', function() {
      const element = PhotoViewModalHelper.render(true, photo, 'Demo Game', Noop.noop);
      expect(element.type).toBe(Modal);
      expect(element.props.show).toBe(true);
    });

    it('wires onHide to the onClose handler', function() {
      const onClose = jasmine.createSpy('onClose');
      const element = PhotoViewModalHelper.render(true, photo, 'Demo Game', onClose);

      element.props.onHide();

      expect(onClose).toHaveBeenCalled();
    });

    it('renders the photo image at full size using its path', function() {
      const element = PhotoViewModalHelper.render(true, photo, 'Demo Game', Noop.noop);
      const img = findElement(element, (child) => child.type === 'img');

      expect(img.props.src).toBe('photos/games/demo/photo.jpg');
      expect(img.props.alt).toBe('Demo Game');
      expect(img.props.className).toContain('img-fluid');
    });

    it('renders no image when photo is null', function() {
      const element = PhotoViewModalHelper.render(true, null, 'Demo Game', Noop.noop);
      const img = findElement(element, (child) => child.type === 'img');

      expect(img).toBeNull();
    });

    it('renders no "set as profile photo" button when new props are omitted', function() {
      const element = PhotoViewModalHelper.render(true, photo, 'Demo Game', Noop.noop);
      const button = findElement(element, (child) => child.type === 'button');

      expect(button).toBeNull();
    });

    it('renders the "set as profile photo" button when canSetProfilePhoto is true and isProfilePhoto is false', function() {
      const element = PhotoViewModalHelper.render(true, photo, 'Demo Game', Noop.noop, true, false, Noop.noop);
      const button = findElement(element, (child) => child.type === 'button');

      expect(button).not.toBeNull();
    });

    it('renders no button when canSetProfilePhoto is false', function() {
      const element = PhotoViewModalHelper.render(true, photo, 'Demo Game', Noop.noop, false, false, Noop.noop);
      const button = findElement(element, (child) => child.type === 'button');

      expect(button).toBeNull();
    });

    it('renders no button when isProfilePhoto is true', function() {
      const element = PhotoViewModalHelper.render(true, photo, 'Demo Game', Noop.noop, true, true, Noop.noop);
      const button = findElement(element, (child) => child.type === 'button');

      expect(button).toBeNull();
    });

    it('renders no button when there is no photo, even when canSetProfilePhoto is true', function() {
      const element = PhotoViewModalHelper.render(true, null, 'Demo Game', Noop.noop, true, false, Noop.noop);
      const button = findElement(element, (child) => child.type === 'button');

      expect(button).toBeNull();
    });

    it('invokes onSetProfilePhoto with the photo id when the button is clicked', function() {
      const onSetProfilePhoto = jasmine.createSpy('onSetProfilePhoto');
      const element = PhotoViewModalHelper.render(true, photo, 'Demo Game', Noop.noop, true, false, onSetProfilePhoto);
      const button = findElement(element, (child) => child.type === 'button');

      button.props.onClick();

      expect(onSetProfilePhoto).toHaveBeenCalledWith(photo.id);
    });
  });
});
