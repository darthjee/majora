import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenGamesPickerHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokenGamesPickerHelper.jsx';
import MultiResourcePickerField from '../../../../../../../../../assets/js/components/common/forms/MultiResourcePickerField.jsx';

const findByType = (node, type) => {
  if (Array.isArray(node)) return node.map((child) => findByType(child, type)).find(Boolean) ?? null;
  if (!node || typeof node !== 'object') return null;
  if (node.type === type) return node;
  return findByType(node.props?.children, type);
};

describe('ApiTokenGamesPickerHelper', function() {
  const games = [{ slug: 'a', name: 'Alpha' }, { slug: 'b', name: 'Beta' }];
  const buildGames = (count) => Array.from({ length: count }, (_, index) => ({ slug: `g${index}`, name: `G${index}` }));
  const handlers = { onChange: jasmine.createSpy() };
  const build = (state) => ApiTokenGamesPickerHelper.render({
    value: [], games, allGames: false, errors: [], ...state,
  }, handlers);
  const render = (state) => renderToStaticMarkup(build(state));

  it('shows the empty note with the reachable count when nothing is selected', function() {
    const html = render();

    expect(html).toContain('data-testid="api-token-games-empty-note"');
    expect(html).toContain('all 2 games you can reach');
  });

  it('hides the empty note once a game is selected', function() {
    expect(render({ value: [games[0]] })).not.toContain('api-token-games-empty-note');
  });

  it('shows the superuser warning only when all_games is true and nothing is selected', function() {
    expect(render({ allGames: true })).toContain('alert-warning');
    expect(render({ allGames: true, value: [games[0]] })).not.toContain('alert-warning');
    expect(render({ allGames: false })).not.toContain('alert-warning');
  });

  it('shows the no-games note instead of the picker when nothing is reachable', function() {
    const html = render({ games: [] });

    expect(html).toContain('data-testid="api-token-games-none"');
    expect(html).not.toContain('api-token-games-empty-note');
    expect(findByType(build({ games: [] }), MultiResourcePickerField)).toBeNull();
  });

  it('offers only unselected games, mapped to {id, name}', function() {
    const field = findByType(build({ value: [games[0]] }), MultiResourcePickerField);

    expect(field.props.picker.values).toEqual(['b']);
    expect(field.props.picker.translateOption('b')).toBe('Beta');
    expect(field.props.value).toEqual([{ id: 'a', name: 'Alpha' }]);
  });

  it('blocks additions and shows the limit hint at 100 games', function() {
    const all = buildGames(120);
    const state = { games: all, value: all.slice(0, 100) };
    const field = findByType(build(state), MultiResourcePickerField);

    expect(field.props.picker.values).toEqual([]);
    expect(render(state)).toContain('At most 100 games can be selected.');
  });

  it('does not show the limit hint below 100 games', function() {
    expect(render()).not.toContain('api-token-games-limit');
  });

  it('renders the field errors', function() {
    expect(render({ errors: ['game_not_reachable'] })).toContain('alert-danger');
  });
});
