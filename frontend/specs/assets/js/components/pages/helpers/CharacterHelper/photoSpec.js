import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import ActionsOverlay from '../../../../../../../assets/js/components/elements/ActionsOverlay.jsx';
import { character, findElement } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
    it('renders the default avatar when profile_photo_path is null', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('default_character.png');
    });

    it('renders the profile photo when profile_photo_path is provided', function() {
      const c = {
        ...character,
        profile_photo_path: 'http://example.com/profile_photo.png',
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('http://example.com/profile_photo.png');
    });

    it('renders the photo upload overlay button when can_edit is true', function() {
      const c = { ...character, can_edit: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is false', function() {
      const c = { ...character, can_edit: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is absent', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('invokes onOpenUploadModal when the overlay button is clicked', function() {
      const onOpenUploadModal = jasmine.createSpy('onOpenUploadModal');
      const c = { ...character, can_edit: true };
      const element = CharacterHelper.render(c, '#/games/demo/pcs', { onOpenUploadModal });
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      overlay.props.onClick();

      expect(onOpenUploadModal).toHaveBeenCalled();
    });
  });
});
