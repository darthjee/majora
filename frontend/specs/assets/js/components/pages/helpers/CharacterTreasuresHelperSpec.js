import { renderToStaticMarkup } from 'react-dom/server';
import CharacterTreasuresHelper
  from '../../../../../../assets/js/components/pages/helpers/CharacterTreasuresHelper.jsx';

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
      expect(html).not.toContain('Add Treasure');
    });

    it('renders the "Add treasure" button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(
          treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1', true
        )
      );
      expect(html).toContain('Add Treasure');
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
