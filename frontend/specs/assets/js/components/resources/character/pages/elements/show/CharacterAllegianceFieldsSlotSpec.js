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
    onPrivateAllegianceChange: jasmine.createSpy('onPrivateAllegianceChange'),
    onPublicAllegianceChange: jasmine.createSpy('onPublicAllegianceChange'),
  });

  it('renders both allegiance selects with mode-scoped ids for a full editor', function() {
    const AllegianceFields = buildCharacterAllegianceFields(variants);
    const html = renderToStaticMarkup(
      React.createElement(AllegianceFields, {
        mode: 'edit',
        privateAllegiance: 'ally',
        publicAllegiance: 'enemy',
        isFullEditor: true,
        handlers: buildHandlers(),
      }),
    );

    expect(html).toContain('id="npc-edit-allegiance"');
    expect(html).toContain('id="npc-edit-public-allegiance"');
  });

  it('scopes ids/options to the new-mode namespace for a full editor', function() {
    const AllegianceFields = buildCharacterAllegianceFields(variants);
    const html = renderToStaticMarkup(
      React.createElement(AllegianceFields, {
        mode: 'new',
        privateAllegiance: 'neutral',
        publicAllegiance: 'neutral',
        isFullEditor: true,
        handlers: buildHandlers(),
      }),
    );

    expect(html).toContain('id="game-npc-new-allegiance"');
    expect(html).toContain('id="game-npc-new-public-allegiance"');
  });

  it('selects the current privateAllegiance/publicAllegiance values for a full editor', function() {
    const AllegianceFields = buildCharacterAllegianceFields(variants);
    const html = renderToStaticMarkup(
      React.createElement(AllegianceFields, {
        mode: 'edit',
        privateAllegiance: 'ally',
        publicAllegiance: 'enemy',
        isFullEditor: true,
        handlers: buildHandlers(),
      }),
    );

    expect(html).toContain('<option value="ally" selected="">');
    expect(html).toContain('<option value="enemy" selected="">');
  });

  it('renders only the public allegiance select when not a full editor', function() {
    const AllegianceFields = buildCharacterAllegianceFields(variants);
    const html = renderToStaticMarkup(
      React.createElement(AllegianceFields, {
        mode: 'edit',
        privateAllegiance: 'ally',
        publicAllegiance: 'enemy',
        isFullEditor: false,
        handlers: buildHandlers(),
      }),
    );

    expect(html).not.toContain('id="npc-edit-allegiance"');
    expect(html).toContain('id="npc-edit-public-allegiance"');
  });
});
