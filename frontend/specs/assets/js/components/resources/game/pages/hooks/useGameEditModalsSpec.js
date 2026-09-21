import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useGameEditModals, { buildModalCallbacks }
  from '../../../../../../../../assets/js/components/resources/game/pages/hooks/useGameEditModals.js';

/**
 * Minimal component exercising `useGameEditModals`, capturing what the hook returns.
 *
 * @param {object} props - Component props.
 * @param {object} props.controller - Controller passed through to the hook.
 * @param {Function} props.setLinks - Links setter passed through to the hook.
 * @param {Function} props.onResult - Callback invoked with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ controller, setLinks, onResult }) {
  onResult(useGameEditModals(controller, setLinks));
  return React.createElement('div', null, 'ok');
}

describe('useGameEditModals', function() {
  let result;

  beforeEach(function() {
    const controller = { buildEffect: jasmine.createSpy('buildEffect') };
    const setLinks = jasmine.createSpy('setLinks');

    renderToStaticMarkup(React.createElement(TestHost, {
      controller, setLinks, onResult: (value) => { result = value; },
    }));
  });

  it('starts with both modals hidden', function() {
    expect(result.modalProps.showUploadModal).toBe(false);
    expect(result.modalProps.showLinksModal).toBe(false);
  });

  it('exposes the callbacks expected by GameEditModals', function() {
    expect(Object.keys(result.modalProps).sort()).toEqual([
      'onLinksClose',
      'onLinksConfirm',
      'onUploadClose',
      'onUploadSuccess',
      'showLinksModal',
      'showUploadModal',
    ]);
  });

  it('exposes the modal openers', function() {
    expect(result.onOpenUploadModal).toEqual(jasmine.any(Function));
    expect(result.onOpenLinksModal).toEqual(jasmine.any(Function));
  });
});

describe('buildModalCallbacks', function() {
  let controller, reload, setLinks, setShowUploadModal, setShowLinksModal, callbacks;

  beforeEach(function() {
    reload = jasmine.createSpy('reload');
    controller = { buildEffect: jasmine.createSpy('buildEffect').and.returnValue(reload) };
    setLinks = jasmine.createSpy('setLinks');
    setShowUploadModal = jasmine.createSpy('setShowUploadModal');
    setShowLinksModal = jasmine.createSpy('setShowLinksModal');

    callbacks = buildModalCallbacks({
      controller, setLinks, setShowUploadModal, setShowLinksModal,
    });
  });

  it('opens the upload modal', function() {
    callbacks.onOpenUploadModal();

    expect(setShowUploadModal).toHaveBeenCalledWith(true);
  });

  it('opens the links modal', function() {
    callbacks.onOpenLinksModal();

    expect(setShowLinksModal).toHaveBeenCalledWith(true);
  });

  it('closes the upload modal', function() {
    callbacks.onUploadClose();

    expect(setShowUploadModal).toHaveBeenCalledWith(false);
  });

  it('closes the links modal', function() {
    callbacks.onLinksClose();

    expect(setShowLinksModal).toHaveBeenCalledWith(false);
  });

  describe('when the upload succeeds', function() {
    beforeEach(function() {
      callbacks.onUploadSuccess();
    });

    it('closes the upload modal', function() {
      expect(setShowUploadModal).toHaveBeenCalledWith(false);
    });

    it('re-runs the controller effect', function() {
      expect(reload).toHaveBeenCalled();
    });
  });

  describe('when the links are confirmed', function() {
    beforeEach(function() {
      callbacks.onLinksConfirm([{ url: 'http://example.com' }]);
    });

    it('sets the links', function() {
      expect(setLinks).toHaveBeenCalledWith([{ url: 'http://example.com' }]);
    });

    it('closes the links modal', function() {
      expect(setShowLinksModal).toHaveBeenCalledWith(false);
    });
  });
});
