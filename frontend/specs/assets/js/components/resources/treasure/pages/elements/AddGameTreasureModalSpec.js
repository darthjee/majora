import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AddGameTreasureModal, { buildLinkPayload, buildSeededFormState }
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/AddGameTreasureModal.jsx';
import AddGameTreasureModalHelper
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx';
import AddGameTreasureModalController
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/AddGameTreasureModalController.js';

describe('AddGameTreasureModal', function() {
  // eslint-disable-next-line no-empty-function
  const neverResolves = () => new Promise(() => {});

  const renderModal = (props = {}) => {
    let capturedHandlers;
    let capturedState;

    spyOn(AddGameTreasureModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(AddGameTreasureModal, {
        show: true,
        gameSlug: 'demo',
        onClose: jasmine.createSpy('onClose'),
        onSuccess: jasmine.createSpy('onSuccess'),
        ...props,
      })
    );

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(AddGameTreasureModalController.prototype, 'fetchMissingPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper', function() {
    const { state } = renderModal();

    expect(state.browse).toEqual({
      items: [], page: 1, pages: 1, loading: false, error: '',
    });
    expect(state.selected).toBeNull();
    expect(state.formState).toEqual({
      value: '', hidden: false, hasMaxUnits: false, maxUnits: '',
    });
    expect(state.submitting).toBe(false);
    expect(state.actionError).toBe('');
  });

  it('invokes onClose when the close handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('fetches the previous browse page via the controller when onPrev is triggered', function() {
    const { handlers } = renderModal();

    handlers.onPrev();

    expect(AddGameTreasureModalController.prototype.fetchMissingPage).toHaveBeenCalledWith(
      'demo', null, { page: 0, perPage: 10 }
    );
  });

  it('fetches the next browse page via the controller when onNext is triggered', function() {
    const { handlers } = renderModal();

    handlers.onNext();

    expect(AddGameTreasureModalController.prototype.fetchMissingPage).toHaveBeenCalledWith(
      'demo', null, { page: 2, perPage: 10 }
    );
  });

  it('exposes an onSelect handler', function() {
    const { handlers } = renderModal();

    expect(typeof handlers.onSelect).toBe('function');
    expect(() => handlers.onSelect({ id: 1, name: 'Sword', value: 100 })).not.toThrow();
  });

  it('exposes an onBack handler', function() {
    const { handlers } = renderModal();

    expect(typeof handlers.onBack).toBe('function');
    expect(() => handlers.onBack()).not.toThrow();
  });

  it('exposes form field change handlers', function() {
    const { handlers } = renderModal();

    expect(() => handlers.onValueChange('100')).not.toThrow();
    expect(() => handlers.onHiddenChange(true)).not.toThrow();
    expect(() => handlers.onHasMaxUnitsChange(true)).not.toThrow();
    expect(() => handlers.onMaxUnitsChange('5')).not.toThrow();
  });

  it('exposes an onSubmit handler', function() {
    const { handlers } = renderModal();

    expect(typeof handlers.onSubmit).toBe('function');
  });
});

describe('buildLinkPayload', function() {
  const selected = { id: 9, name: 'Golden Crown', value: 500 };

  it('sends max_units as null when hasMaxUnits is false', function() {
    const payload = buildLinkPayload(selected, {
      value: '500', hidden: false, hasMaxUnits: false, maxUnits: '10',
    });

    expect(payload).toEqual({
      treasure_id: 9, value: 500, hidden: false, max_units: null,
    });
  });

  it('sends max_units as a number when hasMaxUnits is true', function() {
    const payload = buildLinkPayload(selected, {
      value: '500', hidden: true, hasMaxUnits: true, maxUnits: '10',
    });

    expect(payload).toEqual({
      treasure_id: 9, value: 500, hidden: true, max_units: 10,
    });
  });
});

describe('buildSeededFormState', function() {
  it('prefills value from the item and resets hidden/max_units to their defaults', function() {
    const formState = buildSeededFormState({ id: 9, name: 'Golden Crown', value: 500 });

    expect(formState).toEqual({
      value: 500, hidden: false, hasMaxUnits: false, maxUnits: '',
    });
  });
});
