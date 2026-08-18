import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemDetailHelper
  from '../../../../../../../../assets/js/components/resources/common_item/pages/helpers/CommonItemDetailHelper.jsx';

describe('CommonItemDetailHelper', function() {
  describe('.render', function() {
    it('renders the common item name', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: 'Heals wounds.' };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).toContain('Healing Potion');
    });

    it('renders the common item description', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: 'Heals wounds.' };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).toContain('Heals wounds.');
    });

    it('renders the description inside the collapsible description box', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: 'Heals wounds.' };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).toContain('border rounded bg-light');
    });

    it('renders the common item price', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '', price: 500 };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).toContain('5 GP');
    });

    it('renders the common item category', function() {
      const commonItem = {
        id: 5, name: 'Healing Potion', description: '', price: 0, category: 'potion',
      };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).toContain('Potion');
    });

    it('renders the common item photo', function() {
      const commonItem = {
        id: 5, name: 'Healing Potion', description: 'Heals wounds.', photo_path: '/common_item.png',
      };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).toContain('/common_item.png');
    });

    it('renders a back button to the given href', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '' };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).toContain('href="#/games/demo/common_items"');
    });

    it('renders the hidden badge when the common item is hidden', function() {
      const commonItem = {
        id: 5, name: 'Healing Potion', description: '', hidden: true,
      };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).toContain('bi-eye-slash-fill');
    });

    it('does not render the hidden badge when the common item is not hidden', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '' };
      const html = renderToStaticMarkup(CommonItemDetailHelper.render(commonItem, '#/games/demo/common_items'));

      expect(html).not.toContain('bi-eye-slash-fill');
    });

    it('does not render the upload button when canUploadPhoto is omitted', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '' };
      const html = renderToStaticMarkup(
        CommonItemDetailHelper.render(
          commonItem, '#/games/demo/common_items', '#/games/demo/common_items/5/edit',
        ),
      );

      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the upload button when canUploadPhoto is true', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '' };
      const html = renderToStaticMarkup(
        CommonItemDetailHelper.render(
          commonItem, '#/games/demo/common_items', '#/games/demo/common_items/5/edit', false, true,
        ),
      );

      expect(html).toContain('actions-overlay-button');
    });

    it('passes canUploadPhoto and onUploadClick through to the show page layout context', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '' };
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = CommonItemDetailHelper.render(
        commonItem, '#/games/demo/common_items', '#/games/demo/common_items/5/edit', false, true, onUploadClick,
      );

      expect(element.props.context.canUploadPhoto).toBe(true);
      expect(element.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });

    it('does not render the edit button when canEdit is omitted', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '' };
      const html = renderToStaticMarkup(
        CommonItemDetailHelper.render(
          commonItem, '#/games/demo/common_items', '#/games/demo/common_items/5/edit',
        ),
      );

      expect(html).not.toContain('href="#/games/demo/common_items/5/edit"');
    });

    it('does not render the edit button when canEdit is false', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '' };
      const html = renderToStaticMarkup(
        CommonItemDetailHelper.render(
          commonItem, '#/games/demo/common_items', '#/games/demo/common_items/5/edit', false,
        ),
      );

      expect(html).not.toContain('href="#/games/demo/common_items/5/edit"');
    });

    it('renders the edit button linking to editHref when canEdit is true', function() {
      const commonItem = { id: 5, name: 'Healing Potion', description: '' };
      const html = renderToStaticMarkup(
        CommonItemDetailHelper.render(
          commonItem, '#/games/demo/common_items', '#/games/demo/common_items/5/edit', true,
        ),
      );

      expect(html).toContain('href="#/games/demo/common_items/5/edit"');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(CommonItemDetailHelper.renderLoading());
      expect(html).toContain('Loading common item...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(CommonItemDetailHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
