import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyFieldHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyFieldHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterMoneyFieldHelper', function() {
  describe('.render', function() {
    it('returns null when isFullEditor is false', function() {
      expect(
        CharacterMoneyFieldHelper.render(false, 'Money', 310, 0, 'dnd', 'Edit money', Noop.noop, [])
      ).toBeNull();
    });

    it('renders the label and money breakdown', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', 310, 0, 'dnd', 'Edit money', Noop.noop, [])
      );
      expect(html).toContain('Money');
      expect(html).toContain('coin-box-cp');
      expect(html).toContain('20');
    });

    it('renders the edit money button', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', 0, 0, 'dnd', 'Edit money', Noop.noop, [])
      );
      expect(html).toContain('Edit money');
    });

    it('renders field errors', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', 0, 0, 'dnd', 'Edit money', Noop.noop, ['must be positive'])
      );
      expect(html).toContain('must be positive');
    });

    it('coerces a falsy money value to 0', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', undefined, 0, 'dnd', 'Edit money', Noop.noop, [])
      );
      expect(html).toContain('coin-box-cp');
      expect(html).toContain('>0<');
    });

    it('forwards treasureValue into the money breakdown', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyFieldHelper.render(true, 'Money', 0, 2020, 'dnd', 'Edit money', Noop.noop, [])
      );
      expect(html).toContain('coin-box-treasure');
      expect(html).toContain('2 SP | 20 GP');
      expect(html).toContain('in Gems');
    });
  });
});
