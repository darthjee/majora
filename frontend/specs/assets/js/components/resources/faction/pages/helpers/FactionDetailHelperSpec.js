import { renderToStaticMarkup } from 'react-dom/server';
import FactionDetailHelper
  from '../../../../../../../../assets/js/components/resources/faction/pages/helpers/FactionDetailHelper.jsx';

describe('FactionDetailHelper', function() {
  describe('.render', function() {
    it('renders the faction name', function() {
      const faction = { id: 5, name: 'The Silver Hand' };
      const html = renderToStaticMarkup(FactionDetailHelper.render(faction, '#/games/demo/factions'));

      expect(html).toContain('The Silver Hand');
    });

    it('renders the faction photo', function() {
      const faction = { id: 5, name: 'The Silver Hand', photo_path: '/faction.png' };
      const html = renderToStaticMarkup(FactionDetailHelper.render(faction, '#/games/demo/factions'));

      expect(html).toContain('/faction.png');
    });

    it('renders a back button to the given href', function() {
      const faction = { id: 5, name: 'The Silver Hand' };
      const html = renderToStaticMarkup(FactionDetailHelper.render(faction, '#/games/demo/factions'));

      expect(html).toContain('href="#/games/demo/factions"');
    });

    it('does not render the upload button when canUploadPhoto is omitted', function() {
      const faction = { id: 5, name: 'The Silver Hand' };
      const html = renderToStaticMarkup(
        FactionDetailHelper.render(faction, '#/games/demo/factions', '#/games/demo/factions/5/edit'),
      );

      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the upload button when canUploadPhoto is true', function() {
      const faction = { id: 5, name: 'The Silver Hand' };
      const html = renderToStaticMarkup(
        FactionDetailHelper.render(
          faction, '#/games/demo/factions', '#/games/demo/factions/5/edit', false, true,
        ),
      );

      expect(html).toContain('actions-overlay-button');
    });

    it('passes canUploadPhoto and onUploadClick through to the show page layout context', function() {
      const faction = { id: 5, name: 'The Silver Hand' };
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = FactionDetailHelper.render(
        faction, '#/games/demo/factions', '#/games/demo/factions/5/edit', false, true, onUploadClick,
      );

      expect(element.props.context.canUploadPhoto).toBe(true);
      expect(element.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });

    it('does not render the edit button when canEdit is omitted', function() {
      const faction = { id: 5, name: 'The Silver Hand' };
      const html = renderToStaticMarkup(
        FactionDetailHelper.render(faction, '#/games/demo/factions', '#/games/demo/factions/5/edit'),
      );

      expect(html).not.toContain('href="#/games/demo/factions/5/edit"');
    });

    it('does not render the edit button when canEdit is false', function() {
      const faction = { id: 5, name: 'The Silver Hand' };
      const html = renderToStaticMarkup(
        FactionDetailHelper.render(
          faction, '#/games/demo/factions', '#/games/demo/factions/5/edit', false,
        ),
      );

      expect(html).not.toContain('href="#/games/demo/factions/5/edit"');
    });

    it('renders the edit button linking to editHref when canEdit is true', function() {
      const faction = { id: 5, name: 'The Silver Hand' };
      const html = renderToStaticMarkup(
        FactionDetailHelper.render(
          faction, '#/games/demo/factions', '#/games/demo/factions/5/edit', true,
        ),
      );

      expect(html).toContain('href="#/games/demo/factions/5/edit"');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(FactionDetailHelper.renderLoading());
      expect(html).toContain('Loading faction...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(FactionDetailHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
