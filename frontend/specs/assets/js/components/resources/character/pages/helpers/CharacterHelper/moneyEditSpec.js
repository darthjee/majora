import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { character, findElement } from './support.js';

describe('CharacterHelper', function() {
  describe('.render money edit link', function() {
    it('renders the money edit button when can_edit_money is true', function() {
      const c = { ...character, can_edit_money: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('Edit money');
    });

    it('does not render the money edit button when can_edit_money is false', function() {
      const c = { ...character, can_edit_money: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('Edit money');
    });

    it('does not render the money edit button when can_edit_money is absent', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('Edit money');
    });

    it('passes onOpenMoneyModal through to CharacterMoney as the click handler', function() {
      const onOpenMoneyModal = jasmine.createSpy('onOpenMoneyModal');
      const c = { ...character, can_edit_money: true };

      const tree = CharacterHelper.render(c, '#/games/demo/pcs', { onOpenMoneyModal });
      const button = findElement(tree, (node) => node.type === 'button' && typeof node.props?.onClick === 'function');

      expect(button).not.toBeNull();
      button.props.onClick();
      expect(onOpenMoneyModal).toHaveBeenCalled();
    });
  });
});
