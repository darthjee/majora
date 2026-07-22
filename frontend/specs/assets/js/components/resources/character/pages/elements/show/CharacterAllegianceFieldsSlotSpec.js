import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { buildCharacterAllegianceFields }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterAllegianceFieldsSlot.jsx';

describe('CharacterAllegianceFieldsSlot', function() {
  const variants = {
    edit: { namespace: 'npc_edit_page', idPrefix: 'npc-edit' },
    new: { namespace: 'game_npc_new_page', idPrefix: 'game-npc-new' },
  };

  const buildHandlers = () => ({
    onAllegianceChange: jasmine.createSpy('onAllegianceChange'),
    onPublicAllegianceChange: jasmine.createSpy('onPublicAllegianceChange'),
  });

  it('renders both allegiance selects with mode-scoped ids', function() {
    const AllegianceFields = buildCharacterAllegianceFields(variants);
    const html = renderToStaticMarkup(
      React.createElement(AllegianceFields, {
        mode: 'edit', allegiance: 'ally', publicAllegiance: 'enemy', handlers: buildHandlers(),
      }),
    );

    expect(html).toContain('id="npc-edit-allegiance"');
    expect(html).toContain('id="npc-edit-public-allegiance"');
  });

  it('scopes ids/options to the new-mode namespace', function() {
    const AllegianceFields = buildCharacterAllegianceFields(variants);
    const html = renderToStaticMarkup(
      React.createElement(AllegianceFields, {
        mode: 'new', allegiance: 'neutral', publicAllegiance: 'neutral', handlers: buildHandlers(),
      }),
    );

    expect(html).toContain('id="game-npc-new-allegiance"');
    expect(html).toContain('id="game-npc-new-public-allegiance"');
  });

  it('selects the current allegiance/publicAllegiance values', function() {
    const AllegianceFields = buildCharacterAllegianceFields(variants);
    const html = renderToStaticMarkup(
      React.createElement(AllegianceFields, {
        mode: 'edit', allegiance: 'ally', publicAllegiance: 'enemy', handlers: buildHandlers(),
      }),
    );

    expect(html).toContain('<option value="ally" selected="">');
    expect(html).toContain('<option value="enemy" selected="">');
  });
});
