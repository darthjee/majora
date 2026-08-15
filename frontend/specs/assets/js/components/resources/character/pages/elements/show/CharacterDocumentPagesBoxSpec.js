import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentPagesBox
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentPagesBox.jsx';
import DocumentPagesBoxHelper
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelper.jsx';

// `CharacterDocumentPagesBox` is a pure prop-remapping wrapper around `DocumentPagesBox`: it has
// no fetch effect, controller, or helper of its own, so there is nothing to wait on server-side —
// `DocumentPagesBox` itself synchronously delegates to `DocumentPagesBoxHelper.render` on every
// render (see `DocumentPagesBoxSpec.js`), which this spec spies on to assert the remapping.
describe('CharacterDocumentPagesBox', function() {
  const renderBox = (props) => {
    let capturedGameSlug;
    let capturedId;

    spyOn(DocumentPagesBoxHelper, 'render').and.callFake((state, refs, gameSlug, id) => {
      capturedGameSlug = gameSlug;
      capturedId = id;
      return React.createElement('div', null, 'character-document-pages-box');
    });

    renderToStaticMarkup(React.createElement(CharacterDocumentPagesBox, props));

    return { gameSlug: capturedGameSlug, id: capturedId };
  };

  it('renders DocumentPagesBox with id set from game_document_id, not the CharacterDocument id', function() {
    const { id } = renderBox({
      game_slug: 'demo', id: 3, game_document_id: 42,
    });

    expect(id).toBe(42);
  });

  it('passes game_slug through unchanged', function() {
    const { gameSlug } = renderBox({
      game_slug: 'epic-quest', id: 3, game_document_id: 42,
    });

    expect(gameSlug).toBe('epic-quest');
  });
});
