import { renderToStaticMarkup } from 'react-dom/server';
import StlModelHelper from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
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

    it('does not render a races section when races is empty', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ races: [] }), false, handlers));
      expect(html).not.toContain('stl_model_page.races_label');
    });

    it('renders each race as a translated badge', function() {
      spyOn(Translator, 't').and.callThrough();
      const html = renderToStaticMarkup(
        StlModelHelper.render(buildStlModel({ races: ['elf', 'orc'] }), false, handlers),
      );

      expect(Translator.t).toHaveBeenCalledWith('stl_model_page.races_label');
      expect(Translator.t).toHaveBeenCalledWith('stl_model_page.race_elf');
      expect(Translator.t).toHaveBeenCalledWith('stl_model_page.race_orc');
      expect(html).toContain('Elf');
      expect(html).toContain('Orc');
    });

    it('does not render a roles section when roles is empty', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ roles: [] }), false, handlers));
      expect(html).not.toContain('stl_model_page.roles_label');
    });

    it('renders each role as a translated badge', function() {
      spyOn(Translator, 't').and.callThrough();
      const html = renderToStaticMarkup(
        StlModelHelper.render(buildStlModel({ roles: ['wizard', 'archer'] }), false, handlers),
      );

      expect(Translator.t).toHaveBeenCalledWith('stl_model_page.roles_label');
      expect(Translator.t).toHaveBeenCalledWith('stl_model_page.role_wizard');
      expect(Translator.t).toHaveBeenCalledWith('stl_model_page.role_archer');
      expect(html).toContain('Wizard');
      expect(html).toContain('Archer');
    });

    it('renders the translated size when set', function() {
      spyOn(Translator, 't').and.callThrough();
      renderToStaticMarkup(StlModelHelper.render(buildStlModel({ size: 'huge' }), false, handlers));

      expect(Translator.t).toHaveBeenCalledWith('stl_model_page.size_label');
      expect(Translator.t).toHaveBeenCalledWith('stl_model_page.size_huge');
    });

    it('renders "None" when size is null', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ size: null }), false, handlers));
      expect(html).toContain('None');
    });

    it('does not render a url when url is null', function() {
      const html = renderToStaticMarkup(StlModelHelper.render(buildStlModel({ url: null }), false, handlers));
      expect(html).not.toContain('stl_model_page.url_label');
    });

    it('renders url as an external link when set', function() {
      const html = renderToStaticMarkup(
        StlModelHelper.render(buildStlModel({ url: 'https://example.com/model' }), false, handlers),
      );

      expect(html).toContain('href="https://example.com/model"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noreferrer"');
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
