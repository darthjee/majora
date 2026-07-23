import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDmNotesFieldHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterDmNotesFieldHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterDmNotesFieldHelper', function() {
  describe('.render', function() {
    it('returns null when isFullEditor is false', function() {
      expect(
        CharacterDmNotesFieldHelper.render(false, 'npc-edit-private-description', 'DM Notes', '', Noop.noop, [])
      ).toBeNull();
    });

    it('renders the DM notes markdown editor with the given id, label and value', function() {
      const html = renderToStaticMarkup(
        CharacterDmNotesFieldHelper.render(
          true, 'npc-edit-private-description', 'DM Notes', 'Secret DM notes.', Noop.noop, []
        )
      );
      expect(html).toContain('id="npc-edit-private-description"');
      expect(html).toContain('Secret DM notes.');
    });

    it('renders field errors', function() {
      const html = renderToStaticMarkup(
        CharacterDmNotesFieldHelper.render(
          true, 'npc-edit-private-description', 'DM Notes', '', Noop.noop, ['must not be blank']
        )
      );
      expect(html).toContain('must not be blank');
    });
  });
});
