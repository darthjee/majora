import { renderToStaticMarkup } from 'react-dom/server';
import StlModelHelper from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx';
import { buildStlModel } from '../../../../../../../support/factories.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('StlModelHelper', function() {
  const handlers = { onOpenUploadModal: Noop.noop };

  describe('.render', function() {
    it('renders the STL model name', function() {
      const stlModel = buildStlModel({ name: 'Goblin Miniature' });
      expect(renderToStaticMarkup(StlModelHelper.render(stlModel, false, handlers))).toContain('Goblin Miniature');
    });

    it('renders a back button to the STL models index', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel(), false, handlers));
      expect(html).toContain('href="#/miniatures/stl_models"');
    });

    it('renders the photo', function() {
      const html = renderToStaticMarkup(
        StlModelHelper.render(buildStlModel({ photo_url: 'http://example.com/photo.png' }), false, handlers),
      );
      expect(html).toContain('http://example.com/photo.png');
    });

    it('does not render a links section when there are no links', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ links: [] }), false, handlers));
      expect(html).not.toContain('Links');
    });

    it('renders links as anchor tags', function() {
      const stlModel = buildStlModel({
        links: [{
          id: 1, text: 'Thingiverse', url: 'http://example.com/thing', link_type: 'source',
        }],
      });
      const html = renderToStaticMarkup(StlModelHelper.render(stlModel, false, handlers));

      expect(html).toContain('href="http://example.com/thing"');
      expect(html).toContain('Thingiverse');
    });

    it('does not render a sources section when there are no sources', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ sources: [] }), false, handlers));
      expect(html).not.toContain('Sources');
    });

    it('renders sources', function() {
      const stlModel = buildStlModel({ sources: [{ name: 'Kickstarter Batch 3' }] });
      const html = renderToStaticMarkup(StlModelHelper.render(stlModel, false, handlers));

      expect(html).toContain('Kickstarter Batch 3');
    });

    it('does not render a collections section when there are no collections', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ collections: [] }), false, handlers));
      expect(html).not.toContain('Collections');
    });

    it('renders collections', function() {
      const stlModel = buildStlModel({ collections: [{ name: 'Dungeon Pack' }] });
      const html = renderToStaticMarkup(StlModelHelper.render(stlModel, false, handlers));

      expect(html).toContain('Dungeon Pack');
    });

    it('does not render a tags section when there are no tags', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ tags: [] }), false, handlers));
      expect(html).not.toContain('Tags');
    });

    it('renders tags as badges', function() {
      const stlModel = buildStlModel({ tags: ['goblin', 'humanoid'] });
      const html = renderToStaticMarkup(StlModelHelper.render(stlModel, false, handlers));

      expect(html).toContain('goblin');
      expect(html).toContain('humanoid');
    });

    it('renders the upload button when isStaffOrSuperUser is true', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel(), true, handlers));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the upload button when isStaffOrSuperUser is false', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel(), false, handlers));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders an "Owned" badge when owned is true', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ owned: true }), false, handlers));
      expect(html).toContain('Owned');
    });

    it('renders a "Not owned" badge when owned is false', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ owned: false }), false, handlers));
      expect(html).toContain('Not owned');
    });

    it('renders the translated type', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ type: 'prop' }), false, handlers));
      expect(html).toContain('Prop');
    });

    it('renders the translated race when set', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ race: 'elf' }), false, handlers));
      expect(html).toContain('Elf');
    });

    it('renders "None" when race is null', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ race: null }), false, handlers));
      expect(html).toContain('None');
    });

    it('renders the translated role when set', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ role: 'wizard' }), false, handlers));
      expect(html).toContain('Wizard');
    });

    it('renders "None" when role is null', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ role: null }), false, handlers));
      expect(html).toContain('None');
    });

    it('renders an Edit link to the edit page when isStaffOrSuperUser is true', function() {
      const html = renderToStaticMarkup(
        StlModelHelper.render(buildStlModel({ id: 7 }), true, handlers),
      );
      expect(html).toContain('href="#/miniatures/stl_models/7/edit"');
    });

    it('does not render an Edit link when isStaffOrSuperUser is false', function() {
      const html = renderToStaticMarkup(
        StlModelHelper.render(buildStlModel({ id: 7 }), false, handlers),
      );
      expect(html).not.toContain('href="#/miniatures/stl_models/7/edit"');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(StlModelHelper.renderLoading())).toContain('Loading STL model');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(StlModelHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
