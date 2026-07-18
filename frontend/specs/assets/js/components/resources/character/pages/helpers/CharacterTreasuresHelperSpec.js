import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterTreasuresHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterTreasuresHelper.jsx';

describe('CharacterTreasuresHelper', function() {
  const treasures = [
    { id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500 },
    { id: 2, treasure_id: 12, name: 'Silver Ring', quantity: 3, value: 50 },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders each treasure name', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('Golden Crown');
      expect(html).toContain('Silver Ring');
    });

    it('renders each treasure card linked by its underlying treasure_id', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('href="#/treasures/11"');
      expect(html).toContain('href="#/treasures/12"');
    });

    it('renders a quantity badge only for quantities greater than 1', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).not.toContain('×1');
      expect(html).toContain('×3');
    });

    it('renders a back button to the parent character page', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('href="#/games/demo/pcs/1"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('pagination');
    });

    it('does not render the "Add treasure" button when canEdit is false', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(
          treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1', false
        )
      );
      expect(html).not.toContain('Exchange Treasure');
    });

    it('renders the "Add treasure" button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(
          treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1', true
        )
      );
      expect(html).toContain('Exchange Treasure');
    });

    it('renders each treasure value using the given gameType', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(
          [{ id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 350 }],
          pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1', false, undefined, 'deadlands'
        )
      );
      expect(html).toContain('$ 3,50');
    });

    it('renders each treasure value as a dnd coin breakdown by default', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('5 GP');
    });

    it('invokes onAddTreasure when the "Add treasure" button is clicked', function() {
      const onAddTreasure = jasmine.createSpy('onAddTreasure');
      const element = CharacterTreasuresHelper.render(
        treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1', true, onAddTreasure
      );
      const button = element.props.children[0].props.children;

      button.props.onClick();

      expect(onAddTreasure).toHaveBeenCalled();
    });

    it('renders the given filter bar above the treasures grid', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(
          treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1', false, undefined, 'dnd', {},
          React.createElement('div', { 'data-testid': 'treasure-filters' }, 'filters'),
        )
      );

      expect(html).toContain('data-testid="treasure-filters"');
    });

    it('preserves active filters on pagination links', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(
          treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1', false, undefined, 'dnd',
          { name: 'sword' },
        )
      );

      expect(html).toContain('name=sword');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      const html = renderToStaticMarkup(CharacterTreasuresHelper.renderLoading());
      expect(html).toContain('Loading');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(CharacterTreasuresHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
