import { renderToStaticMarkup } from 'react-dom/server';
import ItemDetailHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx';
import ActionsOverlay from '../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

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

    it('defaults canEdit to false and onClick to a no-op when omitted (CharacterItem callers)', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const element = ItemDetailHelper.render(item, '#/games/demo/items');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.canEdit).toBe(false);
      expect(() => overlay.props.onClick()).not.toThrow();
    });

    it('honors an explicit canEdit and onUploadClick', function() {
      const item = { id: 5, name: 'Cloak of Elvenkind', description: '' };
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = ItemDetailHelper.render(item, '#/games/demo/items', true, onUploadClick);
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.canEdit).toBe(true);
      overlay.props.onClick();
      expect(onUploadClick).toHaveBeenCalled();
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
