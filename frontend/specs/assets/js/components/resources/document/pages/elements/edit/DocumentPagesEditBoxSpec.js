import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPagesEditBox
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/edit/DocumentPagesEditBox.jsx';
import DocumentPagesEditBoxHelper
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/edit/helpers/DocumentPagesEditBoxHelper.jsx';
import DocumentPagesEditBoxController
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/edit/controllers/DocumentPagesEditBoxController.js';

// `DocumentPagesEditBox` is a thin, self-contained state owner delegating entirely to
// `DocumentPagesEditBoxHelper` (rendering) and `DocumentPagesEditBoxController` (data/save saga) —
// this spec spies on both to assert wiring, mirroring `DocumentPagesBoxSpec.js`'s own shallow
// conventions. Its exposed imperative `save()` handle (via `forwardRef`/`useImperativeHandle`) is
// only observable once actually mounted (its factory runs as a layout effect, which never fires
// under `renderToStaticMarkup`); `DocumentPagesEditBoxControllerSpec.js` covers the save saga logic
// itself in full.
describe('DocumentPagesEditBox', function() {
  const renderBox = (props = {}) => {
    let capturedState;
    let capturedCanEditPages;
    let capturedHandlers;
    let capturedGameSlug;
    let capturedId;

    spyOn(DocumentPagesEditBoxHelper, 'render').and.callFake((state, canEditPages, handlers, gameSlug, id) => {
      capturedState = state;
      capturedCanEditPages = canEditPages;
      capturedHandlers = handlers;
      capturedGameSlug = gameSlug;
      capturedId = id;
      return React.createElement('div', null, 'document-pages-edit-box');
    });

    renderToStaticMarkup(React.createElement(DocumentPagesEditBox, { gameSlug: 'demo', id: 9, ...props }));

    return {
      state: capturedState,
      canEditPages: capturedCanEditPages,
      handlers: capturedHandlers,
      gameSlug: capturedGameSlug,
      id: capturedId,
    };
  };

  it('starts read-only, not loading, with an empty value', function() {
    const { state } = renderBox();

    expect(state).toEqual({ editMode: false, loading: false, value: '' });
  });

  it('defaults canEditPages to false', function() {
    const { canEditPages } = renderBox();

    expect(canEditPages).toBe(false);
  });

  it('forwards canEditPages through to the helper', function() {
    const { canEditPages } = renderBox({ canEditPages: true });

    expect(canEditPages).toBe(true);
  });

  it('exposes onChange/onCancel handlers that do not throw when invoked', function() {
    const { handlers } = renderBox();

    expect(() => handlers.onChange({ target: { value: 'x' } })).not.toThrow();
    expect(() => handlers.onCancel()).not.toThrow();
  });

  it('calls the controller\'s loadAllPages (seeding the textarea) when onEdit is invoked', function() {
    const loadAllPagesSpy = spyOn(DocumentPagesEditBoxController.prototype, 'loadAllPages')
      .and.returnValue(Promise.resolve({ pages: [], content: '' }));
    const { handlers } = renderBox({ gameSlug: 'epic-quest', id: 42 });

    handlers.onEdit();

    expect(loadAllPagesSpy).toHaveBeenCalled();
  });

  it('forwards gameSlug/id through to the helper (for the past-threshold counter link)', function() {
    const { gameSlug, id } = renderBox({ gameSlug: 'epic-quest', id: 42 });

    expect(gameSlug).toBe('epic-quest');
    expect(id).toBe(42);
  });

  it('delegates rendering to DocumentPagesEditBoxHelper', function() {
    const html = renderToStaticMarkup(React.createElement(DocumentPagesEditBox, { gameSlug: 'demo', id: 9 }));

    expect(html).toBe('');
  });
});
