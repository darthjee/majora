import { renderToStaticMarkup } from 'react-dom/server';
import GameHeading
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameHeading.jsx';

describe('GameHeading', function() {
  describe('.Show', function() {
    it('renders the game name as the heading', function() {
      expect(renderToStaticMarkup(GameHeading.Show({ name: 'Epic Quest' }))).toBe('<h1>Epic Quest</h1>');
    });
  });

  describe('.New', function() {
    it('renders the static new-game title', function() {
      expect(renderToStaticMarkup(GameHeading.New({ status: 'idle' }))).toContain('New Game');
    });

    it('renders an error alert when status is error', function() {
      const html = renderToStaticMarkup(GameHeading.New({ status: 'error' }));

      expect(html).toContain('Failed to create game. Please try again.');
    });

    it('renders no error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameHeading.New({ status: 'idle' }));

      expect(html).not.toContain('Failed to create game.');
    });
  });

  describe('.Edit', function() {
    it('renders the static edit-game title', function() {
      expect(renderToStaticMarkup(GameHeading.Edit({ status: 'idle' }))).toContain('Edit game');
    });

    it('renders an error alert when status is error', function() {
      const html = renderToStaticMarkup(GameHeading.Edit({ status: 'error' }));

      expect(html).toContain('Failed to save game. Please try again.');
    });

    it('renders no error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameHeading.Edit({ status: 'idle' }));

      expect(html).not.toContain('Failed to save game.');
    });
  });
});
