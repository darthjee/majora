import { renderToStaticMarkup } from 'react-dom/server';
import PossessionDetailHelper
  from '../../../../../../../../assets/js/components/resources/possession/pages/helpers/PossessionDetailHelper.jsx';

describe('PossessionDetailHelper', function() {
  describe('.render', function() {
    it('renders the possession name', function() {
      const possession = { id: 5, name: 'Old Tavern', description: 'A cozy roadside tavern.' };
      const html = renderToStaticMarkup(PossessionDetailHelper.render(possession, '#/games/demo/possessions'));

      expect(html).toContain('Old Tavern');
    });

    it('renders the possession description', function() {
      const possession = { id: 5, name: 'Old Tavern', description: 'A cozy roadside tavern.' };
      const html = renderToStaticMarkup(PossessionDetailHelper.render(possession, '#/games/demo/possessions'));

      expect(html).toContain('A cozy roadside tavern.');
    });

    it('renders the description inside the collapsible description box', function() {
      const possession = { id: 5, name: 'Old Tavern', description: 'A cozy roadside tavern.' };
      const html = renderToStaticMarkup(PossessionDetailHelper.render(possession, '#/games/demo/possessions'));

      expect(html).toContain('border rounded bg-light');
    });

    it('renders the possession photo', function() {
      const possession = {
        id: 5, name: 'Old Tavern', description: 'A cozy roadside tavern.', photo_path: '/possession.png',
      };
      const html = renderToStaticMarkup(PossessionDetailHelper.render(possession, '#/games/demo/possessions'));

      expect(html).toContain('/possession.png');
    });

    it('renders a back button to the given href', function() {
      const possession = { id: 5, name: 'Old Tavern', description: '' };
      const html = renderToStaticMarkup(PossessionDetailHelper.render(possession, '#/games/demo/possessions'));

      expect(html).toContain('href="#/games/demo/possessions"');
    });

    it('renders the hidden badge when the possession is hidden', function() {
      const possession = {
        id: 5, name: 'Old Tavern', description: '', hidden: true,
      };
      const html = renderToStaticMarkup(PossessionDetailHelper.render(possession, '#/games/demo/possessions'));

      expect(html).toContain('bi-eye-slash-fill');
    });

    it('does not render the hidden badge when the possession is not hidden', function() {
      const possession = { id: 5, name: 'Old Tavern', description: '' };
      const html = renderToStaticMarkup(PossessionDetailHelper.render(possession, '#/games/demo/possessions'));

      expect(html).not.toContain('bi-eye-slash-fill');
    });

    it('does not render the upload button when canUploadPhoto is omitted', function() {
      const possession = { id: 5, name: 'Old Tavern', description: '' };
      const html = renderToStaticMarkup(
        PossessionDetailHelper.render(possession, '#/games/demo/possessions', '#/games/demo/possessions/5/edit'),
      );

      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the upload button when canUploadPhoto is true', function() {
      const possession = { id: 5, name: 'Old Tavern', description: '' };
      const html = renderToStaticMarkup(
        PossessionDetailHelper.render(
          possession, '#/games/demo/possessions', '#/games/demo/possessions/5/edit', false, true,
        ),
      );

      expect(html).toContain('actions-overlay-button');
    });

    it('passes canUploadPhoto and onUploadClick through to the show page layout context', function() {
      const possession = { id: 5, name: 'Old Tavern', description: '' };
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = PossessionDetailHelper.render(
        possession, '#/games/demo/possessions', '#/games/demo/possessions/5/edit', false, true, onUploadClick,
      );

      expect(element.props.context.canUploadPhoto).toBe(true);
      expect(element.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });

    it('does not render the edit button when canEdit is omitted', function() {
      const possession = { id: 5, name: 'Old Tavern', description: '' };
      const html = renderToStaticMarkup(
        PossessionDetailHelper.render(possession, '#/games/demo/possessions', '#/games/demo/possessions/5/edit'),
      );

      expect(html).not.toContain('href="#/games/demo/possessions/5/edit"');
    });

    it('does not render the edit button when canEdit is false', function() {
      const possession = { id: 5, name: 'Old Tavern', description: '' };
      const html = renderToStaticMarkup(
        PossessionDetailHelper.render(
          possession, '#/games/demo/possessions', '#/games/demo/possessions/5/edit', false,
        ),
      );

      expect(html).not.toContain('href="#/games/demo/possessions/5/edit"');
    });

    it('renders the edit button linking to editHref when canEdit is true', function() {
      const possession = { id: 5, name: 'Old Tavern', description: '' };
      const html = renderToStaticMarkup(
        PossessionDetailHelper.render(
          possession, '#/games/demo/possessions', '#/games/demo/possessions/5/edit', true,
        ),
      );

      expect(html).toContain('href="#/games/demo/possessions/5/edit"');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(PossessionDetailHelper.renderLoading());
      expect(html).toContain('Loading possession...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(PossessionDetailHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
