import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyHelper from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx';

describe('CharacterMoneyHelper', function() {
  describe('.render', function() {
    it('renders all four coin boxes, in cp/sp/gp/pp order, for a mixed remainder', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(332, 0, 'dnd'));
      const cpIndex = html.indexOf('coin-box-cp');
      const spIndex = html.indexOf('coin-box-sp');
      const gpIndex = html.indexOf('coin-box-gp');
      const ppIndex = html.indexOf('coin-box-pp');

      expect(html).toContain('22');
      expect(html).toContain('21');
      expect(html).toContain('>1<');
      expect(html).toContain('>0<');
      expect(cpIndex).toBeLessThan(spIndex);
      expect(spIndex).toBeLessThan(gpIndex);
      expect(gpIndex).toBeLessThan(ppIndex);
    });

    it('shows 0 for platinum when there is no platinum remainder', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(30, 0, 'dnd'));
      expect(html).toContain('coin-box-pp');
      expect(html).toContain('>0<');
    });

    it('lets platinum absorb all remaining value instead of a gems entry', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(32221, 0, 'dnd'));
      expect(html).toContain('coin-box-pp');
      expect(html).toContain('30');
      expect(html).not.toContain('gems');
    });

    it('absorbs the remainder into platinum for 42219', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(42219, 0, 'dnd'));
      expect(html).toContain('39');
    });

    it('absorbs the remainder into platinum for 33219', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(33219, 0, 'dnd'));
      expect(html).toContain('30');
    });

    it('renders all four coin boxes at 0 when money is 0', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(0, 0, 'dnd'));
      expect(html).toContain('coin-box-cp');
      expect(html).toContain('coin-box-sp');
      expect(html).toContain('coin-box-gp');
      expect(html).toContain('coin-box-pp');
    });

    it('renders a deadlands dollar bill box', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(350, 0, 'deadlands'));
      expect(html).toContain('character-money-bill');
      expect(html).toContain('3,50');
    });

    it('renders the deadlands dollar bill box even when money is 0', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(0, 0, 'deadlands'));
      expect(html).toContain('character-money-bill');
      expect(html).toContain('0,00');
    });

    it('does not render an edit link by default', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(310, 0, 'dnd'));
      expect(html).not.toContain('Edit money');
    });

    it('does not render an edit link when canEditMoney is false', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(310, 0, 'dnd', false));
      expect(html).not.toContain('Edit money');
    });

    it('renders an edit link beneath the breakdown when canEditMoney is true', function() {
      const html = renderToStaticMarkup(
        CharacterMoneyHelper.render(310, 0, 'dnd', true, jasmine.createSpy('onEditMoney'))
      );
      expect(html).toContain('coin-box-cp');
      expect(html).toContain('Edit money');
    });

    it('invokes onEditMoney when the edit link is clicked', function() {
      const onEditMoney = jasmine.createSpy('onEditMoney');
      const element = CharacterMoneyHelper.render(310, 0, 'dnd', true, onEditMoney);
      const fragmentChildren = element.props.children;
      const editLinkContainer = fragmentChildren[1];
      const button = editLinkContainer.props.children;

      button.props.onClick();

      expect(onEditMoney).toHaveBeenCalled();
    });

    it('forwards treasureValue into the dnd treasure coin box', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(0, 2000, 'dnd'));
      expect(html).toContain('coin-box-treasure');
      expect(html).toContain('20 GP');
      expect(html).toContain('in Gems');
    });

    it('renders nothing extra for a dnd treasureValue of 0', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(0, 0, 'dnd'));
      expect(html).not.toContain('coin-box-treasure');
    });

    it('forwards treasureValue into the deadlands treasure box', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(0, 10002, 'deadlands'));
      expect(html).toContain('character-money-bill-treasure');
      expect(html).toContain('100,02');
      expect(html).toContain('in Gems');
    });

    it('renders nothing extra for a deadlands treasureValue of 0', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(0, 0, 'deadlands'));
      expect(html).not.toContain('character-money-bill-treasure');
    });
  });
});
