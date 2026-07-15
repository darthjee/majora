import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDescriptionFieldHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterDescriptionFieldHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterDescriptionFieldHelper', function() {
  describe('.render', function() {
    it('renders the description textarea with the given id, label and value', function() {
      const html = renderToStaticMarkup(
        CharacterDescriptionFieldHelper.render(
          'npc-edit-description', 'Description', 'A brave warrior.', Noop.noop, []
        )
      );
      expect(html).toContain('id="npc-edit-description"');
      expect(html).toContain('A brave warrior.');
    });

    it('renders field errors', function() {
      const html = renderToStaticMarkup(
        CharacterDescriptionFieldHelper.render(
          'npc-edit-description', 'Description', '', Noop.noop, ['must not be blank']
        )
      );
      expect(html).toContain('must not be blank');
    });
  });
});
