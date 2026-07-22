import { renderToStaticMarkup } from 'react-dom/server';
import GameTypeSelect
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameTypeSelect.jsx';

describe('GameTypeSelect', function() {
  const buildProps = (overrides = {}) => ({
    gameType: 'dnd',
    handlers: { onGameTypeChange: jasmine.createSpy('onGameTypeChange') },
    ...overrides,
  });

  it('renders both game type options', function() {
    const html = renderToStaticMarkup(GameTypeSelect(buildProps()));

    expect(html).toContain('<option value="dnd" selected="">D&amp;D</option>');
    expect(html).toContain('<option value="deadlands">Deadlands</option>');
  });

  it('selects the current game type value', function() {
    const html = renderToStaticMarkup(GameTypeSelect(buildProps({ gameType: 'deadlands' })));

    expect(html).toContain('<option value="deadlands" selected="">Deadlands</option>');
  });

  it('calls onGameTypeChange when the selection changes', function() {
    const handlers = { onGameTypeChange: jasmine.createSpy('onGameTypeChange') };
    const element = GameTypeSelect(buildProps({ handlers }));
    const changeEvent = { target: { value: 'deadlands' } };

    element.props.children[1].props.onChange(changeEvent);

    expect(handlers.onGameTypeChange).toHaveBeenCalledWith(changeEvent);
  });
});
