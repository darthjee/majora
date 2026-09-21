import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useCommonItemEditModals, { buildModalCallbacks }
  from '../../../../../../../../assets/js/components/resources/common_item/pages/hooks/useCommonItemEditModals.js';

/**
 * Minimal component exercising `useCommonItemEditModals`, capturing what the hook returns.
 *
 * @param {object} props - Component props.
 * @param {object} props.controller - Controller passed through to the hook.
 * @param {Function} props.setField - Field setter passed through to the hook.
 * @param {Function} props.onResult - Callback invoked with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ controller, setField, onResult }) {
  onResult(useCommonItemEditModals(controller, setField));
  return React.createElement('div', null, 'ok');
}

describe('useCommonItemEditModals', function() {
  let result;

  beforeEach(function() {
    renderToStaticMarkup(React.createElement(TestHost, {
      controller: { buildEffect: jasmine.createSpy('buildEffect') },
      setField: jasmine.createSpy('setField'),
      onResult: (value) => { result = value; },
    }));
  });

  it('starts with both modals hidden', function() {
    expect(result.modalProps.showUploadModal).toBe(false);
    expect(result.modalProps.showPriceModal).toBe(false);
  });

  it('exposes the callbacks expected by GameCommonItemEditModals', function() {
    expect(Object.keys(result.modalProps).sort()).toEqual([
      'onPriceClose',
      'onPriceConfirm',
      'onUploadClose',
      'onUploadSuccess',
      'showPriceModal',
      'showUploadModal',
    ]);
  });

  it('exposes the modal openers', function() {
    expect(result.onOpenUploadModal).toEqual(jasmine.any(Function));
    expect(result.onOpenPriceModal).toEqual(jasmine.any(Function));
  });
});

describe('buildModalCallbacks', function() {
  let reload, setField, setShowUploadModal, setShowPriceModal, callbacks;

  beforeEach(function() {
    reload = jasmine.createSpy('reload');
    setField = jasmine.createSpy('setField');
    setShowUploadModal = jasmine.createSpy('setShowUploadModal');
    setShowPriceModal = jasmine.createSpy('setShowPriceModal');

    callbacks = buildModalCallbacks({
      controller: { buildEffect: () => reload },
      setField,
      setShowUploadModal,
      setShowPriceModal,
    });
  });

  it('opens the upload modal', function() {
    callbacks.onOpenUploadModal();

    expect(setShowUploadModal).toHaveBeenCalledWith(true);
  });

  it('opens the price modal', function() {
    callbacks.onOpenPriceModal();

    expect(setShowPriceModal).toHaveBeenCalledWith(true);
  });

  it('closes the upload modal', function() {
    callbacks.onUploadClose();

    expect(setShowUploadModal).toHaveBeenCalledWith(false);
  });

  it('closes the price modal', function() {
    callbacks.onPriceClose();

    expect(setShowPriceModal).toHaveBeenCalledWith(false);
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

  describe('when the price is confirmed', function() {
    beforeEach(function() {
      callbacks.onPriceConfirm(1500);
    });

    it('sets the price field as a string', function() {
      expect(setField).toHaveBeenCalledWith('price', '1500');
    });

    it('closes the price modal', function() {
      expect(setShowPriceModal).toHaveBeenCalledWith(false);
    });
  });
});
