import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyFieldHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyFieldHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterMoneyFieldHelper', function() {
  describe('.render', function() {
    it('returns null when isFullEditor is false', function() {
      expect(CharacterMoneyFieldHelper.render(false, 'Money', 310, 'dnd', 'Edit money', Noop.noop, [])).toBeNull();
    });

    it('renders the label and money breakdown', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', 310, 'dnd', 'Edit money', Noop.noop, [])
      );
      expect(html).toContain('Money');
      expect(html).toContain('20 CP');
    });

    it('renders the edit money button', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', 0, 'dnd', 'Edit money', Noop.noop, [])
      );
      expect(html).toContain('Edit money');
    });

    it('renders field errors', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', 0, 'dnd', 'Edit money', Noop.noop, ['must be positive'])
      );
      expect(html).toContain('must be positive');
    });

    it('coerces a falsy money value to 0', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', undefined, 'dnd', 'Edit money', Noop.noop, [])
      );
      expect(html).not.toContain('character-money');
    });
  });
});
