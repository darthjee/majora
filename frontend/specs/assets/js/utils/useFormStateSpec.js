import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useFormState, {
  buildSetField, buildHandleChange, buildHandleCheckboxChange,
} from '../../../../assets/js/utils/useFormState.js';
import Noop from '../../../../assets/js/utils/Noop.js';

/**
 * Minimal component exercising `useFormState`, used to assert the hook can be called from a
 * real component body without violating the rules of hooks, and capturing its return value for
 * inspection.
 *
 * @param {object} props - Component props.
 * @param {object} props.initial - Initial field values passed through to the hook.
 * @param {Function} props.onResult - Called with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ initial, onResult }) {
  onResult(useFormState(initial));
  return React.createElement('div', null, 'ok');
}

describe('useFormState', function() {
  it('does not throw when called from a component body', function() {
    expect(() => renderToStaticMarkup(
      React.createElement(TestHost, { initial: { name: '' }, onResult: Noop.noop }),
    )).not.toThrow();
  });

  it('returns the initial state on first render', function() {
    let captured;

    renderToStaticMarkup(
      React.createElement(TestHost, { initial: { name: 'Bob', hidden: false }, onResult: (result) => { captured = result; } }),
    );

    expect(captured.state).toEqual({ name: 'Bob', hidden: false });
  });

  describe('.buildSetField', function() {
    it('merges the given field/value onto the previous state', function() {
      const setState = jasmine.createSpy('setState');
      const setField = buildSetField(setState);

      setField('name', 'Bob');

      const [updater] = setState.calls.mostRecent().args;

      expect(updater({ name: '', role: 'guard' })).toEqual({ name: 'Bob', role: 'guard' });
    });
  });

  describe('.buildHandleChange', function() {
    it('reads event.target.value into the given field via setField', function() {
      const setField = jasmine.createSpy('setField');
      const handleChange = buildHandleChange(setField);

      handleChange('name')({ target: { value: 'Bob' } });

      expect(setField).toHaveBeenCalledWith('name', 'Bob');
    });
  });

  describe('.buildHandleCheckboxChange', function() {
    it('reads event.target.checked into the given field via setField', function() {
      const setField = jasmine.createSpy('setField');
      const handleCheckboxChange = buildHandleCheckboxChange(setField);

      handleCheckboxChange('hidden')({ target: { checked: true } });

      expect(setField).toHaveBeenCalledWith('hidden', true);
    });
  });
});
