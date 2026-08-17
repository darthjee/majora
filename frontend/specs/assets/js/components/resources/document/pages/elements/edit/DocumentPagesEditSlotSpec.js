import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPagesEditSlot
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/edit/DocumentPagesEditSlot.jsx';
import DocumentPagesEditSlotHelper
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/edit/helpers/DocumentPagesEditSlotHelper.jsx';

// `DocumentPagesEditSlot` is a pure prop-remapping wrapper delegating entirely to
// `DocumentPagesEditSlotHelper.render`, mirroring `CharacterDocumentPagesBoxSpec.js`'s own shallow
// conventions — this spec spies on the helper to assert the remapping from `ShowPageLayout`'s
// merged, snake_case (`game_slug`) context into the helper's own `box`/`save` argument shape.
describe('DocumentPagesEditSlot', function() {
  const renderSlot = (props) => {
    let capturedBox;
    let capturedSave;

    spyOn(DocumentPagesEditSlotHelper, 'render').and.callFake((box, save) => {
      capturedBox = box;
      capturedSave = save;
      return React.createElement('div', null, 'document-pages-edit-slot');
    });

    renderToStaticMarkup(React.createElement(DocumentPagesEditSlot, props));

    return { box: capturedBox, save: capturedSave };
  };

  it('remaps game_slug to gameSlug and forwards id/canEditPages/pagesRef', function() {
    const pagesRef = { current: null };
    const { box } = renderSlot({
      game_slug: 'demo', id: 5, canEditPages: true, pagesRef,
    });

    expect(box).toEqual({
      gameSlug: 'demo', id: 5, canEditPages: true, pagesRef,
    });
  });

  it('defaults canEditPages to false when not given', function() {
    const { box } = renderSlot({ game_slug: 'demo', id: 5 });

    expect(box.canEditPages).toBe(false);
  });

  it('defaults saveStatus to idle and the save handlers to no-ops', function() {
    const { save } = renderSlot({ game_slug: 'demo', id: 5 });

    expect(save.saveStatus).toBe('idle');
    expect(() => save.onSave()).not.toThrow();
    expect(() => save.onRetrySave()).not.toThrow();
    expect(() => save.onSkipSave()).not.toThrow();
  });

  it('forwards saveStatus and the save handlers through unchanged', function() {
    const onSave = jasmine.createSpy('onSave');
    const onRetrySave = jasmine.createSpy('onRetrySave');
    const onSkipSave = jasmine.createSpy('onSkipSave');
    const { save } = renderSlot({
      game_slug: 'demo', id: 5, saveStatus: 'failed', onSave, onRetrySave, onSkipSave,
    });

    expect(save).toEqual({
      saveStatus: 'failed', onSave, onRetrySave, onSkipSave,
    });
  });

  it('delegates rendering to DocumentPagesEditSlotHelper', function() {
    const { box } = renderSlot({ game_slug: 'demo', id: 5 });

    expect(DocumentPagesEditSlotHelper.render).toHaveBeenCalled();
    expect(box.gameSlug).toBe('demo');
  });
});
