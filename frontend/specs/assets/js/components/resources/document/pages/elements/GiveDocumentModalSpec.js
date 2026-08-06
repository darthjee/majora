import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GiveDocumentModal
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/GiveDocumentModal.jsx';
import GiveDocumentModalHelper
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/helpers/GiveDocumentModalHelper.jsx';
import GiveDocumentModalController
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController.js';

describe('GiveDocumentModal', function() {
  const document = { id: 9, hidden: false };

  // eslint-disable-next-line no-empty-function
  const neverResolves = () => new Promise(() => {});

  const renderModal = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(GiveDocumentModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'give-document-modal');
    });

    renderToStaticMarkup(React.createElement(GiveDocumentModal, {
      show: true,
      document,
      gameSlug: 'demo',
      onClose: jasmine.createSpy('onClose'),
      ...props,
    }));

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(GiveDocumentModalController.prototype, 'loadPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper', function() {
    const { state } = renderModal();

    expect(state.activeTab).toBe('pcs');
    expect(state.browse).toEqual({
      items: [], page: 1, pages: 1, loading: false, error: '',
    });
    expect(state.search).toBe('');
    expect(state.receiving).toEqual([]);
    expect(state.submitting).toBe(false);
  });

  it('exposes every handler the helper needs', function() {
    const { handlers } = renderModal();

    [
      'onTabChange', 'onSearchChange', 'onPrev', 'onNext', 'onSelectCharacter', 'onRemove',
      'onSubmit', 'onClear', 'onClose',
    ].forEach((name) => {
      expect(typeof handlers[name]).toBe('function');
    });
  });

  it('loads the previous page via the controller when onPrev is triggered', function() {
    const { handlers } = renderModal();

    handlers.onPrev();

    expect(GiveDocumentModalController.prototype.loadPage).toHaveBeenCalledWith(
      0, 'demo', 'pcs', '', jasmine.any(Function),
    );
  });

  it('loads the next page via the controller when onNext is triggered', function() {
    const { handlers } = renderModal();

    handlers.onNext();

    expect(GiveDocumentModalController.prototype.loadPage).toHaveBeenCalledWith(
      2, 'demo', 'pcs', '', jasmine.any(Function),
    );
  });

  it('adds the selected character through the controller', function() {
    spyOn(GiveDocumentModalController.prototype, 'addCharacter').and.returnValue(Promise.resolve());
    const { handlers } = renderModal();
    const character = { id: 3, name: 'Aria' };

    handlers.onSelectCharacter(character);

    expect(GiveDocumentModalController.prototype.addCharacter).toHaveBeenCalledWith(
      character, 'pcs', 'demo', 9, [], jasmine.any(Function),
    );
  });

  it('does not throw when onTabChange/onSearchChange/onClear are triggered', function() {
    const { handlers } = renderModal();

    expect(() => {
      handlers.onTabChange('npcs');
      handlers.onSearchChange('aria');
      handlers.onClear();
    }).not.toThrow();
  });

  it('does not throw when onRemove is triggered', function() {
    const { handlers } = renderModal();

    expect(() => {
      handlers.onRemove('pcs', 1);
    }).not.toThrow();
  });

  it('submits through the controller with the document id and canGiveHidden, then calls onSuccess', async function() {
    spyOn(GiveDocumentModalController.prototype, 'submit').and.returnValue(Promise.resolve());
    const onSuccess = jasmine.createSpy('onSuccess');
    const { handlers } = renderModal({ canGiveHidden: true, onSuccess });

    await handlers.onSubmit();

    expect(GiveDocumentModalController.prototype.submit).toHaveBeenCalledWith(
      [], 'demo', 9, true, jasmine.objectContaining({
        setSubmitting: jasmine.any(Function), setReceiving: jasmine.any(Function),
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('defaults canGiveHidden to false when not given', async function() {
    spyOn(GiveDocumentModalController.prototype, 'submit').and.returnValue(Promise.resolve());
    const { handlers } = renderModal();

    await handlers.onSubmit();

    expect(GiveDocumentModalController.prototype.submit).toHaveBeenCalledWith(
      [], 'demo', 9, false, jasmine.any(Object),
    );
  });

  it('forwards the onClose handler as-is', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });
});
