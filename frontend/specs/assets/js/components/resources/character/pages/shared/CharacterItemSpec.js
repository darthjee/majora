import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterItem
  from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterItem.jsx';
import ItemDetailHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const loadedItem = { id: 1, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.' };

/** Stub controller that synchronously loads an item during construction. */
class LoadedController {
  constructor(characterKind, setItem, setLoading) {
    setItem(loadedItem);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously sets an error during construction. */
class ErroredController {
  constructor(characterKind, setItem, setLoading, setError) {
    setError('Unable to load item.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

[
  { label: 'pcs', characterKind: 'pcs', hash: '#/games/demo/pcs/7/items/1' },
  { label: 'npcs', characterKind: 'npcs', hash: '#/games/demo/npcs/9/items/1' },
].forEach(({ label, characterKind, hash }) => {
  describe(`CharacterItem (${label})`, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash } };
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('renders the loading state while the item is loading', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterItem, { characterKind, ControllerClass: LoadingController }),
      );

      expect(html).toContain('Loading item...');
    });

    it('renders the error state when the item fails to load', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterItem, { characterKind, ControllerClass: ErroredController }),
      );

      expect(html).toContain('Unable to load item.');
    });

    it('delegates to ItemDetailHelper.render with the item and back href', function() {
      let capturedItem;
      let capturedBackHref;
      spyOn(ItemDetailHelper, 'render').and.callFake((item, backHref) => {
        capturedItem = item;
        capturedBackHref = backHref;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterItem, { characterKind, ControllerClass: LoadedController }),
      );

      expect(capturedItem).toEqual(loadedItem);
      expect(capturedBackHref).toBe(hash.replace(/\/1$/, ''));
    });
  });
});
