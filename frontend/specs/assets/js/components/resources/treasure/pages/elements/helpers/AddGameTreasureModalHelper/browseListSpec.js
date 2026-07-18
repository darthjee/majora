import AddGameTreasureModalHelper
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('AddGameTreasureModalHelper', function() {
  describe('.render (browse pane)', function() {
    it('renders a loading message when browsing is loading', function() {
      const state = buildState({ browse: { items: [], page: 1, pages: 1, loading: true, error: '' } });
      const element = AddGameTreasureModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Loading treasures...');
    });

    it('renders an empty message when there are no items to browse', function() {
      const element = AddGameTreasureModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('No treasures left to add.');
    });

    it('renders a browse error message', function() {
      const state = buildState({
        browse: { items: [], page: 1, pages: 1, loading: false, error: 'add_game_treasure_modal.load_error' },
      });
      const element = AddGameTreasureModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Unable to load treasures. Please try again.');
    });

    it('renders a list item for each browse item and wires onSelect', function() {
      const handlers = buildHandlers();
      const item = { id: 9, name: 'Golden Crown', value: 500, game_type: 'dnd' };
      const state = buildState({
        browse: { items: [item], page: 1, pages: 1, loading: false, error: '' },
      });
      const element = AddGameTreasureModalHelper.render(true, state, handlers);
      const button = findElement(
        element, (child) => child.type === 'button' && child.props.children?.[0]?.props?.children === 'Golden Crown'
      );

      button.props.onClick();

      expect(handlers.onSelect).toHaveBeenCalledWith(item);
    });

    it('does not render pager controls when there is only one page', function() {
      const element = AddGameTreasureModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('1 / 1');
    });

    it('renders pager controls and wires onPrev/onNext when there are multiple pages', function() {
      const handlers = buildHandlers();
      const state = buildState({
        browse: { items: [], page: 2, pages: 3, loading: false, error: '' },
      });
      const element = AddGameTreasureModalHelper.render(true, state, handlers);

      expect(JSON.stringify(element)).toContain('2 / 3');

      const prevButton = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Previous'
      );
      const nextButton = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Next'
      );

      prevButton.props.onClick();
      nextButton.props.onClick();

      expect(handlers.onPrev).toHaveBeenCalled();
      expect(handlers.onNext).toHaveBeenCalled();
    });
  });
});
