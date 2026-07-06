import { getGameSlugFromPhotosHash }
  from '../../../../../../../assets/js/components/pages/controllers/GamePhotosController.js';

describe('GamePhotosController', function() {
  it('extracts game slug from photos hash', function() {
    expect(getGameSlugFromPhotosHash('#/games/demo/photos')).toBe('demo');
  });

  it('returns empty string when hash does not match photos route', function() {
    expect(getGameSlugFromPhotosHash('#/games/demo')).toBe('');
  });
});
