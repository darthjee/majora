/**
 * Shared controller/helper stub builders for Jasmine page specs.
 * Neutralizes the `useEffect`-driving `buildEffect()` controller hook and
 * stubs a helper's `renderLoading()` so page specs can assert on the
 * loading state without waiting on a real fetch.
 */
import React from 'react';
import Noop from '../../assets/js/utils/Noop.js';

/**
 * Neutralize a page controller's `buildEffect()` so mounting the page under
 * test does not trigger a real fetch/effect chain.
 *
 * @param {Function} ControllerClass - The controller class to stub.
 * @returns {jasmine.Spy} The installed spy, for specs that need to inspect calls.
 */
export function stubBuildEffect(ControllerClass) {
  return spyOn(ControllerClass.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
}

/**
 * Stub a render helper's `renderLoading()` static method with a recognizable
 * placeholder element, so a page spec can assert its loading state renders it.
 *
 * @param {Function} HelperClass - The render helper class to stub.
 * @param {React.ReactElement} [markup] - Element returned by the stub;
 *   defaults to a `<div>loading</div>`.
 * @returns {jasmine.Spy} The installed spy.
 */
export function stubRenderLoading(HelperClass, markup = React.createElement('div', null, 'loading')) {
  return spyOn(HelperClass, 'renderLoading').and.returnValue(markup);
}

/**
 * Install property-accessor spies on a controller's constructor-assigned fields, so a
 * spec can render the real page component — which owns the `new SomeController(...)`
 * call — and assert on how each field was actually wired, instead of constructing the
 * controller directly with hand-picked spies (which cannot catch a page component
 * passing the wrong argument in the wrong slot). Also captures the constructed
 * instance, since `useEffect` (and so `buildEffect()`) never runs during
 * `renderToStaticMarkup`, so specs need a handle to invoke it themselves.
 *
 * @param {Function} ControllerClass - The controller class to instrument.
 * @param {string[]} fields - Constructor-assigned field names to capture.
 * @returns {{spies: object, getInstance: Function, restore: Function}} `spies` maps
 *   each field name to the value assigned during construction — wrapped in a spy that
 *   calls through when the assigned value is a function, so specs can assert on how
 *   it was called while preserving its real behaviour; left as-is otherwise (e.g. a
 *   stray `null`, reproducing this class of argument-mismatch bug). `getInstance()`
 *   returns the constructed instance. `restore()` removes the instrumentation so later
 *   specs see the controller's normal, uninstrumented behaviour.
 */
export function captureConstructorFields(ControllerClass, fields) {
  const { prototype } = ControllerClass;
  const spies = {};
  let instance = null;

  fields.forEach((field) => {
    Object.defineProperty(prototype, field, {
      configurable: true,
      set(value) {
        instance = this;
        spies[field] = typeof value === 'function'
          ? jasmine.createSpy(field).and.callFake(value)
          : value;
      },
      get() {
        return spies[field];
      },
    });
  });

  return {
    spies,
    getInstance: () => instance,
    restore: () => fields.forEach((field) => delete prototype[field]),
  };
}
