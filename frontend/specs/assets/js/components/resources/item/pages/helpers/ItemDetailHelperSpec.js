import { renderToStaticMarkup } from 'react-dom/server';
import ItemDetailHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx';

describe('ItemDetailHelper', function() {
  describe('.render', function() {
    it('renders the item name', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.' };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items'));

      expect(html).toContain('Cloak of Elvenkind');
    });

    it('renders the item description', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.' };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items'));

      expect(html).toContain('A shimmering cloak.');
    });

    it('renders the description inside the collapsible description box', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.' };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items'));

      expect(html).toContain('border rounded bg-light');
    });

    it('renders the item photo', function() {
      const item = {
        id: 5, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.', photo_path: '/item.png',
      };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items'));

      expect(html).toContain('/item.png');
    });

    it('renders a back button to the given href', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items'));

      expect(html).toContain('href="#/games/demo/items"');
    });

    it('renders the hidden badge when the item is hidden', function() {
      const item = {
        id: 5, name: 'Cloak of Elvenkind', description: '', hidden: true,
      };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items'));

      expect(html).toContain('bi-eye-slash-fill');
    });

    it('does not render the hidden badge when the item is not hidden', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items'));

      expect(html).not.toContain('bi-eye-slash-fill');
    });

    it('does not render the upload button when canUploadPhoto is omitted (CharacterItem callers)', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items', '#/games/demo/items/5/edit'));

      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the upload button when canUploadPhoto is true', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const html = renderToStaticMarkup(
        ItemDetailHelper.render(item, '#/games/demo/items', '#/games/demo/items/5/edit', false, true),
      );

      expect(html).toContain('actions-overlay-button');
    });

    it('passes canUploadPhoto and onUploadClick through to the show page layout context', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = ItemDetailHelper.render(
        item, '#/games/demo/items', '#/games/demo/items/5/edit', false, true, onUploadClick,
      );

      expect(element.props.context.canUploadPhoto).toBe(true);
      expect(element.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });

    it('does not render the edit button when canEdit is omitted', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const html = renderToStaticMarkup(ItemDetailHelper.render(item, '#/games/demo/items', '#/games/demo/items/5/edit'));

      expect(html).not.toContain('href="#/games/demo/items/5/edit"');
    });

    it('does not render the edit button when canEdit is false', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const html = renderToStaticMarkup(
        ItemDetailHelper.render(item, '#/games/demo/items', '#/games/demo/items/5/edit', false),
      );

      expect(html).not.toContain('href="#/games/demo/items/5/edit"');
    });

    it('renders the edit button linking to editHref when canEdit is true', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const html = renderToStaticMarkup(
        ItemDetailHelper.render(item, '#/games/demo/items', '#/games/demo/items/5/edit', true),
      );

      expect(html).toContain('href="#/games/demo/items/5/edit"');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(ItemDetailHelper.renderLoading());
      expect(html).toContain('Loading item...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(ItemDetailHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
