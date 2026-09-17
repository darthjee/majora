import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import usePhotoPreviewUrl from '../../../../assets/js/utils/usePhotoPreviewUrl.js';
import Noop from '../../../../assets/js/utils/Noop.js';

/**
 * Minimal component exercising `usePhotoPreviewUrl`, used to assert the hook can be called from
 * a real component body without violating the rules of hooks, and capturing its return value for
 * inspection.
 *
 * @param {object} props - Component props.
 * @param {(File|null)} props.photoFile - Photo file passed through to the hook.
 * @param {Function} props.onResult - Called with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ photoFile, onResult }) {
  onResult(usePhotoPreviewUrl(photoFile));
  return React.createElement('div', null, 'ok');
}

describe('usePhotoPreviewUrl', function() {
  it('does not throw when called from a component body', function() {
    expect(() => renderToStaticMarkup(
      React.createElement(TestHost, { photoFile: null, onResult: Noop.noop }),
    )).not.toThrow();
  });

  it('returns null when no photo file is given', function() {
    let captured;

    renderToStaticMarkup(
      React.createElement(TestHost, { photoFile: null, onResult: (result) => { captured = result; } }),
    );

    expect(captured).toBeNull();
  });

  it('returns a local object URL for the given photo file', function() {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:preview-url');
    let captured;
    const photoFile = new Blob(['photo']);

    renderToStaticMarkup(
      React.createElement(TestHost, { photoFile, onResult: (result) => { captured = result; } }),
    );

    expect(URL.createObjectURL).toHaveBeenCalledWith(photoFile);
    expect(captured).toBe('blob:preview-url');
  });
});
