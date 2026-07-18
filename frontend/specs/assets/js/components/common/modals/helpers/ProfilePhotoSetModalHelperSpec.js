import ProfilePhotoSetModalHelper from '../../../../../../../assets/js/components/common/modals/helpers/ProfilePhotoSetModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

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

describe('ProfilePhotoSetModalHelper', function() {
  const photo = { id: 3, path: 'photos/games/demo/photo.jpg' };

  describe('.render', function() {
    it('renders a Modal with the given show flag', function() {
      const element = ProfilePhotoSetModalHelper.render(true, photo, 'Aragorn', Noop.noop);

      expect(element.type).toBe(Modal);
      expect(element.props.show).toBe(true);
    });

    it('respects a false show flag', function() {
      const element = ProfilePhotoSetModalHelper.render(false, photo, 'Aragorn', Noop.noop);

      expect(element.props.show).toBe(false);
    });

    it('renders the title', function() {
      const element = ProfilePhotoSetModalHelper.render(true, photo, 'Aragorn', Noop.noop);
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Profile Photo Updated');
    });

    it('wires onHide to the onClose handler', function() {
      const onClose = jasmine.createSpy('onClose');
      const element = ProfilePhotoSetModalHelper.render(true, photo, 'Aragorn', onClose);

      element.props.onHide();

      expect(onClose).toHaveBeenCalled();
    });

    it('renders the photo image using its path and the given alt text', function() {
      const element = ProfilePhotoSetModalHelper.render(true, photo, 'Aragorn', Noop.noop);
      const img = findElement(element, (child) => child.type === 'img');

      expect(img.props.src).toBe('photos/games/demo/photo.jpg');
      expect(img.props.alt).toBe('Aragorn');
      expect(img.props.className).toContain('img-fluid');
    });

    it('renders no image when photo is null', function() {
      const element = ProfilePhotoSetModalHelper.render(true, null, 'Aragorn', Noop.noop);
      const img = findElement(element, (child) => child.type === 'img');

      expect(img).toBeNull();
    });

    it('renders a single Close button wired to the onClose handler', function() {
      const onClose = jasmine.createSpy('onClose');
      const element = ProfilePhotoSetModalHelper.render(true, photo, 'Aragorn', onClose);
      const button = findElement(element, (child) => child.type === 'button');

      button.props.onClick();

      expect(button.props.className).toBe('btn btn-secondary');
      expect(onClose).toHaveBeenCalled();
    });
  });
});
