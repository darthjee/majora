import { renderToStaticMarkup } from 'react-dom/server';
import CharacterAvatarFieldHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarFieldHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterAvatarFieldHelper', function() {
  describe('.render', function() {
    it('renders the default avatar when url is null', function() {
      const html = renderToStaticMarkup(CharacterAvatarFieldHelper.render(null, 'Aragorn', true, Noop.noop));
      expect(html).toContain('default_character.png');
    });

    it('renders the given url when present', function() {
      const html = renderToStaticMarkup(
        CharacterAvatarFieldHelper.render('http://example.com/avatar.png', 'Aragorn', true, Noop.noop)
      );
      expect(html).toContain('http://example.com/avatar.png');
    });

    it('renders the upload button when canEdit is true', function() {
      const html = renderToStaticMarkup(CharacterAvatarFieldHelper.render(null, 'Aragorn', true, Noop.noop));
      expect(html).toContain('actions-overlay-button');
    });

    it('renders no upload button when canEdit is false', function() {
      const html = renderToStaticMarkup(CharacterAvatarFieldHelper.render(null, 'Aragorn', false));
      expect(html).not.toContain('actions-overlay-button');
    });
  });
});
