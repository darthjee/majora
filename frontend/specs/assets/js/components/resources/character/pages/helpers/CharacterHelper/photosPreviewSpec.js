import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import CharacterPhotosPreviewHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('photos preview section', function() {
    it('renders the heading and each photo card, defaulting to an empty list', function() {
      const withPhotos = {
        ...character,
        photos: [{ id: 1, path: '/photos/1.jpg' }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withPhotos, '#/games/demo/pcs'));
      expect(html).toContain('Photos');
      expect(html).toContain('/photos/1.jpg');
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Photos');
    });

    it('wraps the photo cards in a clickable button when onSelectPhoto is provided', function() {
      const withPhotos = {
        ...character,
        photos: [{ id: 1, path: '/photos/1.jpg' }],
      };
      const onSelectPhoto = jasmine.createSpy('onSelectPhoto');

      const html = renderToStaticMarkup(
        CharacterHelper.render(withPhotos, '#/games/demo/pcs', { onSelectPhoto }),
      );
      expect(html).toContain('<button');
    });

    it('passes handlers.onSelectPhoto through to CharacterPhotosPreviewHelper', function() {
      const withPhotos = {
        ...character,
        photos: [{ id: 1, path: '/photos/1.jpg' }],
      };
      const onSelectPhoto = jasmine.createSpy('onSelectPhoto');
      let capturedOnSelectPhoto;
      spyOn(CharacterPhotosPreviewHelper, 'render').and.callFake((photos, title, seeAllHref, onSelect) => {
        capturedOnSelectPhoto = onSelect;
        return null;
      });

      renderToStaticMarkup(CharacterHelper.render(withPhotos, '#/games/demo/pcs', { onSelectPhoto }));

      expect(capturedOnSelectPhoto).toBe(onSelectPhoto);
    });

    it('passes handlers.onSetProfilePhoto and character.can_set_profile_photo/photo_id through ' +
      'to CharacterPhotosPreviewHelper', function() {
      const withPhotos = {
        ...character,
        can_set_profile_photo: true,
        photo_id: 999,
        photos: [{ id: 1, path: '/photos/1.jpg' }],
      };
      const onSetProfilePhoto = jasmine.createSpy('onSetProfilePhoto');
      let capturedArgs;
      spyOn(CharacterPhotosPreviewHelper, 'render').and.callFake((...args) => {
        capturedArgs = args;
        return null;
      });

      renderToStaticMarkup(CharacterHelper.render(withPhotos, '#/games/demo/pcs', { onSetProfilePhoto }));

      const [, , , , canSetProfilePhoto, profilePhotoId, setProfilePhotoHandler] = capturedArgs;
      expect(canSetProfilePhoto).toBe(true);
      expect(profilePhotoId).toBe(999);
      expect(setProfilePhotoHandler).toBe(onSetProfilePhoto);
    });

    it('renders a see all link to the pcs photos page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: true, photos: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/photos"');
    });

    it('renders a see all link to the npcs photos page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: false, photos: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/photos"');
    });
  });
});
