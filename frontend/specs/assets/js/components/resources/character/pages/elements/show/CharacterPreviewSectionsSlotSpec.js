import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPreviewSectionsSlot
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPreviewSectionsSlot.jsx';

describe('CharacterPreviewSectionsSlot', function() {
  it('renders the treasures, items, and documents preview sections', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPreviewSectionsSlot, {
        game_slug: 'demo', id: 7, is_pc: true, game_type: 'dnd',
      }),
    );

    expect(html).toContain('Treasures');
    expect(html).toContain('Items');
    expect(html).toContain('Documents');
  });

  it('links to the pcs preview pages for a PC', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPreviewSectionsSlot, {
        game_slug: 'demo', id: 7, is_pc: true,
      }),
    );

    expect(html).toContain('href="#/games/demo/pcs/7/treasures"');
    expect(html).toContain('href="#/games/demo/pcs/7/items"');
    expect(html).toContain('href="#/games/demo/pcs/7/documents"');
  });

  it('links to the npcs preview pages for an NPC', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPreviewSectionsSlot, {
        game_slug: 'demo', id: 7, is_pc: false,
      }),
    );

    expect(html).toContain('href="#/games/demo/npcs/7/treasures"');
    expect(html).toContain('href="#/games/demo/npcs/7/items"');
    expect(html).toContain('href="#/games/demo/npcs/7/documents"');
  });

  it('renders the given treasures/items/documents', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPreviewSectionsSlot, {
        game_slug: 'demo',
        id: 7,
        is_pc: true,
        game_type: 'dnd',
        treasures: [{
          id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 1, value: 50,
        }],
        items: [{ id: 1, game_item_id: 9, name: 'Cloak of Elvenkind' }],
        documents: [{ id: 1, game_document_id: 9, name: 'Ancient Tome' }],
      }),
    );

    expect(html).toContain('Potion of Healing');
    expect(html).toContain('Cloak of Elvenkind');
    expect(html).toContain('Ancient Tome');
  });
});
