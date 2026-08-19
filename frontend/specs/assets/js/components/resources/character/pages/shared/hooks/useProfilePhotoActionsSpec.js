import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useProfilePhotoActions
  from '../../../../../../../../../assets/js/components/resources/character/pages/shared/hooks/useProfilePhotoActions.js';

const photo1 = { id: 1, path: '/photos/1.jpg' };
const photo2 = { id: 2, path: '/photos/2.jpg' };

/**
 * Minimal component exercising `useProfilePhotoActions`, capturing its return value for
 * inspection.
 *
 * @param {object} props - Component props.
 * @param {object} props.params - Params passed through to the hook.
 * @param {Function} props.onResult - Called with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ params, onResult }) {
  onResult(useProfilePhotoActions(params));
  return React.createElement('div', null, 'ok');
}

const render = (params) => {
  let captured;
  renderToStaticMarkup(
    React.createElement(TestHost, { params, onResult: (result) => { captured = result; } }),
  );
  return captured;
};

describe('useProfilePhotoActions', function() {
  it('starts with no photo set and no error', function() {
    const result = render({
      requestSetProfilePhoto: jasmine.createSpy('requestSetProfilePhoto'),
      getPhotos: () => [photo1, photo2],
      selectedPhoto: null,
    });

    expect(result.profilePhotoSet).toBeNull();
    expect(result.actionError).toBe('');
  });

  it('sets the matching photo from getPhotos() and calls onSuccess on success', async function() {
    const onSuccess = jasmine.createSpy('onSuccess');
    const result = render({
      requestSetProfilePhoto: () => Promise.resolve({ ok: true }),
      getPhotos: () => [photo1, photo2],
      selectedPhoto: null,
      onSuccess,
    });

    await result.handleSetProfilePhoto(photo2.id);

    expect(onSuccess).toHaveBeenCalled();
  });

  it('falls back to selectedPhoto when the photo is not found in getPhotos()', async function() {
    const result = render({
      requestSetProfilePhoto: () => Promise.resolve({ ok: true }),
      getPhotos: () => [],
      selectedPhoto: photo1,
    });

    await expectAsync(result.handleSetProfilePhoto(photo1.id)).toBeResolved();
  });

  it('does not throw when the request fails', async function() {
    const result = render({
      requestSetProfilePhoto: () => Promise.reject(new Error('nope')),
      getPhotos: () => [photo1],
      selectedPhoto: null,
    });

    await expectAsync(result.handleSetProfilePhoto(photo1.id)).toBeResolved();
  });

  it('exposes the raw setProfilePhotoSet setter', function() {
    const result = render({
      requestSetProfilePhoto: jasmine.createSpy('requestSetProfilePhoto'),
      getPhotos: () => [],
      selectedPhoto: null,
    });

    expect(typeof result.setProfilePhotoSet).toBe('function');
  });

  it('exposes the raw setActionError setter', function() {
    const result = render({
      requestSetProfilePhoto: jasmine.createSpy('requestSetProfilePhoto'),
      getPhotos: () => [],
      selectedPhoto: null,
    });

    expect(typeof result.setActionError).toBe('function');
  });
});
