import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasureHelper
  from '../../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasureHelper.jsx';
import { buildTreasure } from '../../../../../../../support/factories.js';

describe('GameTreasureHelper', function() {
  const backHref = '#/games/demo/treasures';
  const editHref = '#/games/demo/treasures/42/edit';
  const treasure = buildTreasure({ id: 42 });

  describe('.render', function() {
    it('renders the treasure name', function() {
      expect(renderToStaticMarkup(GameTreasureHelper.render(treasure, backHref, editHref))).toContain('Golden Crown');
    });

    it('renders the treasure value as a coin breakdown', function() {
      expect(renderToStaticMarkup(GameTreasureHelper.render(treasure, backHref, editHref))).toContain('5 GP');
    });

    it('renders a back button to the given href', function() {
      const html = renderToStaticMarkup(GameTreasureHelper.render(treasure, backHref, editHref));
      expect(html).toContain('href="#/games/demo/treasures"');
    });

    it('renders an edit link when can_edit is true', function() {
      const html = renderToStaticMarkup(GameTreasureHelper.render({ ...treasure, can_edit: true }, backHref, editHref));
      expect(html).toContain('href="#/games/demo/treasures/42/edit"');
    });

    it('does not render an edit link when can_edit is false', function() {
      const html = renderToStaticMarkup(GameTreasureHelper.render({ ...treasure, can_edit: false }, backHref, editHref));
      expect(html).not.toContain('/edit');
    });

    it('renders the give-treasure button unconditionally, regardless of can_edit', function() {
      const html = renderToStaticMarkup(GameTreasureHelper.render(treasure, backHref, editHref));
      expect(html).toContain('Give Treasure');
    });

    it('invokes onGiveTreasureClick when the give-treasure button is clicked', function() {
      const onGiveTreasureClick = jasmine.createSpy('onGiveTreasureClick');
      const element = GameTreasureHelper.render(treasure, backHref, editHref, onGiveTreasureClick);
      const giveTreasureButton = element.props.children[4];

      giveTreasureButton.props.onClick();

      expect(onGiveTreasureClick).toHaveBeenCalled();
    });

    it('renders the availability line when max_units is set', function() {
      const html = renderToStaticMarkup(
        GameTreasureHelper.render({ ...treasure, available_units: 3, max_units: 10 }, backHref, editHref),
      );
      expect(html).toContain('Available: 3 / 10');
    });

    it('does not render the availability line when max_units is null', function() {
      const html = renderToStaticMarkup(
        GameTreasureHelper.render({ ...treasure, available_units: null, max_units: null }, backHref, editHref),
      );
      expect(html).not.toContain('Available:');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameTreasureHelper.renderLoading())).toContain('Loading treasure');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(GameTreasureHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
