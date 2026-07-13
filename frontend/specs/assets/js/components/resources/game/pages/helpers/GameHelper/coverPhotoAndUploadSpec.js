import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/elements/ActionsOverlay.jsx';
import { game } from './support.js';

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

describe('GameHelper', function() {
  describe('.render', function() {
    it('renders the cover photo when cover_photo_path is provided', function() {
      const gameWithPhoto = {
        ...game,
        cover_photo_path: 'http://example.com/cover_photo.png',
      };
      const html = renderToStaticMarkup(GameHelper.render(gameWithPhoto));
      expect(html).toContain('http://example.com/cover_photo.png');
    });

    it('renders the photo upload overlay button when can_edit is true', function() {
      const editableGame = { ...game, can_edit: true };
      const html = renderToStaticMarkup(GameHelper.render(editableGame));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is false', function() {
      const nonEditableGame = { ...game, can_edit: false };
      const html = renderToStaticMarkup(GameHelper.render(nonEditableGame));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is absent', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('invokes onOpenUploadModal when the overlay button is clicked', function() {
      const onOpenUploadModal = jasmine.createSpy('onOpenUploadModal');
      const editableGame = { ...game, can_edit: true };
      const element = GameHelper.render(editableGame, [], [], { onOpenUploadModal });
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      overlay.props.onClick();

      expect(onOpenUploadModal).toHaveBeenCalled();
    });

    it('does not render the old inline photo gallery', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain('img-fluid rounded');
    });
  });
});
