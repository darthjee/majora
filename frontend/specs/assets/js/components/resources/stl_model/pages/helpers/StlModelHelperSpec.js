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
      expect(html).toContain('href="#/stl_models"');
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
