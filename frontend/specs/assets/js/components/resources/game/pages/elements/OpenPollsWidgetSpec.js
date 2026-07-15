import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OpenPollsWidget
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/OpenPollsWidget.jsx';

describe('OpenPollsWidget', function() {
  it('renders nothing when the user is not a DM, player, superuser, or staff', function() {
    const html = renderToStaticMarkup(
      React.createElement(OpenPollsWidget, {
        game: {
          game_slug: 'demo', is_dm: false, is_player: false, is_superuser: false, is_staff: false,
        },
      }),
    );

    expect(html).toBe('');
  });

  it('renders the widget for a DM', function() {
    const html = renderToStaticMarkup(
      React.createElement(OpenPollsWidget, { game: { game_slug: 'demo', is_dm: true } }),
    );

    expect(html).toContain('data-testid="open-polls-widget"');
    expect(html).toContain('href="#/games/demo/polls"');
  });

  it('renders the widget for a player', function() {
    const html = renderToStaticMarkup(
      React.createElement(OpenPollsWidget, { game: { game_slug: 'demo', is_player: true } }),
    );

    expect(html).toContain('data-testid="open-polls-widget"');
  });

  it('renders the widget for a superuser', function() {
    const html = renderToStaticMarkup(
      React.createElement(OpenPollsWidget, { game: { game_slug: 'demo', is_superuser: true } }),
    );

    expect(html).toContain('data-testid="open-polls-widget"');
  });

  it('renders the widget for staff', function() {
    const html = renderToStaticMarkup(
      React.createElement(OpenPollsWidget, { game: { game_slug: 'demo', is_staff: true } }),
    );

    expect(html).toContain('data-testid="open-polls-widget"');
  });

  it('shows a loading placeholder before the effect resolves', function() {
    const html = renderToStaticMarkup(
      React.createElement(OpenPollsWidget, { game: { game_slug: 'demo', is_dm: true } }),
    );

    expect(html).toContain('data-testid="open-polls-loading"');
  });
});
