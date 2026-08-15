import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPagesBox
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentPagesBox.jsx';
import DocumentPagesBoxHelper
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelper.jsx';

describe('DocumentPagesBox', function() {
  const renderBox = (props = {}) => {
    let capturedState;
    let capturedRefs;
    let capturedGameSlug;
    let capturedId;

    spyOn(DocumentPagesBoxHelper, 'render').and.callFake((state, refs, gameSlug, id) => {
      capturedState = state;
      capturedRefs = refs;
      capturedGameSlug = gameSlug;
      capturedId = id;
      return React.createElement('div', null, 'document-pages-box');
    });

    renderToStaticMarkup(React.createElement(DocumentPagesBox, { game_slug: 'demo', id: 9, ...props }));

    return {
      state: capturedState, refs: capturedRefs, gameSlug: capturedGameSlug, id: capturedId,
    };
  };

  it('starts with no loaded segments before the mount effect resolves (server rendering never runs effects)',
    function() {
      const { state } = renderBox();

      expect(state).toEqual({
        segments: [], loadedPages: jasmine.any(Set), totalPages: 0, currentPage: 1,
      });
      expect(state.loadedPages.size).toBe(0);
    });

  it('forwards the game slug and document id through to the helper', function() {
    const { gameSlug, id } = renderBox({ game_slug: 'epic-quest', id: 42 });

    expect(gameSlug).toBe('epic-quest');
    expect(id).toBe(42);
  });

  it('exposes a box ref, a bottom sentinel ref, and a segment ref registrar without throwing', function() {
    const { refs } = renderBox();

    expect(refs.boxRef).toEqual(jasmine.objectContaining({ current: null }));
    expect(refs.bottomSentinelRef).toEqual(jasmine.objectContaining({ current: null }));
    expect(() => refs.registerSegmentRef(1, null)).not.toThrow();
  });

  it('delegates rendering to DocumentPagesBoxHelper', function() {
    const html = renderToStaticMarkup(React.createElement(DocumentPagesBox, { game_slug: 'demo', id: 9 }));

    expect(html).toBe('');
  });
});
