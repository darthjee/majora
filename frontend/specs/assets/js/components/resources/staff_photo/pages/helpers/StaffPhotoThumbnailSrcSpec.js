import staffPhotoThumbnailSrc from '../../../../../../../../assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoThumbnailSrc.js';

describe('staffPhotoThumbnailSrc', function() {
  const photo = { id: 3, path: '/photos/game/3.png' };

  it('returns the bare path when no version is recorded', function() {
    expect(staffPhotoThumbnailSrc(photo, { 4: 123 })).toBe('/photos/game/3.png');
  });

  it('returns the bare path when no versions map is given', function() {
    expect(staffPhotoThumbnailSrc(photo)).toBe('/photos/game/3.png');
  });

  it('appends ?v=<version> when a version is recorded', function() {
    expect(staffPhotoThumbnailSrc(photo, { 3: 123 })).toBe('/photos/game/3.png?v=123');
  });

  it('appends &v=<version> when the path already has a query', function() {
    expect(staffPhotoThumbnailSrc({ id: 3, path: '/p.png?x=1' }, { 3: 123 })).toBe('/p.png?x=1&v=123');
  });
});
