import { renderToStaticMarkup } from 'react-dom/server';
import CharacterRoleFieldHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterRoleFieldHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterRoleFieldHelper', function() {
  describe('.render', function() {
    it('returns null when isFullEditor is false', function() {
      expect(CharacterRoleFieldHelper.render(false, 'npc-edit-role', 'Role', 'Fighter', Noop.noop, [])).toBeNull();
    });

    it('renders the role input with the given id, label and value', function() {
      const html = renderToStaticMarkup(
        CharacterRoleFieldHelper.render(true, 'npc-edit-role', 'Role', 'Fighter', Noop.noop, [])
      );
      expect(html).toContain('id="npc-edit-role"');
      expect(html).toContain('value="Fighter"');
    });

    it('renders field errors', function() {
      const html = renderToStaticMarkup(
        CharacterRoleFieldHelper.render(
          true, 'npc-edit-role', 'Role', 'Fighter', Noop.noop, ['must not be blank']
        )
      );
      expect(html).toContain('must not be blank');
    });
  });
});
