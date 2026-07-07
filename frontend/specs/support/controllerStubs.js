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
