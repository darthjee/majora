import { renderToStaticMarkup } from 'react-dom/server';
import GameNextSessionBlock
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameNextSessionBlock.jsx';

describe('GameNextSessionBlock', function() {
  it('renders the next session summary when present', function() {
    const html = renderToStaticMarkup(GameNextSessionBlock({
      game_slug: 'epic-quest',
      next_session: { title: 'Session 1', date: '2024-01-01' },
    }));

    expect(html).toContain('Session 1');
    expect(html).toContain('2024-01-01');
    expect(html).toContain('href="#/games/epic-quest/sessions"');
  });

  it('renders a placeholder when there is no next session', function() {
    const html = renderToStaticMarkup(GameNextSessionBlock({ game_slug: 'epic-quest', next_session: null }));

    expect(html).toContain('No upcoming session scheduled.');
  });
});
