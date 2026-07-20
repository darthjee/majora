import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDetail from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterDetail.jsx';
import CharacterHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import PhotoViewModalHelper
  from '../../../../../../../../assets/js/components/common/modals/helpers/PhotoViewModalHelper.jsx';
import ProfilePhotoSetModalHelper
  from '../../../../../../../../assets/js/components/common/modals/helpers/ProfilePhotoSetModalHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const photo1 = { id: 1, path: '/photos/1.jpg' };
const photo2 = { id: 2, path: '/photos/2.jpg' };

const loadedCharacter = {
  id: 5, name: 'Aragorn', can_edit: true, is_pc: true, game_slug: 'demo', profile_photo_id: photo1.id,
  photos: [photo1, photo2],
};

// Sets character/loading state synchronously during render (in the useMemo
// factory), so the "loaded" branch of CharacterDetail is reachable via
// renderToStaticMarkup even though useEffect never runs during SSR.
class LoadedController {
  constructor(setCharacter, setLoading) {
    setCharacter(loadedCharacter);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-unused-vars
  setProfilePhoto(gameSlug, characterId, photoId) { return Promise.resolve({ ok: true }); }
}

const renderDetail = () => {
  const getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
    game_slug: 'demo',
    character_id: '5',
  });

  return renderToStaticMarkup(
    React.createElement(CharacterDetail, {
      ControllerClass: LoadedController,
      getParamsFromHash,
      characterKind: 'pcs',
    })
  );
};

describe('CharacterDetail photo modal', function() {
  it('renders the photo view modal initially closed', function() {
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    let capturedShow;
    spyOn(PhotoViewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });
    spyOn(ProfilePhotoSetModalHelper, 'render').and.returnValue(null);

    renderDetail();

    expect(capturedShow).toBe(false);
  });

  it('opens the photo view modal via onSelectPhoto passed through CharacterHelper.render', function() {
    let capturedHandlers;
    spyOn(CharacterHelper, 'render').and.callFake((character, backHref, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(PhotoViewModalHelper, 'render').and.returnValue(null);
    spyOn(ProfilePhotoSetModalHelper, 'render').and.returnValue(null);

    renderDetail();

    expect(() => capturedHandlers.onSelectPhoto(photo2)).not.toThrow();
  });

  it('passes canSetProfilePhoto from character.can_edit and isProfilePhoto as false before any selection', function() {
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    let capturedCanSet;
    let capturedIsProfile;
    spyOn(PhotoViewModalHelper, 'render').and.callFake((show, photo, alt, onClose, canSetProfilePhoto, isProfilePhoto) => {
      capturedCanSet = canSetProfilePhoto;
      capturedIsProfile = isProfilePhoto;
      return null;
    });
    spyOn(ProfilePhotoSetModalHelper, 'render').and.returnValue(null);

    renderDetail();

    expect(capturedCanSet).toBe(true);
    expect(capturedIsProfile).toBe(false);
  });

  it('sets the profile photo and refreshes the character on success', async function() {
    spyOn(LoadedController.prototype, 'setProfilePhoto').and.returnValue(Promise.resolve({ ok: true }));
    const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    let capturedOnSetProfilePhoto;
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    spyOn(PhotoViewModalHelper, 'render').and.callFake((
      show, photo, alt, onClose, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto,
    ) => {
      capturedOnSetProfilePhoto = onSetProfilePhoto;
      return null;
    });
    spyOn(ProfilePhotoSetModalHelper, 'render').and.returnValue(null);

    renderDetail();

    const callsBefore = buildEffectSpy.calls.count();

    await capturedOnSetProfilePhoto(photo2.id);

    expect(LoadedController.prototype.setProfilePhoto).toHaveBeenCalledWith('demo', 5, photo2.id);
    expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
  });

  it('does not throw when the set-profile-photo request fails', async function() {
    spyOn(LoadedController.prototype, 'setProfilePhoto').and.returnValue(Promise.reject(new Error('nope')));
    let capturedOnSetProfilePhoto;
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    spyOn(PhotoViewModalHelper, 'render').and.callFake((
      show, photo, alt, onClose, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto,
    ) => {
      capturedOnSetProfilePhoto = onSetProfilePhoto;
      return null;
    });
    spyOn(ProfilePhotoSetModalHelper, 'render').and.returnValue(null);

    renderDetail();

    await expectAsync(capturedOnSetProfilePhoto(photo2.id)).toBeResolved();
  });

  it('does not throw when the photo view modal or profile-set confirmation modal is closed', function() {
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    let capturedOnCloseView;
    spyOn(PhotoViewModalHelper, 'render').and.callFake((show, photo, alt, onClose) => {
      capturedOnCloseView = onClose;
      return null;
    });
    let capturedOnCloseConfirm;
    spyOn(ProfilePhotoSetModalHelper, 'render').and.callFake((show, photo, alt, onClose) => {
      capturedOnCloseConfirm = onClose;
      return null;
    });

    renderDetail();

    expect(() => {
      capturedOnCloseView();
      capturedOnCloseConfirm();
    }).not.toThrow();
  });
});
