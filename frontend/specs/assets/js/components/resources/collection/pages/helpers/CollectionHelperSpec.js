import { renderToStaticMarkup } from 'react-dom/server';
import CollectionHelper from '../../../../../../../../assets/js/components/resources/collection/pages/helpers/CollectionHelper.jsx';
import { buildCollection } from '../../../../../../../support/factories.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('CollectionHelper', function() {
  const handlers = { onOpenUploadModal: Noop.noop };

  describe('.render', function() {
    it('renders the collection name', function() {
      const collection = buildCollection({ name: 'Goblin Pack' });
      expect(renderToStaticMarkup(CollectionHelper.render(collection, false, handlers))).toContain('Goblin Pack');
    });

    it('renders a back button to the collections index', function() {
      const html = renderToStaticMarkup(CollectionHelper.render(buildCollection(), false, handlers));
      expect(html).toContain('href="#/miniatures/collections"');
    });

    it('renders the photo', function() {
      const html = renderToStaticMarkup(
        CollectionHelper.render(buildCollection({ photo_url: 'http://example.com/photo.png' }), false, handlers),
      );
      expect(html).toContain('http://example.com/photo.png');
    });

    it('does not render a url link when url is empty', function() {
      const html = renderToStaticMarkup(CollectionHelper.render(buildCollection({ url: '' }), false, handlers));
      expect(html).not.toContain('target="_blank"');
    });

    it('renders the url as an anchor tag when present', function() {
      const collection = buildCollection({ url: 'http://example.com/collection' });
      const html = renderToStaticMarkup(CollectionHelper.render(collection, false, handlers));

      expect(html).toContain('href="http://example.com/collection"');
      expect(html).toContain('target="_blank"');
    });

    it('renders the upload button when isStaffOrSuperUser is true', function() {
      const html = renderToStaticMarkup(CollectionHelper.render(buildCollection(), true, handlers));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the upload button when isStaffOrSuperUser is false', function() {
      const html = renderToStaticMarkup(CollectionHelper.render(buildCollection(), false, handlers));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('does not render a linked source when source is null', function() {
      const html = renderToStaticMarkup(CollectionHelper.render(buildCollection({ source: null }), false, handlers));
      expect(html).not.toContain('href="#/miniatures/sources/');
    });

    it('renders the linked source, linking to the source show page, when present', function() {
      const collection = buildCollection({ source: { id: 3, name: 'MyMiniFactory' } });
      const html = renderToStaticMarkup(CollectionHelper.render(collection, false, handlers));

      expect(html).toContain('href="#/miniatures/sources/3"');
      expect(html).toContain('MyMiniFactory');
    });

    it('does not render an stl_models list when empty', function() {
      const html = renderToStaticMarkup(
        CollectionHelper.render(buildCollection({ stl_models: [] }), false, handlers),
      );
      expect(html).not.toContain('href="#/miniatures/stl_models/');
    });

    it('renders the linked stl_models list, each linking to its own show page', function() {
      const collection = buildCollection({
        stl_models: [{ id: 1, name: 'Goblin' }, { id: 2, name: 'Orc' }],
      });
      const html = renderToStaticMarkup(CollectionHelper.render(collection, false, handlers));

      expect(html).toContain('href="#/miniatures/stl_models/1"');
      expect(html).toContain('Goblin');
      expect(html).toContain('href="#/miniatures/stl_models/2"');
      expect(html).toContain('Orc');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(CollectionHelper.renderLoading())).toContain('Loading collection');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(CollectionHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
